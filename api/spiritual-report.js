// /api/spiritual-report.js
// Main endpoint for personal + technical questions

import formidable from "formidable";
import fs from "fs";

import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { classifyQuestion } from "./utils/classify-question.js";
import { analyzePalmImage } from "./utils/analyze-palm.js";
import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

export const config = {
  api: { bodyParser: false },
};

// ------------------------------------
// Helpers
// ------------------------------------
function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeField(fields, key) {
  const v = fields?.[key];
  if (Array.isArray(v)) return v[0];
  return v ?? "";
}

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // -----------------------------------------
    // Parse multipart/form-data
    // -----------------------------------------
    const form = formidable({
      keepExtensions: true,
      allowEmptyFiles: true,
      multiples: false,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      });
    });

    // Normalize fields (handle arrays from formidable)
    const rawQuestion = normalizeField(fields, "question");
    const question = String(rawQuestion || "").trim();

    const fullName = normalizeField(fields, "fullName");
    const birthDate = normalizeField(fields, "birthDate");
    const birthTime = normalizeField(fields, "birthTime");
    const birthPlace = normalizeField(fields, "birthPlace");
    const email = normalizeField(fields, "email");
    const rawIsPersonal = normalizeField(fields, "isPersonal");
    const recaptchaToken =
      normalizeField(fields, "recaptchaToken") ||
      normalizeField(fields, "g-recaptcha-response");

    if (!question) {
      return res.status(400).json({ ok: false, error: "Question required" });
    }

    // -----------------------------------------
    // Verify reCAPTCHA
    // -----------------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return res
        .status(403)
        .json({ ok: false, error: "reCAPTCHA failed", detail: captcha.error });
    }

    // -----------------------------------------
    // Palmistry image (optional)
    // -----------------------------------------
    let palmImagePath = null;
    const palmFile = files?.palmImage;

    if (Array.isArray(palmFile) && palmFile.length > 0) {
      palmImagePath = palmFile[0]?.filepath || palmFile[0]?.path || null;
    } else if (palmFile && (palmFile.filepath || palmFile.path)) {
      palmImagePath = palmFile.filepath || palmFile.path;
    }

    const palmistryData = await analyzePalmImage(palmImagePath);

    // -----------------------------------------
    // (Optional) technical file – currently ignored but accepted
    // -----------------------------------------
    // const techFile = files?.technicalFile;
    // you can wire this into future upgrades

    // -----------------------------------------
    // Intent classification
    // -----------------------------------------
    const classification = await classifyQuestion(question).catch((e) => {
      console.error("Classifier error:", e);
      return null;
    });

    const safeIntent =
      classification && classification.intent ? classification.intent : "general";

    const personalMode = (() => {
      const v = String(rawIsPersonal || "").toLowerCase();
      return v === "yes" || v === "true" || v === "1" || v === "on";
    })();

    // -----------------------------------------
    // Unified Insights
    // -----------------------------------------
    const insights = await generateInsights({
      question,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      classify: { ...(classification || {}), intent: safeIntent },
      palmistryData,
      technicalMode: !personalMode,
    });

    if (!insights.ok) {
      console.error("INSIGHTS ERROR:", insights.error);
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error,
      });
    }

    // =====================================================
    // PERSONAL MODE → PDF AUTO EMAIL
    // =====================================================
    if (personalMode) {
      let pdfBuffer = null;
      try {
        pdfBuffer = await generatePDF({
          mode: "personal",
          question,
          fullName,
          birthDate,
          birthTime,
          birthPlace,
          insights,
          astrology: insights.astrology,
          numerology: insights.numerology,
          palmistry: insights.palmistry,
        });
      } catch (err) {
        console.error("PDF generation error (personal):", err);
        return res.status(500).json({
          ok: false,
          error: "PDF generation failed",
          detail: err.message,
        });
      }

      if (email) {
        const emailResult = await sendEmailHTML({
          to: email,
          subject: "Your Personal Spiritual Report",
          html: `<p>Your personal spiritual report is attached.</p>`,
          attachments: [
            {
              filename: "spiritual-report.pdf",
              content: pdfBuffer,
            },
          ],
        });

        if (!emailResult.success) {
          console.error("EMAIL ERROR:", emailResult);
          // still return short answer, but flag email failure
          return res.status(500).json({
            ok: false,
            error: "Email delivery failed",
            detail: emailResult.error,
          });
        }
      } else {
        console.warn("Personal mode but no email provided.");
      }

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        intent: safeIntent,
        pdfEmailed: !!email,
      });
    }

    // =====================================================
    // TECHNICAL MODE → Return short summary & data
    // =====================================================
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      keyPoints: insights.keyPoints,
      explanation: insights.explanation,
      recommendations: insights.recommendations,
      pdfEmailed: false,
      intent: safeIntent,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Server failure",
    });
  }
}

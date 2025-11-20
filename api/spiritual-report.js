// /api/spiritual-report.js
// PERSONAL + TECHNICAL ENTRYPOINT

import formidable from "formidable";
import fs from "fs";

// NEW IMPORT PATHS (lib instead of utils)
import { verifyRecaptcha, sendEmailHTML, validateUploadedFile } from "../lib/utils.js";
import { classifyQuestion } from "../lib/ai.js";
import { analyzePalm } from "../lib/engines.js";
import { generateInsights } from "../lib/insights.js";
import { generatePDF } from "../lib/pdf.js";

export const config = { api: { bodyParser: false } };

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
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    // -----------------------------------------
    // Parse form-data
    // -----------------------------------------
    const form = formidable({
      keepExtensions: true,
      allowEmptyFiles: true,
      multiples: false
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      });
    });

    const question = normalizeField(fields, "question")?.trim();
    if (!question) return res.status(400).json({ ok: false, error: "Question required" });

    const fullName = normalizeField(fields, "fullName");
    const birthDate = normalizeField(fields, "birthDate");
    const birthTime = normalizeField(fields, "birthTime");
    const birthPlace = normalizeField(fields, "birthPlace");
    const email = normalizeField(fields, "email");
    const rawIsPersonal = normalizeField(fields, "isPersonal");
    const recaptchaToken =
      normalizeField(fields, "recaptchaToken") ||
      normalizeField(fields, "g-recaptcha-response");

    // -------- reCAPTCHA --------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok)
      return res.status(403).json({ ok: false, error: "reCAPTCHA failed" });

    // ----------------- Palmistry Image ------------------
    let palmImagePath = null;
    const palm = files?.palmImage;

    if (Array.isArray(palm) && palm[0]?.filepath) {
      palmImagePath = palm[0].filepath;
    } else if (palm?.filepath) {
      palmImagePath = palm.filepath;
    }

    const palmistryData = await analyzePalmImage(palmImagePath);

    // ---------------- Classification --------------------
    const classification = await classifyQuestion(question).catch(() => null);
    const safeIntent = classification?.intent || "general";

    const personalMode = ["yes", "true", "on", "1"].includes(
      String(rawIsPersonal).toLowerCase()
    );

    // --------------------- Insights ---------------------
    const insights = await generateInsights({
      question,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      palmistryData,
      classify: { ...(classification || {}), intent: safeIntent },
      technicalMode: !personalMode
    });

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error
      });
    }

    // =====================================================
    // PERSONAL MODE → AUTO PDF + AUTO EMAIL
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
          palmistry: insights.palmistry
        });
      } catch (err) {
        console.error("PDF ERROR:", err);
        return res.status(500).json({ ok: false, error: "PDF generation failed" });
      }

      if (email) {
        const emailResult = await sendEmailHTML({
          to: email,
          subject: "Your Personal Spiritual Report",
          html: `<p>Your personal spiritual report is attached.</p>`,
          attachments: [
            { filename: "spiritual-report.pdf", content: pdfBuffer }
          ]
        });

        if (!emailResult.success) {
          return res.status(500).json({
            ok: false,
            error: "Email delivery failed",
            detail: emailResult.error
          });
        }
      }

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        intent: safeIntent,
        pdfEmailed: !!email
      });
    }

    // =====================================================
    // TECHNICAL MODE → No auto PDF
    // =====================================================
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      keyPoints: insights.keyPoints,
      explanation: insights.explanation,
      recommendations: insights.recommendations,
      pdfEmailed: false,
      intent: safeIntent
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

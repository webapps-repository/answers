// /api/spiritual-report.js
// Main endpoint for personal & technical spiritual reports

import formidable from "formidable";
import fs from "fs";

import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { classifyQuestion } from "./utils/classify-question.js";
import { analyzePalmImage } from "./utils/analyze-palm.js";
import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmail } from "./utils/send-email.js";

// Enable Vercel file uploads
export const config = {
  api: { bodyParser: false },
};

// ---------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------
function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ---------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------
export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // -------------------------------------------------------------
    // Parse FormData
    // -------------------------------------------------------------
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 8 * 1024 * 1024,
      allowEmptyFiles: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      });
    });

    const {
      question,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      email,
      isPersonal,
      recaptchaToken,
    } = fields;

    if (!question) {
      return res.status(400).json({ ok: false, error: "Question is required." });
    }

    // -------------------------------------------------------------
    // reCAPTCHA
    // -------------------------------------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return res.status(403).json({
        ok: false,
        error: "reCAPTCHA failed",
        detail: captcha.error,
      });
    }

    // -------------------------------------------------------------
    // Palmistry
    // -------------------------------------------------------------
    const palmImagePath = files?.palmImage?.filepath || null;
    const palmistryData = await analyzePalmImage(palmImagePath);

    // -------------------------------------------------------------
    // Classification (safe)
    // -------------------------------------------------------------
    let classification = await classifyQuestion(question);

    if (!classification || !classification.intent) {
      console.warn("⚠ classification result invalid, applying fallback logic");
      classification = {
        type: "personal",
        intent: "general",
        confidence: 0.2,
        tone: "neutral",
        source: "emergency-fallback",
      };
    }

    // User override
    const personalMode = String(isPersonal) === "yes";

    // -------------------------------------------------------------
    // Generate insights
    // -------------------------------------------------------------
    const insights = await generateInsights({
      question,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      classify: classification,
      palmistryData,
      technicalMode: !personalMode,
    });

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error,
      });
    }

    // -------------------------------------------------------------
    // PERSONAL MODE — Generate PDF + email it
    // -------------------------------------------------------------
    if (personalMode) {
      const pdfBuffer = await generatePDF({
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

      const emailResult = await sendEmail({
        to: email,
        subject: "Your Personal Spiritual Report",
        html: `<p>Your detailed spiritual report is attached.</p>`,
        attachments: [
          {
            filename: "spiritual-report.pdf",
            content: pdfBuffer,
          },
        ],
      });

      if (!emailResult.ok) {
        return res.status(500).json({
          ok: false,
          error: "Email failed",
          detail: emailResult.error,
        });
      }

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        intent: classification.intent,
        pdfEmailed: true,
      });
    }

    // -------------------------------------------------------------
    // TECHNICAL MODE — short answer only
    // -------------------------------------------------------------
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      keyPoints: insights.keyPoints,
      explanation: insights.explanation,
      recommendations: insights.recommendations,
      intent: classification.intent,
      pdfEmailed: false,
    });

  } catch (err) {
    console.error("❌ spiritual-report ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Server error",
      detail: err.message,
    });
  }
}

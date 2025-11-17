// /api/spiritual-report.js
// ---------------------------------------------------------
// Main endpoint for personal + technical spiritual reports
// Named-exports compatible version
// ---------------------------------------------------------

import formidable from "formidable";
import fs from "fs";

import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { classifyQuestion } from "./utils/classify-question.js";
import { analyzePalmImage } from "./utils/analyze-palm.js";
import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

// Needed for file uploads
export const config = {
  api: { bodyParser: false },
};

// ---------------------------------------------------------
// CORS
// ---------------------------------------------------------
function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------
export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // ------------------------------
    // 1. Parse multipart form
    // ------------------------------
    const form = formidable({
      multiples: false,
      keepExtensions: true,
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
      return res.status(400).json({ ok: false, error: "Question required." });
    }

    // ------------------------------
    // 2. Verify Recaptcha
    // ------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return res.status(403).json({
        ok: false,
        error: "reCAPTCHA failed",
        detail: captcha.error,
      });
    }

    // ------------------------------
    // 3. Palmistry image
    // ------------------------------
    const palmImagePath = files?.palmImage?.filepath || null;
    const palmistryData = await analyzePalmImage(palmImagePath);

    // ------------------------------
    // 4. Classification
    // ------------------------------
    const classification = await classifyQuestion(question);

    // IMPORTANT FIX:
    const safeIntent = classification?.intent || "general";

    const personalMode = isPersonal === "yes";

    // ------------------------------
    // 5. Generate insights
    // ------------------------------
    const insights = await generateInsights({
      question,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      classify: { ...classification, intent: safeIntent },
      palmistryData,
      technicalMode: !personalMode,
    });

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: insights.error || "Insight generation failed.",
      });
    }

    // ------------------------------
    // 6. PERSONAL MODE → build PDF + email
    // ------------------------------
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

      const result = await sendEmailHTML({
        to: email,
        subject: "Your Personal Spiritual Report",
        html: `<p>Your detailed personal report is attached.</p>`,
        attachments: [
          { filename: "spiritual-report.pdf", content: pdfBuffer },
        ],
      });

      if (!result.success) {
        return res.status(500).json({
          ok: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        pdfEmailed: true,
        intent: safeIntent,
      });
    }

    // ------------------------------
    // 7. TECHNICAL MODE → no PDF yet
    // ------------------------------
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
    console.error("Spiritual-report error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Server error",
    });
  }
}

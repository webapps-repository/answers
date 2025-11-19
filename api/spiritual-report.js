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
  api: { bodyParser: false }
};

function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    // -----------------------------------------
    // Parse multipart/form-data
    // -----------------------------------------
    const form = formidable({ keepExtensions: true, allowEmptyFiles: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      });
    });

    // -----------------------------------------
    // Normalize Formidable fields (arrays → strings)
    // -----------------------------------------
    function norm(v) {
      if (Array.isArray(v)) return v[0];
      return v ?? "";
    }

    const question = norm(fields.question);
    const fullName = norm(fields.fullName);
    const birthDate = norm(fields.birthDate);
    const birthTime = norm(fields.birthTime);
    const birthPlace = norm(fields.birthPlace);
    const email = norm(fields.email);
    const isPersonal = norm(fields.isPersonal);
    const recaptchaToken = norm(fields.recaptchaToken);

    // -----------------------------------------
    // Validate question
    // -----------------------------------------
    if (!question || String(question).trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Question required" });
    }

    // -----------------------------------------
    // Verify reCAPTCHA
    // -----------------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok) {
      return res.status(403).json({ ok: false, error: "reCAPTCHA failed" });
    }

    // -----------------------------------------
    // Palmistry image (preserve for personal mode)
    // -----------------------------------------
    const palmImagePath = files?.palmImage?.filepath || null;
    const palmistryData = await analyzePalmImage(palmImagePath);

    // -----------------------------------------
    // Intent classification
    // -----------------------------------------
    const classification = await classifyQuestion(question);
    const safeIntent = classification?.intent || "general";

    const personalMode =
      isPersonal === "yes" ||
      isPersonal === "true" ||
      isPersonal === true;

    // -----------------------------------------
    // Unified Insights (PERSONAL + TECHNICAL)
    // -----------------------------------------
    const insights = await generateInsights({
      question,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      classify: { ...classification, intent: safeIntent },
      palmistryData,
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
    // PERSONAL MODE → AUTO SEND FULL PDF
    // =====================================================
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
        palmistry: insights.palmistry
      });

      const emailResult = await sendEmailHTML({
        to: email,
        subject: "Your Personal Spiritual Report",
        html: `<p>Your personal spiritual report is attached.</p>`,
        attachments: [
          { filename: "spiritual-report.pdf", content: pdfBuffer }
        ]
      });

      if (!emailResult.success) {
        console.error("EMAIL ERROR:", emailResult);
        return res.status(500).json({
          ok: false,
          error: "Email delivery failed",
          detail: emailResult.error
        });
      }

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        intent: safeIntent,
        pdfEmailed: true
      });
    }

    // =====================================================
    // TECHNICAL MODE → Return short summary only
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
    return res.status(500).json({
      ok: false,
      error: err.message || "Server failure"
    });
  }
}

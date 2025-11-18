// /api/spiritual-report.js
// Main endpoint for personal + technical questions (summary mode)
// Handles palm upload, recaptcha, insights, and email for personal mode.

import formidable from "formidable";
import fs from "fs";

import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
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
    // -------------------------------
    // Parse multipart form data
    // -------------------------------
    const form = formidable({ keepExtensions: true, allowEmptyFiles: true });

    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      })
    );

    const {
      question,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      email,
      isPersonal,
      recaptchaToken
    } = fields;

    // Normalize question safely
    const q = typeof question === "string" ? question.trim() : "";
    if (!q.length)
      return res.status(400).json({ ok: false, error: "Question required" });

    // -----------------------------------------
    // Verify reCAPTCHA
    // -----------------------------------------
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok)
      return res.status(403).json({ ok: false, error: "reCAPTCHA failed" });

    // -----------------------------------------
    // Palmistry image
    // -----------------------------------------
    const palmImagePath =
      files?.palmImage && files.palmImage.filepath
        ? files.palmImage.filepath
        : null;

    // -----------------------------------------
    // Detect personal vs technical
    // -----------------------------------------
    const personalMode =
      isPersonal === "yes" ||
      isPersonal === "true" ||
      isPersonal === true;

    // -----------------------------------------
    // Generate unified insights
    // -----------------------------------------
    const insights = await generateInsights({
      question: q,
      isPersonal: personalMode,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      palmImagePath,
      technicalMode: !personalMode
    });

    if (!insights.ok) {
      console.error("INSIGHT FAILURE →", insights.error);
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error
      });
    }

    // =====================================================
    // PERSONAL MODE → auto email PDF
    // =====================================================
    if (personalMode) {
      const pdfBuffer = await generatePDF({
        mode: "personal",
        question: q,
        fullName,
        birthDate,
        birthTime,
        birthPlace,
        insights
      });

      const emailResult = await sendEmailHTML({
        to: email,
        subject: "Your Complete Personal Spiritual Report",
        html: `<p>Your personal spiritual report is attached.</p>`,
        attachments: [{ filename: "spiritual-report.pdf", content: pdfBuffer }]
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
        pdfEmailed: true
      });
    }

    // =====================================================
    // TECHNICAL MODE → return short summary only
    // =====================================================
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      keyPoints: insights.keyPoints,
      explanation: insights.explanation,
      recommendations: insights.recommendations,
      pdfEmailed: false
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Server failure"
    });
  }
}

// /api/spiritual-report.js
// Main endpoint for PERSONAL + TECHNICAL questions

import formidable from "formidable";
import fs from "fs";
import path from "path";

import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { classifyQuestion } from "./utils/classify-question.js";
import { analyzePalmImage } from "./utils/analyze-palm.js";
import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/email.js";
import { validateUploadedFile } from "./utils/file-validators.js";

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
    // ====================================================
    // FORM PARSE
    // ====================================================
    const form = formidable({
      keepExtensions: true,
      allowEmptyFiles: true,
      multiples: false,
      maxFileSize: 12 * 1024 * 1024 // 12MB
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => {
        if (err) reject(err);
        else resolve({ fields: f, files: fi });
      });
    });

    // Normalize values
    const question = String(fields.question || "").trim();
    const isPersonal =
      fields.isPersonal === "true" ||
      fields.isPersonal === true ||
      fields.isPersonal === "yes";

    const email = fields.email ? String(fields.email).trim() : "";
    const fullName = fields.fullName || "";
    const birthDate = fields.birthDate || "";
    const birthTime = fields.birthTime || "";
    const birthPlace = fields.birthPlace || "";
    const recaptchaToken = fields.recaptchaToken || "";

    if (!question || question.length < 3) {
      return res.status(400).json({
        ok: false,
        error: "Question required",
        fresh: true
      });
    }

    // ====================================================
    // RECAPTCHA
    // ====================================================
    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok)
      return res.status(403).json({
        ok: false,
        error: "reCAPTCHA failed",
        fresh: true
      });

    // ====================================================
    // PALM IMAGE FIX
    // ====================================================
    let palmFilePath = null;
    if (files?.palmImage?.filepath && fs.existsSync(files.palmImage.filepath)) {
      palmFilePath = files.palmImage.filepath;
    }

    const palmistryData = await analyzePalmImage(palmFilePath);

    // ====================================================
    // TECHNICAL FILE (optional)
    // ====================================================
    let techFile = null;

    if (files?.techFile?.filepath && fs.existsSync(files.techFile.filepath)) {
      const safe = validateUploadedFile(files.techFile);
      if (!safe.ok) {
        fs.unlinkSync(files.techFile.filepath);
        return res.status(400).json({
          ok: false,
          error: safe.error,
          fresh: true
        });
      }
      techFile = files.techFile.filepath;
    }

    // ====================================================
    // CLASSIFY INTENT
    // ====================================================
    const classification = await classifyQuestion(question);
    const safeIntent = classification?.intent || "general";

    // ====================================================
    // INSIGHTS
    // ====================================================
    const insights = await generateInsights({
      question,
      isPersonal,
      fullName,
      birthDate,
      birthTime,
      birthPlace,
      classify: { ...classification, intent: safeIntent },
      palmistryData,
      technicalMode: !isPersonal,
      techFilePath: techFile
    });

    // delete tech file after reading
    if (techFile && fs.existsSync(techFile)) {
      fs.unlink(techFile, () => {});
    }

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error,
        fresh: true
      });
    }

    // ====================================================
    // PERSONAL MODE → AUTO EMAIL
    // ====================================================
    if (isPersonal) {
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

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        pdfEmailed: emailResult.success ? true : false,
        emailStatus: emailResult.success
          ? "sent"
          : "failed",
        fresh: true,
        intent: safeIntent
      });
    }

    // ====================================================
    // TECHNICAL MODE → SUMMARY ONLY
    // ====================================================
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      keyPoints: insights.keyPoints,
      explanation: insights.explanation,
      recommendations: insights.recommendations,
      pdfEmailed: false,
      emailStatus: "none",
      fresh: true,
      intent: safeIntent
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
      fresh: true
    });
  }
}

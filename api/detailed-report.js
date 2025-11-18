// /api/detailed-report.js
// Generates a full TECHNICAL PDF and emails it to the user on demand.

import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/email.js";
import { validateUploadedFile } from "./utils/file-validators.js";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

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
    // =====================================================
    // PARSE JSON OR FORM
    // This endpoint must support:
    // - JSON body (from modal send)
    // - FormData (future compatibility)
    // =====================================================
    let email = "";
    let question = "";
    let techFilePath = null;

    // Detect whether request is JSON or multipart
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const form = formidable({
        keepExtensions: true,
        allowEmptyFiles: true,
        multiples: false,
        maxFileSize: 12 * 1024 * 1024
      });

      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, f, fi) => {
          if (err) reject(err);
          else resolve({ fields: f, files: fi });
        });
      });

      question = String(fields.question || "").trim();
      email = String(fields.email || "").trim();

      if (files?.techFile?.filepath && fs.existsSync(files.techFile.filepath)) {
        const safe = validateUploadedFile(files.techFile);
        if (!safe.ok) {
          fs.unlinkSync(files.techFile.filepath);
          return res.status(400).json({ ok: false, error: safe.error });
        }
        techFilePath = files.techFile.filepath;
      }
    } else {
      // JSON request (from modal)
      const body = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(JSON.parse(data || "{}")));
      });

      question = String(body.question || "").trim();
      email = String(body.email || "").trim();
    }

    // =====================================================
    // VALIDATION
    // =====================================================
    if (!question || question.length < 3)
      return res.status(400).json({ ok: false, error: "Question required" });

    if (!email)
      return res.status(400).json({ ok: false, error: "Email required" });

    // =====================================================
    // GENERATE TECHNICAL INSIGHTS
    // =====================================================
    const insights = await generateInsights({
      question,
      isPersonal: false,
      classify: { intent: "technical", type: "technical" },
      palmistryData: null,
      technicalMode: true,
      techFilePath
    });

    if (techFilePath && fs.existsSync(techFilePath)) {
      fs.unlink(techFilePath, () => {});
    }

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error
      });
    }

    // =====================================================
    // GENERATE TECHNICAL PDF
    // =====================================================
    const pdfBuffer = await generatePDF({
      mode: "technical",
      question,
      insights
    });

    // =====================================================
    // EMAIL THE PDF
    // =====================================================
    const emailResult = await sendEmailHTML({
      to: email,
      subject: "Your Detailed Technical Report",
      html: `<p>Your detailed technical report is attached.</p>`,
      attachments: [
        { filename: "technical-report.pdf", content: pdfBuffer }
      ]
    });

    if (!emailResult.success) {
      return res.status(500).json({
        ok: false,
        error: "Email failed",
        detail: emailResult.error
      });
    }

    return res.status(200).json({
      ok: true,
      pdfEmailed: true,
      emailStatus: "sent",
      shortAnswer: insights.shortAnswer,
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("DETAILED REPORT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Server failure"
    });
  }
}

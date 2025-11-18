// /api/detailed-report.js
// Generates TECHNICAL PDF + sends via email

import { generateInsights } from "./utils/generate-insights.js";
import { generatePDF } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

export const config = {
  api: { bodyParser: true }
};

function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { question, email } = req.body || {};

    if (!question || !String(question).trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Question is required." });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    // 1) Generate technical insights (GPT-4.1, finance + coding tuned)
    const insights = await generateInsights({
      question: String(question),
      isPersonal: false,
      technicalMode: true
    });

    if (!insights.ok) {
      return res.status(500).json({
        ok: false,
        error: "Insight generation failed",
        detail: insights.error
      });
    }

    // 2) Build TECHNICAL PDF
    const pdfBuffer = await generatePDF({
      mode: "technical",
      question: String(question),
      insights
    });

    // 3) Email PDF
    const emailResult = await sendEmailHTML({
      to: String(email),
      subject: "Your Detailed Technical Report",
      html: `<p>Your detailed technical report is attached.</p>`,
      attachments: [
        {
          filename: "technical-report.pdf",
          content: pdfBuffer
        }
      ]
    });

    if (!emailResult.success) {
      console.error("EMAIL ERROR (technical):", emailResult);
      return res.status(500).json({
        ok: false,
        error: "Email delivery failed",
        detail: emailResult.error
      });
    }

    return res.status(200).json({
      ok: true,
      pdfEmailed: true,
      shortAnswer: insights.shortAnswer,
      stampedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("DETAILED REPORT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Server error"
    });
  }
}

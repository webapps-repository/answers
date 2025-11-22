// /api/detailed-report.js — FIXED FULL VERSION
export const config = {
  api: { bodyParser: false },
  runtime: "nodejs"
};

import formidable from "formidable";
import {
  applyCORS,
  normalize,
  verifyRecaptcha,
  sendEmailHTML
} from "../lib/utils.js";

import { generateInsights } from "../lib/insights.js";
import { generatePDFBufferFromHTML } from "../lib/pdf.js";

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const form = formidable({ keepExtensions: true });
    const { fields } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fi) => err ? reject(err) : resolve({ fields: f }))
    );

    const email = normalize(fields, "email");
    const question = normalize(fields, "question");

    if (!email) return res.status(400).json({ error: "Email required" });
    if (!question) return res.status(400).json({ error: "Question required" });

    const token = normalize(fields, "recaptchaToken");
    const captcha = await verifyRecaptcha(token);
    if (!captcha.ok) return res.status(400).json({ error: "Invalid reCAPTCHA" });

    const insights = await generateInsights({
      question,
      enginesInput: {} // technical mode
    });

    const html = `
      <h1>Technical Report</h1>
      <pre>${JSON.stringify(insights, null, 2)}</pre>
    `;

    const pdfBuffer = await generatePDFBufferFromHTML(html);

    const result = await sendEmailHTML({
      to: email,
      subject: "Your Detailed Technical Report",
      html: "<p>Your technical PDF report is attached.</p>",
      attachments: [{ filename: "technical-report.pdf", content: pdfBuffer }]
    });

    if (!result.success)
      return res.status(500).json({ error: "Email failed", detail: result.error });

    return res.status(200).json({ ok: true, emailed: true });

  } catch (err) {
    console.error("DETAIL ERROR:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}

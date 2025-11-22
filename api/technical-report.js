// /api/technical-report.js — FINAL RESTORED & UPGRADED (drop-in replacement)

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
    /* ----------------------------------------------------------
       1) Parse multipart form
    ---------------------------------------------------------- */
    const form = formidable({ keepExtensions: true, allowEmptyFiles: true });

    const { fields } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f) =>
        err ? reject(err) : resolve({ fields: f })
      )
    );

    /* ----------------------------------------------------------
       2) Validate inputs
    ---------------------------------------------------------- */
    const email = normalize(fields, "email");
    const question = normalize(fields, "question");

    if (!email) return res.status(400).json({ error: "Email required" });
    if (!question) return res.status(400).json({ error: "Question required" });

    /* ----------------------------------------------------------
       3) reCAPTCHA (optional for this endpoint)
    ---------------------------------------------------------- */
    const recaptchaToken = normalize(fields, "recaptchaToken");
    if (recaptchaToken) {
      const recaptcha = await verifyRecaptcha(recaptchaToken);
      if (!recaptcha.ok)
        return res.status(400).json({ error: "Invalid reCAPTCHA" });
    }

    /* ----------------------------------------------------------
       4) Full-engine insights pipeline (technical mode)
          Even with empty enginesInput = {}:
            - classification runs
            - triad synthesis runs with nulls
            - shortAnswer runs
            - full insights object returned
    ---------------------------------------------------------- */
    const insights = await generateInsights({
      question,
      meta: { email },
      enginesInput: {} // Technical mode = no palm, no astro, no numerology
    });

    /* ----------------------------------------------------------
       5) Build the PDF HTML
    ---------------------------------------------------------- */
    const html = `
      <h1>Technical Report</h1>

      <h2>Question</h2>
      <p>${question}</p>

      <h2>Insights</h2>
      <pre>${JSON.stringify(insights, null, 2)}</pre>
    `;

    const pdfBuffer = await generatePDFBufferFromHTML(html);

    /* ----------------------------------------------------------
       6) Email the PDF
    ---------------------------------------------------------- */
    const emailResult = await sendEmailHTML({
      to: email,
      subject: "Your Technical Report",
      html: `<p>Your technical report is attached.</p>`,
      attachments: [
        { filename: "technical-report.pdf", content: pdfBuffer }
      ]
    });

    if (!emailResult.success) {
      return res.status(500).json({
        error: "Email failed",
        detail: emailResult.error
      });
    }

    /* ----------------------------------------------------------
       7) Success response
    ---------------------------------------------------------- */
    return res.status(200).json({ ok: true, emailed: true });

  } catch (err) {
    console.error("TECH REPORT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

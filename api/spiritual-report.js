// /api/spiritual-report.js
import formidable from "formidable";
import fs from "fs";

import { applyCORS, validateUploadedFile, verifyRecaptcha, sendEmailHTML } from "../lib/utils.js";
import { classifyQuestion } from "../lib/ai.js";
import { analyzePalm } from "../lib/engines.js";
import { generateInsights } from "../lib/insights.js";
import { generatePDFBufferFromHTML } from "../lib/pdf.js";

export const config = { api: { bodyParser: false } };

function normalize(fields, key) {
  const v = fields[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const form = formidable({ keepExtensions: true, allowEmptyFiles: true });
    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fi) => err ? reject(err) : resolve({ fields: f, files: fi }))
    );

    const question = normalize(fields, "question")?.trim();
    if (!question) return res.status(400).json({ error: "Question required" });

    const fullName = normalize(fields, "fullName");
    const birthDate = normalize(fields, "birthDate");
    const birthTime = normalize(fields, "birthTime");
    const birthPlace = normalize(fields, "birthPlace");
    const email = normalize(fields, "email");

    const recaptchaToken =
      normalize(fields, "recaptchaToken") ||
      normalize(fields, "g-recaptcha-response");

    const captcha = await verifyRecaptcha(recaptchaToken);
    if (!captcha.ok)
      return res.status(400).json({ error: "Invalid reCAPTCHA" });

    let palmImagePath = null;
    if (files.palmImage?.filepath) palmImagePath = files.palmImage.filepath;

    const palmistryData = palmImagePath
      ? await analyzePalm({ imageDescription: "Palm", handMeta: {} })
      : null;

    // Main insights
    const insights = await generateInsights({
      question,
      enginesInput: {
        palm: palmistryData,
        numerology: { fullName, dateOfBirth: birthDate },
        astrology: { birthDate, birthTime, birthLocation: birthPlace }
      }
    });

    // PDF generation (optional)
    const html = `
      <h1>Spiritual Report</h1>
      <p>Name: ${fullName}</p>
      <p>Question: ${question}</p>
      <pre>${JSON.stringify(insights, null, 2)}</pre>
    `;

    const pdfBuffer = await generatePDFBufferFromHTML(html);

    if (email) {
      await sendEmailHTML({
        to: email,
        subject: "Your Spiritual Report",
        html: `<p>Your personal spiritual report is attached.</p>`,
        attachments: [{ filename: "spiritual-report.pdf", content: pdfBuffer }]
      });
    }

    return res.status(200).json({
      ok: true,
      pdfEmailed: !!email,
      insights
    });

  } catch (err) {
    console.error("SPIRITUAL REPORT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}

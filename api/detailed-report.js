// /api/detailed-report.js
import formidable from "formidable";
import fs from "fs";

import { applyCORS, validateUploadedFile, verifyRecaptcha, sendEmailHTML } from "../lib/utils.js";
import { generateInsights } from "../lib/insights.js";
import { generatePDFBufferFromHTML } from "../lib/pdf.js";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  const form = formidable({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024 });
  return new Promise((resolve, reject) =>
    form.parse(req, (err, f, files) => err ? reject(err) : resolve({ fields: f, files }))
  );
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { fields, files } = await parseForm(req);

    const email = fields.email?.[0] || fields.email || "";
    const name = fields.name?.[0] || fields.name || "";
    const question = fields.question?.[0] || fields.question || "";

    const recaptchaToken =
      normalize(fields, "recaptchaToken") ||
      normalize(fields, "g-recaptcha-response");

    // Validate recaptcha
    const recaptcha = await verifyRecaptcha(recaptchaToken);
    if (!recaptcha.ok)
      return res.status(400).json({ error: "Invalid reCAPTCHA" });

    let uploadedFileBuffer = null;
    const uploaded = files.upload || files.file;
    if (uploaded) {
      const safe = validateUploadedFile(uploaded);
      if (!safe.ok) return res.status(400).json({ error: safe.error });
      uploadedFileBuffer = fs.readFileSync(uploaded.filepath);
    }

    // Build engines input
    const enginesInput = {
      palm: uploadedFileBuffer ? { imageDescription: "Palm image", handMeta: {} } : null,
      numerology: {
        fullName: name,
        dateOfBirth: fields.dateOfBirth
      },
      astrology: {
        birthDate: fields.birthDate,
        birthTime: fields.birthTime,
        birthLocation: fields.birthLocation
      }
    };

    const insights = await generateInsights({ question, meta: { email, name }, enginesInput });

    const html = `
      <h1>Technical Spiritual Report</h1>
      <p>Name: ${name}</p>
      <p>Email: ${email}</p>
      <pre>${JSON.stringify(insights, null, 2)}</pre>
    `;

    const pdfBuffer = await generatePDFBufferFromHTML(html);

    if (email) {
      await sendEmailHTML({
        to: email,
        subject: "Your Technical Report",
        html: `<p>Your report is attached.</p>`,
        attachments: [
          { filename: "report.pdf", content: pdfBuffer }
        ]
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Detailed report API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

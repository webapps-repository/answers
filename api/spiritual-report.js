// /api/spiritual-report.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const config = { api: { bodyParser: false } };

import formidable from "formidable";
import {
  normalize,
  validateUploadedFile,
  verifyRecaptcha,
  sendEmailHTML
} from "../lib/utils.js";
import { classifyQuestion } from "../lib/ai.js";
import { runAllEngines } from "../lib/engines.js";
import {
  buildSummaryHTML,
  buildPersonalEmailHTML
} from "../lib/insights.js";

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization, X-Requested-With, Accept, Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse form-data
  let fields, files;
  try {
    const form = formidable({ multiples: false, maxFileSize: 12 * 1024 * 1024 });
    ({ fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fl) =>
        err ? reject(err) : resolve({ fields: f, files: fl })
      )
    ));
  } catch (err) {
    console.error("Form parse error:", err);
    return res.status(400).json({ error: "Bad form data" });
  }

  // Required inputs
  const question = normalize(fields, "question");
  const email = normalize(fields, "email");

  if (!email) return res.status(400).json({ error: "Missing email" });
  if (!question) return res.status(400).json({ error: "Missing question" });

  // Mandatory recaptcha
  const recaptchaToken =
    normalize(fields, "recaptchaToken") ||
    normalize(fields, "g-recaptcha-response") ||
    normalize(fields, "g-recaptcha-response[]") ||
    normalize(fields, "token") ||
    normalize(fields, "captcha") ||
    normalize(fields, "recaptcha") ||
    normalize(fields, "h-captcha-response");

  const rec = await verifyRecaptcha(recaptchaToken, req.headers["x-forwarded-for"]);
  if (!rec.ok) return res.status(400).json({ error: "Recaptcha failed", rec });

  // Classification + engine run
  let cls = await classifyQuestion(question);
  let uploadedFile = files?.technicalFile || files?.palmImage || null;

  if (uploadedFile) {
    const valid = validateUploadedFile(uploadedFile);
    if (!valid.ok) return res.status(400).json({ error: valid.error });
  }

  let enginesOut;
  try {
    enginesOut = await runAllEngines({
      question,
      mode: cls.type,
      uploadedFile
    });
  } catch (err) {
    return res.status(500).json({ error: "Engine failure" });
  }

  // Short answer
  const shortHTML = buildSummaryHTML({ classification: cls, engines: enginesOut, question });

  // Full email (always sent)
  const fullHTML = buildPersonalEmailHTML({
    question,
    engines: enginesOut,
    fullName: normalize(fields, "fullName"),
    birthDate: normalize(fields, "birthDate"),
    birthTime: normalize(fields, "birthTime"),
    birthPlace: normalize(fields, "birthPlace"),
  });

  await sendEmailHTML({
    to: email,
    subject: "Your AI Insight Report",
    html: fullHTML
  });

  return res.json({
    ok: true,
    shortAnswer: shortHTML,
    emailSent: true
  });
}

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
  buildUniversalEmailHTML
} from "../lib/insights.js";

// Allowed Shopify domains ONLY
const allowedOrigins = [
  "https://zzqejx-u8.myshopify.com",
  "https://zzeqjx-u8.myshopify.com",
  "https://www.zzqejx-u8.myshopify.com"
];

export default async function handler(req, res) {
  /* ----------------------------------------------------------
     CORS — Shopify-friendly (NO WILDCARD!!!)
  ---------------------------------------------------------- */
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  // Shopify always sends OPTIONS → MUST return clean 200
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  /* ----------------------------------------------------------
     Parse multipart form-data
  ---------------------------------------------------------- */
  const form = formidable({ multiples: false, maxFileSize: 12 * 1024 * 1024 });

  let fields, files;
  try {
    ({ fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fl) =>
        err ? reject(err) : resolve({ fields: f, files: fl })
      )
    ));
  } catch (err) {
    console.error("❌ Form parse error:", err);
    return res.status(400).json({ error: "Bad form data" });
  }

  /* ----------------------------------------------------------
     Extract user fields
  ---------------------------------------------------------- */
  const question = normalize(fields, "question");
  const email = normalize(fields, "email");
  const fullName = normalize(fields, "fullName");
  const birthDate = normalize(fields, "birthDate");
  const birthTime = normalize(fields, "birthTime");
  const birthPlace = normalize(fields, "birthPlace");

  // MULTI-TOKEN FIX (supports all V2 recaptcha names)
  const recaptchaToken =
    normalize(fields, "recaptchaToken") ||
    normalize(fields, "g-recaptcha-response") ||
    normalize(fields, "token") ||
    normalize(fields, "captcha") ||
    normalize(fields, "recaptcha");

  if (!question) return res.status(400).json({ error: "Missing question" });
  if (!email) return res.status(400).json({ error: "Missing email" });

  /* ----------------------------------------------------------
     Verify reCAPTCHA (MANDATORY)
  ---------------------------------------------------------- */
  const rec = await verifyRecaptcha(recaptchaToken, req.headers["x-forwarded-for"]);
  if (!rec.ok) {
    console.error("❌ Recaptcha:", rec);
    return res.status(400).json({ error: "recaptcha failed", rec });
  }

  /* ----------------------------------------------------------
     Optional file upload
  ---------------------------------------------------------- */
  const uploadedFile = files?.technicalFile || files?.palmImage || null;

  if (uploadedFile) {
    const valid = validateUploadedFile(uploadedFile);
    if (!valid.ok)
      return res.status(400).json({ error: valid.error });
  }

  /* ----------------------------------------------------------
     Classification (still used for summary)
  ---------------------------------------------------------- */
  let cls;
  try {
    cls = await classifyQuestion(question);
  } catch {
    cls = { type: "personal", confidence: 0.5 };
  }

  /* ----------------------------------------------------------
     Run all engines (always PERSONAL mode)
  ---------------------------------------------------------- */
  let enginesOut;
  try {
    enginesOut = await runAllEngines({
      question,
      mode: "personal",
      uploadedFile
    });
  } catch (err) {
    console.error("❌ Engine failure:", err);
    return res.status(500).json({ error: "Engine failure" });
  }

  /* ----------------------------------------------------------
     SHORT ANSWER (shown on Shopify page)
  ---------------------------------------------------------- */
  const shortHTML = buildSummaryHTML({
    classification: cls,
    engines: enginesOut,
    question
  });

  /* ----------------------------------------------------------
     LONG ANSWER EMAIL (Universal template)
  ---------------------------------------------------------- */
  const longHTML = buildUniversalEmailHTML({
    title: "Your Personal Insight Report",
    question,
    engines: enginesOut,
    fullName,
    birthDate,
    birthTime,
    birthPlace
  });

  const emailResult = await sendEmailHTML({
    to: email,
    subject: "Your Personal Insight Report",
    html: longHTML
  });

  if (!emailResult.success) {
    console.error("❌ Email error:", emailResult.error);
    return res.status(500).json({ error: "Email failed" });
  }

  return res.json({
    ok: true,
    mode: "personal",
    shortAnswer: shortHTML
  });
}

// /api/technical-report.js
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

import { runAllEngines } from "../lib/engines.js";
import {
  buildSummaryHTML,
  buildUniversalEmailHTML
} from "../lib/insights.js";

export default async function handler(req, res) {
  /* ---------------------------------------------
     CORS
  ---------------------------------------------- */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Not allowed" });

  /* ---------------------------------------------
     PARSE FORM (multipart/form-data)
  ---------------------------------------------- */
  const form = formidable({ multiples: false });
  let fields, files;

  try {
    ({ fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fl) =>
        err ? reject(err) : resolve({ fields: f, files: fl })
      )
    ));
  } catch (err) {
    return res.status(400).json({ error: "Bad form data", detail: String(err) });
  }

  /* ---------------------------------------------
     NORMALISE FIELDS
  ---------------------------------------------- */
  const email = normalize(fields, "email");
  const question = normalize(fields, "question");

  // Shopify invisible recaptcha sends only one of these
  const recaptchaToken =
    normalize(fields, "recaptchaToken") ||
    normalize(fields, "g-recaptcha-response") ||
    normalize(fields, "token");

  if (!email) return res.status(400).json({ error: "Email required" });
  if (!question) return res.status(400).json({ error: "Question required" });
  if (!recaptchaToken)
    return res.status(400).json({ error: "Missing recaptcha token" });

  /* ---------------------------------------------
     VERIFY RECAPTCHA
     IP detection must be corrected for Shopify + Vercel
  ---------------------------------------------- */
  const inferredIP =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "0.0.0.0";

  let rec;
  try {
    rec = await verifyRecaptcha(recaptchaToken, inferredIP);
  } catch (err) {
    return res.status(500).json({ error: "Recaptcha API failure", detail: String(err) });
  }

  if (!rec.ok)
    return res.status(400).json({
      error: "Invalid reCAPTCHA",
      google: rec
    });

  /* ---------------------------------------------
     FILE VALIDATION (tech mode)
  ---------------------------------------------- */
  const uploadedFile = files?.technicalFile || null;

  if (uploadedFile) {
    const valid = validateUploadedFile(uploadedFile);
    if (!valid.ok) return res.status(400).json({ error: valid.error });
  }

  /* ---------------------------------------------
     RUN ENGINES (technical mode)
  ---------------------------------------------- */
  let enginesOut;

  try {
    enginesOut = await runAllEngines({
      question,
      mode: "technical",
      uploadedFile
    });
  } catch (err) {
    return res.status(500).json({ error: "Engine failure", detail: String(err) });
  }

  /* ---------------------------------------------
     BUILD SHORT + LONG OUTPUTS
  ---------------------------------------------- */
  const shortHTML = buildSummaryHTML({
    classification: { type: "technical", confidence: 1 },
    engines: enginesOut,
    question
  });

  const longHTML = buildUniversalEmailHTML({
    title: "Your Technical Analysis Report",
    question,
    engines: enginesOut
  });

  /* ---------------------------------------------
     SEND EMAIL
  ---------------------------------------------- */
  try {
    await sendEmailHTML({
      to: email,
      subject: "Your Technical Analysis Report",
      html: longHTML
    });
  } catch (err) {
    return res.status(500).json({
      error: "Email send failure",
      detail: String(err)
    });
  }

  /* ---------------------------------------------
     SUCCESS RESPONSE TO FRONTEND
  ---------------------------------------------- */
  return res.json({
    ok: true,
    mode: "technical",
    shortAnswer: shortHTML
  });
}

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
import { generateInsights } from "../lib/insights.js";
import { runAllEngines } from "../lib/engines.js";
import {
  buildSummaryHTML,
  buildUniversalEmailHTML
} from "../lib/insights.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });

  // Parse form
  const form = formidable({ multiples: false });
  let fields, files;

  try {
    ({ fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fl) =>
        err ? reject(err) : resolve({ fields: f, files: fl })
      )
    ));
  } catch {
    return res.status(400).json({ error: "Bad form data" });
  }

  const email = normalize(fields, "email");
  const question = normalize(fields, "question");

  const recaptchaToken =
    normalize(fields, "recaptchaToken") ||
    normalize(fields, "g-recaptcha-response") ||
    normalize(fields, "token");

  if (!email) return res.status(400).json({ error: "Email required" });
  if (!question) return res.status(400).json({ error: "Question required" });

  // recaptcha
  const rec = await verifyRecaptcha(recaptchaToken, req.headers["x-forwarded-for"]);
  if (!rec.ok) return res.status(400).json({ error: "Invalid reCAPTCHA", rec });

  const uploadedFile = files?.technicalFile || null;
  if (uploadedFile) {
    const valid = validateUploadedFile(uploadedFile);
    if (!valid.ok) return res.status(400).json({ error: valid.error });
  }

  // Run engines (technical mode)
  let enginesOut;
  try {
    enginesOut = await runAllEngines({
      question,
      mode: "technical",
      uploadedFile
    });
  } catch (err) {
    return res.status(500).json({ error: "Engine failure" });
  }

  // Short answer
  const shortHTML = buildSummaryHTML({
    classification: { type: "technical" },
    engines: enginesOut,
    question
  });

  // Long HTML email
  const longHTML = buildUniversalEmailHTML({
    title: "Your Technical Analysis Report",
    question,
    engines: enginesOut
  });

  await sendEmailHTML({
    to: email,
    subject: "Your Technical Analysis Report",
    html: longHTML
  });

  return res.json({
    ok: true,
    mode: "technical",
    shortAnswer: shortHTML
  });
}

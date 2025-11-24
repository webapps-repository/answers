// /api/technical-report.js — V2 Mandatory, Email Required
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const config = { api: { bodyParser: false } };

import formidable from "formidable";
import {
  normalize,
  verifyRecaptcha,
  sendEmailHTML
} from "../lib/utils.js";
import { generateInsights } from "../lib/insights.js";

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // Parse form
  let fields;
  try {
    const form = formidable({ multiples: false });
    ({ fields } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f) =>
        err ? reject(err) : resolve({ fields: f })
      )
    ));
  } catch {
    return res.status(400).json({ error: "Bad form data" });
  }

  const email = normalize(fields, "email");
  const question = normalize(fields, "question");

  if (!email) return res.status(400).json({ error: "Email required" });
  if (!question) return res.status(400).json({ error: "Question required" });

  // Mandatory recaptcha
  const recaptchaToken =
    normalize(fields, "recaptchaToken") ||
    normalize(fields, "g-recaptcha-response") ||
    normalize(fields, "captcha");

  const rec = await verifyRecaptcha(recaptchaToken, req.headers["x-forwarded-for"]);
  if (!rec.ok)
    return res.status(400).json({ error: "Invalid reCAPTCHA", rec });

  let insights;
  try {
    insights = await generateInsights({
      question,
      enginesInput: {}
    });
  } catch {
    return res.status(500).json({ error: "Insight engine failure" });
  }

  const subject = `Your Technical Report — ${new Date().toLocaleString()}`;
  const html = `
    <div style="font-family:Arial; line-height:1.55;">
      <h2>Your Technical Insight Report</h2>
      <div style="background:#f8f6ff; padding:14px; border-radius:10px; white-space:pre-wrap;">
        ${JSON.stringify(insights, null, 2)}
      </div>
    </div>
  `;

  await sendEmailHTML({
    to: email,
    subject,
    html
  });

  return res.status(200).json({
    ok: true,
    emailed: true
  });
}

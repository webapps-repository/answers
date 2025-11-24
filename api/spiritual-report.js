// /api/spiritual-report.js — Stage-3 (HTML email only)

export const config = {
  api: { bodyParser: false },
  runtime: "nodejs"
};

import formidable from "formidable";

import {
  applyCORS,
  normalize,
  verifyRecaptcha,
  sendHtmlEmail    // <-- Stage-3 function
} from "../lib/utils.js";

import { analyzePalm } from "../lib/engines.js";
import { generateInsights } from "../lib/insights.js";

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const form = formidable({ keepExtensions: true });
    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, f, fs) => err ? reject(err) : resolve({ fields: f, files: fs }))
    );

    const question = normalize(fields, "question");
    if (!question) return res.status(400).json({ error: "Missing question" });

    const recaptchaToken = normalize(fields, "recaptchaToken");
    const captcha = await verifyRecaptcha(recaptchaToken, req.headers["x-real-ip"]);
    if (!captcha.ok) return res.status(400).json({ error: "Invalid reCAPTCHA" });

    const isPersonal = normalize(fields, "isPersonal") === "true";
    const email = normalize(fields, "email");

    // Optional palmistry upload
    let palm = null;
    if (files.palmImage?.filepath) {
      palm = await analyzePalm({
        imageDescription: "Palm Photo",
        handMeta: {}
      });
    }

    const enginesInput = {
      palm,
      numerology: isPersonal ? {
        fullName: normalize(fields, "fullName"),
        dateOfBirth: normalize(fields, "birthDate")
      } : null,
      astrology: isPersonal ? {
        birthDate: normalize(fields, "birthDate"),
        birthTime: normalize(fields, "birthTime"),
        birthLocation: normalize(fields, "birthPlace")
      } : null
    };

    const insights = await generateInsights({ question, enginesInput });

    // 🔥 PERSONAL MODE → SEND EMAIL
    if (isPersonal) {
      const subject = `Your Personal AI Insight — ${new Date().toLocaleString()}`;
      const html = `
        <h1>Your Personal AI Insight Report</h1>
        <p>Here is your full personal reading:</p>
        <pre>${JSON.stringify(insights, null, 2)}</pre>
      `;

      await sendHtmlEmail({ to: email, subject, html });

      return res.status(200).json({
        ok: true,
        mode: "personal",
        shortAnswer: insights.shortAnswer,
        emailed: true
      });
    }

    // 🔥 TECHNICAL MODE → return short answer
    return res.status(200).json({
      ok: true,
      mode: "technical",
      shortAnswer: insights.shortAnswer,
      insights
    });

  } catch (err) {
    console.error("SPIRITUAL ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// /api/selftest.js
// Health check for: env, OpenAI presence, PDF render, Resend mail (optional), Recaptcha presence.
// Supports "light" polling mode to avoid sending emails every 10s: /api/selftest?light=1

import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithResend } from "./utils/sendEmail.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const light = url.searchParams.get("light") === "1";

  const result = {
    success: false,
    checks: {
      env: { ok: true, message: "OK" },
      openai: { ok: true, message: "OK" },
      pdf: { ok: true, message: "OK" },
      resend: { ok: true, message: light ? "Skipped (light mode)" : "OK" },
      recaptcha: { ok: true, message: "OK" },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // ===== Env =====
    const missing = [];
    if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    // OPENAI optional (app still runs without)
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      result.checks.recaptcha.ok = false;
      result.checks.recaptcha.message = "RECAPTCHA_SECRET_KEY missing";
    }
    if (missing.length) {
      result.checks.env.ok = false;
      result.checks.env.message = `Missing: ${missing.join(", ")}`;
    }

    // ===== OpenAI presence (soft check) =====
    if (!process.env.OPENAI_API_KEY) {
      result.checks.openai.ok = false;
      result.checks.openai.message = "OPENAI_API_KEY missing (non-fatal)";
    }

    // ===== PDF generation =====
    try {
      const pdf = await generatePdfBuffer({
        headerBrand: "Melodies Web",
        title: "Your Answer",
        mode: "technical",
        question: "Self-test PDF render",
        answer: "PDF engine healthy.",
      });
      if (!pdf || !pdf.length) throw new Error("Empty PDF buffer");
    } catch (e) {
      result.checks.pdf.ok = false;
      result.checks.pdf.message = `PDF error: ${e.message}`;
    }

    // ===== Resend email send (skip in light mode) =====
    if (!light) {
      try {
        const to = process.env.TEST_EMAIL_TO || process.env.ALERT_EMAIL_TO;
        if (!to) throw new Error("Set TEST_EMAIL_TO or ALERT_EMAIL_TO for full self-test");
        await sendEmailWithResend({
          to,
          subject: "Melodies Web · Self-Test OK",
          html: "<p>✅ Self-test succeeded. (This email proves Resend works.)</p>",
        });
      } catch (e) {
        result.checks.resend.ok = false;
        result.checks.resend.message = `Resend error: ${e.message}`;
      }
    }

    // ===== Final outcome =====
    result.success = Object.values(result.checks).every((c) => c.ok);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    result.success = false;
    // a catch-all failure message if we got here
    if (!result.checks.env) result.checks.env = { ok: false, message: err.message };
    return res.status(500).json(result);
  }
}

// /lib/utils.js — FINAL PRODUCTION VERSION (HTML EMAIL ONLY)

import { Resend } from "resend";

/* ============================================================
   SINGLETON RESEND CLIENT (never recreate in serverless)
============================================================ */
let resend = null;

function getResendClient() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.error("❌ RESEND_API_KEY missing — email disabled.");
      return null;
    }
    resend = new Resend(key);
  }
  return resend;
}

/* ============================================================
   UNIVERSAL CORS (Shopify + dev friendly)
============================================================ */
export function applyCORS(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // Stop here (preflight)
  }

  return false; // Allow real request to continue
}

/* ============================================================
   NORMALIZER — consistent with formidable's array-like fields
============================================================ */
export function normalize(fields = {}, key, { trim = true } = {}) {
  let v = fields?.[key];

  if (Array.isArray(v)) v = v[0];
  if (typeof v === "string" && trim) v = v.trim();

  return v ?? "";
}

/* ============================================================
   FILE VALIDATOR (optional palm uploads)
============================================================ */
export function validateUploadedFile(file) {
  if (!file) return { ok: true };

  const validTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (!validTypes.includes(file.mimetype))
    return { ok: false, error: "Invalid file type" };

  if (file.size > 10 * 1024 * 1024)
    return { ok: false, error: "File too large" };

  return { ok: true };
}

/* ============================================================
   SEND EMAIL (NO PDF — HTML ONLY)
============================================================ */
export async function sendHtmlEmail({
  to,
  subject,
  html,
  attachments = []
}) {
  const client = getResendClient();
  if (!client)
    return { success: false, error: "Resend client missing" };

  const fromAddress = process.env.RESEND_FROM;
  if (!fromAddress) {
    console.error("❌ RESEND_FROM missing — email cannot be sent.");
    return { success: false, error: "Missing from-address" };
  }

  try {
    // Convert any attachments → Resend format (HTML mode supports inline text/html)
    const prepared = attachments.map(a => ({
      filename: a.filename,
      content:
        typeof a.content === "string"
          ? a.content
          : Buffer.isBuffer(a.content)
          ? a.content.toString("base64")
          : "",
      encoding: "base64"
    }));

    const out = await client.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      attachments: prepared
    });

    return { success: true, out };

  } catch (err) {
    console.error("❌ Resend email error:", err);
    return { success: false, error: err.message };
  }
}

/* ============================================================
   reCAPTCHA VERIFY
============================================================ */
export async function verifyRecaptcha(token, ip) {
  if (!token)
    return { ok: false, error: "Missing reCAPTCHA token" };

  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.warn("⚠ RECAPTCHA_SECRET_KEY missing — dev bypass active.");
    return { ok: true, devBypass: true };
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (ip) params.append("remoteip", ip);

  try {
    const r = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      }
    );

    const data = await r.json();
    return { ok: data.success === true, raw: data };

  } catch (err) {
    console.error("❌ Recaptcha error:", err);
    return { ok: false, error: err.message };
  }
}

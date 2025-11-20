// /lib/utils.js
import { Resend } from "resend";
import fs from "fs";

/* -------------------------------------------------------------------------- */
/*   RECAPTCHA (unchanged except removed SendGrid dependency)                 */
/* -------------------------------------------------------------------------- */

export async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.warn("RECAPTCHA_SECRET_KEY not set; skipping verification.");
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, error: "Missing reCAPTCHA token." };
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (remoteIp) params.append("remoteip", remoteIp);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const data = await res.json();

  if (!data.success) {
    return { ok: false, error: "reCAPTCHA failed", details: data };
  }

  return {
    ok: true,
    score: data.score ?? 0.9,
    raw: data
  };
}

/* -------------------------------------------------------------------------- */
/*   FILE VALIDATION (no changes needed)                                      */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/jpg"
];

export function validateUploadedFile(file) {
  if (!file) {
    return { ok: false, error: "No file uploaded." };
  }

  const type = file.mimetype || file.type;
  const size = file.size ?? 0;

  if (!ALLOWED_MIME_TYPES.includes(type)) {
    return {
      ok: false,
      error: `Unsupported file type: ${type}`
    };
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File too large (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`
    };
  }

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*   RESEND EMAIL — CLEAN, FINAL VERSION                                      */
/* -------------------------------------------------------------------------- */

let resendInstance = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

/**
 * Send an HTML email with optional PDF attachments via RESEND.
 */
export async function sendEmailHTML({ to, subject, html, attachments = [] }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing → skipping email.");
    return { ok: false, skipped: true };
  }

  const resend = getResend();

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM || "no-reply@yourdomain.com",
      to,
      subject,
      html,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content, // must be BASE64 encoded
        type: a.type
      }))
    });

    return { ok: true, response: data };
  } catch (err) {
    console.error("Resend send error:", err);
    return { ok: false, error: err.message };
  }
}

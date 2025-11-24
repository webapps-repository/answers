// /api/test-email.js
//
// Example:
// https://answers-rust.vercel.app/api/test-email?email=henrycvalk@gmail.com

export const runtime = "nodejs";            // REQUIRED for Resend + env vars
export const dynamic = "force-dynamic";     // Prevent caching
export const config = { api: { bodyParser: true } };

import { applyCORS, sendEmailHTML } from "../lib/utils.js";

export default async function handler(req, res) {
  // -----------------------------
  // CORS (must run before anything)
  // -----------------------------
  if (applyCORS(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  try {
    // Extract email or use default
    const email = req.query.email || "henrycvalk@gmail.com";

    // Send email using Resend
    const result = await sendEmailHTML({
      to: email,
      subject: "TEST EMAIL WORKS",
      html: `
        <div style="font-family:Arial; padding:20px;">
          <h1 style="color:#4B0082;">Resend Test OK ✔</h1>
          <p>This is a live test email sent from your Vercel API route.</p>
        </div>
      `
    });

    if (!result.success) {
      console.error("❌ Test email error:", result.error);
      return res.status(500).json({
        ok: false,
        error: result.error
      });
    }

    // Success
    return res.status(200).json({
      ok: true,
      message: "Email sent!",
      details: result.out
    });

  } catch (err) {
    console.error("❌ test-email route error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}

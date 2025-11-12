// test-email.js — Quick endpoint to test Resend mail delivery
import { sendEmailWithResend } from "./utils/sendEmail.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const to = process.env.TEST_EMAIL_TO || "dev@melodiesweb.io";

  try {
    await sendEmailWithResend({
      to,
      subject: "Test Email from Melodies Web",
      html: "<p>This is a test email via Resend API integration.</p>",
    });
    res.json({ success: true, to });
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

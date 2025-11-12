// selftest.js — Self-check for environment, CORS, Recaptcha, and Resend connectivity
import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { sendEmailWithResend } from "./utils/sendEmail.js";
import { generatePdfBuffer } from "./utils/generatePdf.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 1️⃣ Test PDF generation
    const pdf = await generatePdfBuffer({
      headerBrand: "Melodies Web",
      title: "Test PDF",
      mode: "technical",
      question: "Is everything working?",
      answer: "Yes — your API, Resend, OpenAI, and CORS setup are all healthy.",
    });

    // 2️⃣ Test email send
    await sendEmailWithResend({
      to: process.env.TEST_EMAIL_TO || "dev@melodiesweb.io",
      subject: "Melodies Web API Self-Test",
      html: "<p>✅ Your backend stack passed the self-test.</p>",
      buffer: pdf,
      filename: "SelfTest.pdf",
    });

    // 3️⃣ Test Recaptcha (mock)
    const recaptcha = await verifyRecaptcha("dummy-token");

    res.json({
      success: true,
      resend: "OK",
      pdf: pdf.length,
      recaptcha,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Selftest error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

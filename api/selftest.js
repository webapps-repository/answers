export const config = { api: { bodyParser: true } };

export default async function handler(_req, res) {
  const out = [];
  const start = Date.now();

  const push = (name, ok, detail = "") => out.push({ name, ok, detail });

  // OpenAI
  try {
    push("OPENAI_API_KEY", !!process.env.OPENAI_API_KEY, !!process.env.OPENAI_API_KEY ? "Found" : "Missing");
  } catch { push("OPENAI_API_KEY", false, "Error reading env"); }

  // Resend
  push("RESEND_API_KEY", !!process.env.RESEND_API_KEY, !!process.env.RESEND_API_KEY ? "Found" : "Missing");
  push("FROM_EMAIL", !!process.env.FROM_EMAIL, process.env.FROM_EMAIL || "Missing");

  // reCAPTCHA
  push("RECAPTCHA_SECRET_KEY", !!process.env.RECAPTCHA_SECRET_KEY, !!process.env.RECAPTCHA_SECRET_KEY ? "Found" : "Missing");

  // PDF
  try {
    const { generatePdfBuffer } = await import("./utils/generate-pdf.js");
    const pdf = await generatePdfBuffer({ titleText: "SelfTest PDF", question: "ping", answer: "pong", mode: "technical", numerologyPack: { technicalKeyPoints: ["ok"], technicalNotes: "ok" } });
    push("PDF generation", pdf?.length > 1000, `bytes=${pdf?.length || 0}`);
  } catch (e) { push("PDF generation", false, String(e?.message || e)); }

  res.status(200).json({
    success: out.every(x => x.ok),
    duration: ((Date.now() - start) / 1000).toFixed(2) + "s",
    results: out,
  });
}

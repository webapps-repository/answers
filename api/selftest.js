// /api/selftest.js
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";
import OpenAI from "openai";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  const results = [];
  const add = (name, ok, detail = "") => results.push({ name, ok, detail });

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 1️⃣ OpenAI key
    const openaiKey = process.env.OPENAI_API_KEY;
    add("OpenAI API Key", !!openaiKey, openaiKey ? "Found" : "Missing");

    let openai;
    let classification = null;
    if (openaiKey) {
      try {
        openai = new OpenAI({ apiKey: openaiKey });
        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say PASS" }],
          temperature: 0,
        });
        const text = resp.choices?.[0]?.message?.content || "";
        add("OpenAI Request", text.includes("PASS"), text);
        classification = text;
      } catch (err) {
        add("OpenAI Request", false, err.message);
      }
    }

    // 2️⃣ reCAPTCHA
    const recaptchaKey = process.env.RECAPTCHA_SECRET_KEY;
    add("reCAPTCHA Secret", !!recaptchaKey, recaptchaKey ? "Found" : "Missing");

    // 3️⃣ SendGrid
    const sendgrid = process.env.SENDGRID_API_KEY;
    add("SendGrid API Key", !!sendgrid, sendgrid ? "Found" : "Missing");

    // 4️⃣ Numerology (local)
    const testName = "Test User";
    const letters = testName.toUpperCase().replace(/[^A-Z]/g, "");
    const map = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8 };
    const sum = letters.split("").reduce((s,c)=>s+(map[c]||0),0);
    add("Numerology Local Calc", sum > 0, `Sum=${sum}`);

    // 5️⃣ PDF Generation
    try {
      const pdf = await generatePdfBuffer({
        headerBrand: "Melodies Web",
        title: "Self Test Report",
        mode: "technical",
        question: "System diagnostics",
        answer: "PDF generation OK",
        numerologyPack: { technicalKeyPoints:["Check1 OK","Check2 OK"], technicalNotes:"Functional" },
      });
      add("PDF Generation", Buffer.isBuffer(pdf) && pdf.length > 500, `Size=${pdf.length}`);
    } catch (err) {
      add("PDF Generation", false, err.message);
    }

    // 6️⃣ Email Test (mock)
    try {
      if (sendgrid) {
        await sendEmailWithAttachment({
          to: process.env.TEST_EMAIL || "your@email.com",
          subject: "Melodies Web Self Test",
          html: "<p>✅ Email test succeeded.</p>",
          buffer: Buffer.from("Email OK", "utf-8"),
          filename: "test.txt",
        });
        add("Email Sending", true, "Sent to TEST_EMAIL");
      } else add("Email Sending", false, "No SendGrid key");
    } catch (err) {
      add("Email Sending", false, err.message);
    }

    // 7️⃣ JSON Integrity
    const valid = results.every(r => typeof r.ok === "boolean");
    add("JSON Integrity", valid, valid ? "Valid" : "Broken");

    return res.status(200).json({
      success: true,
      summary: `${results.filter(r=>r.ok).length}/${results.length} checks passed`,
      results,
      timestamp: new Date().toISOString(),
      classification,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

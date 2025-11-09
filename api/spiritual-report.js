// full updated /api/spiritual-report.js

import { formidable } from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  // ✅ Parse form data
  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(500).json({ success: false, error: "Form parsing failed" });
    }

    // ✅ Verify reCAPTCHA
    const token = Array.isArray(fields["g-recaptcha-response"])
      ? fields["g-recaptcha-response"][0]
      : fields["g-recaptcha-response"];

    const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const verification = await verify.json();
    if (!verification.success) {
      return res.status(403).json({
        success: false,
        error: "reCAPTCHA verification failed",
        details: verification,
      });
    }

    // ✅ Extract fields
    const fullName = fields.name;
    const birthdate = fields.birthdate;
    const birthTime = fields.birthtime || "Unknown";
    const birthPlace = `${fields.birthcity}, ${fields.birthstate}, ${fields.birthcountry}`;
    const email = fields.email;
    const question = fields.question || "No question provided.";
    const submittedAt = new Date().toISOString();

    console.log(`✅ Verified user: ${fullName}`);

    // --- 🔮 Generate OpenAI combined insights ---
    let answer = "Could not generate answer.";
    let astrology = "Could not generate astrology insights.";
    let numerology = "Could not generate numerology insights.";
    let palmistry = "Could not generate palmistry insights.";

    try {
      const prompt = `
You are a professional spiritual advisor combining astrology, numerology, and palmistry.
Use the following information to provide a personal answer and insights.

Name: ${fullName}
Date of Birth: ${birthdate}
Time of Birth: ${birthTime}
Birth Place: ${birthPlace}
Question: ${question}
Submission Time: ${submittedAt}

Return a JSON response in the format:
{
  "answer": "Direct, clear answer to their question.",
  "astrology": "Personal astrology insights (around 100 words).",
  "numerology": "Numerology interpretation (around 100 words).",
  "palmistry": "Palmistry reading (around 100 words)."
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert astrologer, numerologist, and palm reader who provides calm, wise, and insightful guidance.",
          },
          { role: "user", content: prompt },
        ],
      });

      const responseText = completion.choices[0].message.content || "{}";
      const json = JSON.parse(responseText);
      answer = json.answer || answer;
      astrology = json.astrology || astrology;
      numerology = json.numerology || numerology;
      palmistry = json.palmistry || palmistry;
    } catch (error) {
      console.error("❌ OpenAI generation error:", error);
    }

    // --- 🧘 Generate PDF with full report ---
    const pdfBuffer = await generatePdfBuffer({
      fullName,
      birthdate,
      birthTime,
      birthPlace,
      question,
      answer,
      astrology,
      numerology,
      palmistry,
    });

    // --- ✉️ Build email body (includes question + answer first) ---
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 650px; margin: auto;">
        <h2 style="text-align:center; color:#6c63ff;">🔮 Your Spiritual Report & Answer</h2>

        <div style="background:#f9f9f9; padding:1rem; border-radius:10px; margin-bottom:1.2rem;">
          <p><strong>📧 Email:</strong> ${email}</p>
          <p><strong>🧑 Name:</strong> ${fullName}</p>
          <p><strong>📅 Birth Date:</strong> ${birthdate}</p>
          <p><strong>⏰ Birth Time:</strong> ${birthTime}</p>
          <p><strong>🌍 Birth Place:</strong> ${birthPlace}</p>
          <p><strong>💭 Question:</strong> ${question}</p>
        </div>

        <h3 style="color:#444;">💫 Answer</h3>
        <div style="background:#eef3ff;padding:0.8rem;border-radius:8px;margin-bottom:1rem;">
          ${answer}
        </div>

        <h3 style="color:#444;">✨ Astrology Insights</h3>
        <div style="background:#f7f7f7;padding:0.8rem;border-radius:8px;margin-bottom:1rem;">
          ${astrology}
        </div>

        <h3 style="color:#444;">🔢 Numerology Insights</h3>
        <div style="background:#f7f7f7;padding:0.8rem;border-radius:8px;margin-bottom:1rem;">
          ${numerology}
        </div>

        <h3 style="color:#444;">✋ Palmistry Insights</h3>
        <div style="background:#f7f7f7;padding:0.8rem;border-radius:8px;margin-bottom:1rem;">
          ${palmistry}
        </div>

        <p style="margin-top:20px; font-size:0.95rem; color:#555;">
          ✅ A full detailed PDF report is attached to this email.
        </p>

        <p style="margin-top:1.5rem; text-align:center; color:#777;">
          <em>— Hazcam Spiritual Systems ✨</em>
        </p>
      </div>
    `;

    // --- 📧 Send Email ---
    await sendEmailWithAttachment({
      to: email,
      subject: "🔮 Your Spiritual Report & Answer",
      html: htmlBody,
      buffer: pdfBuffer,
      filename: "Spiritual_Report.pdf",
    });

    console.log(`✅ Report emailed to ${email}`);

    // --- ✅ Return JSON for frontend summaries ---
    return res.status(200).json({
      success: true,
      answer,
      astrologySummary: astrology,
      numerologySummary: numerology,
      palmSummary: palmistry,
    });
  });
}

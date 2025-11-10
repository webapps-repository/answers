// /api/spiritual-report.js
// /api/spiritual-report.js
// /api/spiritual-report.js

import { formidable } from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  const form = formidable({ multiples: false, keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(500).json({ success: false, error: "Form parsing failed" });
    }

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

    const userData = {
      fullName: fields.name,
      email: fields.email,
      birthdate: fields.birthdate,
      birthTime: fields.birthtime || "Unknown",
      birthPlace: `${fields.birthcity}, ${fields.birthstate}, ${fields.birthcountry}`,
      question: fields.question || "No question provided.",
      submittedAt: new Date().toISOString(),
    };

    console.log(`✅ Verified user: ${userData.fullName}`);

    // === 🔮 OpenAI Combined JSON ===
    let result = {};
    try {
      const prompt = `
You are an expert spiritual analyst specializing in astrology, numerology, and palmistry.
You will answer the user's question using insights from all three disciplines.

User:
- Name: ${userData.fullName}
- Date of Birth: ${userData.birthdate}
- Time of Birth: ${userData.birthTime}
- Birth Place: ${userData.birthPlace}
- Question: ${userData.question}
- Submission Time: ${userData.submittedAt}

Respond ONLY in valid JSON format with the following structure:
{
  "answer": "Short, cohesive synthesis answering their question, derived from astrology, numerology, and palmistry summaries.",
  "astrology": {
    "summary": "Short paragraph relevant to the user's question.",
    "Planetary Positions": "...",
    "Ascendant (Rising) Zodiac Sign": "...",
    "Astrological Houses": "...",
    "Family Astrology": "...",
    "Love Governing House in Astrology": "...",
    "Health & Wellbeing Predictions": "...",
    "Astrological influences on Work, Career and Business": "..."
  },
  "numerology": {
    "summary": "Short paragraph relevant to the question asked.",
    "Life Path": { "number": "5", "meaning": "..." },
    "Expression": { "number": "7", "meaning": "..." },
    "Personality": { "number": "3", "meaning": "..." },
    "Soul Urge": { "number": "9", "meaning": "..." },
    "Maturity": { "number": "11", "meaning": "..." }
  },
  "palmistry": {
    "summary": "Short paragraph relevant to the question asked.",
    "Life Line": "...",
    "Head Line": "...",
    "Heart Line": "...",
    "Fate Line": "...",
    "Fingers": "...",
    "Mounts": "...",
    "Marriage / Relationship": "...",
    "Children": "...",
    "Travel Lines": "...",
    "Stress Lines": "..."
  }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: "You are an expert spiritual analyst producing JSON reports for astrology, numerology, and palmistry." },
          { role: "user", content: prompt },
        ],
      });

      result = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("❌ OpenAI JSON error:", err);
    }

    // === PDF Generation ===
    const pdfBuffer = await generatePdfBuffer({
      ...userData,
      answer: result.answer,
      astrology: result.astrology?.summary,
      numerology: result.numerology?.summary,
      palmistry: result.palmistry?.summary,
      astroDetails: result.astrology,
      numDetails: result.numerology,
      palmDetails: result.palmistry,
    });

    // === Email Send ===
    await sendEmailWithAttachment({
      to: userData.email,
      subject: "🔮 Your Spiritual Report and Personalized Guidance",
      html: `
        <h2>Your Spiritual Report</h2>
        <p><strong>Question:</strong> ${userData.question}</p>
        <p>${result.answer}</p>
        <p>Attached is your detailed report.</p>
      `,
      buffer: pdfBuffer,
      filename: "Spiritual_Report.pdf",
    });

    console.log(`✅ Report emailed to ${userData.email}`);

    res.status(200).json({
      success: true,
      message: "Report generated successfully.",
      answer: result.answer,
      astrologySummary: result.astrology?.summary,
      numerologySummary: result.numerology?.summary,
      palmSummary: result.palmistry?.summary,
    });
  });
}

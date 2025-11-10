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

    // === reCAPTCHA Verification ===
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

    // === Extract User Data ===
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

    // === 🔮 OpenAI JSON Prompt with Canonical Numerology Meanings ===
    let result = {};
    try {
      const prompt = `
You are an expert spiritual analyst combining astrology, numerology, and palmistry.
Provide a deeply personalized reading that answers the user's question.

Use standard numerology interpretations for these numbers:

1 – Leadership, individuality, ambition
2 – Harmony, diplomacy, sensitivity
3 – Creativity, self-expression, optimism
4 – Practicality, discipline, structure
5 – Freedom, adaptability, adventure
6 – Responsibility, nurturing, family focus
7 – Introspection, analysis, spirituality
8 – Power, ambition, material success
9 – Compassion, idealism, humanitarianism
11 – Intuition, inspiration, visionary
22 – Master builder, manifestation, achievement
33 – Universal teacher, empathy, enlightenment

User:
- Name: ${userData.fullName}
- Date of Birth: ${userData.birthdate}
- Time of Birth: ${userData.birthTime}
- Birth Place: ${userData.birthPlace}
- Question: ${userData.question}
- Submission Time: ${userData.submittedAt}

Respond in **valid JSON** format only:

{
  "answer": "Short synthesized answer to their question, integrating insights from astrology, numerology, and palmistry.",
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
    "Life Path": { "number": "5", "meaning": "You are curious, adaptable, and thrive on freedom..." },
    "Expression": { "number": "3", "meaning": "Creative and communicative, expressing through art or words..." },
    "Personality": { "number": "8", "meaning": "Projecting confidence and ambition, driven by tangible success..." },
    "Soul Urge": { "number": "9", "meaning": "Compassionate and idealistic, guided by altruistic purpose..." },
    "Maturity": { "number": "11", "meaning": "Deep intuitive wisdom and leadership through inspiration..." }
  },
  "palmistry": {
    "summary": "Short paragraph relevant to the user's question.",
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
          { role: "system", content: "You are an expert spiritual analyst producing structured JSON reports with consistent numerological interpretations." },
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
      subject: "Your Full Spiritual Report",
      html: `
        <h2>Your Personalized Report</h2>
        <p><strong>Question:</strong> ${userData.question}</p>
        <p>${result.answer}</p>
        <p>Attached is your detailed PDF report.</p>
      `,
      buffer: pdfBuffer,
      filename: "Spiritual_Report.pdf",
    });

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

// /api/spiritual-report.js
import { formidable } from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: false },
};

// ✅ Date normalizer — ensures consistent dd-mm-yyyy format before PDF
function normalizeDate(dateStr) {
  try {
    if (!dateStr) return "";
    if (dateStr instanceof Date) {
      return dateStr.toISOString().split("T")[0];
    }
    if (typeof dateStr === "string") {
      const parts = dateStr.match(/\d+/g);
      if (!parts) return dateStr;
      if (parts.length === 3) {
        const [y, m, d] =
          dateStr.includes("-") && dateStr.indexOf("-") === 4
            ? [parts[0], parts[1], parts[2]]
            : [parts[2], parts[1], parts[0]];
        return `${y}-${m}-${d}`;
      }
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

export default async function handler(req, res) {
  // --- CORS ---
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
      console.error("❌ reCAPTCHA verification failed:", verification);
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
      birthdate: normalizeDate(fields.birthdate),
      birthTime: fields.birthtime || "Unknown",
      birthPlace: `${fields.birthcity}, ${fields.birthstate}, ${fields.birthcountry}`,
      question: fields.question || "No question provided.",
      submittedAt: new Date().toISOString(),
    };

    console.log(`✅ Verified user: ${userData.fullName}`);

    // === OpenAI Query ===
    let answer = "Could not generate answer.";
    let astrology = "No astrology insights available.";
    let numerology = "No numerology insights available.";
    let palmistry = "No palmistry insights available.";
    let astroDetails = {};
    let numDetails = {};
    let palmDetails = {};

    try {
      const prompt = `
You are an advanced spiritual advisor skilled in astrology, numerology (Pythagorean method), and palmistry.
Use the following user details to produce a structured report.
Respond in JSON format matching this schema exactly:

{
  "answer": "Short paragraph answer to their question (relevant to question context).",
  "astrology": "Short paragraph connecting astrology to their question.",
  "numerology": "Short paragraph connecting numerology to their question.",
  "palmistry": "Short paragraph connecting palmistry to their question.",
  "astroDetails": {
    "Planetary Positions": "...",
    "Ascendant (Rising) Zodiac Sign": "...",
    "Astrological Houses": "...",
    "Family Astrology": "...",
    "Love Governing House": "...",
    "Health & Wellbeing": "...",
    "Career & Business": "..."
  },
  "numDetails": {
    "Life Path": "... include number and its meaning ...",
    "Expression": "... include number and its meaning ...",
    "Personality": "... include number and its meaning ...",
    "Soul Urge": "... include number and its meaning ...",
    "Maturity": "... include number and its meaning ..."
  },
  "palmDetails": {
    "Life Line": "...",
    "Head Line": "...",
    "Heart Line": "...",
    "Fate Line": "...",
    "Thumb": "...",
    "Index Finger": "...",
    "Ring Finger": "...",
    "Mounts": "... include which mounts are prominent and meanings ...",
    "Marriage / Relationship": "... include how many lines and possible timelines ...",
    "Children": "... include number of children indicated and traits ...",
    "Travel Lines": "... include domestic/international and possible timelines ...",
    "Stress Lines": "..."
  }
}

User:
Name: ${userData.fullName}
Date of Birth: ${userData.birthdate}
Time of Birth: ${userData.birthTime}
Birth Place: ${userData.birthPlace}
Question: ${userData.question}
Submission Time: ${userData.submittedAt}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a structured, factual spiritual analyst who formats output as clean JSON without markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      });

      const jsonText = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(jsonText);

      answer = parsed.answer || answer;
      astrology = parsed.astrology || astrology;
      numerology = parsed.numerology || numerology;
      palmistry = parsed.palmistry || palmistry;
      astroDetails = parsed.astroDetails || {};
      numDetails = parsed.numDetails || {};
      palmDetails = parsed.palmDetails || {};
    } catch (err) {
      console.error("❌ OpenAI generation error:", err);
    }

    // === Generate PDF ===
    const pdfBuffer = await generatePdfBuffer({
      fullName: userData.fullName,
      birthdate: userData.birthdate,
      birthTime: userData.birthTime,
      birthPlace: userData.birthPlace,
      question: userData.question,
      answer,
      astrology,
      numerology,
      palmistry,
      astroDetails,
      numDetails,
      palmDetails,
    });

    // === Email Content ===
    const htmlBody = `
      <div style="font-family:Arial, sans-serif;color:#333;max-width:700px;margin:auto;line-height:1.6;">
        <h2 style="text-align:center;color:#6c63ff;">Your Personalized Spiritual Report</h2>
        <p><strong>Name:</strong> ${userData.fullName}</p>
        <p><strong>Date of Birth:</strong> ${userData.birthdate}</p>
        <p><strong>Time of Birth:</strong> ${userData.birthTime}</p>
        <p><strong>Birth Place:</strong> ${userData.birthPlace}</p>
        <p><strong>Question:</strong> ${userData.question}</p>
        <hr/>
        <p>${answer}</p>
        <p><em>Your detailed report is attached as a PDF.</em></p>
        <p style="text-align:center;color:#777;">— Hazcam Spiritual Systems</p>
      </div>
    `;

    await sendEmailWithAttachment({
      to: userData.email,
      subject: "🔮 Your Full Spiritual Report",
      html: htmlBody,
      buffer: pdfBuffer,
      filename: "Spiritual_Report.pdf",
    });

    console.log(`✅ Report emailed to ${userData.email}`);

    return res.status(200).json({
      success: true,
      message: "Report generated successfully.",
      answer,
      astrology,
      numerology,
      palmistry,
    });
  });
}

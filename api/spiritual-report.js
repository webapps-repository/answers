// /api/spiritual-report.js
import { formidable } from "formidable";
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: false },
};

function setCors(res) {
  const allowed =
    process.env.ALLOWED_ORIGIN ||
    "https://zzqejx-u8.myshopify.com"; // ← set your real Shopify domain here
  res.setHeader("Access-Control-Allow-Origin", allowed === "*" ? "*" : allowed);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("❌ Form parse error:", err);
        return res.status(500).json({ success: false, error: "Form parsing failed" });
      }

      // --- reCAPTCHA v2 ---
      const token = Array.isArray(fields["g-recaptcha-response"])
        ? fields["g-recaptcha-response"][0]
        : fields["g-recaptcha-response"];

      if (!token) {
        return res.status(400).json({ success: false, error: "Missing reCAPTCHA token" });
      }

      const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || "",
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

      // --- Extract user data ---
      const userData = {
        fullName: String(fields.name || ""),
        email: String(fields.email || ""),
        birthdate: String(fields.birthdate || ""),
        birthTime: String(fields.birthtime || "Unknown"),
        birthPlace: `${fields.birthcity || ""}, ${fields.birthstate || ""}, ${
          fields.birthcountry || ""
        }`.replaceAll(", ,", ",").replace(/(^, |, $)/g, ""),
        question: String(fields.question || "No question provided."),
        submittedAt: new Date().toISOString(),
      };

      console.log(`✅ Verified user: ${userData.fullName}`);

      // --- Build STRICT JSON prompt for OpenAI ---
      const schemaJson = `{
  "answer": "Direct answer to the user's question (~80-120 words).",
  "astrology": "One concise paragraph with the user's astrology summary.",
  "numerology": "One concise paragraph with the user's numerology summary.",
  "palmistry": "One concise paragraph with the user's palmistry summary.",
  "astroDetails": {
    "Planetary Positions": "Personalized meaning based on DOB, time, place.",
    "Ascendant (Rising) Zodiac Sign": "Personalized meaning for rising sign.",
    "Astrological Houses": "How houses emphasize life areas for the user.",
    "Family Astrology": "Family/home tendencies suggested by chart.",
    "Love Governing House in Astrology": "Romance/relationships context.",
    "Health & Wellbeing Predictions": "Health/vitality tendencies.",
    "Astrological influences on Work, Career and Business": "Career/public image themes."
  },
  "numDetails": {
    "Life Path Number": "Meaning for user's life path.",
    "Expression Number": "Meaning for user's expression/destiny.",
    "Personality Number": "Meaning for outward personality.",
    "Soul Urge Number": "Meaning for inner desires.",
    "Maturity Number": "Meaning for later-in-life fulfillment."
  },
  "palmDetails": {
    "Life Line": "User-specific vitality/stamina note.",
    "Head Line": "User-specific thinking/learning style.",
    "Heart Line": "User-specific emotional/relationship tendencies.",
    "Fate Line": "User-specific career/destiny outlook.",
    "Fingers": "User-specific personality notes by fingers.",
    "Mounts": "User-specific strength areas: Jupiter/Venus/Luna, etc."
  }
}`;

      const userBlock = `
User profile:
- Name: ${userData.fullName}
- Date of Birth: ${userData.birthdate}
- Time of Birth: ${userData.birthTime}
- Birth Place: ${userData.birthPlace}
- Question: ${userData.question}
- Submission Time (use as current context): ${userData.submittedAt}
`;

      const instruction = `
You are a careful spiritual advisor (astrology + numerology + palmistry).
Return ONLY valid minified JSON that strictly matches the provided schema.
Do not include any extra keys, comments, or prose outside JSON.
Tailor meanings to the user. Keep summaries concise (1 short paragraph each).
`;

      // --- OpenAI call ---
      let answer = "Could not generate answer.";
      let astrology = "Astrology interpretation unavailable.";
      let numerology = "Numerology interpretation unavailable.";
      let palmistry = "Palmistry interpretation unavailable.";
      let astroDetails = {};
      let numDetails = {};
      let palmDetails = {};

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You return only strict JSON. No extra text." },
            {
              role: "user",
              content:
                instruction +
                "\nJSON Schema to follow exactly:\n" +
                schemaJson +
                "\n\n" +
                userBlock,
            },
          ],
          temperature: 0.7,
        });

        const raw = completion.choices[0]?.message?.content || "{}";

        // Try to extract first JSON object (in case a model emits prefix text)
        const match = raw.match(/\{[\s\S]*\}$/);
        const jsonText = match ? match[0] : raw;

        const parsed = JSON.parse(jsonText);

        answer = parsed.answer || answer;
        astrology = parsed.astrology || astrology;
        numerology = parsed.numerology || numerology;
        palmistry = parsed.palmistry || palmistry;

        if (parsed.astroDetails && typeof parsed.astroDetails === "object")
          astroDetails = parsed.astroDetails;
        if (parsed.numDetails && typeof parsed.numDetails === "object")
          numDetails = parsed.numDetails;
        if (parsed.palmDetails && typeof parsed.palmDetails === "object")
          palmDetails = parsed.palmDetails;
      } catch (e) {
        console.error("❌ OpenAI JSON parse/generation error:", e);
      }

      // --- PDF generation with detail maps ---
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

      // --- Email (HTML body mirrors summaries + details note) ---
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 720px; margin: auto; line-height: 1.6;">
          <h2 style="text-align:center; color:#6c63ff;">🔮 Your Personalized Spiritual Report</h2>

          <div style="background:#f7f7f7; padding:12px 14px; border-radius:10px; margin-bottom:16px;">
            <p><strong>📧 Email:</strong> ${userData.email}</p>
            <p><strong>🧑 Name:</strong> ${userData.fullName}</p>
            <p><strong>📅 Birth Date:</strong> ${userData.birthdate}</p>
            <p><strong>⏰ Birth Time:</strong> ${userData.birthTime}</p>
            <p><strong>🌍 Birth Place:</strong> ${userData.birthPlace}</p>
            <p><strong>💭 Question:</strong> ${userData.question}</p>
          </div>

          <h3 style="color:#4B0082;">💫 Answer to Your Question</h3>
          <p>${answer}</p>

          <h3 style="color:#4B0082;">🌟 Astrology Summary</h3>
          <p>${astrology}</p>

          <h3 style="color:#4B0082;">🔢 Numerology Summary</h3>
          <p>${numerology}</p>

          <h3 style="color:#4B0082;">✋ Palmistry Summary</h3>
          <p>${palmistry}</p>

          <p style="margin-top:16px; font-size:0.95rem; color:#555;">
            ✅ A full detailed PDF (with structured tables) is attached to this email.
          </p>

          <p style="text-align:center; margin-top:12px; color:#777;">
            — Hazcam Spiritual Systems ✨
          </p>
        </div>
      `;

      await sendEmailWithAttachment({
        to: userData.email,
        subject: "🔮 Your Full Spiritual Report & Personalized Answer",
        html: htmlBody,
        buffer: pdfBuffer,
        filename: "Spiritual_Report.pdf",
      });

      console.log(`✅ Report emailed to ${userData.email}`);

      // --- Response for the web page summaries ---
      return res.status(200).json({
        success: true,
        message: "Report generated successfully.",
        answer,
        astrologySummary: astrology,
        numerologySummary: numerology,
        palmSummary: palmistry,
      });
    } catch (e) {
      console.error("❌ Server error:", e);
      return res.status(500).json({ success: false, error: e.message || "Server error" });
    }
  });
}

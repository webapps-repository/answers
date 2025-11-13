// /api/spiritual-report.js
// Core handler: CORS + reCAPTCHA + personal/technical logic + numerology + PDF + email

import { formidable } from "formidable";
import { classifyQuestion } from "./utils/classify-question.js";
import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { personalSummaries, technicalSummary } from "./utils/generate-insights.js";
import { generatePdfBuffer } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

export const config = {
  api: { bodyParser: false },
};

// ---------- Small helpers ----------
const safe = (v, d = "") =>
  v == null ? d : Array.isArray(v) ? String(v[0] ?? d) : String(v);

const toISO = (ddmmyyyy) => {
  const s = safe(ddmmyyyy);
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

// ---------- Local Pythagorean numerology ----------
const MAP = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const reduceNum = (n) => {
  const keep = (x) => x === 11 || x === 22 || x === 33;
  while (n > 9 && !keep(n)) {
    n = String(n)
      .split("")
      .reduce((sum, d) => sum + (+d || 0), 0);
  }
  return n;
};

const lettersOnly = (s) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
const vowelsOnly  = (s) => (s || "").toUpperCase().replace(/[^AEIOUY]/g, "");
const consOnly    = (s) => (s || "").toUpperCase().replace(/[^A-Z]|[AEIOUY]/g, "");

const sumLetters = (s) =>
  reduceNum(
    lettersOnly(s)
      .split("")
      .reduce((t, c) => t + (MAP[c] || 0), 0)
  );

const sumVowels = (s) =>
  reduceNum(
    vowelsOnly(s)
      .split("")
      .reduce((t, c) => t + (MAP[c] || 0), 0)
  );

const sumCons = (s) =>
  reduceNum(
    consOnly(s)
      .split("")
      .reduce((t, c) => t + (MAP[c] || 0), 0)
  );

const lifePathFromISO = (iso) =>
  reduceNum(
    (iso || "")
      .replace(/\D/g, "")
      .split("")
      .reduce((t, d) => t + (+d || 0), 0)
  );

// =======================================================
//                     MAIN HANDLER
// =======================================================
export default async function handler(req, res) {
  // CORS (Shopify embed)
  res.setHeader("Access-Control-Allow-Origin", "*"); // tighten later
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Formidable with safe file options (palm image optional)
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    allowEmptyFiles: true,
    minFileSize: 0,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ formidable parse error:", err);
        return res.status(400).json({
          success: false,
          error: "File upload error",
          detail: err.message,
        });
      }

      // Optional palm image path (not yet used in OpenAI prompt, but harmless)
      const palmImage = files.palmImage;
      const palmImagePath =
        palmImage && palmImage.size > 0 ? palmImage.filepath : null;
      if (palmImagePath) {
        console.log("✅ Palm image uploaded at:", palmImagePath);
      }

      // ---------- reCAPTCHA ----------
      const token = safe(fields["g-recaptcha-response"]);
      const rcResult = await verifyRecaptcha(token);
      if (!rcResult.ok) {
        console.error("❌ reCAPTCHA verification failed:", rcResult);
        return res.status(403).json({
          success: false,
          error: "reCAPTCHA verification failed",
          details: rcResult,
        });
      }

      // ---------- Extract inputs ----------
      const question = safe(fields.question).trim();
      const email = safe(fields.email).trim();
      const fullName = safe(fields.name).trim();

      const birthDDMM = safe(fields.birthdate);
      const birthISO = toISO(birthDDMM);
      const birthTime = safe(fields.birthtime, "Unknown");
      const birthPlace = [
        safe(fields.birthcity),
        safe(fields.birthstate),
        safe(fields.birthcountry),
      ]
        .filter(Boolean)
        .join(", ");

      // NEW: user checkbox overrides classification for personal/technical
      const personalFlag = safe(fields.isPersonal).toLowerCase();
      const userMarkedPersonal =
        personalFlag === "yes" ||
        personalFlag === "true" ||
        personalFlag === "on" ||
        personalFlag === "personal";

      // ---------- Classify (still used as hint for OpenAI, not for branching) ----------
      let classification = { type: "unknown", confidence: 0.0, source: "fallback" };
      try {
        classification = await classifyQuestion(question);
      } catch (e) {
        console.warn("⚠ classifyQuestion failed, falling back:", e);
      }

      // use the checkbox as the real branch:
      const isPersonal = userMarkedPersonal;

      // We'll decorate the question with classifier metadata to give the model more context.
      const decoratedQuestion = `${question}

[Classifier hint: type=${classification.type || "unknown"}, confidence=${
        classification.confidence ?? "n/a"
      }, userMarkedPersonal=${isPersonal}]`;

      // ---------- Numerology (local, Pythagorean) ----------
      let numerologyPack = {};
      if (isPersonal) {
        const lp = lifePathFromISO(birthISO);
        const expr = sumLetters(fullName);
        const pers = sumCons(fullName);
        const soul = sumVowels(fullName);
        const mat = reduceNum(lp + expr);
        numerologyPack = {
          lifePath: lp,
          expression: expr,
          personality: pers,
          soulUrge: soul,
          maturity: mat,
        };
      }

      // ---------- Insights via OpenAI ----------
      let answer = "";
      let astrologySummary = "";
      let numerologySummary = "";
      let palmistrySummary = "";

      if (isPersonal) {
        const summaries = await personalSummaries({
          fullName,
          birthISO,
          birthTime,
          birthPlace,
          question: decoratedQuestion,
          numerologyPack,
        });

        answer =
          summaries.answer ||
          "Here is your personal answer based on your details.";
        astrologySummary =
          summaries.astrologySummary || "Astrology summary unavailable.";
        numerologySummary =
          summaries.numerologySummary || "Numerology summary unavailable.";
        palmistrySummary =
          summaries.palmistrySummary || "Palmistry summary unavailable.";
      } else {
        const tech = await technicalSummary(decoratedQuestion);
        answer =
          tech.answer ||
          "Here is a concise answer based on your question.";
        numerologyPack = {
          technicalKeyPoints: Array.isArray(tech.keyPoints)
            ? tech.keyPoints
            : [],
          technicalNotes: tech.notes || "",
        };
        astrologySummary = "";
        numerologySummary = "";
        palmistrySummary = "";
      }

      // ---------- PDF generation ----------
      const pdf = await generatePdfBuffer({
        headerBrand: "Melodies Web",
        titleText: "Your Answer",
        mode: isPersonal ? "personal" : "technical",
        question,
        answer,
        fullName,
        birthdate: birthDDMM,
        birthTime,
        birthPlace,
        astrologySummary,
        numerologySummary,
        palmistrySummary,
        numerologyPack,
      });

      // ---------- Email (optional) ----------
      if (email) {
        const html = `
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:720px;margin:auto;color:#222;line-height:1.55">
            <h2 style="text-align:center;margin:0 0 8px 0;">Melodies Web</h2>
            <h3 style="text-align:center;margin:0 0 16px 0;">Your Answer</h3>
            <p><strong>Question:</strong> ${question || "—"}</p>
            <p>${answer}</p>
            <p style="color:#666;font-size:13px;margin-top:16px;">Your detailed PDF is attached.</p>
          </div>
        `;
        await sendEmailHTML({
          to: email,
          subject: "Your Answer",
          html,
          attachments: [
            {
              filename: "Your_Answer.pdf",
              buffer: pdf,
            },
          ],
        });
      }

      // ---------- Web response ----------
      return res.status(200).json({
        success: true,
        type: isPersonal ? "personal" : "technical",
        answer,
        astrologySummary,
        numerologySummary,
        palmistrySummary,
      });
    });
  } catch (e) {
    console.error("❌ unhandled error in spiritual-report:", e);
    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: String(e?.message || e),
    });
  }
}

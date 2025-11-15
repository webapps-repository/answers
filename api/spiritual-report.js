// /api/spiritual-report.js
// Core: CORS + reCAPTCHA + user-selected personal mode + numerology + PDF + email
// Fully audited, JSON-safe, works with Vercel Node 22.x, Resend, and your Liquid frontend.

import { formidable } from "formidable";
import { classifyQuestion } from "./utils/classify-question.js";
import { verifyRecaptcha } from "./utils/verify-recaptcha.js";
import { personalSummaries, technicalSummary } from "./utils/generate-insights.js";
import { generatePdfBuffer } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

// Vercel / serverless required setting
export const config = { api: { bodyParser: false } };

// ---------------- HELPERS ----------------
const safe = (v, d = "") =>
  v == null ? d : Array.isArray(v) ? String(v[0] ?? d) : String(v);

const isPersonalTrue = (v) => {
  if (!v) return false;
  const x = String(v).toLowerCase().trim();
  return x === "yes" || x === "true" || x === "on" || x === "personal";
};

const toISO = (ddmmyyyy) => {
  const s = safe(ddmmyyyy);
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

// ---------------- NUMEROLOGY (local) ----------------
const MAP = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
};

const reduceNum = (n) => {
  const keep = (x) => x === 11 || x === 22 || x === 33;
  while (n > 9 && !keep(n)) {
    n = String(n).split("").reduce((a,b)=>a+(+b||0),0);
  }
  return n;
};

const lettersOnly = (s) => (s||"").toUpperCase().replace(/[^A-Z]/g,"");
const vowelsOnly  = (s) => (s||"").toUpperCase().replace(/[^AEIOUY]/g,"");
const consOnly    = (s) => (s||"").toUpperCase().replace(/[^A-Z]|[AEIOUY]/g,"");

const sumLetters = (s) => reduceNum(lettersOnly(s).split("").reduce((t,c)=>t+(MAP[c]||0),0));
const sumVowels  = (s) => reduceNum(vowelsOnly(s).split("").reduce((t,c)=>t+(MAP[c]||0),0));
const sumCons    = (s) => reduceNum(consOnly(s).split("").reduce((t,c)=>t+(MAP[c]||0),0));

const lifePathFromISO = (iso) =>
  reduceNum((iso||"").replace(/\D/g,"").split("").reduce((t,d)=>t+(+d||0),0));

// =======================================================
//                         HANDLER
// =======================================================
export default async function handler(req, res) {
  // ------------- CORS -------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ------------- FORM PARSE -------------
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    allowEmptyFiles: true,
    minFileSize: 0,
    maxFileSize: 10 * 1024 * 1024,
  });

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Formidable parse error:", err);
        return res.status(400).json({ success: false, error: "form-parse-error" });
      }

      // Palm image optional
      const palmImage = files.palmImage;
      const palmImagePath = palmImage && palmImage.size > 0 ? palmImage.filepath : null;

      // ------------- RECAPTCHA -------------
      const token = safe(fields["g-recaptcha-response"]);
      const rc = await verifyRecaptcha(token);

      if (!rc.ok) {
        return res.status(403).json({
          success: false,
          error: "recaptcha-failed",
          details: rc
        });
      }

      // ------------- INPUTS -------------
      const question = safe(fields.question).trim();
      const email = safe(fields.email).trim();   // May be empty (technical questions)
      const fullName = safe(fields.name).trim();

      const birthDDMM = safe(fields.birthdate);
      const birthISO  = toISO(birthDDMM);
      const birthTime = safe(fields.birthtime, "Unknown");

      const birthPlace = [
        safe(fields.birthcity),
        safe(fields.birthstate),
        safe(fields.birthcountry)
      ].filter(Boolean).join(", ");

      // ------------- USER SELECTED PERSONAL MODE -------------
      const isPersonal = isPersonalTrue(fields.isPersonal);

      // ------------- CLASSIFIER (used only as hint) -------------
      let classification = { type: "unknown", confidence: 0.0, source: "fallback" };
      try {
        classification = await classifyQuestion(question);
      } catch (e) {
        console.warn("⚠ classifyQuestion failed:", e);
      }

      const decoratedQuestion = `${question}

[ClassifierHint type=${classification.type} conf=${classification.confidence} userMarkedPersonal=${isPersonal}]`;

      // ------------- NUMEROLOGY (if personal) -------------
      let numerologyPack = {};

      if (isPersonal) {
        const lp = lifePathFromISO(birthISO);
        const expr = sumLetters(fullName);
        const pers = sumCons(fullName);
        const soul = sumVowels(fullName);
        const mat  = reduceNum(lp + expr);

        numerologyPack = {
          lifePath: lp,
          expression: expr,
          personality: pers,
          soulUrge: soul,
          maturity: mat,
        };
      }

      // ------------- GENERATE INSIGHTS -------------
      let answer = "";
      let astrologySummary = "";
      let numerologySummary = "";
      let palmistrySummary = "";

      if (isPersonal) {
        const s = await personalSummaries({
          fullName,
          birthISO,
          birthTime,
          birthPlace,
          question: decoratedQuestion,
          numerologyPack
        });

        answer = s.answer || "Your personal answer is ready.";
        astrologySummary  = s.astrologySummary || "";
        numerologySummary = s.numerologySummary || "";
        palmistrySummary  = s.palmistrySummary || "";
      } else {
        const t = await technicalSummary(decoratedQuestion);
        answer = t.answer || "Your concise answer is ready.";
        numerologyPack = {
          keyPoints: Array.isArray(t.keyPoints) ? t.keyPoints : [],
          technicalNotes: t.notes || "",
        };
      }

      // ------------- SHORT ANSWER RETURNED TO FRONTEND -------------
      const censored = answer.toLowerCase().includes("not permitted")
                    || answer.toLowerCase().includes("policy")
                    || answer.toLowerCase().includes("assist with that request");

      const finalShortAnswer = censored
        ? "⚠️ Censored by OpenAI — this question cannot be answered."
        : answer;

      // ------------- PDF (ONLY auto for personal) -------------
      let pdf = null;

      if (isPersonal && email) {
        pdf = await generatePdfBuffer({
          headerBrand: "Melodies Web",
          titleText: "Your Answer",
          mode: "personal",
          question,
          answer,
          fullName,
          birthdate: birthDDMM,
          birthTime,
          birthPlace,
          astrologySummary,
          numerologySummary,
          palmistrySummary,
          numerologyPack
        });

        await sendEmailHTML({
          to: email,
          subject: `Your Answer: ${question}`,
          html: `
            <h2>Melodies Web</h2>
            <p>Your detailed personal report is attached.</p>
          `,
          attachments: [
            { filename: "Your_Answer.pdf", buffer: pdf }
          ]
        });
      }

      // ------------- FINAL RESPONSE TO WEB PAGE -------------
      return res.status(200).json({
        success: true,
        isPersonal,
        answer: finalShortAnswer,
        astrologySummary,
        numerologySummary,
        palmistrySummary,
      });
    });

  } catch (e) {
    console.error("❌ UNHANDLED ERROR:", e);
    return res.status(500).json({
      success: false,
      error: "server-error",
      detail: String(e?.message || e),
    });
  }
}

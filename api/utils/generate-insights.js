// /api/utils/generate-insights.js
import OpenAI from "openai";
import { synthesizeTriad } from "./synthesize-triad.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ========== NUMEROLOGY HELPERS ==========
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split("").reduce((a,b)=>a+Number(b),0);
  }
  return n;
}

function calculateLifePath(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const digits = dateStr.replace(/\D/g,"").split("").map(Number);
  if (!digits.length) return null;
  let sum = digits.reduce((a,b)=>a+b,0);
  return reduceNum(sum);
}

function calculatePersonalYear(dob) {
  if (!(dob instanceof Date)) return null;
  const now = new Date();
  return reduceNum(
    dob.getDate() + (dob.getMonth()+1) + now.getFullYear()
  );
}

function calculatePersonalMonth(dob) {
  if (!(dob instanceof Date)) return null;
  const now = new Date();
  return reduceNum((dob.getMonth()+1) + (now.getMonth()+1));
}

const lifePathMeanings = {
  1:"Leadership, independence, originality.",
  2:"Partnership, intuition, sensitivity.",
  3:"Creativity, joy, communication.",
  4:"Stability, discipline, structure.",
  5:"Change, adventure, freedom.",
  6:"Nurturing, harmony, responsibility.",
  7:"Spirituality, introspection, wisdom.",
  8:"Success, power, manifestation.",
  9:"Completion, compassion, purpose.",
  11:"Spiritual awakening, intuition.",
  22:"Master builder, achievement."
};

// ========== ASTROLOGY MOCK (will be replaced later) ==========
function computeAstrologyMock() {
  return {
    sun:"Aries",
    moon:"Leo",
    rising:"Sagittarius",
    transit1:"Sun trine Jupiter",
    transit2:"Moon conjunct Venus"
  };
}

// =============================================================
// ==========  MAIN INSIGHTS GENERATOR  =========================
// =============================================================
export async function generateInsights({
  question,
  isPersonal,
  fullName,
  birthDate,
  birthTime,
  birthPlace,
  classify,
  palmistryData,
  technicalMode
}) {
  try {
    const cleanedQuestion = String(question || "").trim();

    // ============================================================
    // 1. TECHNICAL MODE → Real OpenAI answer
    // ============================================================
    if (technicalMode) {
      // Ask OpenAI for a REAL short answer
      const techAnswer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role:"system", content:"You are an expert in mathematics, coding, finance, trading, economics, debugging and logical reasoning. Provide a concise, accurate answer to the question." },
          { role:"user", content: cleanedQuestion }
        ]
      });

      const shortAns = techAnswer.choices?.[0]?.message?.content?.trim() || "No answer.";

      return {
        ok:true,
        mode:"technical",
        question,
        shortAnswer: shortAns,

        keyPoints:[
          "Technical analysis performed with OpenAI reasoning.",
          "Short answer generated from domain-specific inference.",
          "PDF report available with extended analysis."
        ],

        explanation: shortAns,
        recommendations: "For deeper insights, request the full PDF report."
      };
    }

    // ============================================================
    // 2. PERSONAL MODE → numerology + astrology + palmistry + AI
    // ============================================================

    let numerology = null;
    if (birthDate) {
      const dob = new Date(birthDate);
      const lp  = calculateLifePath(birthDate);
      const py  = calculatePersonalYear(dob);
      const pm  = calculatePersonalMonth(dob);

      numerology = {
        lifePath: lp,
        personalYear: py,
        personalMonth: pm,
        personalMonthRange: pm ? `${pm}-${pm+2}` : "N/A",
        lifePathMeaning: lifePathMeanings[lp] || "",
        personalYearMeaning: lifePathMeanings[py] || ""
      };
    }

    const astrology = computeAstrologyMock();

    // Triad
    const triad = synthesizeTriad({
      question: cleanedQuestion,
      intent: classify.intent || "general",
      astrology,
      numerology,
      palmistry: palmistryData
    });

    // Now ask OpenAI to produce a final short answer based on TRIAD + QUESTION
    const aiPersonal = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0.3,
      messages:[
        { role:"system", content:"You are a spiritual advisor combining astrology, numerology, palmistry, and intuition. Provide a direct answer to the user's question based on the triad data." },
        {
          role:"user",
          content:
`QUESTION: ${cleanedQuestion}

ASTROLOGY: ${JSON.stringify(astrology)}
NUMEROLOGY: ${JSON.stringify(numerology)}
PALMISTRY: ${JSON.stringify(palmistryData)}

TRIAD SUMMARY: ${triad.shortAnswer}

Give a short, clear, specific answer to the question.`
        }
      ]
    });

    const finalShort = aiPersonal.choices?.[0]?.message?.content?.trim() || triad.shortAnswer;

    return {
      ok:true,
      mode:"personal",
      question,
      shortAnswer: finalShort,
      astrology,
      numerology,
      palmistry: palmistryData,
      interpretations: {
        astrology: triad.astroInterpretation,
        numerology: triad.numerologyInterpretation,
        palmistry: triad.palmInterpretation,
        combined: triad.combined,
        timeline: triad.timeline,
        recommendations: triad.recommendations
      }
    };

  } catch (err) {
    console.error("INSIGHTS ERROR:", err);
    return { ok:false, error: err.message };
  }
}

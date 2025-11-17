// /api/utils/generate-insights.js
// -----------------------------------------------------------
// Unified insight generator for:
//  • Personal questions (Astrology + Numerology + Palmistry)
//  • Technical questions
// -----------------------------------------------------------

import OpenAI from "openai";
import { synthesizeTriad } from "./synthesize-triad.js";

// ==========================================================
// NUMEROLOGY FUNCTIONS
// ==========================================================
function reduceNum(n) {
  while (n > 9 && ![11, 22, 33].includes(n)) {
    n = n.toString().split("").reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function computeLifePath(dateStr) {
  if (!dateStr) return null;
  const digits = dateStr.replace(/\D/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  return reduceNum(sum);
}

function computePersonalYear(dob) {
  const now = new Date();
  const sum =
    dob.getDate() + (dob.getMonth() + 1) + now.getFullYear();
  return reduceNum(sum);
}

function computePersonalMonth(dob) {
  const now = new Date();
  const sum = (dob.getMonth() + 1) + (now.getMonth() + 1);
  return reduceNum(sum);
}

// Meanings
const lifePathMeaning = {
  1: "Independence, leadership, self-direction.",
  2: "Harmony, partnership, intuition.",
  3: "Creativity, expression, optimism.",
  4: "Stability, discipline, groundwork.",
  5: "Change, adventure, transformation.",
  6: "Responsibility, love, family.",
  7: "Spiritual depth, analysis, inner wisdom.",
  8: "Power, ambition, material mastery.",
  9: "Completion, giving, humanitarian energy.",
  11: "Spiritual illumination and awakening.",
  22: "Master builder energy, manifestation.",
};

const personalYearMeaning = {
  1: "New beginnings and identity shifts.",
  2: "Relationships, emotions, intuition.",
  3: "Expression, social activity, creativity.",
  4: "Structure, discipline, long-term planning.",
  5: "Freedom, breakthroughs, movement.",
  6: "Family, responsibility, love.",
  7: "Spiritual insight, introspection.",
  8: "Success and achievement.",
  9: "Endings, transformation, closure.",
};

// Compute Numerology Object
function computeNumerology(fullName, birthDate) {
  if (!birthDate) return null;

  const dob = new Date(birthDate);

  const lifePath = computeLifePath(birthDate);
  const personalYear = computePersonalYear(dob);
  const personalMonth = computePersonalMonth(dob);

  return {
    lifePath,
    personalYear,
    personalMonth,
    personalMonthRange: `${personalMonth}-${personalMonth + 2}`,
    lifePathMeaning: lifePathMeaning[lifePath] || "Meaning unavailable.",
    personalYearMeaning:
      personalYearMeaning[personalYear] || "Meaning unavailable.",
  };
}

// ==========================================================
// ASTROLOGY PLACEHOLDER (replace later with true API)
// ==========================================================
function computeAstrologyMock(date, time, place) {
  return {
    sun: "Aries — assertive new beginnings",
    moon: "Cancer — emotional depth",
    rising: "Libra — balance + harmony",
    transit1: "Jupiter trine Sun",
    transit2: "Venus conjunct Moon",
  };
}

// ==========================================================
// TECHNICAL INSIGHTS
// ==========================================================
async function generateTechnicalInsights(question) {
  return {
    ok: true,
    mode: "technical",
    question,
    shortAnswer: `Here is your core technical answer: ${question}`,
    keyPoints: [
      "The logic is evaluated using deterministic reasoning.",
      "If logs or code are added, deeper debugging becomes possible.",
      "The system focuses on clarity and actionable steps.",
    ],
    explanation: `
This explanation elaborates on the logical structure behind your technical question.
If you provide more code, stack traces, or logs, this system can generate extremely deep debugging insights.
    `,
    recommendations: `
• Add logs for deeper insight  
• Include failed inputs or expected outputs  
• Provide stack traces if possible  
    `,
  };
}

// ==========================================================
// EXPORT: generateInsights
// ==========================================================
export async function generateInsights({
  question,
  isPersonal,
  fullName,
  birthDate,
  birthTime,
  birthPlace,
  classify,
  palmistryData,
  technicalMode = false,
}) {
  try {
    // -----------------------------------------------------
    // TECHNICAL MODE
    // -----------------------------------------------------
    if (technicalMode) {
      return await generateTechnicalInsights(question);
    }

    // -----------------------------------------------------
    // PERSONAL MODE
    // -----------------------------------------------------
    const numerology = computeNumerology(fullName, birthDate);
    const astrology = computeAstrologyMock(birthDate, birthTime, birthPlace);
    const palmistry = palmistryData;

    const intent = classify?.intent || "general";

    // Build total spiritual synthesis
    const triad = synthesizeTriad({
      question,
      intent,
      astrology,
      numerology,
      palmistry,
    });

    return {
      ok: true,
      mode: "personal",
      question,
      intent,
      shortAnswer: triad.shortAnswer,
      astrology,
      numerology,
      palmistry,
      interpretations: {
        astrology: triad.astroInterpretation,
        numerology: triad.numerologyInterpretation,
        palmistry: triad.palmInterpretation,
        combined: triad.combined,
        timeline: triad.timeline,
        recommendations: triad.recommendations,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "Insight generation failure",
    };
  }
}

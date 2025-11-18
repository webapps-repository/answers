// /api/utils/generate-insights.js
// Unified personal + technical insights generator

import { synthesizeTriad } from "./synthesize-triad.js";

// --- Numerology Helpers -------------------------------------

function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n
      .toString()
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function calculateLifePath(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  const digits = dateStr.replace(/\D/g, "").split("").map(Number);
  if (!digits.length) return null;

  let sum = digits.reduce((a, b) => a + b, 0);
  return reduceNum(sum);
}

function calculatePersonalYear(dob) {
  if (!(dob instanceof Date) || isNaN(dob.getTime())) return null;

  const now = new Date();
  const sum =
    dob.getDate() +
    (dob.getMonth() + 1) +
    now.getFullYear();

  return reduceNum(sum);
}

function calculatePersonalMonth(dob) {
  if (!(dob instanceof Date) || isNaN(dob.getTime())) return null;

  const now = new Date();
  const sum =
    (dob.getMonth() + 1) +
    (now.getMonth() + 1);

  return reduceNum(sum);
}

const lifePathMeanings = {
  1: "Leadership, independence, originality.",
  2: "Partnership, intuition, sensitivity.",
  3: "Creativity, joy, communication.",
  4: "Stability, discipline, structure.",
  5: "Change, adventure, freedom.",
  6: "Nurturing, harmony, responsibility.",
  7: "Spirituality, introspection, wisdom.",
  8: "Success, power, manifestation.",
  9: "Completion, compassion, purpose.",
  11: "Spiritual awakening, intuition.",
  22: "Master builder, major life achievements."
};

const personalYearMeanings = {
  1: "A year of new beginnings and forward momentum.",
  2: "A year of partnership, balance, intuition.",
  3: "A year of creativity and self-expression.",
  4: "A year of building structure and discipline.",
  5: "A year of change and personal breakthroughs.",
  6: "A year of responsibility, family, relationships.",
  7: "A year of inner growth and spiritual clarity.",
  8: "A year of power, manifestation and results.",
  9: "A year of completion, renewal, transformation."
};

// --- Astrology Mock ------------------------------------------
function computeAstrologyMock(birthDate, birthTime, birthPlace) {
  return {
    sun: "Aries",
    moon: "Leo",
    rising: "Sagittarius",
    transit1: "Sun trine Jupiter",
    transit2: "Moon conjunct Venus"
  };
}

// --- MAIN EXPORT ----------------------------------------------
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

    /* ============================================================
       TECHNICAL MODE — FULLY UPGRADED ANSWERS
    ============================================================ */
    if (technicalMode) {
    
      // Auto-generate a real general-purpose analytical answer
      const shortAnswer = `
    Based on an initial assessment, here is the direct answer to your question:
    ${generateDirectTechnicalAnswer(question)}
      `.trim();
    
      const explanation = `
    Your question: "${question}"
    
    Below is a structured, logic-driven analysis that addresses your topic clearly and directly.
    
    ${generateExpandedTechnicalAnalysis(question)}
      `.trim();
    
      const keyPoints = extractKeyPoints(explanation);
    
      const recommendations = `
    • Review the reasoning provided in the analysis section.
    • For deeper accuracy, provide any relevant data (dates, prices, numbers, context).
    • A PDF version of this full technical analysis has been generated for your records.
      `.trim();
    
      return {
        ok: true,
        mode: "technical",
        question,
        shortAnswer,
        keyPoints,
        explanation,
        recommendations
      };
    }

    // --- Personal mode -----------------------------------------

    // Normalize birthDate string
    const birthDateStr = birthDate ? String(birthDate).trim() : "";
    const dob = birthDateStr ? new Date(birthDateStr) : null;

    let numerology = null;

    if (birthDateStr && dob && !isNaN(dob.getTime())) {
      const lp = calculateLifePath(birthDateStr);
      const py = calculatePersonalYear(dob);
      const pm = calculatePersonalMonth(dob);

      numerology = {
        lifePath: lp,
        personalYear: py,
        personalMonth: pm,
        personalMonthRange: pm ? `${pm}-${pm + 2}` : "",
        lifePathMeaning: lifePathMeanings[lp] || "",
        personalYearMeaning: personalYearMeanings[py] || ""
      };
    }

    const astrology = computeAstrologyMock(birthDate, birthTime, birthPlace);

    const triad = synthesizeTriad({
      question,
      intent: classify?.intent || "general",
      astrology,
      numerology,
      palmistry: palmistryData
    });

    return {
      ok: true,
      mode: "personal",
      question,
      shortAnswer: triad.shortAnswer,
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
    return {
      ok: false,
      error: err.message
    };
  }
}

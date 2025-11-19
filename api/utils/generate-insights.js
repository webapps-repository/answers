// /api/utils/generate-insights.js
// Unified personal + technical insights generator (pre-upgrade version)

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
  const sum = dob.getDate() + (dob.getMonth() + 1) + now.getFullYear();
  return reduceNum(sum);
}

function calculatePersonalMonth(dob) {
  if (!(dob instanceof Date) || isNaN(dob.getTime())) return null;
  const now = new Date();
  const sum = (dob.getMonth() + 1) + (now.getMonth() + 1);
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
  22: "Master builder, major life achievements.",
};

// --- Astrology Mock ------------------------------------------
function computeAstrologyMock(birthDate, birthTime, birthPlace) {
  // Pre-upgrade: static mock, just to populate tables & text
  return {
    sun: "Aries",
    moon: "Leo",
    rising: "Sagittarius",
    transit1: "Sun trine Jupiter",
    transit2: "Moon conjunct Venus",
    birthDate: birthDate || "Unknown",
    birthTime: birthTime || "Unknown",
    birthPlace: birthPlace || "Unknown",
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
  technicalMode,
}) {
  try {
    const q = (question || "").toString().trim();
    const intent = classify?.intent || "general";

    // --- Technical mode ----------------------------------------
    if (technicalMode) {
      const label =
        intent === "technical"
          ? "technical"
          : intent === "money"
          ? "financial / practical"
          : "practical";

      const shortAnswer = q
        ? `Here’s a concise ${label} perspective on your question: ${q}`
        : "Here’s a concise perspective on your technical / practical question.";

      const explanation = `
Your question was interpreted as a ${label} topic.
This pre-upgrade version focuses on giving you a clear framing of your issue,
so you can decide next actions or follow-up questions.

In the upgraded engine, this section will expand into a full, step-by-step
answer that uses AI to reason through your exact context in more depth.
      `.trim();

      const recommendations = `
• If this involves code, keep a record of error messages and screenshots.
• If this is financial, double-check assumptions and inputs (rates, time frames, fees).
• Use the "Get Full PDF Report" option when you want a more structured write-up.
      `.trim();

      return {
        ok: true,
        mode: "technical",
        question: q,
        shortAnswer,
        keyPoints: [
          `Your question is treated as a ${label} question (${intent}).`,
          "This version gives you a clear framing but does not yet perform deep AI reasoning.",
          "Use the PDF option if you want a formatted report emailed to you.",
        ],
        explanation,
        recommendations,
      };
    }

    // --- Personal mode -----------------------------------------
    let numerology = null;

    if (birthDate) {
      const dobDate = new Date(birthDate);
      const lifePath = calculateLifePath(birthDate);
      const personalYear = calculatePersonalYear(dobDate);
      const personalMonth = calculatePersonalMonth(dobDate);

      numerology = {
        lifePath,
        personalYear,
        personalMonth,
        personalMonthRange:
          personalMonth != null ? `${personalMonth}-${personalMonth + 2}` : "",
        lifePathMeaning: lifePath != null ? lifePathMeanings[lifePath] || "" : "",
        personalYearMeaning:
          personalYear != null ? lifePathMeanings[personalYear] || "" : "",
      };
    }

    const astrology = computeAstrologyMock(birthDate, birthTime, birthPlace);

    const triad = synthesizeTriad({
      question: q,
      intent,
      astrology,
      numerology,
      palmistry: palmistryData,
    });

    return {
      ok: true,
      mode: "personal",
      question: q,
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
        recommendations: triad.recommendations,
      },
    };
  } catch (err) {
    console.error("INSIGHTS ERROR:", err);
    return {
      ok: false,
      error: err.message,
    };
  }
}

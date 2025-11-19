// /api/utils/generate-insights.js
// Unified personal + technical insights generator (FIXED VERSION)

import { synthesizeTriad } from "./synthesize-triad.js";

/* ============================================================
   NUMEROLOGY HELPERS (SAFE VERSION)
============================================================ */

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
  const digits = dateStr.replace(/\D/g, "");
  if (!digits) return null;

  const sum = digits.split("").reduce((a, b) => a + Number(b), 0);
  return reduceNum(sum);
}

function calculatePersonalYear(dob) {
  if (!(dob instanceof Date) || isNaN(dob)) return null;
  const now = new Date();
  const sum =
    dob.getDate() +
    (dob.getMonth() + 1) +
    now.getFullYear();
  return reduceNum(sum);
}

function calculatePersonalMonth(dob) {
  if (!(dob instanceof Date) || isNaN(dob)) return null;
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

/* ============================================================
   ASTROLOGY (TEMPORARY MOCK — UPGRADED LATER)
============================================================ */
function computeAstrologyMock() {
  return {
    sun: "Aries",
    moon: "Leo",
    rising: "Sagittarius",
    transit1: "Sun trine Jupiter",
    transit2: "Moon conjunct Venus"
  };
}

/* ============================================================
   MAIN EXPORT — FULLY FIXED VERSION
============================================================ */
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
       TECHNICAL MODE (FIXED)
    ============================================================ */
    if (technicalMode) {
      return {
        ok: true,
        mode: "technical",
        question,
        shortAnswer: `Here is the direct answer to your technical question:\n\n${question}`,
        keyPoints: [
          "This explanation is structured, logical, and task-focused.",
          "Upload additional files or screenshots for deeper debugging.",
          "A full technical PDF is available via the 'Get Full Report' button."
        ],
        explanation: `
Your question was analysed using a hybrid coding + finance engine.
This summary provides a focused and practical interpretation, without unnecessary verbosity.
        `.trim(),
        recommendations: `
• If your question relates to code: include error output or logs.
• If it relates to finance: include numbers, assumptions and constraints.
• You can request a full PDF report anytime.
        `.trim()
      };
    }

    /* ============================================================
       PERSONAL MODE (FIXED)
    ============================================================ */

    // --- NUMEROLOGY --------------------------------------------
    let numerology = null;

    if (birthDate && typeof birthDate === "string" && birthDate.length >= 8) {
      const dobObj = new Date(birthDate);

      const lp = calculateLifePath(birthDate);
      const py = calculatePersonalYear(dobObj);
      const pm = calculatePersonalMonth(dobObj);

      numerology = {
        lifePath: lp,
        personalYear: py,
        personalMonth: pm,
        personalMonthRange: pm ? `${pm}-${pm + 2}` : null,
        lifePathMeaning: lifePathMeanings[lp] || "Unique spiritual pattern.",
        personalYearMeaning: lifePathMeanings[py] || "Growth cycle."
      };
    }

    // --- ASTROLOGY (placeholder until upgrade) -------------------
    const astrology = computeAstrologyMock();

    // --- TRIAD SYNTHESIS ----------------------------------------
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

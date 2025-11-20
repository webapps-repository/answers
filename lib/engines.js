// /lib/engines.js
// Local placeholder calculation engines (stable pre-upgrade versions)

import { safeString } from "./utils.js";

// -----------------------------------------------------
// BASIC NUMEROLOGY ENGINE (Pythagorean reduced)
// -----------------------------------------------------
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n
      .toString()
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

export function computeBasicNumerology(fullName, birthDate) {
  if (!birthDate) return null;

  const digits = birthDate.replace(/\D/g, "").split("").map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const lifePath = reduceNum(sum);

  return {
    lifePath,
    expression: null,
    soulUrge: null,
    personality: null,
    maturity: null,
    lifePathMeaning: basicNumerologyMeaning(lifePath),
    raw: { fullName, birthDate }
  };
}

function basicNumerologyMeaning(n) {
  const map = {
    1: "Leadership, independence, originality.",
    2: "Partnership, intuition, balance.",
    3: "Creativity, joy, communication.",
    4: "Stability, discipline, structure.",
    5: "Change, adventure, freedom.",
    6: "Care, harmony, responsibility.",
    7: "Spirituality, introspection, wisdom.",
    8: "Success, power, manifestation.",
    9: "Completion, compassion, purpose.",
    11: "Intuition, higher awareness.",
    22: "Master builder, achievement potential."
  };
  return map[n] || "Unassigned life-path vibration.";
}

// -----------------------------------------------------
// ASTROLOGY MOCK ENGINE (placeholder)
// -----------------------------------------------------
export function computeAstrologyMock(birthDate, birthTime, birthPlace) {
  // Will be replaced by AstrologyAPI upgrade
  return {
    sun: "Aries",
    moon: "Leo",
    rising: "Sagittarius",
    placementSummary:
      "This is a placeholder chart. Premium engine coming next.",
    location: safeString(birthPlace),
    date: safeString(birthDate),
    time: safeString(birthTime)
  };
}

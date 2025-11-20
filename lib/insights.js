// /lib/insights.js
// Central orchestrator for:
// - Numerology (local basic engine)
// - Astrology (placeholder simple engine — upgrades later)
// - Palmistry (vision model already handled earlier)
// - Technical mode routing
// - Calls triad engine for final AI alignment

import { generateTriad } from "./triad.js";
import { safeString } from "./utils.js";
import { computeAstrologyMock } from "./engines.js"; // basic astrology placeholder
import { computeBasicNumerology } from "./engines.js"; // basic numerology placeholder

// ------------------------------------------------------------
// MAIN ENTRY
// ------------------------------------------------------------
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
  techFileText
}) {
  try {
    // ------------------------------------------------------------
    // PERSONAL MODE DATA
    // ------------------------------------------------------------
    let astrology = null;
    let numerology = null;

    if (isPersonal) {
      astrology = computeAstrologyMock(birthDate, birthTime, birthPlace);
      numerology = computeBasicNumerology(fullName, birthDate);
    }

    // ------------------------------------------------------------
    // TRIAD AI
    // ------------------------------------------------------------
    const triad = await generateTriad({
      mode: technicalMode ? "technical" : "personal",
      question,
      intent: classify?.intent || "general",
      astrology,
      numerology,
      palmistry: palmistryData,
      techFileText
    });

    // ------------------------------------------------------------
    // STANDARD STRUCTURED OUTPUT
    // ------------------------------------------------------------
    if (technicalMode) {
      return {
        ok: true,
        mode: "technical",
        shortAnswer: safeString(triad.shortAnswer),
        keyPoints: triad.keyPoints || [],
        explanation: safeString(triad.explanation),
        recommendations: safeString(triad.recommendations),
        pdfEmailed: false
      };
    }

    // PERSONAL MODE
    return {
      ok: true,
      mode: "personal",
      shortAnswer: safeString(triad.shortAnswer),
      astrology,
      numerology,
      palmistry: palmistryData,
      interpretations: {
        astrology: triad.astroInterpretation || "",
        numerology: triad.numerologyInterpretation || "",
        palmistry: triad.palmInterpretation || "",
        combined: triad.combined || "",
        timeline: triad.timeline || "",
        recommendations: triad.recommendations || ""
      }
    };

  } catch (err) {
    console.error("INSIGHTS ERROR:", err);

    return {
      ok: false,
      error: err.message || "Insights generation failed"
    };
  }
}

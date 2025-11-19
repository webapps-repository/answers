// /lib/insights.js
// -------------------------------------------------------------
// UNIFIED INSIGHTS ENGINE
// - Personal Mode (Astrology + Numerology + Palmistry + GPT-4.1)
// - Technical Mode (Coding + Finance + Logic reasoning)
// - Triad Alignment + Short Answer Generator
// -------------------------------------------------------------

import { askGPT } from "./ai.js";
import { 
  getAstrologyData,
  getNumerologyProfile,
  analyzePalm 
} from "./engines.js";

// -------------------------------------------------------------
// Helper: Smooth join ignoring nulls
// -------------------------------------------------------------
function safeJoin(arr, sep = " ") {
  return arr.filter(Boolean).join(sep);
}

// -------------------------------------------------------------
// MASTER INSIGHTS ENGINE
// -------------------------------------------------------------
export async function generateInsights({
  question,
  isPersonal,
  fullName,
  birthDate,
  birthTime,
  birthPlace,
  classify,
  palmistryData,  // may be null
  technicalMode,
  techFilePath     // optional for technical uploads
}) {

  try {
    //-----------------------------------------------------------------
    // TECHNICAL MODE (Coding, Finance, Engineering)
    //-----------------------------------------------------------------
    if (technicalMode === true) {
      const tech = await askGPT({
        model: "gpt-4.1",
        system: `
You are an elite technical expert across:
- Coding (all languages)
- Debugging
- Electronics & hardware
- Finance & accounting
- Mathematics & statistics
- Excel & data analysis

Return JSON ONLY with:
{
  "shortAnswer": "...",
  "keyPoints": ["...","..."],
  "explanation": "...",
  "recommendations": "..."
}
`,
        user: `
TECHNICAL QUESTION:
"${question}"

${techFilePath ? `A file was uploaded. Summaries should assume there is visual or text data in the file.` : ""}
`
      });

      if (!tech.ok) {
        return {
          ok: false,
          error: tech.error || "Technical model failure"
        };
      }

      return {
        ok: true,
        mode: "technical",
        shortAnswer: tech.json.shortAnswer,
        keyPoints: tech.json.keyPoints,
        explanation: tech.json.explanation,
        recommendations: tech.json.recommendations
      };
    }

    //-----------------------------------------------------------------
    // PERSONAL MODE: ASTROLOGY + NUMEROLOGY + PALMISTRY
    //-----------------------------------------------------------------

    // ------------------------------
    // 1) PALMISTRY (GPT-4.1-VISION)
    // ------------------------------
    const palm =
      palmistryData && palmistryData.hasImage !== undefined
        ? palmistryData               // already pre-analyzed by API layer
        : await analyzePalm(null);    // fallback

    // ------------------------------
    // 2) NUMEROLOGY
    // ------------------------------
    const numerology =
      fullName && birthDate
        ? getNumerologyProfile(fullName, birthDate)
        : null;

    // ------------------------------
    // 3) ASTROLOGY (AstrologyAPI)
    // ------------------------------
    let astrology = null;

    if (birthDate && birthPlace && birthTime) {
      try {
        astrology = await getAstrologyData({
          birthDate,
          birthTime,
          birthPlace,
          lat: classify?.geo?.lat || null,
          lon: classify?.geo?.lon || null,
          tz: classify?.geo?.tz || 10    // default AUS east coast
        });
      } catch (err) {
        console.error("Astrology error:", err);
        astrology = null;
      }
    }

    // ------------------------------
    // 4) TRIAD ALIGNMENT (GPT-4.1)
    // ------------------------------
    const triad = await askGPT({
      model: "gpt-4.1",
      system: `
You are a master metaphysical analyst.
Your job is to combine ASTROLOGY + NUMEROLOGY + PALMISTRY
into a unified answer **to the user's question**.

Write in a warm, highly readable "magazine style".

Return JSON ONLY:
{
  "shortAnswer": "...",
  "astroSummary": "...",
  "numerologySummary": "...",
  "palmSummary": "...",
  "combined": "...",
  "timeline": "...",
  "recommendations": "..."
}
`,
      user: `
QUESTION:
"${question}"

INTENT: ${classify?.intent || "general"}

ASTROLOGY:
${JSON.stringify(astrology || {}, null, 2)}

NUMEROLOGY:
${JSON.stringify(numerology || {}, null, 2)}

PALMISTRY:
${JSON.stringify(palm || {}, null, 2)}
`
    });

    if (!triad.ok) {
      return {
        ok: false,
        error: triad.error || "Triad model failure"
      };
    }

    //-----------------------------------------------------------------
    // SUCCESS PAYLOAD (PERSONAL)
    //-----------------------------------------------------------------
    return {
      ok: true,
      mode: "personal",
      shortAnswer: triad.json.shortAnswer,
      astrology,
      numerology,
      palmistry: palm,
      interpretations: {
        astrology: triad.json.astroSummary,
        numerology: triad.json.numerologySummary,
        palmistry: triad.json.palmSummary,
        combined: triad.json.combined,
        timeline: triad.json.timeline,
        recommendations: triad.json.recommendations
      }
    };

  } catch (err) {
    console.error("INSIGHTS ENGINE CRASH:", err);
    return {
      ok: false,
      error: err.message || "Insights engine fatal error"
    };
  }
}


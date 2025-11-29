// /lib/engines.js — Unified Personal + Compatibility Engines (14-Field Table)

import { completeJson } from "../lib/ai.js";

/* ---------------------------------------------------------
   PALMISTRY ENGINE (PERSONAL)
--------------------------------------------------------- */
async function analyzePalm(file) {
  const description = file
    ? "User uploaded a palm photo. Describe palmistry insights based on a typical right-hand photo."
    : "No palm image provided. Use a generic palmistry reading.";

  const prompt = `
Return STRICT JSON ONLY:

{
  "summary": string,
  "lifeLine": string,
  "headLine": string,
  "heartLine": string,
  "fateLine": string,
  "thumb": string,
  "indexFinger": string,
  "middleFinger": string,
  "ringFinger": string,
  "pinkyFinger": string,
  "mounts": string,
  "marriage": string,
  "children": string,
  "travelLines": string,
  "stressLines": string
}

Palm image info: ${description}
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   NUMEROLOGY ENGINE (PERSONAL)
--------------------------------------------------------- */
async function analyzeNumerology(question) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string,
  "lifePath": string,
  "expression": string,
  "personality": string,
  "soulUrge": string,
  "maturity": string
}

User asked: "${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   ASTROLOGY ENGINE (PERSONAL)
--------------------------------------------------------- */
async function analyzeAstrology(question) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string,
  "planetaryPositions": string,
  "ascendant": string,
  "houses": string,
  "family": string,
  "loveHouse": string,
  "health": string,
  "career": string
}

User asked: "${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   TRIAD ENGINE (fusion of all 3)
--------------------------------------------------------- */
async function analyzeTriad({ palmistry, numerology, astrology }) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string,
  "combinedInsight": string,
  "shadow": string,
  "growth": string
}

Palmistry: ${JSON.stringify(palmistry)}
Numerology: ${JSON.stringify(numerology)}
Astrology: ${JSON.stringify(astrology)}
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   DIRECT ANSWER ENGINE (PERSONAL)
--------------------------------------------------------- */
async function analyzeDirectAnswer(question) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "answer": string
}

Provide a short direct answer:
"${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   UNIVERSAL SUMMARY (SHORT ANSWER)
--------------------------------------------------------- */
async function analyzeSummary({ question, palmistry, numerology, astrology }) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string
}

Blend astrology + numerology + palmistry into a short 2–3 sentence summary.
Question: "${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   UNIFIED COMPATIBILITY ENGINE — 14 FIELDS
   (AI-Generated Score + Table Values)
--------------------------------------------------------- */
async function analyzeCompatibility({ question, compat1, compat2 }) {
  const prompt = `
Return STRICT JSON ONLY:

{
  "score": number,

  "summary": string,

  "num_lifePath1": string,
  "num_lifePath2": string,

  "num_expression1": string,
  "num_expression2": string,

  "num_soulUrge1": string,
  "num_soulUrge2": string,

  "num_personality1": string,
  "num_personality2": string,

  "astro_sun1": string,
  "astro_sun2": string,

  "astro_moon1": string,
  "astro_moon2": string,

  "astro_rising1": string,
  "astro_rising2": string,

  "palm_life1": string,
  "palm_life2": string,

  "palm_head1": string,
  "palm_head2": string,

  "palm_heart1": string,
  "palm_heart2": string,

  "coreCompatibility": string,

  "strengths": string,
  "challenges": string,
  "overall": string
}

User's question: "${question}"

Person 1:
${JSON.stringify(compat1, null, 2)}

Person 2:
${JSON.stringify(compat2, null, 2)}

Rules:
- MUST return all keys above — no extra keys.
- "score" MUST be between 0 and 100.
- Each field should be short, factual, clear.
- Signs must be plain text — no emojis.
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   MAIN EXPORT — PERSONAL + COMPAT
--------------------------------------------------------- */
export async function runAllEngines({
  question,
  mode,
  uploadedFile,
  compat1,
  compat2
}) {

  /* ---------------- PERSONAL MODE ---------------- */
  if (mode !== "compat") {
    const palmistry = await analyzePalm(uploadedFile);
    const numerology = await analyzeNumerology(question);
    const astrology = await analyzeAstrology(question);
    const triad = await analyzeTriad({ palmistry, numerology, astrology });

    const answerOut = await analyzeDirectAnswer(question);
    const summaryOut = await analyzeSummary({
      question, palmistry, numerology, astrology
    });

    return {
      mode: "personal",
      answer: answerOut?.answer || "",
      summary: summaryOut?.summary || "",
      palmistry,
      numerology,
      astrology,
      triad
    };
  }

  /* ---------------- COMPAT MODE ---------------- */
  const palmistry = await analyzePalm(uploadedFile);
  const numerology = await analyzeNumerology(question);
  const astrology = await analyzeAstrology(question);
  const triad = await analyzeTriad({ palmistry, numerology, astrology });

  const compatOut = await analyzeCompatibility({
    question,
    compat1,
    compat2
  });

  let compatScore = 0;
  if (compatOut && typeof compatOut.score === "number") {
    compatScore = Math.max(0, Math.min(100, Math.round(compatOut.score)));
  }

  const summaryOut = await analyzeSummary({
    question, palmistry, numerology, astrology
  });

  return {
    mode: "compat",
    summary: summaryOut?.summary || "",
    palmistry,
    numerology,
    astrology,
    triad,
    compat: compatOut,
    compatScore
  };
}

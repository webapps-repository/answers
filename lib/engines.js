// /lib/engines.js — Stage-3 (HTML-only engines, FIXED + COMPATIBILITY ENGINE)

import { completeJson } from "../lib/ai.js";

/* ---------------------------------------------------------
   PALMISTRY ENGINE
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
   NUMEROLOGY ENGINE
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
   ASTROLOGY ENGINE
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
   DIRECT ANSWER ENGINE
--------------------------------------------------------- */
async function analyzeDirectAnswer(question) {
  const prompt = `
Return STRICT JSON ONLY:

{
  "answer": string
}

Provide a short direct answer to the user's question:
"${question}"
`;

  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   UNIVERSAL SUMMARY (short 2–3 sentence)
--------------------------------------------------------- */
async function analyzeSummary({ question, palmistry, numerology, astrology }) {
  const prompt = `
Return STRICT JSON ONLY:

{
  "summary": string
}

Create a short, readable 2–3 sentence summary blending:
- astrology insights
- numerology insights
- palmistry themes
- the user's question context

Question: "${question}"
`;

  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   COMPATIBILITY ENGINE — NEW
--------------------------------------------------------- */
async function analyzeCompatibility({ compat1, compat2 }) {
  const prompt = `
Return STRICT JSON ONLY:

{
  "score": number,
  "summary": string,
  "strengths": string,
  "challenges": string,
  "advice": string
}

Person 1:
${JSON.stringify(compat1)}

Person 2:
${JSON.stringify(compat2)}

Generate:
- A compatibility score between 0 and 100
- A clear summary
- Relationship strengths
- Potential challenges
- Guidance for harmony
`;

  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   MAIN ENGINE EXPORT (FINAL)
--------------------------------------------------------- */
export async function runAllEngines({ 
  question, 
  mode, 
  uploadedFile, 
  compat1, 
  compat2 
}) {

  // Normal triad engines (always run)
  const palmistry = await analyzePalm(uploadedFile);
  const numerology = await analyzeNumerology(question);
  const astrology = await analyzeAstrology(question);
  const triad = await analyzeTriad({ palmistry, numerology, astrology });
  const answerOut = await analyzeDirectAnswer(question);
  const summaryOut = await analyzeSummary({
    question,
    palmistry,
    numerology,
    astrology
  });

  /* -------------------------------------------------------
     COMPATIBILITY MODE (new)
  -------------------------------------------------------- */
  let compatibility = null;

  if (mode === "compat" && compat1 && compat2) {
    compatibility = await analyzeCompatibility({ compat1, compat2 });
  }

  /* -------------------------------------------------------
     FINAL STRUCTURED OUTPUT
  -------------------------------------------------------- */
  return {
    // universal
    answer: answerOut?.answer || "No answer available.",
    summary: summaryOut?.summary || "",
    palmistry,
    numerology,
    astrology,
    triad,
    mode,

    // NEW
    compatibility
  };
}

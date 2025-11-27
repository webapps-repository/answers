// /lib/engines.js — Stage-3 Engines + Compatibility Engine
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
   NUMEROLOGY
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
   ASTROLOGY
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
   TRIAD (Fusion of all 3)
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
   DIRECT ANSWER
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
   UNIVERSAL SUMMARY (Short Answer)
--------------------------------------------------------- */
async function analyzeSummary({ question, palmistry, numerology, astrology }) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string
}

Create a 2–3 sentence friendly summary that blends:
- astrology
- numerology
- palmistry
- question context

Question: "${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   COMPATIBILITY ENGINE (NEW)
--------------------------------------------------------- */
async function analyzeCompatibility({
  c1,
  c2
}) {
  const prompt = `
Return STRICT JSON ONLY:

{
  "score": number,              // 0–100
  "summary": string,            // short explanation
  "strengths": string,          // combined strengths
  "challenges": string,         // possible friction points
  "advice": string              // relationship guidance
}

Person A:
${JSON.stringify(c1, null, 2)}

Person B:
${JSON.stringify(c2, null, 2)}

Using astrology + numerology + palmistry patterns, create a real compatibility reading.
Score must be 0–100.
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   COMPATIBILITY SUMMARY (Short Answer)
--------------------------------------------------------- */
async function analyzeCompatibilitySummary({ question, compat }) {
  const prompt = `
Return STRICT JSON ONLY:
{
  "summary": string
}

Write a short 2–3 sentence summary explaining the compatibility score and what it means.

Score: ${compat.score}
User question: "${question}"
`;
  return await completeJson(prompt);
}

/* ---------------------------------------------------------
   MAIN ENGINE CONTROLLER
--------------------------------------------------------- */
export async function runAllEngines({
  question,
  mode,
  uploadedFile,
  compatA = null,
  compatB = null
}) {

  /* ---------------------------------------------------------
     COMPATIBILITY MODE (NEW)
  --------------------------------------------------------- */
  if (mode === "compat") {
    const palmA = compatA?.palmFile ? await analyzePalm(compatA.palmFile) : await analyzePalm(null);
    const palmB = compatB?.palmFile ? await analyzePalm(compatB.palmFile) : await analyzePalm(null);

    const numerA = await analyzeNumerology(compatA.question || question);
    const numerB = await analyzeNumerology(compatB.question || question);

    const astroA = await analyzeAstrology(compatA.question || question);
    const astroB = await analyzeAstrology(compatB.question || question);

    const compatPayload = {
      personA: {
        fullName: compatA.fullName,
        birthDate: compatA.birthDate,
        birthTime: compatA.birthTime,
        birthPlace: compatA.birthPlace,
        palmistry: palmA,
        numerology: numerA,
        astrology: astroA
      },
      personB: {
        fullName: compatB.fullName,
        birthDate: compatB.birthDate,
        birthTime: compatB.birthTime,
        birthPlace: compatB.birthPlace,
        palmistry: palmB,
        numerology: numerB,
        astrology: astroB
      }
    };

    const compat = await analyzeCompatibility({
      c1: compatPayload.personA,
      c2: compatPayload.personB
    });

    const compatSummary = await analyzeCompatibilitySummary({
      question,
      compat
    });

    return {
      mode: "compat",
      compatibility: compat,
      summary: compatSummary.summary,
      compatPayload
    };
  }

  /* ---------------------------------------------------------
     PERSONAL MODE (original)
  --------------------------------------------------------- */
  const palmistry = await analyzePalm(uploadedFile);
  const numerology = await analyzeNumerology(question);
  const astrology = await analyzeAstrology(question);

  const triad = await analyzeTriad({ palmistry, numerology, astrology });
  const direct = await analyzeDirectAnswer(question);
  const summary = await analyzeSummary({
    question,
    palmistry,
    numerology,
    astrology
  });

  return {
    mode,
    answer: direct?.answer || "",
    summary: summary?.summary || "",
    palmistry,
    numerology,
    astrology,
    triad
  };
}

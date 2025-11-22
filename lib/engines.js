// /lib/engines.js — FINAL RESTORED & UPGRADED (Stage-2/Stage-3 engine)

import { runModel } from "./ai.js";

/* ------------------------------------------------------------
   Helper: Safe JSON parse
------------------------------------------------------------ */
function safeJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------
   PALMISTRY ENGINE (gpt-4.1-mini)
------------------------------------------------------------ */
export async function analyzePalm({ imageDescription, handMeta }) {
  const prompt = `
You are a senior palmistry analyst. Return JSON ONLY.

{
  "life_line": string,
  "head_line": string,
  "heart_line": string,
  "overall": string
}

Image Description: "${imageDescription || "N/A"}"
Metadata: ${JSON.stringify(handMeta || {})}
`;

  const out = await runModel("gpt-4.1-mini", prompt);
  return safeJSON(out);
}

/* ------------------------------------------------------------
   NUMEROLOGY ENGINE (gpt-4.1-mini)
------------------------------------------------------------ */
export async function analyzeNumerology({ fullName, dateOfBirth }) {
  const prompt = `
You are a Pythagorean numerology expert. Return JSON ONLY.

{
  "life_path": { "number": number, "meaning": string },
  "expression": { "number": number, "meaning": string },
  "soul_urge": { "number": number, "meaning": string },
  "summary": string
}

Full Name: "${fullName}"
Date of Birth: "${dateOfBirth}"
`;

  const out = await runModel("gpt-4.1-mini", prompt);
  return safeJSON(out);
}

/* ------------------------------------------------------------
   ASTROLOGY ENGINE (gpt-4.1)
------------------------------------------------------------ */
export async function analyzeAstrology({ birthDate, birthTime, birthLocation }) {
  const prompt = `
You are a classical astrologer. Return JSON ONLY.

{
  "sun": { "sign": string, "meaning": string },
  "moon": { "sign": string, "meaning": string },
  "rising": { "sign": string, "meaning": string },
  "themes": string[],
  "summary": string
}

Birth Date: "${birthDate}"
Birth Time: "${birthTime}"
Birth Location: "${birthLocation}"
`;

  const out = await runModel("gpt-4.1", prompt);
  return safeJSON(out);
}

/* ------------------------------------------------------------
   TRIAD SYNTHESIS ENGINE (gpt-4.1)
------------------------------------------------------------ */
export async function synthesizeTriad({
  palm,
  numerology,
  astrology,
  question
}) {
  const prompt = `
You are a synthesis engine combining three spiritual modalities.
Return JSON ONLY:

{
  "synthesis": string,
  "guidance": string
}

Inputs:
Palmistry: ${JSON.stringify(palm)}
Numerology: ${JSON.stringify(numerology)}
Astrology: ${JSON.stringify(astrology)}
Question: "${question}"
`;

  const out = await runModel("gpt-4.1", prompt);
  return safeJSON(out);
}

/* ------------------------------------------------------------
   SHORT ANSWER GENERATOR (gpt-4.1-mini)
------------------------------------------------------------ */
export async function generateShortAnswer(question, insights) {
  const prompt = `
You are a spiritual Q&A expert.
Based on the following insights, answer the user's question directly.

Insights:
${JSON.stringify(insights)}

Return ONLY plain text (1–3 sentences).
User Question: "${question}"
`;

  return await runModel("gpt-4.1-mini", prompt);
}

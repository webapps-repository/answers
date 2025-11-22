// /lib/engines.js — FINAL PRODUCTION VERSION (Stage 3 Engines)

import { runJsonModel } from "./ai.js";

/* ============================================================
   PALMISTRY ENGINE — Model: gpt-4.1-mini
============================================================ */
export async function analyzePalm({ imageDescription, handMeta }) {
  const prompt = `
You are a palmistry expert. Return JSON ONLY.

{
  "life_line": string,
  "head_line": string,
  "heart_line": string,
  "overall": string
}

Image description: ${imageDescription || "N/A"}
Metadata: ${JSON.stringify(handMeta || {})}
`;

  return await runJsonModel(prompt, "gpt-4.1-mini", 0.25);
}

/* ============================================================
   NUMEROLOGY ENGINE — Model: gpt-4.1-mini
============================================================ */
export async function analyzeNumerology({ fullName, dateOfBirth }) {
  const prompt = `
You are a numerologist. Return JSON ONLY.

{
  "life_path": { "number": number, "meaning": string },
  "expression": { "number": number, "meaning": string },
  "soul_urge": { "number": number, "meaning": string },
  "summary": string
}

Full Name: "${fullName}"
Date of Birth: "${dateOfBirth}"
`;

  return await runJsonModel(prompt, "gpt-4.1-mini", 0.2);
}

/* ============================================================
   ASTROLOGY ENGINE — Model: gpt-4.1
============================================================ */
export async function analyzeAstrology({ birthDate, birthTime, birthLocation }) {
  const prompt = `
You are an expert astrologer. Return JSON ONLY.

{
  "sun":    { "sign": string, "meaning": string },
  "moon":   { "sign": string, "meaning": string },
  "rising": { "sign": string, "meaning": string },
  "themes": string[],
  "summary": string
}

Birth date: "${birthDate}"
Birth time: "${birthTime}"
Birth location: "${birthLocation}"
`;

  return await runJsonModel(prompt, "gpt-4.1", 0.3);
}

/* ============================================================
   TRIAD SYNTHESIS ENGINE — Model: gpt-4.1
============================================================ */
export async function synthesizeTriad({ palm, numerology, astrology, question }) {
  const prompt = `
You are a deep spiritual analysis engine that merges 3 domains:
1. Palmistry
2. Numerology
3. Astrology

Return JSON ONLY:

{
  "core_pattern": string,
  "alignment": string,
  "conflicts": string[],
  "guidance": string,
  "summary": string
}

Palmistry: ${JSON.stringify(palm)}
Numerology: ${JSON.stringify(numerology)}
Astrology: ${JSON.stringify(astrology)}

User Question: "${question}"
`;

  return await runJsonModel(prompt, "gpt-4.1", 0.35);
}

// /api/utils/classify-question.js
// Enhanced classifier with fallback

import OpenAI from "openai";

let client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// fallback keywords
const fallback = (q = "") => {
  const t = q.toLowerCase();

  const map = {
    love: ["love", "relationship", "marriage", "partner"],
    career: ["career", "job", "promotion", "work"],
    money: ["money", "finance", "income"],
    health: ["health", "ill", "body"],
    spiritual: ["soul", "meaning", "purpose", "spiritual"]
  };

  let intent = "general";

  for (const key of Object.keys(map)) {
    if (map[key].some(w => t.includes(w))) intent = key;
  }

  const type = ["technical", "code", "bug", "math"].some(w => t.includes(w))
    ? "technical"
    : "personal";

  return {
    type,
    intent,
    confidence: 0.3,
    source: "fallback"
  };
};

export async function classifyQuestion(question) {
  if (!client) return fallback(question);

  try {
    const prompt = `
Classify the user's question:

"${question}"

Return ONLY this JSON:
{
"type": "personal" | "technical",
"intent": "love" | "career" | "money" | "health" | "spiritual" | "general" | "technical",
"confidence": number,
"tone": "emotional" | "neutral" | "curious" | "urgent"
}`;

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    return r.choices[0].message.parsed;
  } catch (err) {
    console.error("CLASSIFY ERROR:", err);
    return fallback(question);
  }
}

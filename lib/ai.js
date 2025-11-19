// /lib/ai.js
// ------------------------------------------------------------
// AI CLASSIFICATION ENGINE
// - Uses GPT-4.1 (or fallback if no API key)
// - Detects intent (love, career, money, health, spiritual, etc.)
// - Detects technical vs personal type
// - Detects tone (neutral, emotional, urgent, curious)
// - Safe fallback keyword logic if models are unavailable
// ------------------------------------------------------------

import OpenAI from "openai";

let client = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ------------------------------------------------------------
// FALLBACK CLASSIFIER (keyword logic)
// ------------------------------------------------------------
const fallbackClassifier = (q = "") => {
  const t = q.toLowerCase();

  const categories = {
    love: ["love", "relationship", "partner", "crush", "marriage"],
    career: ["job", "career", "promotion", "work", "boss", "business"],
    money: ["money", "finance", "wealth", "income", "investment"],
    health: ["health", "illness", "wellbeing", "body"],
    spiritual: ["spiritual", "purpose", "meaning", "soul", "karma"],
    coding: ["code", "error", "bug", "compile", "javascript", "python"],
    finance: ["npv", "irr", "discount rate", "valuation", "cash flow"],
  };

  let intent = "general";

  for (const k of Object.keys(categories)) {
    if (categories[k].some((w) => t.includes(w))) {
      intent = k;
      break;
    }
  }

  const isTechnical = intent === "coding" || intent === "finance";

  return {
    type: isTechnical ? "technical" : "personal",
    intent: intent,
    tone: "neutral",
    confidence: 0.35,
    source: "fallback",
  };
};

// ------------------------------------------------------------
// GPT-4.1 CLASSIFIER
// ------------------------------------------------------------
export async function classifyQuestion(question) {
  // No OpenAI key → fallback
  if (!client) return fallbackClassifier(question);

  try {
    const prompt = `
Classify the following user question:

"${question}"

Return a JSON object **ONLY**:

{
  "type": "personal" | "technical",
  "intent": "love" | "career" | "money" | "health" | "spiritual" | "coding" | "finance" | "personal_growth" | "life_direction" | "general",
  "tone": "emotional" | "neutral" | "urgent" | "curious",
  "confidence": number (0 to 1)
}

Rules:
- "technical" = programming, math, finance, physics, engineering, debugging.
- "personal" = emotions, life choices, spiritual questions, relationships, birth info.
- "intent" must reflect deeper meaning behind the question.
- Do NOT include any explanation.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.parsed;
  } catch (err) {
    console.error("CLASSIFIER ERROR:", err);
    return fallbackClassifier(question);
  }
}

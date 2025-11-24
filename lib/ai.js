// /lib/ai.js — Stage 3 (Corrected + Vercel-Safe)
export const runtime = "nodejs"; // REQUIRED so env vars + OpenAI work

import OpenAI from "openai";

let client = null;

// Lazy load OpenAI client
function getClient() {
  // preserve your behaviour exactly
  if (!client && process.env.OPENAI_API_KEY) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Remove ```json fences
function stripJsonFences(str = "") {
  return str.replace(/```json/gi, "").replace(/```/g, "").trim();
}

// Same fallback classifier
const fallbackClassify = q => {
  const t = (q || "").toLowerCase();
  const personal = ["my", "me", "love", "future", "career", "born", "should i", "for me"];
  const isP = personal.some(k => t.includes(k));
  return { type: isP ? "personal" : "technical", confidence: 0.4, source: "fallback" };
};

// Same classifyQuestion logic
export async function classifyQuestion(question) {
  const c = getClient();
  if (!c) return fallbackClassify(question);

  const prompt = `
Return JSON ONLY:
{
"type":"personal"|"technical",
"confidence":0..1
}
User: "${question}"
`;

  try {
    const r = await c.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });

    const cleaned = stripJsonFences(r.choices[0].message.content);
    return { ...JSON.parse(cleaned), source: "openai" };
  } catch {
    return fallbackClassify(question);
  }
}

// Same completeJson functionality
export async function completeJson(prompt, { temperature = 0.3 } = {}) {
  const c = getClient();
  if (!c) throw new Error("OpenAI client missing");

  const r = await c.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature
  });

  const cleaned = stripJsonFences(r.choices[0].message.content);
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned;
  }
}

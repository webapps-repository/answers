// /lib/ai.js — FINAL PRODUCTION VERSION (Stable Stage 3 Core)

import OpenAI from "openai";

// Single cached client to avoid re-instantiation in Vercel
let client = null;

function getClient() {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.warn("OPENAI_API_KEY missing — AI disabled.");
      return null;
    }
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

// Remove code blocks / formatting
function stripJson(raw = "") {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Safety fallback if LLM fails
const fallback = (q) => {
  const t = (q || "").toLowerCase();
  const personalWords = ["my", "me", "love", "future", "career", "born", "should i"];
  const isPersonal = personalWords.some(w => t.includes(w));
  return { type: isPersonal ? "personal" : "technical", confidence: 0.4, source: "fallback" };
};

/* ============================================================
   CLASSIFIER
============================================================ */
export async function classifyQuestion(question) {
  const c = getClient();
  if (!c) return fallback(question);

  try {
    const prompt = `
Return JSON ONLY:

{
  "type": "personal" | "technical",
  "confidence": number
}

USER QUESTION:
"${question}"
`;

    const r = await c.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });

    const raw = r.choices[0]?.message?.content || "{}";
    return JSON.parse(stripJson(raw));

  } catch (err) {
    console.error("Classifier error:", err);
    return fallback(question);
  }
}

/* ============================================================
   GENERIC JSON COMPLETION (for palm, numerology, astrology)
============================================================ */
export async function runJsonModel(prompt, model = "gpt-4.1-mini", temperature = 0.3) {
  const c = getClient();
  if (!c) throw new Error("OpenAI client missing");

  try {
    const r = await c.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature
    });

    const raw = r.choices[0]?.message?.content || "{}";
    const cleaned = stripJson(raw);

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("JSON parse fail. Returning raw:", cleaned);
      return { raw: cleaned };
    }
  } catch (err) {
    console.error("runJsonModel error:", err);
    throw err;
  }
}

/* ============================================================
   SHORT ANSWER ENGINE
============================================================ */
export async function runShortAnswerEngine(question, insightsSummary) {
  const c = getClient();
  if (!c) return { short: "Unable to generate short answer." };

  const prompt = `
Return the final short human-friendly answer as plain text only.

Context summary:
${insightsSummary}

User Question:
"${question}"
`;

  try {
    const r = await c.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    return { short: r.choices[0]?.message?.content?.trim() || "" };

  } catch (err) {
    console.error("Short answer engine error:", err);
    return { short: "Unable to generate answer." };
  }
}

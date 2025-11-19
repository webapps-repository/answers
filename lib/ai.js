// /lib/ai.js
// Unified AI engine for:
// - Intent classification
// - GPT-4.1 text generation
// - GPT-4.1-vision analysis
// Fully Vercel-compatible

import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =============================================
// 1) INTENT CLASSIFIER (Personal / Technical / General)
// =============================================
export async function classifyQuestion(question) {
  const text = String(question || "").trim().toLowerCase();

  // QUICK FALLBACK RULES in case API fails
  const fallback = () => {
    const personalKeywords = [
      "my", "me", "born", "birth",
      "future", "love", "career", "life",
      "should i", "for me", "my chart", "my palm"
    ];
    const technicalKeywords = [
      "code", "error", "fix", "debug",
      "circuit", "diagram", "math",
      "formula", "excel", "sheet", "jetson"
    ];

    if (personalKeywords.some(k => text.includes(k)))
      return { intent: "personal", type: "personal", ok: true, source: "fallback" };

    if (technicalKeywords.some(k => text.includes(k)))
      return { intent: "technical", type: "technical", ok: true, source: "fallback" };

    return { intent: "general", type: "general", ok: true, source: "fallback" };
  };

  if (!question || question.length < 2) return fallback();

  try {
    const prompt = `
Classify the user's question.

Return JSON ONLY in the following structure:
{
  "intent": "personal" | "technical" | "general",
  "type": "personal" | "technical" | "general",
  "confidence": 0-1
}

User question:
"${question}"
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = res.choices[0].message.content;
    let json;

    try {
      json = JSON.parse(raw);
    } catch {
      return fallback(); // model responded in unexpected format
    }

    return {
      ok: true,
      intent: json.intent || "general",
      type: json.type || json.intent || "general",
      confidence: json.confidence ?? 0.7,
      source: "gpt"
    };
  } catch (err) {
    console.error("CLASSIFIER API ERROR:", err);
    return fallback();
  }
}

// =============================================
// 2) GPT-4.1 TEXT COMPLETION WRAPPER
// =============================================
export async function askGPT({ prompt, temperature = 0.4 }) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature,
      messages: [{ role: "user", content: prompt }]
    });

    return {
      ok: true,
      text: res.choices[0].message.content
    };
  } catch (err) {
    console.error("GPT TEXT ERROR:", err);
    return { ok: false, error: err.message };
  }
}

// =============================================
// 3) GPT-4.1-VISION ANALYSIS WRAPPER
// =============================================
// Used for: palmistry, technical uploads, diagrams, photos
// =============================================
export async function askGPTVision({ question, imagePath }) {
  try {
    const b64 = fs.readFileSync(imagePath, { encoding: "base64" });

    const res = await openai.chat.completions.create({
      model: "gpt-4.1-vision",
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${question}\nProvide a structured, expert answer.`
            },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${b64}`
            }
          ]
        }
      ]
    });

    const content = res.choices[0].message.content;

    return {
      ok: true,
      text: content
    };
  } catch (err) {
    console.error("GPT VISION ERROR:", err);
    return {
      ok: false,
      error: err.message
    };
  }
}


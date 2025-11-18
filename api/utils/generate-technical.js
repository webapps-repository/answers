// /api/utils/generate-technical.js
// High-intelligence technical engine using GPT-4o-mini

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateTechnicalInsights(question, category="general") {
  try {
    const prompt = `
You are a world-class technical analyst.
Your job is to answer the user's question with deep reasoning.

QUESTION:
"${question}"

CATEGORY: ${category}

Your output MUST be valid JSON ONLY:

{
  "shortAnswer": "...",
  "keyPoints": ["...", "..."],
  "diagnosis": "...",
  "explanation": "...",
  "recommendations": "..."
}

Rules:
- shortAnswer = concise, 1–2 sentences, directly answer the question.
- keyPoints = 3–6 bullet points.
- diagnosis = main causes, analysis, or logic.
- explanation = long-form deep dive (5–20 sentences).
- recommendations = clear next steps.
- No placeholders, no missing fields.
    `;

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const out = r.choices[0].message.parsed;

    return {
      ok: true,
      ...out
    };

  } catch (err) {
    console.error("TECHNICAL-INSIGHTS ERROR:", err);
    return {
      ok: false,
      shortAnswer: "Unable to process technical question.",
      keyPoints: [],
      diagnosis: "",
      explanation: "",
      recommendations: "",
      error: err.message
    };
  }
}

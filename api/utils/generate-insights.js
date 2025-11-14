// /api/utils/generate-insights.js
import OpenAI from "openai";

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const model = "gpt-4o";

export async function personalSummaries({
  fullName,
  birthISO,
  birthTime,
  birthPlace,
  question,
  numerologyPack
}) {
  if (!openai) {
    return {
      answer: "A personal answer will appear here.",
      astrologySummary: "",
      numerologySummary: "",
      palmistrySummary: ""
    };
  }

  const prompt = `
You are creating PERSONAL spiritual insights.

Provide:
1. Short answer directly answering the user's question (2–3 sentences).
2. Short astrology paragraph relevant to question.
3. Short numerology paragraph relevant to question and numbers:
   ${JSON.stringify(numerologyPack)}
4. Short palmistry paragraph relevant to question.
Return ONLY valid JSON:
{
  "answer": "",
  "astrologySummary": "",
  "numerologySummary": "",
  "palmistrySummary": ""
}

User:
Name=${fullName}
DOB=${birthISO}
Birth time=${birthTime}
Birth place=${birthPlace}
Question=${question}
`;

  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    return JSON.parse(r.choices[0].message.content.trim());
  } catch (err) {
    console.error("personalSummaries error:", err);
    return {
      answer: "A personal answer appears here.",
      astrologySummary: "",
      numerologySummary: "",
      palmistrySummary: ""
    };
  }
}

export async function technicalSummary(question) {
  if (!openai) {
    return {
      answer: "A concise technical answer will appear here.",
      keyPoints: [],
      notes: ""
    };
  }

  const prompt = `
Provide a concise technical answer.

Return ONLY JSON:
{
  "answer": "",
  "keyPoints": [],
  "notes": ""
}

User question:
${question}`;

  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    return JSON.parse(r.choices[0].message.content.trim());
  } catch (err) {
    console.error("techSummary error:", err);
    return { answer: "Technical answer unavailable.", keyPoints: [], notes: "" };
  }
}

// /api/utils/classify-question.js
// GPT-4o enhanced classification (personal vs technical)

import OpenAI from "openai";

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function fallback(question){
  const q = (question||"").toLowerCase();
  const personalHints = [
    "my", "i", "me", "born", "love", "relationship", "marriage",
    "career", "future", "astrology", "numerology", "palm"
  ];
  const isPersonal = personalHints.some(k => q.includes(k));
  return { type: isPersonal?"personal":"technical", confidence:0.55, source:"fallback" };
}

export async function classifyQuestion(question){
  if (!openai) return fallback(question);

  try {
    const prompt = `
Return ONLY JSON:

{
  "type": "personal" | "technical",
  "confidence": number
}

Classify this question:
"${question}"
`;

    const r = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.0,
      messages:[
        {role:"system", content:"Return ONLY JSON."},
        {role:"user", content:prompt}
      ]
    });

    const txt = r.choices[0].message.content.trim();
    const parsed = JSON.parse(txt);
    if (parsed.type) return { ...parsed, source:"openai" };
    return fallback(question);

  } catch {
    return fallback(question);
  }
}

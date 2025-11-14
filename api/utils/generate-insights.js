// /api/utils/generate-insights.js
import OpenAI from "openai";
let openai = null;
if (process.env.OPENAI_API_KEY){
  openai = new OpenAI({ apiKey:process.env.OPENAI_API_KEY });
}

function safeAI(text){
  if(!text) return "";
  const lower = text.toLowerCase();
  if(lower.includes("not permitted") || lower.includes("policy") || lower.includes("i cannot assist"))
    return "⚠️ Censored by OpenAI — cannot answer this question.";
  return text;
}

export async function personalSummaries({question,fullName,birthISO,birthTime,birthPlace,numerologyPack}){
  if(!openai){
    return {
      answer:"Personal answer unavailable.",
      astrologySummary:"",
      numerologySummary:"",
      palmistrySummary:""
    };
  }

  const prompt = `
You are generating personal astrology + numerology + palmistry insights.

Return THREE sections:

1. answer — short direct answer to the user’s question
2. astrologySummary
3. numerologySummary
4. palmistrySummary

User:
Name: ${fullName}
DOB: ${birthISO}
Birth time: ${birthTime}
Birth place: ${birthPlace}

Numerology Numbers:
${JSON.stringify(numerologyPack,null,2)}

Question:
"${question}"
`;

  const r = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    temperature:0.4,
    messages:[
      {role:"system", content:"Return JSON only."},
      {role:"user", content:prompt}
    ]
  });

  let parsed = {};
  try { parsed = JSON.parse(r.choices[0].message.content); } catch {}

  return {
    answer: safeAI(parsed.answer),
    astrologySummary: parsed.astrologySummary || "",
    numerologySummary: parsed.numerologySummary || "",
    palmistrySummary: parsed.palmistrySummary || ""
  };
}

export async function technicalSummary(question){
  if(!openai){
    return { answer:"Technical answer unavailable.", keyPoints:[], notes:"" };
  }

  const prompt = `
You generate a HYBRID technical response:
- Start with a 2–3 sentence clear answer.
- Then list bullet key points.
- Then short explanation.

Return JSON:
{
 "answer": "...",
 "keyPoints": ["..."],
 "notes": "..."
}

Question:
"${question}"
`;

  const r = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    temperature:0.4,
    messages:[
      {role:"system",content:"JSON only."},
      {role:"user",content:prompt}
    ]
  });

  let parsed={};
  try { parsed = JSON.parse(r.choices[0].message.content); } catch {}

  return {
    answer: safeAI(parsed.answer),
    keyPoints: parsed.keyPoints || [],
    notes: parsed.notes || ""
  };
}

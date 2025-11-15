// /api/utils/classify-question.js
import OpenAI from "openai";
let client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey:process.env.OPENAI_API_KEY }) : null;

const fallback = q => {
  const t = (q||"").toLowerCase();
  const personal = ["my","me","love","future","career","born","should i","for me"];
  const isP = personal.some(k => t.includes(k));
  return { type: isP?"personal":"technical", confidence:0.4, source:"fallback" };
};

export async function classifyQuestion(question){
  if(!client) return fallback(question);

  try {
    const prompt = `
Return JSON ONLY:

{
 "type": "personal" | "technical",
 "confidence": 0..1
}

User: "${question}"
`;

    const r = await client.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0,
      messages:[
        {role:"system",content:"Return ONLY JSON. No text."},
        {role:"user",content:prompt}
      ]
    });

    const txt = r.choices?.[0]?.message?.content?.trim() || "{}";
    const obj = JSON.parse(txt);
    if(!obj.type) return fallback(question);
    return { type:obj.type, confidence:Number(obj.confidence||0.5), source:"openai" };
  } catch(e){
    console.error("classifier error", e);
    return fallback(question);
  }
}

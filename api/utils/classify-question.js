// /api/utils/classify-question.js
import OpenAI from "openai";
let openai=null;
if(process.env.OPENAI_API_KEY){
  openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
}

export async function classifyQuestion(question){
  const q=(question||"").toLowerCase();

  // fallback
  const fallback=()=>{
    const personalHints=["my","i ","should i","love","health","career","future","born","birth"];
    return {
      type: personalHints.some(h=>q.includes(h))?"personal":"technical",
      confidence:0.55,
      source:"fallback"
    };
  };

  if(!openai) return fallback();

  try{
    const prompt=`
Return JSON:
{
 "type":"personal"|"technical",
 "confidence": number
}

Classify this question:
"${question}"
`;

    const r=await openai.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0.0,
      messages:[
        {role:"system",content:"JSON only."},
        {role:"user",content:prompt}
      ]
    });

    const text=r.choices[0].message.content.trim();
    const parsed=JSON.parse(text);
    return parsed;

  }catch(e){
    console.error("classifier error:",e);
    return fallback();
  }
}

// Personal vs Non-personal report flow + OpenAI + Email + PDF
import { formidable } from "formidable";
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const config = { api: { bodyParser: false } };

// ---------------- Helpers ----------------
function safeStr(x, f = "") {
  if (x == null) return f;
  if (Array.isArray(x)) return String(x[0] ?? f);
  return String(x);
}
function toIsoFromDDMMYYYY(d) {
  if (!d || typeof d !== "string") return "";
  const [dd, mm, yyyy] = d.split("-").map((p) => p.trim());
  return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : d;
}
function epochIso() { return new Date().toISOString(); }

// Simple local classifier (fallback)
function fallbackClassify(q) {
  const t = (q || "").toLowerCase();
  const personalHints = ["my ","should i","will i","born","relationship","love","career","health","astrology","numerology","palm"];
  return { type: personalHints.some((k)=>t.includes(k))?"personal":"technical", confidence:0.5, source:"fallback" };
}
async function classifyQuestion(question){
  if(!openai) return fallbackClassify(question);
  try{
    const prompt=`Classify strictly as JSON {"type":"personal"|"technical","confidence":number}. Question:"""${question}"""`;
    const r=await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[{role:"system",content:"Return JSON only"},{role:"user",content:prompt}],
      temperature:0
    });
    const txt=r.choices?.[0]?.message?.content?.trim()||"{}";
    const p=JSON.parse(txt);
    if(p.type==="personal"||p.type==="technical")return p;
    return fallbackClassify(question);
  }catch{return fallbackClassify(question);}
}

// ---------------- Numerology (Pythagorean) ----------------
const MAP={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};
const onlyL=s=>s.toUpperCase().replace(/[^A-Z]/g,"");
const onlyV=s=>s.toUpperCase().replace(/[^AEIOUY]/g,"");
const onlyC=s=>s.toUpperCase().replace(/[^A-Z]|[AEIOUY]/g,"");
const reduce=n=>{while(n>9&&![11,22,33].includes(n))n=String(n).split("").reduce((a,d)=>a+(+d||0),0);return n;};
const nameSum=s=>reduce([...onlyL(s)].reduce((a,ch)=>a+(MAP[ch]||0),0));
const soulUrge=s=>reduce([...onlyV(s)].reduce((a,ch)=>a+(MAP[ch]||0),0));
const personality=s=>reduce([...onlyC(s)].reduce((a,ch)=>a+(MAP[ch]||0),0));
const lifePath=d=>reduce([...d.replace(/\D/g,"")].reduce((a,v)=>a+(+v||0),0));
const maturity=(lp,ex)=>reduce(+lp+ +ex);

// ---------------- AI helpers ----------------
async function aiJson(sys,user,fallback={}){
  if(!openai)return fallback;
  try{
    const r=await openai.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:sys},{role:"user",content:user}],temperature:0.4});
    return JSON.parse(r.choices?.[0]?.message?.content?.trim()||"{}");
  }catch{return fallback;}
}

// ---------------- Handler ----------------
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(req.method!=="POST")return res.status(405).end();

  const form=formidable({multiples:false,keepExtensions:true});
  form.parse(req,async(err,fields)=>{
    if(err)return res.status(500).json({success:false,error:"form parse"});

    const q=safeStr(fields.question);
    const email=safeStr(fields.email);
    const name=safeStr(fields.name);
    const bdateIso=toIsoFromDDMMYYYY(safeStr(fields.birthdate));
    const btime=safeStr(fields.birthtime,"Unknown");
    const bplace=[safeStr(fields.birthcity),safeStr(fields.birthstate),safeStr(fields.birthcountry)].filter(Boolean).join(", ");

    const cls=await classifyQuestion(q);
    const personal=cls.type==="personal";

    let answer,astro,num,palm;
    let numPack={};

    if(personal){
      const lp=lifePath(bdateIso);
      const ex=nameSum(name);
      const per=personality(name);
      const so=soulUrge(name);
      const ma=maturity(lp,ex);
      numPack={lifePath:lp,expression:ex,personality:per,soulUrge:so,maturity:ma};

      const js=await aiJson("Return JSON only",`
Return JSON:
{"answer":"","astrologySummary":"","numerologySummary":"","palmistrySummary":""}
User:${name}, DOB:${bdateIso}, Time:${btime}, Place:${bplace}
Question:${q}`);
      answer=js.answer||"Here are your insights.";
      astro=js.astrologySummary||"Astrology summary unavailable.";
      num=js.numerologySummary||"Numerology summary unavailable.";
      palm=js.palmistrySummary||"Palmistry summary unavailable.";
    }else{
      const js=await aiJson("Return JSON only",`
Return JSON:{"answer":"","keyPoints":[],"notes":""}
Question:${q}`);
      answer=js.answer||"Here is your concise answer.";
      numPack={technicalKeyPoints:js.keyPoints||[],technicalNotes:js.notes||""};
      astro=num=palm="";
    }

    const pdf=await generatePdfBuffer({
      headerBrand:"Melodies Web",title:"Your Answer",mode:personal?"personal":"technical",
      question:q,answer,
      fullName:name,birthdate:safeStr(fields.birthdate),birthTime:btime,birthPlace:bplace,
      astrologySummary:astro,numerologySummary:num,palmistrySummary:palm,
      numerologyPack:numPack
    });

    if(email){
      await sendEmailWithAttachment({
        to:email,
        subject:"Your Answer",
        html:`<div style="font-family:sans-serif;max-width:700px;margin:auto">
        <h2 style="text-align:center">Melodies Web</h2><h3 style="text-align:center">Your Answer</h3>
        <p><b>Question:</b> ${q}</p><p>${answer}</p><p><i>A detailed PDF is attached.</i></p></div>`,
        buffer:pdf,filename:"Your_Answer.pdf"
      });
    }

    res.json({success:true,type:personal?"personal":"technical",answer,astrologySummary:astro,numerologySummary:num,palmSummary:palm});
  });
}

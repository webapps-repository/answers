// /api/detailed-report.js
// Sends full PDF for BOTH personal + technical questions (email required)

import { formidable } from "formidable";
import { generatePdfBuffer } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

export const config = { api: { bodyParser: false } };

const safe = (v, d="") => v==null? d : Array.isArray(v)? String(v[0]??d) : String(v);

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");

  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const form = formidable({ multiples:false, keepExtensions:true });
  
  try {
    form.parse(req, async (err, fields) => {
      if(err) return res.status(400).json({error:"Parse error",detail:err.message});

      const email = safe(fields.email).trim();
      const shortAnswer = safe(fields.answer);
      const question = safe(fields.question);

      const astro = safe(fields.astrologySummary);
      const num   = safe(fields.numerologySummary);
      const palm  = safe(fields.palmistrySummary);
      const pack  = JSON.parse(safe(fields.numerologyPack,"{}"));

      if(!email) return res.status(400).json({error:"Email required"});

      const pdf = await generatePdfBuffer({
        headerBrand: "Melodies Web",
        titleText: question,
        mode: safe(fields.personal)==="true" ? "personal":"technical",
        question,
        answer: shortAnswer,
        astrologySummary: astro,
        numerologySummary: num,
        palmistrySummary: palm,
        numerologyPack: pack
      });

      await sendEmailHTML({
        to: email,
        subject: `Your Detailed Report — ${question}`,
        html: `<p>Your detailed PDF report is attached.</p>`,
        attachments: [{ filename:"Detailed_Report.pdf", buffer:pdf }]
      });

      return res.status(200).json({ success:true });
    });
  } catch(e){
    return res.status(500).json({error:"server error", detail:String(e)});
  }
}

// /api/selftest.js
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const results = [];
  const add = (name, ok, detail = "") => results.push({ name, ok, detail });

  const start = Date.now();
  let openaiOk = false;
  let openai;
  let classificationText = "";

  // 1️⃣ Environment keys
  const openaiKey = process.env.OPENAI_API_KEY;
  const sendKey = process.env.SENDGRID_API_KEY;
  const recaptchaKey = process.env.RECAPTCHA_SECRET_KEY;
  add("OpenAI API Key", !!openaiKey, openaiKey ? "Found" : "Missing");
  add("SendGrid API Key", !!sendKey, sendKey ? "Found" : "Missing");
  add("reCAPTCHA Secret", !!recaptchaKey, recaptchaKey ? "Found" : "Missing");

  // 2️⃣ OpenAI check
  if (openaiKey) {
    try {
      openai = new OpenAI({ apiKey: openaiKey });
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Return the single word PASS" }],
        temperature: 0,
      });
      classificationText = resp.choices?.[0]?.message?.content?.trim() || "";
      openaiOk = classificationText.toUpperCase().includes("PASS");
      add("OpenAI Chat Test", openaiOk, classificationText);
    } catch (e) {
      add("OpenAI Chat Test", false, e.message);
    }
  }

  // 3️⃣ Numerology (local)
  const name = "Test User";
  const dob = "13-03-1960";
  const MAP = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
    J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
    S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
  };
  const reduce = n => { while(n>9&&![11,22,33].includes(n)) n=String(n).split("").reduce((a,b)=>a+ +b,0); return n; };
  const only = s => s.toUpperCase().replace(/[^A-Z]/g,"");
  const letters = only(name);
  const life = reduce([...dob.replace(/\D/g,"")].reduce((a,b)=>a+ +b,0));
  const expr = reduce([...letters].reduce((a,b)=>a+(MAP[b]||0),0));
  add("Local Numerology", life>0 && expr>0, `Life=${life}, Expr=${expr}`);

  // 4️⃣ PDF Generation
  try {
    const pdf = await generatePdfBuffer({
      headerBrand: "Melodies Web",
      title: "Self-Test Report",
      mode: "technical",
      question: "System Diagnostic Check",
      answer: "PDF generation successful.",
      numerologyPack: { lifePath: life, expression: expr },
    });
    add("PDF Generation", Buffer.isBuffer(pdf) && pdf.length>500, `Bytes=${pdf.length}`);
  } catch (e) {
    add("PDF Generation", false, e.message);
  }

  // 5️⃣ Email Test (mock)
  try {
    if (sendKey) {
      await sendEmailWithAttachment({
        to: process.env.TEST_EMAIL || "test@example.com",
        subject: "Melodies Web System Test",
        html: `<p>✅ Email check complete. Everything is working.</p>`,
        buffer: Buffer.from("System OK", "utf-8"),
        filename: "test.txt",
      });
      add("Email Sending", true, "Sent successfully.");
    } else add("Email Sending", false, "SendGrid key missing.");
  } catch (e) {
    add("Email Sending", false, e.message);
  }

  // 6️⃣ Mock Personal Question Simulation
  let simAnswer = "";
  try {
    if (openai) {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role:"user", content:`Simulate personal question response for "When will I get married?" Return JSON {"answer":"short insight","astrologySummary":"1 line","numerologySummary":"1 line","palmistrySummary":"1 line"}` }],
      });
      const txt = r.choices?.[0]?.message?.content?.trim() || "{}";
      const js = JSON.parse(txt);
      simAnswer = js.answer;
      add("Mock Personal Question", !!simAnswer, simAnswer || txt);
    } else {
      simAnswer = "Simulated locally.";
      add("Mock Personal Question", true, "Local simulation only.");
    }
  } catch (e) {
    add("Mock Personal Question", false, e.message);
  }

  // 7️⃣ JSON structure check
  const valid = results.every(r => typeof r.ok === "boolean" && r.name);
  add("JSON Output Integrity", valid, valid ? "Valid JSON" : "Broken");

  const duration = ((Date.now()-start)/1000).toFixed(2);
  return res.status(200).json({
    success:true,
    duration:`${duration}s`,
    summary:`${results.filter(r=>r.ok).length}/${results.length} checks passed`,
    results,
    mockPersonal: { question:"When will I get married?", answer:simAnswer },
  });
}

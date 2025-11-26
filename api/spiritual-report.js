// /api/spiritual-report.js — now supports compatibility mode safely

import formidable from "formidable";
import {
  normalize,
  validateUploadedFile,
  verifyRecaptcha,
  sendEmailHTML
} from "../lib/utils.js";

import { runAllEngines } from "../lib/engines.js";
import { buildSummaryHTML, buildUniversalEmailHTML } from "../lib/insights.js";

export default async function handler(req, res) {

  /* CORS */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Not allowed" });

  /* PARSE FORM */
  const form = formidable({
    multiples: true,
    maxFileSize: 20 * 1024 * 1024
  });

  let fields, files;
  try {
    ({ fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (e, f, fl) => e ? reject(e) : resolve({ fields: f, files: fl }))
    ));
  } catch (e) {
    return res.status(400).json({ error: "Bad form data" });
  }

  /* FIELDS */
  const mode = normalize(fields, "mode") || "personal";
  const email = normalize(fields, "email");
  const question = normalize(fields, "question");

  if (!email) return res.status(400).json({ error: "Missing email" });
  if (!question) return res.status(400).json({ error: "Missing question" });

  /* RECAPTCHA */
  const TOGGLE = process.env.RECAPTCHA_TOGGLE || "false";
  if (TOGGLE !== "false") {
    const rec = await verifyRecaptcha(normalize(fields, "recaptchaToken"), req.headers["x-forwarded-for"]);
    if (!rec.ok) return res.status(400).json({ error: "reCAPTCHA failed", rec });
  }

  /* ===========================
      COMPATIBILITY MODE
  ============================ */
  if (mode === "compat") {

    // ----- Person 1 -----
    const p1 = {
      fullName: normalize(fields, "c1_fullName"),
      birthDate: normalize(fields, "c1_birthDate"),
      birthTime: normalize(fields, "c1_birthTime"),
      birthPlace: normalize(fields, "c1_birthPlace"),
    };

    const p1Palm = files.c1_palm ? (Array.isArray(files.c1_palm) ? files.c1_palm[0] : files.c1_palm) : null;

    // ----- Person 2 -----
    const p2 = {
      fullName: normalize(fields, "c2_fullName"),
      birthDate: normalize(fields, "c2_birthDate"),
      birthTime: normalize(fields, "c2_birthTime"),
      birthPlace: normalize(fields, "c2_birthPlace"),
    };

    const p2Palm = files.c2_palm ? (Array.isArray(files.c2_palm) ? files.c2_palm[0] : files.c2_palm) : null;

    // run engines separately
    const p1Eng = await runAllEngines({ question, mode: "personal", uploadedFile: p1Palm });
    const p2Eng = await runAllEngines({ question, mode: "personal", uploadedFile: p2Palm });

    // AI compatibility fusion (reuse triad engine)
    const compatFusion = await runAllEngines({
      question,
      mode: "personal",
      uploadedFile: null
    });

    const shortHTML = buildSummaryHTML({
      question,
      engines: compatFusion,
      mode: "compat"
    });

    const longHTML = buildUniversalEmailHTML({
      mode: "compat",
      question,
      p1: { ...p1, engines: p1Eng },
      p2: { ...p2, engines: p2Eng },
      compat: {
        summary: compatFusion.summary,
        details: compatFusion
      }
    });

    await sendEmailHTML({
      to: email,
      subject: "Your Compatibility Insight Report",
      html: longHTML
    });

    return res.json({
      ok: true,
      mode: "compat",
      shortAnswer: shortHTML
    });
  }

  /* ===========================
      PERSONAL MODE (default)
  ============================ */

  const fullName = normalize(fields, "fullName");
  const birthDate = normalize(fields, "birthDate");
  const birthTime = normalize(fields, "birthTime");
  const birthPlace = normalize(fields, "birthPlace");

  const palm = files.palmImage ? (Array.isArray(files.palmImage) ? files.palmImage[0] : files.palmImage) : null;

  const enginesOut = await runAllEngines({
    question,
    mode: "personal",
    uploadedFile: palm
  });

  const shortHTML = buildSummaryHTML({
    question,
    engines: enginesOut,
    mode: "personal"
  });

  const longHTML = buildUniversalEmailHTML({
    mode: "personal",
    question,
    engines: enginesOut,
    fullName,
    birthDate,
    birthTime,
    birthPlace
  });

  await sendEmailHTML({
    to: email,
    subject: "Your Personal Insight Report",
    html: longHTML
  });

  return res.json({
    ok: true,
    mode: "personal",
    shortAnswer: shortHTML
  });
}

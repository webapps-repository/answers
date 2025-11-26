// /lib/insights.js — FIXED & COMPLETE
import { runAllEngines } from "../lib/engines.js";
import { completeJson } from "../lib/ai.js";

/* ============================================================
   SUMMARY HTML (short box for Shopify)
============================================================ */
export function buildSummaryHTML({ classification, engines, question }) {
  return `
    <div style="font-size:15px; line-height:1.55; color:#222;">
      <div><b>Your Question:</b> ${question}</div>

      <div style="margin-top:10px;">
        <b>Classification:</b> ${classification?.type || "unknown"}  
        (${Math.round((classification?.confidence || 0) * 100)}% confidence)
      </div>

      <div style="margin-top:12px; white-space:pre-wrap;">
        ${engines?.summary || "No summary available."}
      </div>
    </div>
  `;
}

/* ============================================================
   UNIVERSAL EMAIL HTML — BRAND NEW RENDERED VERSION
============================================================ */
export function buildUniversalEmailHTML({
  title = "Your Insight Report",
  question = "",
  engines = {},
  fullName = "",
  birthDate = "",
  birthTime = "",
  birthPlace = ""
}) {

  const style = `
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background:#f4f4f7; 
        margin:0; padding:0;
      }
      .container {
        max-width: 720px;
        background:#ffffff;
        margin: 24px auto;
        padding: 32px;
        border-radius: 14px;
        box-shadow: 0px 4px 18px rgba(0,0,0,0.06);
      }
      h1 { font-size: 26px; font-weight:700; margin-bottom:20px; }
      h2 { font-size:20px; margin-top:28px; }
      h3 { font-size:17px; margin-top:20px; }
      .block { 
        background:#f7f7fb;
        padding:16px; 
        border-radius:10px;
        margin-top:10px;
        white-space:pre-wrap;
        line-height:1.55;
        font-size:15px;
        color:#333;
      }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      td { padding:8px 6px; border-bottom:1px solid #eee; vertical-align:top; }
      .key { font-weight:600; width:150px; color:#555; }
    </style>
  `;

  const {
    answer = "",
    summary = "",
    palmistry = {},
    numerology = {},
    astrology = {},
    triad = {}
  } = engines;

  /* PERSONAL DETAILS BLOCK */
  const personalDetailsHTML =
    fullName || birthDate || birthTime || birthPlace
      ? `
        <h2>Personal Details</h2>
        <ul>
          ${fullName ? `<li><b>Name:</b> ${fullName}</li>` : ""}
          ${birthDate ? `<li><b>Date of Birth:</b> ${birthDate}</li>` : ""}
          ${birthTime ? `<li><b>Time of Birth:</b> ${birthTime}</li>` : ""}
          ${birthPlace ? `<li><b>Place of Birth:</b> ${birthPlace}</li>` : ""}
        </ul>
      `
      : "";

  /* PALMISTRY TABLE */
  const palmHTML = palmistry && Object.keys(palmistry).length
    ? `
      <h3>Palmistry</h3>
      <div class="block">${palmistry.summary || ""}</div>
      <table>
        ${Object.entries(palmistry)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join("")}
      </table>
    `
    : "";

  /* ASTROLOGY TABLE */
  const astroHTML = astrology && Object.keys(astrology).length
    ? `
      <h3>Astrology</h3>
      <div class="block">${astrology.summary || ""}</div>
      <table>
        ${Object.entries(astrology)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join("")}
      </table>
    `
    : "";

  /* NUMEROLOGY TABLE */
  const numHTML = numerology && Object.keys(numerology).length
    ? `
      <h3>Numerology</h3>
      <div class="block">${numerology.summary || ""}</div>
      <table>
        ${Object.entries(numerology)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join("")}
      </table>
    `
    : "";

  /* TRIAD TABLE */
  const triadHTML = triad && Object.keys(triad).length
    ? `
      <h3>Combined Insight</h3>
      <table>
        ${Object.entries(triad)
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join("")}
      </table>
    `
    : "";

  /* FINAL HTML OUTPUT */
  return `
  <!DOCTYPE html>
  <html><head>${style}</head>
  <body>
    <div class="container">

      <h1>${title}</h1>

      <h3>Your Question</h3>
      <div class="block">${question}</div>

      ${personalDetailsHTML}

      <h2>In-Depth Analysis</h2>
      <div class="block">${summary}</div>

      ${palmHTML}
      ${astroHTML}
      ${numHTML}
      ${triadHTML}

      <p style="margin-top:34px; font-size:13px; color:#777;">
        This report was generated automatically based on the information you provided.
      </p>

    </div>
  </body></html>`;
}

/* ============================================================
   PERSONAL EMAIL WRAPPER (kept for compatibility)
============================================================ */
export function buildPersonalEmailHTML(props) {
  return buildUniversalEmailHTML({
    ...props,
    title: "Your Personal Insight Report"
  });
}

/* ============================================================
   TECHNICAL EMAIL WRAPPER
============================================================ */
export function buildTechnicalEmailHTML({ question, engines }) {
  return buildUniversalEmailHTML({
    title: "Your Technical Analysis Report",
    question,
    engines
  });
}

/* ============================================================
   MAIN INSIGHT GENERATOR (still used by some endpoints)
============================================================ */
export async function generateInsights({ question, mode, fullName, birthDate, birthTime, birthPlace, palmImage }) {
  const payload = {
    question,
    fullName,
    birthDate,
    birthTime,
    birthPlace,
    mode
  };

  let palm = null;
  if (palmImage) {
    try {
      palm = await analyzePalm(palmImage);
    } catch (e) {
      palm = { error: "Palm analysis failed", detail: String(e) };
    }
  }

  const ai = await completeJson(`
    Return STRICT JSON ONLY:
    {
      "summary": string,
      "analysis": string
    }
    User Question: ${question}
    Mode: ${mode}
    Payload: ${JSON.stringify(payload, null, 2)}
    Palm: ${JSON.stringify(palm, null, 2)}
  `);

  return {
    summary: ai.summary || "",
    analysis: ai.analysis || "",
    palm
  };
}

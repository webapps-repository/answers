// /lib/insights.js
import { analyzePalm, analyzeNumerology, analyzeAstrology } from "./engines.js";

/**
 * Runs all metaphysical engines and produces a consolidated "insights" bundle.
 */
export async function generateInsights({ question, meta = {}, enginesInput = {} }) {
  const { palm, numerology, astrology } = enginesInput;

  const [palmResult, numerologyResult, astrologyResult] = await Promise.all([
    palm ? analyzePalm(palm) : null,
    numerology ? analyzeNumerology(numerology) : null,
    astrology ? analyzeAstrology(astrology) : null
  ]);

  // High-level synthesis
  const summaryBlocks = [];

  if (palmResult?.overall) summaryBlocks.push(`Palmistry: ${palmResult.overall}`);
  if (numerologyResult?.summary) summaryBlocks.push(`Numerology: ${numerologyResult.summary}`);
  if (astrologyResult?.summary) summaryBlocks.push(`Astrology: ${astrologyResult.summary}`);

  const synthesis = {
    alignment_score: 0.75,
    summary: summaryBlocks.join("\n\n"),
    themes: summaryBlocks.slice(0, 5)
  };

  return {
    question,
    meta,
    palm: palmResult,
    numerology: numerologyResult,
    astrology: astrologyResult,
    synthesis
  };
}

/**
 * Generates a BEAUTIFUL, MODERN, MINIMAL, PROFESSIONAL HTML report.
 * This HTML is then converted to a PDF by Satori + Resvg via /lib/pdf.js.
 */
export function generateTechnicalReportHTML(insights) {
  const { question, meta, palm, numerology, astrology, synthesis } = insights;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    margin: 0;
    padding: 60px 70px;
    font-family: Inter, sans-serif;
    background: #f5f6fa;
    color: #222;
  }

  .report-container {
    background: white;
    padding: 50px 55px;
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  h1 {
    font-size: 42px;
    margin-top: 0;
    margin-bottom: 14px;
    color: #2a2d41;
    letter-spacing: -0.5px;
    font-weight: 700;
  }

  .subtitle {
    font-size: 18px;
    margin-bottom: 32px;
    color: #555;
  }

  .meta-box {
    padding: 18px 22px;
    background: #fff7e6;
    border-left: 6px solid #ffb74d;
    border-radius: 10px;
    margin-bottom: 40px;
    font-size: 15px;
    color: #6a4d1f;
  }

  .section {
    margin-top: 45px;
    padding: 35px;
    background: #fafbfc;
    border: 1px solid #e7e8ec;
    border-radius: 14px;
  }

  .section-title {
    font-size: 26px;
    color: #3d4670;
    margin-bottom: 14px;
    font-weight: 600;
    border-left: 6px solid #3d4670;
    padding-left: 14px;
  }

  .section p {
    line-height: 1.65;
    font-size: 15.5px;
    color: #333;
    margin: 0;
    white-space: pre-wrap;
  }

  .tag {
    display: inline-block;
    background: #ebedff;
    color: #4552cc;
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 13px;
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .footer {
    margin-top: 60px;
    text-align: center;
    font-size: 14px;
    color: #888;
  }
</style>
</head>

<body>
  <div class="report-container">
    
    <h1>Technical Spiritual Report</h1>
    <div class="subtitle">
      A polished, professional interpretation generated using metaphysical analytics.
    </div>

    <div class="meta-box">
      <strong>Question:</strong> ${question || "—"}<br/>
      ${meta?.name ? `<strong>Name:</strong> ${meta.name}<br/>` : ""}
      ${meta?.email ? `<strong>Email:</strong> ${meta.email}<br/>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Summary & Synthesis</div>
      <p><strong>Alignment Score:</strong> ${(synthesis?.alignment_score ?? 0).toFixed(2)}</p>
      <br/>
      <p>${synthesis?.summary || "No synthesis available."}</p>
      <div style="margin-top: 20px;">
        ${(synthesis?.themes || []).map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Palmistry</div>
      <p>${palm?.overall || "No palmistry information available."}</p>
    </div>

    <div class="section">
      <div class="section-title">Numerology</div>
      <p>${numerology?.summary || "No numerology details available."}</p>
    </div>

    <div class="section">
      <div class="section-title">Astrology</div>
      <p>${astrology?.summary || "No astrology information available."}</p>
    </div>

    <div class="footer">
      Generated on ${new Date().toLocaleDateString()} • Automated Insight System
    </div>

  </div>
</body>
</html>
`;
}

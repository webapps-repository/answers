// latest pdfgen

import getStream from "get-stream";

// ✅ Safe dynamic import for Vercel
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

// ✅ Helper to safely stringify any value (fixes [object Object])
function stringify(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    try {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    } catch {
      return JSON.stringify(value);
    }
  }
  return String(value);
}

// ===== Helper Functions =====
function drawSectionHeading(doc, title) {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();

  doc
    .moveDown(0.3)
    .fontSize(16)
    .fillColor("#4B0082")
    .text(title, { underline: true })
    .moveDown(0.6);
}

function drawParagraph(doc, text, size = 12, color = "#333") {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();

  doc
    .fontSize(size)
    .fillColor(color)
    .lineGap(6) // increased line spacing ~1.5x
    .text(stringify(text) || "—")
    .moveDown(1.0);
}

function drawTwoColTable(doc, rows, opts = {}) {
  const {
    left = 50,
    top = doc.y,
    col1Width = 200,
    col2Width = 340,
    rowHeight = 28,
    stripeColor = "#F8F8FF",
    textSize = 11,
  } = opts;

  const pageBottom = doc.page.height - doc.page.margins.bottom;

  rows.forEach((row, i) => {
    const y = doc.y;
    const neededHeight = rowHeight;

    if (y + neededHeight > pageBottom - 20) doc.addPage();

    // alternate shading
    if (i % 2 === 0) {
      doc.save().rect(left, y, col1Width + col2Width, rowHeight).fill(stripeColor).restore();
    }

    const label = stringify(row[0]);
    const value = stringify(row[1]);

    doc
      .fontSize(textSize)
      .fillColor("#000")
      .text(label, left + 6, y + 6, { width: col1Width - 12 })
      .text(value, left + col1Width + 10, y + 6, { width: col2Width - 16 });

    doc.y = y + rowHeight;
  });

  doc.moveDown(1.2);
}

// ===== Main PDF Export =====
export async function generatePdfBuffer({
  fullName,
  birthdate,
  birthTime,
  birthPlace,
  question,
  answer,
  astrology,
  numerology,
  palmistry,
  astroDetails = {},
  numDetails = {},
  palmDetails = {},
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("✅ PDF generation complete"));

  // ===== Title =====
  doc
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Your Question — Personalized Spiritual Report", { align: "center" })
    .moveDown(1.2);

  // ===== User Info =====
  doc.fontSize(12).fillColor("#111").lineGap(6);
  doc.text(`Name: ${fullName || "—"}`);
  doc.text(`Date of Birth: ${birthdate || "—"}`);
  doc.text(`Time of Birth: ${birthTime || "Unknown"}`);
  doc.text(`Birth Place: ${birthPlace || "—"}`);
  doc.text(`Question: ${question || "—"}`).moveDown(1.2);

  // ===== Answer =====
  drawSectionHeading(doc, "Answer to Your Question");
  drawParagraph(doc, answer || "No answer available.");

  // ===== Astrology =====
  drawSectionHeading(doc, "Astrology");
  drawParagraph(doc, astrology || "Astrological interpretation unavailable.");

  const astrologyRows = [
    ["Planetary Positions", astroDetails["Planetary Positions"] || "See summary above."],
    ["Ascendant (Rising) Zodiac Sign", astroDetails["Ascendant (Rising) Zodiac Sign"] || "See summary above."],
    ["Astrological Houses", astroDetails["Astrological Houses"] || "See summary above."],
    ["Family Astrology", astroDetails["Family Astrology"] || "See summary above."],
    ["Love Governing House in Astrology", astroDetails["Love Governing House in Astrology"] || "See summary above."],
    ["Health & Wellbeing Predictions", astroDetails["Health & Wellbeing Predictions"] || "See summary above."],
    ["Astrological influences on Work, Career and Business",
      astroDetails["Astrological influences on Work, Career and Business"] || "See summary above."],
  ];

  drawTwoColTable(doc, astrologyRows);

  // ===== Numerology =====
  drawSectionHeading(doc, "Numerology");
  drawParagraph(doc, numerology || "Numerology interpretation unavailable.");

  const numerologyRows = [
    [`Life Path Number ${stringify(numDetails["Life Path Number Value"] || "")}`,
      numDetails["Life Path Number"] || "See summary above."],
    [`Expression Number ${stringify(numDetails["Expression Number Value"] || "")}`,
      numDetails["Expression Number"] || "See summary above."],
    [`Personality Number ${stringify(numDetails["Personality Number Value"] || "")}`,
      numDetails["Personality Number"] || "See summary above."],
    [`Soul Urge Number ${stringify(numDetails["Soul Urge Number Value"] || "")}`,
      numDetails["Soul Urge Number"] || "See summary above."],
    [`Maturity Number ${stringify(numDetails["Maturity Number Value"] || "")}`,
      numDetails["Maturity Number"] || "See summary above."],
  ];

  drawTwoColTable(doc, numerologyRows);

  // ===== Palmistry =====
  drawSectionHeading(doc, "Palmistry");
  drawParagraph(doc, palmistry || "Palmistry interpretation unavailable.");

  const palmistryRows = [
    ["Life Line", palmDetails["Life Line"] || "Vitality and stamina; long and deep shows resilience."],
    ["Head Line", palmDetails["Head Line"] || "Intellect and focus; deep shows clarity, wavy indicates creativity."],
    ["Heart Line", palmDetails["Heart Line"] || "Emotional depth and balance; breaks suggest shifts in relationships."],
    ["Fate Line", palmDetails["Fate Line"] || "Career and destiny; deep indicates purpose, breaks show changes."],
    ["Fingers", palmDetails["Fingers"] || "Thumb=willpower, Index=ambition, Middle=discipline, Ring=creativity, Pinky=communication."],
    ["Mounts", palmDetails["Mounts"] || "Jupiter=leadership, Venus=love, Luna=intuition — highlights key traits."],
    ["Marriage / Relationship Lines", palmDetails["Marriage / Relationship Lines"] || "Shows number and timeline of relationships or marriage events."],
    ["Children", palmDetails["Children"] || "Indicates potential number and gender energy of children."],
    ["Travel Lines", palmDetails["Travel Lines"] || "Represents journeys — domestic or international — and their timing."],
    ["Prominent Mounts", palmDetails["Prominent Mounts"] || "Identifies most pronounced mounts revealing key life themes."],
  ];

  drawTwoColTable(doc, palmistryRows);

  // ===== Footer =====
  doc
    .moveDown(1.0)
    .fontSize(10)
    .fillColor("#777")
    .text("✨ Generated by Hazcam Spiritual Systems — combining astrology, numerology, and palmistry for personal insight.", {
      align: "center",
    });

  doc.end();
  return await getStream.buffer(doc);
}

// /api/utils/generatePdf.js
import getStream from "get-stream";

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load pdfkit:", err);
  throw err;
}

function drawParagraph(doc, text) {
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#222")
    .lineGap(6)
    .text(text || "—", { align: "left" })
    .moveDown(1);
}

function drawSectionTitle(doc, title) {
  doc
    .moveDown(0.4)
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#4B0082")
    .text(title, { underline: true })
    .moveDown(0.4);
}

function drawTable(doc, rows) {
  const leftX = 50;
  const col1Width = 180;
  const col2Width = 330;
  const rowHeight = 26;
  const stripe = "#f5f5ff";

  rows.forEach((row, i) => {
    const y = doc.y;
    if (i % 2 === 0) {
      doc.save().rect(leftX, y, col1Width + col2Width, rowHeight).fill(stripe).restore();
    }
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#000")
      .text(row[0], leftX + 6, y + 6, { width: col1Width - 12 })
      .text(row[1], leftX + col1Width + 10, y + 6, { width: col2Width - 16 });
    doc.y = y + rowHeight;
  });
  doc.moveDown(1.2);
}

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

  doc.font("Helvetica").fontSize(12).fillColor("#111").lineGap(6);

  // --- Header ---
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Personal Spiritual Report", { align: "center" })
    .moveDown(1.2);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#111")
    .text(`Name: ${fullName}`)
    .text(`Date of Birth: ${birthdate}`)
    .text(`Time of Birth: ${birthTime}`)
    .text(`Birth Place: ${birthPlace}`)
    .text(`Question: ${question}`)
    .moveDown(1);

  // --- Answer ---
  drawSectionTitle(doc, "Answer to Your Question");
  drawParagraph(doc, answer);

  // --- Astrology ---
  drawSectionTitle(doc, "Astrology");
  drawParagraph(doc, astrology);

  drawTable(doc, [
    ["Planetary Positions", astroDetails["Planetary Positions"] || ""],
    ["Ascendant (Rising) Zodiac Sign", astroDetails["Ascendant (Rising) Zodiac Sign"] || ""],
    ["Astrological Houses", astroDetails["Astrological Houses"] || ""],
    ["Family Astrology", astroDetails["Family Astrology"] || ""],
    ["Love Governing House in Astrology", astroDetails["Love Governing House in Astrology"] || ""],
    ["Health & Wellbeing Predictions", astroDetails["Health & Wellbeing Predictions"] || ""],
    ["Astrological influences on Work, Career and Business", astroDetails["Astrological influences on Work, Career and Business"] || ""],
  ]);

  // --- Numerology ---
  drawSectionTitle(doc, "Numerology");
  drawParagraph(doc, numerology);

  drawTable(doc, [
    ["Life Path Number", numDetails["Life Path Number"] || ""],
    ["Expression Number", numDetails["Expression Number"] || ""],
    ["Personality Number", numDetails["Personality Number"] || ""],
    ["Soul Urge Number", numDetails["Soul Urge Number"] || ""],
    ["Maturity Number", numDetails["Maturity Number"] || ""],
  ]);

  // --- Palmistry ---
  drawSectionTitle(doc, "Palmistry");
  drawParagraph(doc, palmistry);

  drawTable(doc, [
    ["Life Line", palmDetails["Life Line"] || ""],
    ["Head Line", palmDetails["Head Line"] || ""],
    ["Heart Line", palmDetails["Heart Line"] || ""],
    ["Fate Line", palmDetails["Fate Line"] || ""],
    ["Thumb", palmDetails["Thumb"] || ""],
    ["Index Finger", palmDetails["Index Finger"] || ""],
    ["Ring Finger", palmDetails["Ring Finger"] || ""],
    ["Mounts", palmDetails["Mounts"] || ""],
    ["Marriage / Relationship", palmDetails["Marriage / Relationship"] || ""],
    ["Children", palmDetails["Children"] || ""],
    ["Travel Lines", palmDetails["Travel Lines"] || ""],
    ["Stress Lines", palmDetails["Stress Lines"] || ""],
  ]);

  doc
    .moveDown(1)
    .fontSize(10)
    .fillColor("#777")
    .text("This report is for entertainment purposes only.", { align: "center" });

  doc.end();
  return await getStream.buffer(doc);
}

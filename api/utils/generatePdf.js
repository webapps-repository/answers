// /api/utils/generatePdf.js
import getStream from "get-stream";

// Dynamic import (Vercel-safe)
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default; // pdfkit ^0.17.x
} catch (err) {
  console.error("Failed to load PDFKit:", err);
  throw err;
}

// ~1.5 line spacing effect
const LINE_GAP = 6;

function maybePageBreak(doc, needed = 48) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function heading(doc, text) {
  maybePageBreak(doc, 48);
  doc
    .moveDown(0.2)
    .fontSize(18)
    .fillColor("#4B0082")
    .text(text, { underline: true })
    .moveDown(0.4);
}

function subheading(doc, text) {
  maybePageBreak(doc, 32);
  doc
    .fontSize(13)
    .fillColor("#4B0082")
    .text(text)
    .moveDown(0.1);
}

function paragraph(doc, text = "") {
  maybePageBreak(doc, 64);
  doc
    .fontSize(12)
    .fillColor("#222")
    .text(text || "—", { lineGap: LINE_GAP })
    .moveDown(0.2);
}

function detailsBlock(doc, kvPairs = []) {
  kvPairs.forEach(([label, value]) => {
    maybePageBreak(doc, 28);
    doc.fontSize(12).fillColor("#222")
      .text(`${label}: ${value || "—"}`, { lineGap: LINE_GAP });
  });
  doc.moveDown(0.4);
}

const nz = (v, d="") => (v == null ? d : String(v));
const numTitle = (label, block) => {
  if (block && typeof block === "object") {
    const n = nz(block.number);
    return n ? `${label}: ${n}` : label;
  }
  return label;
};
const numMeaning = (block) => {
  if (block && typeof block === "object") return nz(block.meaning);
  return nz(block);
};

export async function generatePdfBuffer({
  fullName,
  birthdate,
  birthTime,
  birthPlace,
  question,

  // narrative content from OpenAI (structured)
  answer,
  astrology = {},
  numerology = {},
  palmistry = {},
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("PDF generation complete"));

  // Title (no icons, centered)
  doc
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Personal Spiritual Report", { align: "center" })
    .moveDown(0.8);

  // Details (full width)
  detailsBlock(doc, [
    ["Name", fullName],
    ["Date of Birth", birthdate],
    ["Time of Birth", birthTime || "Unknown"],
    ["Birth Place", birthPlace],
    ["Question", question || "—"],
  ]);

  // Answer
  heading(doc, "Answer to Your Question");
  paragraph(doc, answer);

  // Astrology section (summary + full-width sub-sections)
  heading(doc, "Astrology");
  paragraph(doc, nz(astrology.summary));
  subheading(doc, "Planetary Positions"); paragraph(doc, nz(astrology.planetaryPositions));
  subheading(doc, "Ascendant (Rising)");  paragraph(doc, nz(astrology.ascendant));
  subheading(doc, "Houses");               paragraph(doc, nz(astrology.houses));
  subheading(doc, "Family");               paragraph(doc, nz(astrology.family));
  subheading(doc, "Love");                 paragraph(doc, nz(astrology.loveHouse));
  subheading(doc, "Health & Wellbeing");   paragraph(doc, nz(astrology.health));
  subheading(doc, "Work, Career & Business"); paragraph(doc, nz(astrology.career));

  // Numerology section
  heading(doc, "Numerology");
  paragraph(doc, nz(numerology.summary));

  subheading(doc, numTitle("Life Path", numerology.lifePath));
  paragraph(doc, numMeaning(numerology.lifePath));

  subheading(doc, numTitle("Expression", numerology.expression));
  paragraph(doc, numMeaning(numerology.expression));

  subheading(doc, numTitle("Personality", numerology.personality));
  paragraph(doc, numMeaning(numerology.personality));

  subheading(doc, numTitle("Soul Urge", numerology.soulUrge));
  paragraph(doc, numMeaning(numerology.soulUrge));

  subheading(doc, numTitle("Maturity", numerology.maturity));
  paragraph(doc, numMeaning(numerology.maturity));

  // Palmistry section (full set including your added detail)
  heading(doc, "Palmistry");
  paragraph(doc, nz(palmistry.summary));

  subheading(doc, "Life Line");        paragraph(doc, nz(palmistry.lifeLine));
  subheading(doc, "Head Line");        paragraph(doc, nz(palmistry.headLine));
  subheading(doc, "Heart Line");       paragraph(doc, nz(palmistry.heartLine));
  subheading(doc, "Fate Line");        paragraph(doc, nz(palmistry.fateLine));
  subheading(doc, "Thumb");            paragraph(doc, nz(palmistry.thumb));
  subheading(doc, "Index Finger");     paragraph(doc, nz(palmistry.indexFinger));
  subheading(doc, "Middle Finger");    paragraph(doc, nz(palmistry.middleFinger));
  subheading(doc, "Ring Finger");      paragraph(doc, nz(palmistry.ringFinger));
  subheading(doc, "Pinky Finger");     paragraph(doc, nz(palmistry.pinkyFinger));
  subheading(doc, "Mounts (overall)"); paragraph(doc, nz(palmistry.mounts));
  subheading(doc, "Prominent Mounts"); paragraph(doc, nz(palmistry.prominentMounts));
  subheading(doc, "Marriage / Relationship"); paragraph(doc, nz(palmistry.marriageTimeline));
  subheading(doc, "Children");         paragraph(doc, nz(palmistry.childrenCount));
  subheading(doc, "Travel Lines");     paragraph(doc, nz(palmistry.travelDetails));
  subheading(doc, "Stress Lines");     paragraph(doc, nz(palmistry.stressLines));

  // Footer
  doc
    .moveDown(0.6)
    .fontSize(10)
    .fillColor("#666")
    .text("This report is for informational and entertainment purposes only.", {
      align: "center",
    });

  doc.end();
  return await getStream.buffer(doc);
}

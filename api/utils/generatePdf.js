// /api/utils/generatePdf.js
// Clean, stable PDF layout for both modes: 'personal' and 'technical'
import getStream from "get-stream";

// Vercel-safe dynamic import (no internal paths)
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default; // pdfkit@0.17.x
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

function line(doc, h = 6) { doc.moveDown(h / 12); }
function sectionTitle(doc, text) {
  doc.fontSize(14).fillColor("#111").text(text, { underline: true }).moveDown(0.5);
}
function headerBrand(doc, brandText) {
  doc.fontSize(10).fillColor("#666").text(brandText || "", { align: "center" });
  doc.moveDown(0.2);
}

export async function generatePdfBuffer({
  headerBrand: brand = "Melodies Web",
  title = "Your Answer",
  mode = "personal",  // 'personal' | 'technical'

  // Common
  question,
  answer,

  // Personal fields
  fullName,
  birthdate, // dd-mm-yyyy
  birthTime,
  birthPlace,

  // Short paragraphs (personal)
  astrologySummary,
  numerologySummary,
  palmistrySummary,

  // Pack:
  // - personal: { lifePath, expression, personality, soulUrge, maturity }
  // - technical: { technicalKeyPoints:[], technicalNotes:"" }
  numerologyPack = {},
}) {
  const doc = new PDFDocument({
    margin: 56, // a bit more generous
    info: { Title: title, Author: "Melodies Web" }
  });

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => {});

  // Header
  headerBrand(doc, brand);
  doc.fontSize(20).fillColor("#000").text(title, { align: "center" });
  line(doc, 10);

  // Question
  if (question) {
    sectionTitle(doc, "Question");
    doc.fontSize(12).fillColor("#222").text(question, { align: "left" });
    line(doc, 10);
  }

  // Answer
  sectionTitle(doc, "Answer");
  doc.fontSize(12).fillColor("#222").text(answer || "—", {
    align: "left",
  });
  line(doc, 12);

  if (mode === "technical") {
    // Concise single-page technical layout
    if (Array.isArray(numerologyPack.technicalKeyPoints) && numerologyPack.technicalKeyPoints.length) {
      sectionTitle(doc, "Key Points");
      doc.fontSize(12).fillColor("#222");
      numerologyPack.technicalKeyPoints.forEach((p) => {
        doc.text(`• ${p}`);
      });
      line(doc, 8);
    }
    if (numerologyPack.technicalNotes) {
      sectionTitle(doc, "Notes");
      doc.fontSize(12).fillColor("#222").text(numerologyPack.technicalNotes);
      line(doc, 8);
    }
  } else {
    // Personal, flowing format with 1.5-ish spacing (achieved by small extra moveDown)
    // Personal details block
    sectionTitle(doc, "Your Details");
    doc.fontSize(12).fillColor("#222")
      .text(`Name: ${fullName || "—"}`)
      .moveDown(0.25)
      .text(`Date of Birth: ${birthdate || "—"}`)
      .moveDown(0.25)
      .text(`Time of Birth: ${birthTime || "Unknown"}`)
      .moveDown(0.25)
      .text(`Birth Place: ${birthPlace || "—"}`);
    line(doc, 10);

    // Astrology
    sectionTitle(doc, "Astrology");
    doc.fontSize(12).fillColor("#222").text(astrologySummary || "—");
    line(doc, 10);

    // Numerology (summary paragraph first, then detailed five sections)
    sectionTitle(doc, "Numerology");
    doc.fontSize(12).fillColor("#222").text(numerologySummary || "—");
    line(doc, 6);

    const np = numerologyPack || {};
    const numLines = [
      { label: "Life Path", value: np.lifePath },
      { label: "Expression", value: np.expression },
      { label: "Personality", value: np.personality },
      { label: "Soul Urge", value: np.soulUrge },
      { label: "Maturity", value: np.maturity },
    ];

    numLines.forEach(({ label, value }) => {
      doc.fontSize(12).fillColor("#111").text(`${label}: ${value ?? "—"}`, { continued: false });
      // Provide a short meaning line seeded by the number (simple placeholders; your AI summaries add context)
      doc.fontSize(12).fillColor("#333").text(`Meaning: Personalized interpretation for ${label} ${value ?? ""}.`);
      line(doc, 6);
    });
    line(doc, 6);

    // Palmistry
    sectionTitle(doc, "Palmistry");
    doc.fontSize(12).fillColor("#222").text(palmistrySummary || "—");
    line(doc, 8);
  }

  // Footer
  doc.moveDown(0.5).fontSize(10).fillColor("#777")
    .text("This report is for informational purposes only.", { align: "center" });

  doc.end();
  return await getStream.buffer(doc);
}

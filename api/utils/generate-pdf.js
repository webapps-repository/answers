// /api/utils/generate-pdf.js
// Stable PDF generator for both Personal + Technical reports.
// Clean layout, no icons, 1.45 line-spacing, consistent typography.

import getStream from "get-stream";

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (e) {
  console.error("PDFKit load failed:", e);
  throw e;
}

// ---------- Layout Helpers ----------
function spacer(doc, lines = 1) {
  // ~1.45 line spacing
  doc.moveDown(lines * 0.45);
}

function heading(doc, text) {
  doc
    .fontSize(14)
    .fillColor("#111")
    .text(text, { underline: true })
    .moveDown(0.6);
}

function headerBrand(doc, brandText) {
  doc
    .fontSize(10)
    .fillColor("#666")
    .text(brandText, { align: "center" })
    .moveDown(0.3);
}

// ---------- Main Export ----------
export async function generatePdfBuffer({
  headerBrand: brand = "Melodies Web",
  titleText = "Your Answer",
  mode = "personal",

  // Common
  question,
  answer,

  // Personal details
  fullName,
  birthdate,
  birthTime,
  birthPlace,

  // Summaries
  astrologySummary,
  numerologySummary,
  palmistrySummary,

  // numerologyPack:
  //   PERSONAL: {lifePath, expression, personality, soulUrge, maturity}
  //   TECHNICAL: {technicalKeyPoints:[], technicalNotes:""}
  numerologyPack = {}
}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 56,
    info: { Title: titleText, Author: brand }
  });

  const chunks = [];
  doc.on("data", c => chunks.push(c));
  doc.on("end", () => {});

  // ----- Header -----
  headerBrand(doc, brand);
  doc
    .fontSize(20)
    .fillColor("#000")
    .text(titleText, { align: "center" });
  spacer(doc, 2);

  // ----- Question -----
  heading(doc, "Question");
  doc
    .fontSize(12)
    .fillColor("#222")
    .text(question || "—");
  spacer(doc, 2);

  // ----- Answer -----
  heading(doc, "Answer");
  doc
    .fontSize(12)
    .fillColor("#222")
    .text(answer || "—");
  spacer(doc, 2.2);

  // ---------------------------------------------------------
  //                     TECHNICAL MODE
  // ---------------------------------------------------------
  if (mode === "technical") {
    const tk = numerologyPack.technicalKeyPoints || [];
    const tn = numerologyPack.technicalNotes || "";

    if (tk.length > 0) {
      heading(doc, "Key Points");
      doc.fontSize(12).fillColor("#222");
      tk.forEach(pt => {
        doc.text(`• ${pt}`);
        spacer(doc, 0.5);
      });
      spacer(doc, 1);
    }

    if (tn) {
      heading(doc, "Notes");
      doc.fontSize(12).fillColor("#222").text(tn);
      spacer(doc, 1.5);
    }

    doc
      .moveDown(1)
      .fontSize(10)
      .fillColor("#777")
      .text("This report is for informational purposes only.", { align: "center" });

    doc.end();
    return await getStream.buffer(doc);
  }

  // ---------------------------------------------------------
  //                     PERSONAL MODE
  // ---------------------------------------------------------
  heading(doc, "Your Details");
  doc.fontSize(12).fillColor("#222");
  doc.text(`Name: ${fullName || "—"}`);
  spacer(doc, 0.4);
  doc.text(`Date of Birth: ${birthdate || "—"}`);
  spacer(doc, 0.4);
  doc.text(`Time of Birth: ${birthTime || "Unknown"}`);
  spacer(doc, 0.4);
  doc.text(`Birth Place: ${birthPlace || "—"}`);
  spacer(doc, 2);

  // ----- Astrology -----
  heading(doc, "Astrology");
  doc.fontSize(12).fillColor("#222").text(astrologySummary || "—");
  spacer(doc, 2);

  // ----- Numerology -----
  heading(doc, "Numerology");
  doc.fontSize(12).fillColor("#222").text(numerologySummary || "—");
  spacer(doc, 1.3);

  const np = numerologyPack || {};
  const detailed = [
    ["Life Path", np.lifePath],
    ["Expression Number", np.expression],
    ["Personality Number", np.personality],
    ["Soul Urge Number", np.soulUrge],
    ["Maturity Number", np.maturity]
  ];

  doc.fontSize(12).fillColor("#111");
  detailed.forEach(([label, value]) => {
    doc.text(`${label}: ${value ?? "—"}`);
    doc
      .moveDown(0.3)
      .fontSize(12)
      .fillColor("#333")
      .text(`Meaning: Personalized interpretation for ${label} ${value ?? ""}.`);
    spacer(doc, 1.1);
    doc.fontSize(12).fillColor("#111");
  });

  spacer(doc, 1.5);

  // ----- Palmistry -----
  heading(doc, "Palmistry");
  doc.fontSize(12).fillColor("#222").text(palmistrySummary || "—");
  spacer(doc, 1.5);

  // ----- Footer -----
  doc
    .moveDown(1)
    .fontSize(10)
    .fillColor("#777")
    .text("This report is for entertainment and informational purposes only.", {
      align: "center"
    });

  doc.end();
  return await getStream.buffer(doc);
}

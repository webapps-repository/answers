// /api/utils/generate-pdf.js
// Enhanced PDF builder for unified detailed spiritual reports + technical reports

import PDFDocument from "pdfkit";

export function generatePDF({
  mode = "personal",
  question,
  fullName,
  birthDate,
  birthTime,
  birthPlace,
  insights,
  astrology,
  numerology,
  palmistry
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const chunks = [];
      doc.on("data", (d) => chunks.push(d));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // ------------------------------
      // HEADER
      // ------------------------------
      doc
        .fontSize(20)
        .text("Melodies Web — Detailed Report", { align: "center" })
        .moveDown(2);

      // ------------------------------
      // QUESTION
      // ------------------------------
      doc
        .fontSize(12)
        .text(`Your Question: "${question}"`, { align: "left" })
        .moveDown();

      if (mode === "personal") {
        doc.text(`Name: ${fullName || "N/A"}`);
        doc.text(`Birth Date: ${birthDate || "N/A"}`);
        doc.text(`Birth Time: ${birthTime || "N/A"}`);
        doc.text(`Birth Place: ${birthPlace || "N/A"}`);
        doc.moveDown();
      }

      // ------------------------------
      // SUMMARY
      // ------------------------------
      createSectionHeader(doc, "Summary Answer");
      doc.fontSize(11).fillColor("black").text(insights.shortAnswer, { align: "left" }).moveDown(1.5);

      // ======================================================
      // PERSONAL MODE
      // ======================================================
      if (mode === "personal") {
        // Astrology
        createSectionHeader(doc, "Astrological Interpretation");
        doc.text(insights.interpretations.astrology, { align: "left" }).moveDown();
        createAstrologyTables(doc, astrology);

        // Numerology
        createSectionHeader(doc, "Numerological Interpretation");
        doc.text(insights.interpretations.numerology, { align: "left" }).moveDown();
        createNumerologyTable(doc, numerology);

        // Palmistry
        createSectionHeader(doc, "Palmistry Interpretation");
        doc.text(insights.interpretations.palmistry, { align: "left" }).moveDown();
        createPalmistryTable(doc, palmistry);

        // Combined
        createSectionHeader(doc, "Combined Synthesis (Astrology + Numerology + Palmistry)");
        doc.text(insights.interpretations.combined, { align: "left" }).moveDown();

        // Timeline
        createSectionHeader(doc, "Timeline & Forecast");
        doc.text(insights.interpretations.timeline, { align: "left" }).moveDown();

        // Recommendations
        createSectionHeader(doc, "Guidance & Recommendations");
        doc.text(insights.interpretations.recommendations, { align: "left" }).moveDown();
      }

      // ======================================================
      // TECHNICAL MODE
      // ======================================================
      if (mode === "technical") {
        createSectionHeader(doc, "Key Points");
        doc.text("• " + insights.keyPoints.join("\n• "), { align: "left" }).moveDown();

        createSectionHeader(doc, "Detailed Explanation");
        doc.text(insights.explanation, { align: "left" }).moveDown();

        createSectionHeader(doc, "Recommendations");
        doc.text(insights.recommendations, { align: "left" }).moveDown();
      }

      // END PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/* ======================================================
   HELPERS
====================================================== */

function createSectionHeader(doc, title) {
  doc
    .moveDown()
    .fontSize(14)
    .fillColor("#333")
    .text(title, { underline: true })
    .moveDown(0.5);
}

function createAstrologyTables(doc, astrology) {
  if (!astrology) return;
  doc.fontSize(11).text("Astrological Data:", { align: "left" });
  for (const [k, v] of Object.entries(astrology)) {
    doc.text(`${k}: ${v}`);
  }
  doc.moveDown();
}

function createNumerologyTable(doc, numerology) {
  if (!numerology) return;
  doc.fontSize(11).text("Numerology Data:", { align: "left" });
  for (const [k, v] of Object.entries(numerology)) {
    doc.text(`${k}: ${v}`);
  }
  doc.moveDown();
}

function createPalmistryTable(doc, palmistry) {
  if (!palmistry) return;
  doc.fontSize(11).text("Palmistry Data:", { align: "left" });
  for (const [k, v] of Object.entries(palmistry)) {
    doc.text(`${k}: ${v}`);
  }
  doc.moveDown();
}

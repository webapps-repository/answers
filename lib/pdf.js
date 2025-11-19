// /lib/pdf.js
// ---------------------------------------------------------------------
// Universal PDF Generator
// - Personal Mode: Astrology + Numerology + Palmistry + Triad Reading
// - Technical Mode: Problem summary + key points + explanation
// - Clean magazine-style layout
// ---------------------------------------------------------------------

import PDFDocument from "pdfkit";

export async function generatePDF({
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
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: "Detailed Report",
          Author: "Melodies Web"
        }
      });

      const chunks = [];
      doc.on("data", (d) => chunks.push(d));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // ---------------------------------------------------
      // HEADER
      // ---------------------------------------------------
      doc
        .fontSize(22)
        .fillColor("#333")
        .text("Melodies Web — Detailed Report", { align: "center" })
        .moveDown(1.5);

      // ---------------------------------------------------
      // BASIC INFO
      // ---------------------------------------------------
      doc
        .fontSize(12)
        .fillColor("#000")
        .text(`Your Question: "${question}"`, { align: "left" })
        .moveDown();

      if (mode === "personal") {
        doc.text(`Name: ${fullName || "N/A"}`);
        doc.text(`Birth Date: ${birthDate || "N/A"}`);
        doc.text(`Birth Time: ${birthTime || "N/A"}`);
        doc.text(`Birth Place: ${birthPlace || "N/A"}`);
        doc.moveDown(1);
      }

      // ===================================================
      // PERSONAL MODE
      // ===================================================
      if (mode === "personal") {
        // -----------------------------
        // SHORT ANSWER
        // -----------------------------
        sectionHeader(doc, "Your Answer");
        doc.fontSize(12).text(insights.shortAnswer || "(No answer) ").moveDown(1.5);

        // -----------------------------
        // ASTROLOGY
        // -----------------------------
        if (insights.interpretations?.astrology) {
          sectionHeader(doc, "Astrological Summary");
          doc.text(insights.interpretations.astrology).moveDown();

          if (astrology) {
            subHeader(doc, "Astrology Table");
            writeKeyValueTable(doc, astrology);
          }
        }

        // -----------------------------
        // NUMEROLOGY
        // -----------------------------
        if (insights.interpretations?.numerology) {
          sectionHeader(doc, "Numerology Summary");
          doc.text(insights.interpretations.numerology).moveDown();

          if (numerology) {
            subHeader(doc, "Numerology Table");
            writeKeyValueTable(doc, numerology);
          }
        }

        // -----------------------------
        // PALMISTRY
        // -----------------------------
        if (insights.interpretations?.palmistry) {
          sectionHeader(doc, "Palmistry Summary");
          doc.text(insights.interpretations.palmistry).moveDown();

          if (palmistry?.features) {
            subHeader(doc, "Palmistry Table");
            writeKeyValueTable(doc, palmistry.features);
          }
        }

        // -----------------------------
        // COMBINED TRIAD READING
        // -----------------------------
        if (insights.interpretations?.combined) {
          sectionHeader(doc, "Triad Combined Reading");
          doc.text(insights.interpretations.combined).moveDown();
        }

        // -----------------------------
        // TIMELINE
        // -----------------------------
        if (insights.interpretations?.timeline) {
          sectionHeader(doc, "Timeline & Forecast");
          doc.text(insights.interpretations.timeline).moveDown();
        }

        // -----------------------------
        // RECOMMENDATIONS
        // -----------------------------
        if (insights.interpretations?.recommendations) {
          sectionHeader(doc, "Guidance & Recommendations");
          doc.text(insights.interpretations.recommendations).moveDown();
        }
      }

      // ===================================================
      // TECHNICAL MODE
      // ===================================================
      if (mode === "technical") {
        sectionHeader(doc, "Your Technical Answer");
        doc.text(insights.shortAnswer || "(No answer)").moveDown(1);

        if (insights.keyPoints) {
          sectionHeader(doc, "Key Points");
          insights.keyPoints.forEach((kp) => {
            doc.text(`• ${kp}`).moveDown(0.2);
          });
          doc.moveDown(1);
        }

        if (insights.explanation) {
          sectionHeader(doc, "Detailed Explanation");
          doc.text(insights.explanation).moveDown();
        }

        if (insights.recommendations) {
          sectionHeader(doc, "Recommendations");
          doc.text(insights.recommendations).moveDown();
        }
      }

      // END
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------
function sectionHeader(doc, title) {
  doc
    .moveDown()
    .fontSize(15)
    .fillColor("#333")
    .text(title, { underline: true })
    .moveDown(0.5);
}

function subHeader(doc, title) {
  doc
    .moveDown(0.4)
    .fontSize(13)
    .fillColor("#555")
    .text(title)
    .moveDown(0.4);
}

function writeKeyValueTable(doc, obj) {
  doc.fontSize(12).fillColor("#000");
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    doc.text(`${key}: ${v}`);
  }
  doc.moveDown(1);
}


import getStream from "get-stream";

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default; // pdfkit@0.17.x
} catch (e) {
  console.error("pdfkit load error:", e);
  throw e;
}

function line(doc, h = 8) { doc.moveDown(h / 12); }
function title(doc, t)     { doc.fontSize(20).fillColor("#000").text(t, { align: "center" }); }
function heading(doc, t)   { doc.fontSize(14).fillColor("#111").text(t, { underline: true }).moveDown(0.5); }

export async function generatePdfBuffer({
  headerBrand = "Melodies Web",
  titleText = "Your Answer",
  mode = "personal",
  // common
  question, answer,
  // personal
  fullName, birthdate, birthTime, birthPlace,
  astrologySummary, numerologySummary, palmistrySummary,
  numerologyPack = {}, // personal: numbers; technical: keyPoints/notes
}) {
  const doc = new PDFDocument({ margin: 56, info: { Title: titleText, Author: headerBrand } });
  const chunks = [];
  doc.on("data", c => chunks.push(c));

  // header
  doc.fontSize(10).fillColor("#666").text(headerBrand, { align: "center" });
  title(doc, titleText);
  line(doc, 10);

  if (question) {
    heading(doc, "Question");
    doc.fontSize(12).fillColor("#222").text(question);
    line(doc, 8);
  }

  heading(doc, "Answer");
  doc.fontSize(12).fillColor("#222").text(answer || "—");
  line(doc, 10);

  if (mode === "technical") {
    if (Array.isArray(numerologyPack.technicalKeyPoints) && numerologyPack.technicalKeyPoints.length) {
      heading(doc, "Key Points");
      numerologyPack.technicalKeyPoints.forEach(p => doc.text(`• ${p}`));
      line(doc, 8);
    }
    if (numerologyPack.technicalNotes) {
      heading(doc, "Notes");
      doc.text(numerologyPack.technicalNotes);
      line(doc, 6);
    }
  } else {
    heading(doc, "Your Details");
    doc.fontSize(12).text(`Name: ${fullName || "—"}`).moveDown(0.2)
       .text(`Date of Birth: ${birthdate || "—"}`).moveDown(0.2)
       .text(`Time of Birth: ${birthTime || "Unknown"}`).moveDown(0.2)
       .text(`Birth Place: ${birthPlace || "—"}`);
    line(doc, 8);

    heading(doc, "Astrology");
    doc.text(astrologySummary || "—");
    line(doc, 8);

    heading(doc, "Numerology");
    doc.text(numerologySummary || "—");
    line(doc, 6);
    const np = numerologyPack || {};
    const rows = [
      ["Life Path", np.lifePath],
      ["Expression", np.expression],
      ["Personality", np.personality],
      ["Soul Urge", np.soulUrge],
      ["Maturity", np.maturity],
    ];
    rows.forEach(([lbl, val]) => {
      doc.fontSize(12).fillColor("#111").text(`${lbl}: ${val ?? "—"}`);
      doc.fontSize(12).fillColor("#333").text(`Meaning: Personalized interpretation for ${lbl} ${val ?? ""}.`);
      line(doc, 5);
    });

    heading(doc, "Palmistry");
    doc.fillColor("#222").text(palmistrySummary || "—");
    line(doc, 6);
  }

  doc.fontSize(10).fillColor("#777").text("This report is for informational purposes only.", { align: "center" });
  doc.end();
  return await getStream.buffer(doc);
}

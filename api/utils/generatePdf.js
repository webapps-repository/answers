// /api/utils/generatePdf.js
import getStream from "get-stream";

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

// ✅ Simple date formatter
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
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
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("✅ PDF generation complete"));

  // Title
  doc
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Personal Spiritual Report", { align: "center" })
    .moveDown(1.0);

  // Personal details
  doc.fontSize(12).fillColor("#111");
  doc.text(`Name: ${fullName || "—"}`);
  doc.text(`Date of Birth: ${formatDate(birthdate)}`);
  doc.text(`Time of Birth: ${birthTime || "Unknown"}`);
  doc.text(`Birth Place: ${birthPlace || "—"}`);
  doc.text(`Question: ${question || "—"}`).moveDown(1.2);

  // Answer
  doc.fontSize(16).fillColor("#4B0082").text("Answer").moveDown(0.4);
  doc.fontSize(12).fillColor("#000").text(answer || "No answer available.").moveDown(1);

  // Astrology
  doc.fontSize(16).fillColor("#4B0082").text("Astrology").moveDown(0.4);
  doc.fontSize(12).fillColor("#000").text(astrology || "No astrology data.").moveDown(1);

  // Numerology
  doc.fontSize(16).fillColor("#4B0082").text("Numerology").moveDown(0.4);
  doc.fontSize(12).fillColor("#000").text(numerology || "No numerology data.").moveDown(1);

  // Palmistry
  doc.fontSize(16).fillColor("#4B0082").text("Palmistry").moveDown(0.4);
  doc.fontSize(12).fillColor("#000").text(palmistry || "No palmistry data.").moveDown(1.5);

  doc
    .fontSize(10)
    .fillColor("#777")
    .text("This report is for entertainment purposes only.", { align: "center" });

  doc.end();
  return await getStream.buffer(doc);
}

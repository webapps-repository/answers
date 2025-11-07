// generatePdf.js
import PDFDocument from 'pdfkit';
import getStream from 'get-stream';

export async function generatePdfBuffer({ fullName, birthdate, birthTime, birthPlace, reading }) {
  const doc = new PDFDocument();
  doc.fontSize(18).text("🧘 Spiritual Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Name: ${fullName || "Not provided"}`);
  doc.text(`Birth Date: ${birthdate || "Not provided"}`);
  doc.text(`Birth Time: ${birthTime || "Not provided"}`);
  doc.text(`Birth Place: ${birthPlace || "Not provided"}`);
  doc.moveDown();

  doc.fontSize(14).text("🔮 Insights", { underline: true });
  doc.moveDown();

  doc.fontSize(12).text(reading || "No reading generated", {
    lineGap: 6,
  });

  doc.end();
  return await getStream.buffer(doc);
}

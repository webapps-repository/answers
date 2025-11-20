// /lib/pdf.js
// /lib/pdf.js
// /lib/pdf.js
// /lib/pdf.js
// /lib/pdf.js

import PDFDocument from "pdfkit";
import getStream from "get-stream";

/**
 * Convert HTML-like text into a simple PDF using PDFKit.
 * NOTE: This is plain text rendering; no real HTML support.
 */
export async function generatePDFBufferFromHTML(htmlString) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  // capture PDF into a buffer
  const stream = doc.pipe(getStream.buffer());

  // simple stripping of tags for text rendering
  const text = htmlString
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();

  doc.font("Helvetica").fontSize(12).text(text, {
    width: 500,
    lineGap: 4
  });

  doc.end();
  return stream;
}

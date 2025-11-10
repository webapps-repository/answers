// /api/utils/generatePdf.js
import getStream from "get-stream";

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

// ✅ Safe universal formatter for dd-mm-yyyy format
function formatDate(dateStr) {
  try {
    // Handle already-Date objects or timestamp
    if (dateStr instanceof Date) {
      return dateStr.toLocaleDateString("en-GB"); // dd/mm/yyyy
    }

    // Handle string in yyyy-mm-dd or other formats
    if (typeof dateStr === "string" && dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}-${month}-${year}`;
      }
    }

    // Last resort: just stringify safely
    return String(dateStr || "—");
  } catch (err) {
    console.error("❌ formatDate failed:", err, dateStr);
    return "—";
  }
}

/**
 * Helper to draw a heading section
 */
function drawSectionHeading(doc, title) {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();

  doc.moveDown(0.3).fontSize(16).fillColor("#4B0082").text(title, {
    underline: true,
  }).moveDown(0.4);
}

/**
 * Helper to draw a paragraph
 */
function drawParagraph(doc, text, size = 12, color = "#333") {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();
  doc.fontSize(size).fillColor(color).text(text || "—", {
    align: "left",
    lineGap: 6, // ✅ add better line spacing (1.5x)
  }).moveDown(0.8);
}

/**
 * Draws a spaced table for astrology / palmistry sections
 */
function drawTwoColTable(doc, rows, opts = {}) {
  const {
    left = 50,
    top = doc.y,
    col1Width = 180,
    col2Width = 360,
    rowHeight = 26,
    stripeColor = "#F8F8FF",
  } = opts;

  const pageBottom = doc.page.height - doc.page.margins.bottom;

  rows.forEach((row, i) => {
    if (doc.y + rowHeight > pageBottom - 20) {
      doc.addPage();
    }
    const y = doc.y;

    if (i % 2 === 0) {
      doc.save().rect(left, y, col1Width + col2Width, rowHeight).fill(stripeColor).restore();
    }

    doc.fontSize(11)
      .fillColor("#111")
      .text(row[0] ?? "", left + 6, y + 6, { width: col1Width - 12 })
      .text(row[1] ?? "", left + col1Width + 10, y + 6, { width: col2Width - 16 });

    doc.y = y + rowHeight;
  });

  doc.moveDown(1.2);
}

/**
 * Main PDF generator
 */
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

  // ===== Title =====
  doc.fontSize(22).fillColor("#4B0082").text("Personal Spiritual Report", {
    align: "center",
  }).moveDown(1.0);

  // ===== User Details =====
  doc.fontSize(12).fillColor("#111");
  const safeBirthdate = birthdate ? formatDate(birthdate) : "—";
  doc.text(`Name: ${fullName || "—"}`);
  doc.text(`Date of Birth: ${safeBirthdate}`);
  doc.text(`Time of Birth: ${birthTime || "Unknown"}`);
  doc.text(`Birth Place: ${birthPlace || "—"}`);
  doc.text(`Question: ${question || "—"}`).moveDown(1.0);

  // ===== Answer Summary =====
  drawSectionHeading(doc, "Answer Summary");
  drawParagraph(doc, answer || "No answer generated.");

  // ===== Astrology =====
  drawSectionHeading(doc, "Astrology");
  drawParagraph(doc, astrology || "Astrology interpretation unavailable.");

  const astrologyRows = [
    ["Planetary Positions", astroDetails["Planetary Positions"] || "—"],
    ["Ascendant (Rising) Zodiac Sign", astroDetails["Ascendant (Rising) Zodiac Sign"] || "—"],
    ["Astrological Houses", astroDetails["Astrological Houses"] || "—"],
    ["Family Astrology", astroDetails["Family Astrology"] || "—"],
    ["Love Governing House", astroDetails["Love Governing House"] || "—"],
    ["Health & Wellbeing", astroDetails["Health & Wellbeing"] || "—"],
    ["Career & Business", astroDetails["Career & Business"] || "—"],
  ];
  drawTwoColTable(doc, astrologyRows);

  // ===== Numerology =====
  drawSectionHeading(doc, "Numerology");
  drawParagraph(doc, numerology || "Numerology interpretation unavailable.");

  const numerologyRows = [
    ["Life Path", numDetails["Life Path"] || "—"],
    ["Expression", numDetails["Expression"] || "—"],
    ["Personality", numDetails["Personality"] || "—"],
    ["Soul Urge", numDetails["Soul Urge"] || "—"],
    ["Maturity", numDetails["Maturity"] || "—"],
  ];
  drawTwoColTable(doc, numerologyRows);

  // ===== Palmistry =====
  drawSectionHeading(doc, "Palmistry");
  drawParagraph(doc, palmistry || "Palmistry interpretation unavailable.");

  const palmistryRows = [
    ["Life Line", palmDetails["Life Line"] || "—"],
    ["Head Line", palmDetails["Head Line"] || "—"],
    ["Heart Line", palmDetails["Heart Line"] || "—"],
    ["Fate Line", palmDetails["Fate Line"] || "—"],
    ["Thumb", palmDetails["Thumb"] || "—"],
    ["Index Finger", palmDetails["Index Finger"] || "—"],
    ["Ring Finger", palmDetails["Ring Finger"] || "—"],
    ["Mounts", palmDetails["Mounts"] || "—"],
    ["Marriage / Relationship", palmDetails["Marriage / Relationship"] || "—"],
    ["Children", palmDetails["Children"] || "—"],
    ["Travel Lines", palmDetails["Travel Lines"] || "—"],
    ["Stress Lines", palmDetails["Stress Lines"] || "—"],
  ];
  drawTwoColTable(doc, palmistryRows);

  // ===== Footer =====
  doc.moveDown(1.2).fontSize(10).fillColor("#777").text(
    "This report is for entertainment and personal reflection purposes only.",
    { align: "center" }
  );

  doc.end();
  return await getStream.buffer(doc);
}

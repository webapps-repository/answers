// /api/utils/generatePdf.js
import getStream from "get-stream";

// ✅ Vercel-safe dynamic import (works with pdfkit@0.17.x)
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

function drawTwoColTable(doc, rows, opts = {}) {
  const {
    left = 50,
    col1Width = 230,   // a bit wider to fit longer static labels
    col2Width = 330,
    rowHeight = 26,
    stripeColor = "#F8F8FF",
    textSize = 11,
  } = opts;

  const pageBottom = doc.page.height - doc.page.margins.bottom;

  rows.forEach((row, i) => {
    const neededHeight = rowHeight;
    if (doc.y + neededHeight > pageBottom - 20) {
      doc.addPage();
    }

    const y = doc.y;

    if (i % 2 === 0) {
      doc.save().rect(left, y, col1Width + col2Width, rowHeight).fill(stripeColor).restore();
    }

    doc
      .fontSize(textSize)
      .fillColor("#111")
      .text(String(row[0] ?? ""), left + 6, y + 6, { width: col1Width - 12 })
      .text(String(row[1] ?? ""), left + col1Width + 10, y + 6, { width: col2Width - 16 });

    doc.y = y + rowHeight;
  });

  doc.moveDown(1.2);
}

function drawSectionHeading(doc, title) {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();

  doc
    .moveDown(0.3)
    .fontSize(16)
    .fillColor("#4B0082")
    .text(title, { underline: true })
    .moveDown(0.4);
}

function drawParagraph(doc, text, size = 12, color = "#333") {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > pageBottom) doc.addPage();

  doc.fontSize(size).fillColor(color).text(text || "—").moveDown(0.8);
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

  astroDetails = {},
  numDetails = {},
  palmDetails = {},
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("✅ PDF generation complete"));

  // ====== Title ======
  doc
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Your Question — Personalized Spiritual Report", { align: "center" })
    .moveDown(1.0);

  // ====== User Details ======
  doc.fontSize(12).fillColor("#111");
  doc.text(`👤 Name: ${fullName || "—"}`);
  doc.text(`📅 Date of Birth: ${birthdate || "—"}`);
  doc.text(`⏰ Time of Birth: ${birthTime || "Unknown"}`);
  doc.text(`🌍 Birth Place: ${birthPlace || "—"}`);
  doc.text(`💭 Question: ${question || "—"}`).moveDown(1.0);

  // ====== Direct Answer ======
  drawSectionHeading(doc, "🔮 Answer to Your Question");
  drawParagraph(doc, answer || "No answer available.");

  // ====== Astrology Section ======
  drawSectionHeading(doc, "☀️ Astrology");
  drawParagraph(doc, astrology || "Astrology interpretation unavailable.");

  const astrologyRows = [
    ["🌐 Planetary Positions", astroDetails["Planetary Positions"] || "See summary above."],
    ["🌅 Ascendant (Rising) Zodiac Sign", astroDetails["Ascendant (Rising) Zodiac Sign"] || "See summary above."],
    ["🏠 Astrological Houses", astroDetails["Astrological Houses"] || "See summary above."],
    ["👪 Family Astrology", astroDetails["Family Astrology"] || "See summary above."],
    ["❤️ Love Governing House in Astrology", astroDetails["Love Governing House in Astrology"] || "See summary above."],
    ["💫 Health & Wellbeing Predictions", astroDetails["Health & Wellbeing Predictions"] || "See summary above."],
    [
      "💼 Astrological influences on Work, Career and Business",
      astroDetails["Astrological influences on Work, Career and Business"] || "See summary above.",
    ],
  ];
  drawTwoColTable(doc, astrologyRows);

  // ====== Numerology Section ======
  drawSectionHeading(doc, "🔢 Numerology");
  drawParagraph(doc, numerology || "Numerology interpretation unavailable.");

  const numerologyRows = [
    ["1️⃣ Life Path Number", numDetails["Life Path Number"] || "See summary above."],
    ["2️⃣ Expression Number", numDetails["Expression Number"] || "See summary above."],
    ["3️⃣ Personality Number", numDetails["Personality Number"] || "See summary above."],
    ["4️⃣ Soul Urge Number", numDetails["Soul Urge Number"] || "See summary above."],
    ["5️⃣ Maturity Number", numDetails["Maturity Number"] || "See summary above."],
  ];
  drawTwoColTable(doc, numerologyRows);

  // ====== Palmistry Section ======
  drawSectionHeading(doc, "✋ Palmistry");
  drawParagraph(doc, palmistry || "Palmistry interpretation unavailable.");

  const palmistryRows = [
    ["🫀 Life Line", palmDetails["Life Line"] || "Physical vitality & stamina…"],
    ["🧠 Head Line", palmDetails["Head Line"] || "Intellect & mindset…"],
    ["💞 Heart Line", palmDetails["Heart Line"] || "Emotions & relationships…"],
    ["🧭 Fate Line", palmDetails["Fate Line"] || "Career & destiny…"],
    ["🤲 Fingers", palmDetails["Fingers"] || "Willpower, ambition, creativity, communication…"],
    ["🌕 Mounts", palmDetails["Mounts"] || "Jupiter=leadership, Venus=love, Luna=intuition…"],
  ];
  drawTwoColTable(doc, palmistryRows);

  // ====== Footer ======
  doc
    .moveDown(0.8)
    .fontSize(10)
    .fillColor("#777")
    .text("This report is for entertainment purposes only.", { align: "center" });

  doc.end();
  return await getStream.buffer(doc);
}

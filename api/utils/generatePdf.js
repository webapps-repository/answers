// /api/utils/generatePdf.js
import getStream from "get-stream";

// Dynamic import works well on Vercel Node 22
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("❌ Failed to load PDFKit:", err);
  throw err;
}

/** Section heading with consistent spacing */
function heading(doc, text) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 40 > bottom) doc.addPage();
  doc
    .moveDown(0.3)
    .fontSize(18)
    .fillColor("#4B0082")
    .text(text, { underline: true })
    .moveDown(0.2);
}

/** Body paragraph with 1.5ish leading (manually emulated) */
function para(doc, text, size = 12) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + 60 > bottom) doc.addPage();
  doc.fontSize(size).fillColor("#222").text(text || "—", {
    lineBreak: true,
    paragraphGap: 6,
  });
  doc.moveDown(0.3);
}

/** Two-column table (labels left, meanings right), roomier rows */
function twoColTable(doc, rows, opts = {}) {
  const left = opts.left ?? 50;
  const col1 = opts.col1Width ?? 210;
  const col2 = opts.col2Width ?? 335;
  const rowH = opts.rowHeight ?? 28; // roomier
  const stripe = opts.stripeColor ?? "#F5F4FB";
  const bottom = doc.page.height - doc.page.margins.bottom;

  rows.forEach((r, i) => {
    if (doc.y + rowH > bottom - 10) doc.addPage();
    const y = doc.y;

    if (i % 2 === 0) {
      doc.save().rect(left, y, col1 + col2, rowH).fill(stripe).restore();
    }
    doc
      .fontSize(12)
      .fillColor("#111")
      .text(String(r[0] ?? ""), left + 8, y + 7, { width: col1 - 12 })
      .text(String(r[1] ?? ""), left + col1 + 12, y + 7, {
        width: col2 - 16,
      });

    doc.y = y + rowH;
  });

  doc.moveDown(0.5);
}

export async function generatePdfBuffer({
  // Identity
  fullName,
  birthdate,
  birthTime,
  birthPlace,
  question,

  // Summaries
  answer,
  astrology,
  numerology,
  palmistry,

  // Detailed rows/objects
  astroDetails = {},
  numDetails = {},
  palmDetails = {},
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("✅ PDF complete"));

  // Title
  doc
    .fontSize(22)
    .fillColor("#4B0082")
    .text("Personal Spiritual Report", { align: "center" })
    .moveDown(0.6);

  // Personal details (no icons, consistent spacing)
  doc
    .fontSize(12)
    .fillColor("#111")
    .text(`Name: ${fullName || "—"}`)
    .text(`Date of Birth: ${birthdate || "—"}`)
    .text(`Time of Birth: ${birthTime || "Unknown"}`)
    .text(`Birth Place: ${birthPlace || "—"}`)
    .text(`Question: ${question || "—"}`)
    .moveDown(0.6);

  // Answer
  heading(doc, "Answer to Your Question");
  para(doc, answer || "No answer available.");

  // Astrology (summary + wider table)
  heading(doc, "Astrology");
  para(doc, astrology || "Astrology interpretation unavailable.");

  twoColTable(
    doc,
    [
      ["Planetary Positions", astroDetails["Planetary Positions"] || ""],
      ["Ascendant (Rising) Zodiac Sign", astroDetails["Ascendant (Rising) Zodiac Sign"] || ""],
      ["Astrological Houses", astroDetails["Astrological Houses"] || ""],
      ["Family Astrology", astroDetails["Family Astrology"] || ""],
      ["Love Governing House in Astrology", astroDetails["Love Governing House in Astrology"] || ""],
      ["Health & Wellbeing Predictions", astroDetails["Health & Wellbeing Predictions"] || ""],
      [
        "Astrological influences on Work, Career and Business",
        astroDetails["Astrological influences on Work, Career and Business"] || "",
      ],
    ],
    { rowHeight: 30 }
  );

  // Numerology (full-width narrative; show numbers in headings)
  heading(doc, "Numerology");
  para(doc, numerology || "Numerology interpretation unavailable.");

  const NP = (k) => (numDetails[k]?.number != null ? ` (${numDetails[k].number})` : "");
  const NM = (k) => numDetails[k]?.meaning || "";

  doc
    .fontSize(14)
    .fillColor("#4B0082")
    .text(`Life Path${NP("Life Path")}`)
    .moveDown(0.1);
  para(doc, NM("Life Path"));

  doc.fontSize(14).fillColor("#4B0082").text(`Expression${NP("Expression")}`).moveDown(0.1);
  para(doc, NM("Expression"));

  doc.fontSize(14).fillColor("#4B0082").text(`Personality${NP("Personality")}`).moveDown(0.1);
  para(doc, NM("Personality"));

  doc.fontSize(14).fillColor("#4B0082").text(`Soul Urge${NP("Soul Urge")}`).moveDown(0.1);
  para(doc, NM("Soul Urge"));

  doc.fontSize(14).fillColor("#4B0082").text(`Maturity${NP("Maturity")}`).moveDown(0.1);
  para(doc, NM("Maturity"));

  // Palmistry (full-width narrative with the extra details)
  heading(doc, "Palmistry");
  para(doc, palmistry || "Palmistry interpretation unavailable.");

  const P = (k, title) => {
    doc.fontSize(14).fillColor("#4B0082").text(title).moveDown(0.1);
    para(doc, palmDetails[k] || "");
  };

  P("Life Line", "Life Line");
  P("Head Line", "Head Line");
  P("Heart Line", "Heart Line");
  P("Fate Line", "Fate Line");

  // Mounts (prominent + meaning)
  doc.fontSize(14).fillColor("#4B0082").text("Mounts").moveDown(0.1);
  const m = palmDetails["Mounts"] || {};
  const prominent = Array.isArray(m.prominent) ? m.prominent.join(", ") : (m.prominent || "");
  para(
    doc,
    [prominent ? `Prominent: ${prominent}.` : "", m.meaning || ""]
      .filter(Boolean)
      .join(" ")
      .trim()
  );

  // Marriage / Relationship (count + timeline + meaning)
  doc.fontSize(14).fillColor("#4B0082").text("Marriage / Relationship").moveDown(0.1);
  const mar = palmDetails["Marriage / Relationship"] || {};
  para(
    doc,
    [
      mar.count != null ? `Count: ${mar.count}.` : "",
      mar.timeline ? `Timeline: ${mar.timeline}.` : "",
      mar.meaning || "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  // Children
  doc.fontSize(14).fillColor("#4B0082").text("Children").moveDown(0.1);
  const ch = palmDetails["Children"] || {};
  para(doc, [ch.count != null ? `Count: ${ch.count}.` : "", ch.meaning || ""].filter(Boolean).join(" "));

  // Travel Lines
  doc.fontSize(14).fillColor("#4B0082").text("Travel Lines").moveDown(0.1);
  const tr = palmDetails["Travel Lines"] || {};
  para(
    doc,
    [
      tr.type ? `Type: ${tr.type}.` : "",
      tr.timeline ? `Timeline: ${tr.timeline}.` : "",
      tr.meaning || "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  // Stress Lines
  doc.fontSize(14).fillColor("#4B0082").text("Stress Lines").moveDown(0.1);
  para(doc, palmDetails["Stress Lines"] || "");

  // Footer
  doc.moveDown(0.6).fontSize(10).fillColor("#777").text("For personal insight & guidance only.", {
    align: "center",
  });

  doc.end();
  return await getStream.buffer(doc);
}

// /api/utils/generatePdf.js
import getStream from "get-stream";

// Vercel-safe dynamic import for pdfkit (no internal paths)
let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch (err) {
  console.error("Failed to load pdfkit:", err);
  throw err;
}

// Utility: paragraph with global 1.5 line spacing
function para(doc, text, opts = {}) {
  const { size = 12, color = "#222", lineGap = 6 } = opts; // ~1.5 on 12pt
  doc.fontSize(size).fillColor(color).text(text || "—", { lineGap });
  doc.moveDown(0.5);
}

function heading(doc, text, level = 1) {
  const sizes = { 1: 20, 2: 16, 3: 14 };
  const margin = { 1: 10, 2: 6, 3: 4 };
  doc.moveDown(0.2);
  doc
    .fontSize(sizes[level] || 16)
    .fillColor("#4B0082")
    .text(String(text), { underline: level <= 2 })
    .moveDown(margin[level] ? margin[level] / 10 : 0.4);
}

export async function generatePdfBuffer({
  fullName,
  birthdate,
  birthTime,
  birthPlace,
  question,

  answer,
  astrologySummary,
  numerologySummary,
  palmistrySummary,

  numerologyNumbers = {}, // {lifePath, expression, personality, soulUrge, maturity}
  astroDetails = {},      // {planetaryPositions, risingSign, houses, family, loveHouse, health, career}
  palmDetails = {},       // {mountsProminent, marriageCount, marriageTimeline, childrenCount, travelType, travelTimeline, stressLevel}
}) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => console.log("PDF generated."));

  // Title
  heading(doc, "Personal Spiritual Report", 1);

  // Identity block (plain text; no icons)
  doc.fontSize(12).fillColor("#111");
  para(doc, `Name: ${fullName || "—"}`);
  para(doc, `Date of Birth: ${birthdate || "—"}`);
  para(doc, `Time of Birth: ${birthTime || "Unknown"}`);
  para(doc, `Birth Place: ${birthPlace || "—"}`);
  para(doc, `Question: ${question || "—"}`);

  // Answer section
  heading(doc, "Answer to Your Question", 2);
  para(doc, answer);

  // Astrology – summary then sub-sections (narrative)
  heading(doc, "Astrology", 2);
  para(doc, astrologySummary);

  // Optional concise sub-headings for readability
  heading(doc, "Planetary Positions", 3);
  para(doc, astroDetails.planetaryPositions || "—");

  heading(doc, "Ascendant (Rising) Sign", 3);
  para(doc, astroDetails.risingSign || "—");

  heading(doc, "Astrological Houses", 3);
  para(doc, astroDetails.houses || "—");

  heading(doc, "Family Astrology", 3);
  para(doc, astroDetails.family || "—");

  heading(doc, "Love Governing House", 3);
  para(doc, astroDetails.loveHouse || "—");

  heading(doc, "Health & Wellbeing", 3);
  para(doc, astroDetails.health || "—");

  heading(doc, "Work, Career & Business", 3);
  para(doc, astroDetails.career || "—");

  // Numerology – summary full width; include numbers inside headings
  heading(doc, "Numerology", 2);
  para(doc, numerologySummary);

  heading(
    doc,
    `Life Path — ${numerologyNumbers.lifePath ?? "—"}`,
    3
  );
  para(doc, "Your life path number reflects your overarching lesson and direction.");

  heading(
    doc,
    `Expression — ${numerologyNumbers.expression ?? "—"}`,
    3
  );
  para(doc, "Expression (destiny) number speaks to your natural talents and outward potential.");

  heading(
    doc,
    `Personality — ${numerologyNumbers.personality ?? "—"}`,
    3
  );
  para(doc, "Personality number shows the first impression you make and how others perceive you.");

  heading(
    doc,
    `Soul Urge — ${numerologyNumbers.soulUrge ?? "—"}`,
    3
  );
  para(doc, "Soul Urge (heart's desire) reveals inner motivations and what deeply fulfills you.");

  heading(
    doc,
    `Maturity — ${numerologyNumbers.maturity ?? "—"}`,
    3
  );
  para(doc, "Maturity number indicates strengths that crystallize later in life.");

  // Palmistry – summary + specific details (mounts, marriage counts/timeline, etc.)
  heading(doc, "Palmistry", 2);
  para(doc, palmistrySummary);

  heading(doc, "Prominent Mounts", 3);
  para(doc, palmDetails.mountsProminent || "—");

  heading(doc, "Marriage / Relationship", 3);
  para(
    doc,
    `Count: ${palmDetails.marriageCount ?? "—"}; Timeline: ${palmDetails.marriageTimeline ?? "—"}`
  );

  heading(doc, "Children", 3);
  para(doc, `Indicated: ${palmDetails.childrenCount ?? "—"}`);

  heading(doc, "Travel Lines", 3);
  para(
    doc,
    `Type: ${palmDetails.travelType ?? "—"}; Timeline: ${palmDetails.travelTimeline ?? "—"}`
  );

  heading(doc, "Stress Lines", 3);
  para(doc, palmDetails.stressLevel || "—");

  // Footer
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#6b6b6b")
    .text("This material is for personal insight and entertainment purposes only.", { align: "center", lineGap: 5 });

  doc.end();
  return await getStream.buffer(doc);
}

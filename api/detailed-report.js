// /api/detailed-report.js
// Generates full detailed PDF + emails it to user (technical or personal)

import { formidable } from "formidable";
import { personalSummaries, technicalSummary } from "./utils/generate-insights.js";
import { generatePdfBuffer } from "./utils/generate-pdf.js";
import { sendEmailHTML } from "./utils/send-email.js";

// Vercel: disable automatic body parsing
export const config = {
  api: { bodyParser: false },
};

// Helper
const safe = (v, d = "") =>
  v == null ? d : Array.isArray(v) ? String(v[0] ?? d) : String(v);

// ISO conversion
const toISO = (ddmmyyyy) => {
  const s = safe(ddmmyyyy);
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Parse form-data — required because technical mode sends only: question + email
  const form = formidable({
    multiples: false,
    keepExtensions: false,
    allowEmptyFiles: true,
    minFileSize: 0,
  });

  try {
    form.parse(req, async (err, fields) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        return res.status(400).json({ error: "Bad form data" });
      }

      // Inputs
      const question = safe(fields.question).trim();
      const email = safe(fields.email).trim();
      const isPersonalFlag =
        safe(fields.isPersonal).toLowerCase() === "true" ||
        safe(fields.isPersonal).toLowerCase() === "yes" ||
        safe(fields.isPersonal).toLowerCase() === "on";

      if (!email) {
        return res.status(400).json({
          error: "Missing email for detailed report",
        });
      }

      // PERSONAL extra data (ONLY if personal)
      const fullName = safe(fields.name).trim();
      const birthDDMM = safe(fields.birthdate);
      const birthISO = toISO(birthDDMM);
      const birthTime = safe(fields.birthtime, "Unknown");
      const birthPlace = [
        safe(fields.birthcity),
        safe(fields.birthstate),
        safe(fields.birthcountry),
      ]
        .filter(Boolean)
        .join(", ");

      // ================================
      // 🔥 OPENAI CALL
      // ================================
      let ai;
      try {
        if (isPersonalFlag) {
          ai = await personalSummaries({
            fullName,
            birthISO,
            birthTime,
            birthPlace,
            question,
            numerologyPack: {}, // already computed earlier in spiritual-report.js
          });
        } else {
          ai = await technicalSummary(question);
        }
      } catch (err) {
        console.error("OpenAI error:", err);
        return res.status(500).json({
          error: "AI service error",
          detail: String(err?.message || err),
        });
      }

      const shortAnswer =
        ai.answer ||
        (isPersonalFlag
          ? "Your personal guidance is ready."
          : "Here is your detailed explanation.");

      const astrologySummary = ai.astrologySummary || "";
      const numerologySummary = ai.numerologySummary || "";
      const palmistrySummary = ai.palmistrySummary || "";
      const numerologyPack = ai.numerologyPack || ai;

      // ================================
      // 🔥 GENERATE PDF
      // ================================
      let pdfBuffer;
      try {
        pdfBuffer = await generatePdfBuffer({
          headerBrand: "Melodies Web",
          titleText: "Your Detailed Report",
          mode: isPersonalFlag ? "personal" : "technical",
          question,
          answer: shortAnswer,
          fullName,
          birthdate: birthDDMM,
          birthTime,
          birthPlace,
          astrologySummary,
          numerologySummary,
          palmistrySummary,
          numerologyPack,
        });
      } catch (err) {
        console.error("PDF error:", err);
        return res.status(500).json({
          error: "Failed generating PDF",
          detail: err.message,
        });
      }

      // ================================
      // 🔥 SEND EMAIL
      // ================================
      const html = `
        <div style="font-family:system-ui,Segoe UI,Arial;font-size:16px;color:#222;line-height:1.6;max-width:700px;margin:auto;">
          <h2 style="text-align:center;">Your Detailed Report</h2>
          <p><strong>Question:</strong> ${question}</p>
          <p>${shortAnswer}</p>
          <p style="font-size:14px;color:#666;margin-top:20px;">
            Your full detailed PDF report is attached.
          </p>
        </div>
      `;

      try {
        const sent = await sendEmailHTML({
          to: email,
          subject: `Your Detailed Answer: ${question}`,
          html,
          attachments: [
            {
              filename: "Your_Detailed_Report.pdf",
              buffer: pdfBuffer,
            },
          ],
        });

        if (!sent.success) {
          console.error("❌ Email send failed:", sent);
          return res.status(500).json({ error: "Email send failed" });
        }
      } catch (err) {
        console.error("❌ Resend failure:", err);
        return res.status(500).json({
          error: "Resend email failed",
          detail: err.message,
        });
      }

      // ================================
      // 🔥 DONE
      // ================================
      return res.status(200).json({
        success: true,
        message: "Detailed report emailed successfully",
        answer: shortAnswer,
      });
    });
  } catch (error) {
    console.error("Unhandled detailed-report error:", error);
    return res.status(500).json({
      error: "Server error",
      detail: error.message,
    });
  }
}

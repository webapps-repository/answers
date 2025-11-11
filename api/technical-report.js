// /api/technical-report.js
import OpenAI from "openai";
import { generatePdfBuffer } from "./utils/generatePdf.js";
import { sendEmailWithAttachment } from "./utils/sendEmail.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const { question, email } = req.body;
    if (!question)
      return res.status(400).json({ success: false, error: "Missing question" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert analyst producing concise, factual one-page reports for technical, scientific, environmental, or financial questions. Avoid filler. Keep it professional and data-driven.",
        },
        { role: "user", content: question },
      ],
    });

    const summary = completion.choices[0].message.content.trim();

    const pdfBuffer = await generatePdfBuffer({
      title: "Your Answer",
      subtitle: "Technical Report",
      branding: "Melodies Web",
      answer: summary,
    });

    await sendEmailWithAttachment({
      to: email,
      subject: "Your Answer — Technical Report",
      html: `<div style="font-family:sans-serif;">
              <h2>Your Answer — Technical Report</h2>
              <p>${summary}</p>
              <p><em>Attached is your concise technical report.</em></p>
            </div>`,
      buffer: pdfBuffer,
      filename: "Technical_Report.pdf",
    });

    res.status(200).json({ success: true, answer: summary });
  } catch (err) {
    console.error("❌ Technical report error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

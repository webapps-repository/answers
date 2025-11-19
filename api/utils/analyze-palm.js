// /api/utils/analyze-palm.js
// Advanced palmistry analyzer using GPT-4.1 vision when available.
// Falls back to a generic interpretation if anything fails.

import fs from "fs";
import OpenAI from "openai";

const openai =
  process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function analyzePalmImage(filePath) {
  try {
    // No file → generic palmistry with "no image" note
    if (!filePath || !fs.existsSync(filePath)) {
      return {
        hasImage: false,
        summary:
          "No palm image was provided. General palmistry principles are applied instead.",
        features: {
          heartLine: "Emotional capacity and style are interpreted generically.",
          headLine: "Thinking patterns and decisions are interpreted in a general way.",
          lifeLine: "Vitality and life rhythm are interpreted in a broad, symbolic sense.",
          fateLine: "Life direction and purpose are explored through general patterns.",
          sunLine:
            "Potential for recognition and creative self-expression is interpreted symbolically.",
          marriageLines:
            "Relationship patterns are interpreted via general palmistry principles."
        }
      };
    }

    // If no OpenAI key → fallback with "image received"
    if (!openai) {
      return {
        hasImage: true,
        summary:
          "Palm image was received, but advanced image analysis is not active. General interpretations are used.",
        features: {
          heartLine:
            "Indicates a deep sensitivity and strong emotional capacity in relationships.",
          headLine:
            "Suggests active mental energy, adaptability, and intuitive decision-making.",
          lifeLine:
            "Shows steady resilience, life force, and a capacity to recover from challenges.",
          fateLine:
            "Indicates a growing sense of life direction and evolving purpose.",
          sunLine:
            "Points to creative visibility, recognition potential, or a desire to be seen.",
          marriageLines:
            "Highlights the potential for meaningful bonds and emotional depth in relationships."
        }
      };
    }

    // ---------- GPT-4.1 Vision analysis ----------
    const imageBuffer = fs.readFileSync(filePath);
    const b64 = imageBuffer.toString("base64");

    const prompt = `
You are a professional palmistry reader.

Look at the palm photo and return a STRICT JSON object with this shape:

{
  "summary": "2–4 sentence overview of the palm's overall energy, themes, and life tone.",
  "features": {
    "heartLine": "Short palmistry-style description.",
    "headLine": "Short palmistry-style description.",
    "lifeLine": "Short palmistry-style description.",
    "fateLine": "Short palmistry-style description (or 'not clearly visible').",
    "sunLine": "Short palmistry-style description (or 'not clearly visible').",
    "marriageLines": "Short palmistry-style description."
  }
}

No extra keys, no commentary, no markdown. JSON ONLY.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1", // vision-capable in new API
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${b64}`
              }
            }
          ]
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If model didn't perfectly obey JSON, just wrap raw text
      parsed = {
        summary: raw,
        features: {}
      };
    }

    return {
      hasImage: true,
      summary: parsed.summary || "Palmistry summary unavailable.",
      features: {
        heartLine: parsed.features?.heartLine || "Not clearly interpreted.",
        headLine: parsed.features?.headLine || "Not clearly interpreted.",
        lifeLine: parsed.features?.lifeLine || "Not clearly interpreted.",
        fateLine: parsed.features?.fateLine || "Not clearly interpreted.",
        sunLine: parsed.features?.sunLine || "Not clearly interpreted.",
        marriageLines:
          parsed.features?.marriageLines || "Not clearly interpreted."
      }
    };
  } catch (err) {
    console.error("Palmistry analysis failed:", err);
    return {
      hasImage: !!filePath,
      summary:
        "Palmistry analysis encountered an internal error. General interpretations are used instead.",
      features: {
        heartLine: "Emotional patterns are significant but require reflection.",
        headLine: "Your mental energy is active and adaptable.",
        lifeLine:
          "Life force is resilient, with potential for renewal after challenges.",
        fateLine:
          "Life direction develops over time through key choices and turning points.",
        sunLine:
          "Creative and personal visibility may grow as you step into your purpose.",
        marriageLines:
          "Important relationships and emotional commitments play a meaningful role."
      },
      error: err.message
    };
  }
}

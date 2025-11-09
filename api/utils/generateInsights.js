// /api/utils/generateInsights.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Add this key in your Vercel env vars
});

export async function generateSpiritualInsights({ fullName, birthdate, birthTime, birthPlace }) {
  const prompt = `
You are an expert in astrology, numerology, and palmistry. 
Generate a brief personalized report for the following individual:

Name: ${fullName}
Date of Birth: ${birthdate}
Time of Birth: ${birthTime || "Unknown"}
Place of Birth: ${birthPlace}

Return your answer as a JSON object with three keys:
{
  "astrology": "Astrological insights...",
  "numerology": "Numerological analysis...",
  "palmistry": "Palm reading interpretation..."
}
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0].message.content;
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ OpenAI generation error:", err);
    return {
      astrology: "Could not generate astrology insights.",
      numerology: "Could not generate numerology insights.",
      palmistry: "Could not generate palmistry insights.",
    };
  }
}

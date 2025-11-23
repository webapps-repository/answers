// /lib/insights.js
import { completeJson, completeText } from "./ai.js";

export async function getShortAnswer(question) {
  return await completeText(`
    Provide a helpful, positive, spiritual short answer (2–3 sentences).
    Question: "${question}"
  `);
}

export async function generateFullInsights(data) {
  const { name, dob, gender, country, state, question } = data;

  // Astrology
  const astrology = await completeText(`
    Generate a personalized spiritual astrology reading.
    Include: personality traits, emotional patterns, strength archetypes.
    Person: ${name}, ${dob}, ${gender}, ${country}, ${state}
    Topic: "${question}"
  `);

  // Numerology
  const numerology = await completeText(`
    Generate a numerology reading including life path, destiny, personality number.
    Person: ${name}, DOB: ${dob}
  `);

  // Palmistry (text only)
  const palm = await completeText(`
    Create a palmistry-style personality analysis based on spiritual symbolism.
    Person: ${name}
  `);

  // Combined block for HTML
  return `
    <h3>Astrology Insights</h3>
    <p>${astrology}</p>

    <h3>Numerology Insights</h3>
    <p>${numerology}</p>

    <h3>Palmistry Archetype</h3>
    <p>${palm}</p>

    <h3>Personal Guidance</h3>
    <p>${await completeText(`
      Provide constructive spiritual guidance for the user:
      "${question}"
    `)}</p>
  `;
}

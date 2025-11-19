// /api/utils/synthesize-triad.js
// This file merges astrology + numerology + palmistry + question intent
// into a single unified interpretation for PDFs and on-page display.

export function synthesizeTriad({
  question,
  intent, // “love”, “career”, “spiritual”, “money”, “health”, etc.
  astrology,
  numerology,
  palmistry,
}) {
  const shortAnswer = generateShortAnswer({
    question,
    intent,
    astrology,
    numerology,
    palmistry,
  });

  const astroInterpretation = generateAstrologicalInterpretation({
    question,
    intent,
    astrology,
  });

  const numerologyInterpretation = generateNumerologicalInterpretation({
    question,
    intent,
    numerology,
  });

  const palmInterpretation = generatePalmistryInterpretation({
    question,
    intent,
    palmistry,
  });

  const combined = generateCombinedSynthesis({
    question,
    intent,
    astrology,
    numerology,
    palmistry,
  });

  const timeline = generateTimeline({
    intent,
    astrology,
    numerology,
  });

  const recommendations = generateRecommendations({
    intent,
    astrology,
    numerology,
    palmistry,
  });

  return {
    shortAnswer,
    astroInterpretation,
    numerologyInterpretation,
    palmInterpretation,
    combined,
    timeline,
    recommendations,
  };
}

// ========================================================================
// SUPPORTING GENERATORS
// ========================================================================

function generateShortAnswer({ question, intent }) {
  return `Based on your current energy and overall pattern, the situation around your question — "${question}" — is evolving strongly in the area of ${intent}. You are being guided toward greater clarity and alignment as you move forward.`;
}

function generateAstrologicalInterpretation({ question, intent, astrology }) {
  return `
Your astrological pattern sheds light on your question about ${intent}.
Your key placements suggest how you naturally respond to this situation:

• Sun: ${astrology?.sun || "N/A"}
• Moon: ${astrology?.moon || "N/A"}
• Rising: ${astrology?.rising || "N/A"}

Together these show how your personality, emotional life, and outer presentation all connect to "${question}".
`.trim();
}

function generateNumerologicalInterpretation({ question, intent, numerology }) {
  if (!numerology) {
    return `
Numerology data was not fully provided, so this reading focuses more on your astrology and palmistry patterns.
Even without full numbers, there is still a sense of timing and life themes surrounding your question about ${intent}.
    `.trim();
  }

  return `
Numerologically, your Life Path (${numerology.lifePath}) and current Personal Year (${numerology.personalYear}) are especially important.

• Life Path ${numerology.lifePath}: ${numerology.lifePathMeaning || "Summary unavailable."}
• Personal Year ${numerology.personalYear}: ${
    numerology.personalYearMeaning || "Year meaning unavailable."
  }

These patterns describe the bigger cycle you are in, and how it connects to "${question}" in the area of ${intent}.
`.trim();
}

function generatePalmistryInterpretation({ question, intent, palmistry }) {
  if (!palmistry) {
    return `
No palm image was detected, so this part of the reading uses general palmistry principles only.
Even so, your deeper emotional and life-direction patterns still influence your question about ${intent}.
    `.trim();
  }

  return `
Your palm features add another layer to your situation around ${intent}:

Heart Line: ${palmistry?.features?.heartLine || "Not specified"}
Head Line: ${palmistry?.features?.headLine || "Not specified"}
Life Line: ${palmistry?.features?.lifeLine || "Not specified"}
Fate Line: ${palmistry?.features?.fateLine || "Not specified"}

These reflect how you feel, think, sustain energy, and orient your life path, all of which shape the way you experience "${question}".
`.trim();
}

function generateCombinedSynthesis({ question, intent, astrology, numerology, palmistry }) {
  return `
When we blend these three systems together, the message around "${question}" becomes clearer:

• Astrology shows the energetic and psychological themes you are working through.
• Numerology reveals the timing and life-cycle stage you are in.
• Palmistry reflects your deeper emotional wiring and long-term direction.

Combined, they suggest that your path in the area of ${intent} is moving toward greater awareness and choice.
You are being asked to respond with honesty, self-knowledge, and a willingness to grow.
`.trim();
}

function generateTimeline({ intent, astrology, numerology }) {
  const year = numerology?.personalYear ?? "your current year";
  const range = numerology?.personalMonthRange || "the upcoming months";

  return `
In terms of timing, the strongest movement appears during Personal Year ${year}, especially over ${range}.
Astrologically, supportive transits (such as ${astrology?.transit1 || "a key uplifting aspect"} and ${
    astrology?.transit2 || "a secondary positive influence"
  }) can bring clearer events, decisions, or opportunities.

This doesn’t force an outcome, but it does highlight a window where choices around ${intent} can have extra impact.
`.trim();
}

function generateRecommendations({ intent }) {
  return `
To work constructively with these energies around ${intent}, consider:

1. Getting clear on what you truly want and why.
2. Releasing patterns that no longer fit who you’re becoming.
3. Taking one grounded, practical step that reflects your intention.
4. Giving yourself time to integrate emotional shifts as they arise.
5. Trusting that you are allowed to move toward situations that feel aligned, honest, and alive for you.

Use this reading as a mirror rather than a rigid prediction; your free will is always the most important factor.
`.trim();
}

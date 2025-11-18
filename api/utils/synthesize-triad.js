// /api/utils/synthesize-triad.js
// Deterministic text combiner for astrology + numerology + palmistry

export function synthesizeTriad({
  question,
  intent,
  astrology,
  numerology,
  palmistry
}) {
  const shortAnswer = generateShortAnswer({
    question,
    intent,
    astrology,
    numerology,
    palmistry
  });

  const astroInterpretation = generateAstrologicalInterpretation({
    question,
    intent,
    astrology
  });

  const numerologyInterpretation = generateNumerologicalInterpretation({
    question,
    intent,
    numerology
  });

  const palmInterpretation = generatePalmistryInterpretation({
    question,
    intent,
    palmistry
  });

  const combined = generateCombinedSynthesis({
    question,
    intent,
    astrology,
    numerology,
    palmistry
  });

  const timeline = generateTimeline({ intent, astrology, numerology });

  const recommendations = generateRecommendations({
    intent,
    astrology,
    numerology,
    palmistry
  });

  return {
    shortAnswer,
    astroInterpretation,
    numerologyInterpretation,
    palmInterpretation,
    combined,
    timeline,
    recommendations
  };
}

function generateShortAnswer({ question, intent }) {
  return `Based on your spiritual profile, the energy around your question — "${question}" — is actively working through themes of ${intent || "your overall life direction"}. There is movement, learning, and an invitation to make conscious choices rather than leaving things to chance.`;
}

function generateAstrologicalInterpretation({ question, intent, astrology }) {
  return `
Your astrological pattern sheds light on your concern about ${intent || "this area of life"}.
Core placements suggest how you naturally respond here:

• Sun: ${astrology?.sun || "N/A"}
• Moon: ${astrology?.moon || "N/A"}
• Rising: ${astrology?.rising || "N/A"}

These signatures describe your core identity, emotional needs, and outer style – all of which frame how you approach the question: "${question}".`;
}

function generateNumerologicalInterpretation({ numerology, intent, question }) {
  return `
Numerology emphasises the cycle you are in and the deeper tone behind events.

• Life Path ${numerology?.lifePath ?? "?"}: ${numerology?.lifePathMeaning || "Life path summary unavailable."}
• Personal Year ${numerology?.personalYear ?? "?"}: ${numerology?.personalYearMeaning || "Personal year meaning unavailable."}

These numbers colour the way you experience ${intent || "this situation"} and how you are meant to grow through the question "${question}".`;
}

function generatePalmistryInterpretation({ palmistry, intent, question }) {
  return `
Your palm reflects long-term patterns of energy and response.

Heart Line: ${palmistry?.features?.heartLine || "Unknown"}
Head Line: ${palmistry?.features?.headLine || "Unknown"}
Life Line: ${palmistry?.features?.lifeLine || "Unknown"}
Fate Line: ${palmistry?.features?.fateLine || "Unknown"}

Taken together, these suggest how you emotionally process and act within matters related to ${intent || "this question"}: "${question}".`;
}

function generateCombinedSynthesis({ question, intent }) {
  return `
When astrology, numerology, and palmistry are read together, they paint a single message:
you are not stuck – you are in a learning window around ${intent || "this theme"}. The more
you respond with awareness rather than fear, the more supportive the outcomes around
"${question}" become.`;
}

function generateTimeline({ numerology, astrology, intent }) {
  return `
Timing highlights are linked to your current Personal Year ${
    numerology?.personalYear ?? "?"
  } and the upcoming months ${
    numerology?.personalMonthRange || "N/A"
  }. Astrological transits such as
${astrology?.transit1 || "supportive aspects to your Sun or Ascendant"} and ${
    astrology?.transit2 || "harmonious Venus/Jupiter activity"
  }
indicate windows of easier progress in matters of ${intent || "this focus area"}.`;
}

function generateRecommendations({ intent }) {
  return `
Practical guidance:

1. Clarify what you actually want in this area of ${intent || "life"}.
2. Make one concrete decision or small experiment in the next 7 days.
3. Work with supportive routines (sleep, movement, journaling) to keep your nervous system steady.
4. Treat the signals you receive – synchronicities, intuitive nudges, emotional reactions – as information, not verdicts.
`;
}

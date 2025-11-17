// /api/utils/synthesize-triad.js

export function synthesizeTriad({
  question,
  intent,
  astrology,
  numerology,
  palmistry,
}) {

  const shortAnswer = `Here is your clear answer regarding ${intent}: Based on your combined astrology, palmistry, and numerology profile, the energy surrounding "${question}" shows movement toward clarity, resolution, and meaningful development in this area.`;

  const astroInterpretation = `
Your astrological placements (Sun: ${astrology?.sun}, Moon: ${astrology?.moon}, Rising: ${astrology?.rising}) shape the emotional and energetic backdrop of your question about ${intent}.
`;

  const numerologyInterpretation = `
Your Life Path (${numerology?.lifePath}) and Personal Year (${numerology?.personalYear}) show timing patterns that influence how your question unfolds.
`;

  const palmInterpretation = `
Palm features such as your heart, head, life, and fate lines add subconscious and intuitive insight into your question about ${intent}.
`;

  const combined = `
Combining astrology, numerology, and palmistry reveals that the question "${question}" is influenced by aligned cycles of timing, emotional clarity, and intuitive guidance.
`;

  const timeline = `
Most progress occurs during Personal Year ${numerology?.personalYear}, especially in months ${numerology?.personalMonthRange}.
`;

  const recommendations = `
Stay aligned with your Sun & Rising strengths, follow intuitive insights shown in your palm lines, and act during supportive numerology cycles.
`;

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

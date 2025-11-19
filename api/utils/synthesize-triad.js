// /api/utils/synthesize-triad.js

export function synthesizeTriad({
  question,
  intent,
  astrology,
  numerology,
  palmistry
}) {
  const shortAnswer = `
Your question: "${question}"

Based on astrology, numerology, and palm features associated with the theme of ${intent}, 
the energetic pattern suggests emerging clarity and forward movement. The combination of 
astrological timing, numerology cycles, and palmistry indicators supports a meaningful 
shift connected to your question.
  `.trim();

  const astroInterpretation = `
Astrologically, your Sun, Moon, and Rising signs shape your emotional patterns and motivations.
• Sun: ${astrology?.sun}
• Moon: ${astrology?.moon}
• Rising: ${astrology?.rising}

Transits:
• ${astrology?.transit1}
• ${astrology?.transit2}
  `;

  const numerologyInterpretation = `
Numerology insights:
• Life Path ${numerology?.lifePath}: ${numerology?.lifePathMeaning}
• Personal Year ${numerology?.personalYear}: ${numerology?.personalYearMeaning}
  `;

  const palmInterpretation = `
Palmistry insights:
• Heart Line: ${palmistry?.features?.heartLine}
• Head Line: ${palmistry?.features?.headLine}
• Life Line: ${palmistry?.features?.lifeLine}
• Fate Line: ${palmistry?.features?.fateLine}
  `;

  const combined = `
When synthesizing all three systems, your question "${question}" aligns with the theme of ${intent}.
Your chart, numbers, and palm patterns point toward a period of development, clarity, and emotional alignment.
  `;

  const timeline = `
Astrology timing + numerology cycles indicate strongest movement in:
• Personal Year ${numerology?.personalYear}
• Months ${numerology?.personalMonthRange}
  `;

  const recommendations = `
Recommendations:
1. Trust your intuitive guidance.
2. Reflect during supportive planetary transits.
3. Align decisions with your numerology cycle.
4. Use palmistry insights to guide emotional responses.
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

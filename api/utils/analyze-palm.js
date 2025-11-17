// /api/utils/analyze-palm.js
import fs from "fs";

export async function analyzePalmImage(path) {
  try {
    if (!path || !fs.existsSync(path)) {
      return {
        hasImage: false,
        summary: "No palm image uploaded.",
        features: {
          heartLine: "Unknown",
          headLine: "Unknown",
          lifeLine: "Unknown",
          fateLine: "Unknown"
        }
      };
    }

    return {
      hasImage: true,
      summary: "Palm received — using general interpretation.",
      features: {
        heartLine: "Emotional depth and sensitivity.",
        headLine: "Strong reasoning and intuition.",
        lifeLine: "Vitality and grounded energy.",
        fateLine: "Long-term purpose becoming clearer."
      }
    };

  } catch (err) {
    return {
      hasImage: false,
      summary: "Palm analysis failed.",
      features: {},
      error: err.message
    };
  }
}

// /lib/engines.js
// -------------------------------------------------------
// UNIFIED ENGINE MODULE (ASTROLOGY • NUMEROLOGY • PALMISTRY)
// -------------------------------------------------------

import fs from "fs";
import { askGPT, askGPTVision } from "./ai.js";

// ======================================================================
// 1) ASTROLOGY ENGINE (AstrologyAPI Basic plan)
// ======================================================================

// Basic-plan endpoints available:
const ASTRO_ENDPOINT_NATAL = "https://json.astrologyapi.com/v1/natal_wheel_chart/";
const ASTRO_ENDPOINT_POSITIONS = "https://json.astrologyapi.com/v1/planets/";
const ASTRO_ENDPOINT_ASPECTS = "https://json.astrologyapi.com/v1/aspects/";

const ASTRO_UID = process.env.ASTRO_USER_ID;
const ASTRO_KEY = process.env.ASTRO_API_KEY;

// ----------------------------------------------
// Built-in fallback chart (used when API fails)
// ----------------------------------------------
const fallbackChart = {
  sun: { sign: "Aries", degree: 13 },
  moon: { sign: "Leo", degree: 21 },
  ascendant: { sign: "Sagittarius", degree: 3 },
  planets: {
    mercury: { sign: "Aries", degree: 2 },
    venus: { sign: "Pisces", degree: 28 },
    mars: { sign: "Gemini", degree: 7 },
    jupiter: { sign: "Leo", degree: 10 },
    saturn: { sign: "Cancer", degree: 5 },
    uranus: { sign: "Aquarius", degree: 11 },
    neptune: { sign: "Capricorn", degree: 18 },
    pluto: { sign: "Sagittarius", degree: 9 },
    node: { sign: "Libra", degree: 0 }
  },
  houses: [
    "Sagittarius","Capricorn","Aquarius","Pisces","Aries","Taurus",
    "Gemini","Cancer","Leo","Virgo","Libra","Scorpio"
  ],
  aspects: [
    { aspect: "Sun trine Jupiter" },
    { aspect: "Moon conjunct Venus" }
  ]
};

// ----------------------------------------------
// Fetch AstrologyAPI securely
// ----------------------------------------------
async function astrologyAPI(endpoint, payload) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${ASTRO_UID}:${ASTRO_KEY}`).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("AstrologyAPI error status:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("AstrologyAPI error:", err);
    return null;
  }
}

// ----------------------------------------------
// Main Astrology Function
// ----------------------------------------------
export async function getAstrologyData({
  birthDate,
  birthTime,
  birthPlace,
  lat,
  lon,
  tz
}) {
  if (!birthDate || !lat || !lon || !tz) return { ...fallbackChart, source: "fallback" };

  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime ? birthTime.split(":").map(Number) : [12, 0];

  const payload = {
    day,
    month,
    year,
    hour,
    min: minute,
    lat,
    lon,
    tzone: tz
  };

  // 1) Planet positions
  const positions = await astrologyAPI(ASTRO_ENDPOINT_POSITIONS, payload);

  // 2) Aspects
  const aspects = await astrologyAPI(ASTRO_ENDPOINT_ASPECTS, payload);

  // If API fails → fallback
  if (!positions) return { ...fallbackChart, source: "fallback" };

  return {
    source: "astrologyapi",
    sun: positions.sun,
    moon: positions.moon,
    ascendant: positions.ascendant,
    planets: positions,
    aspects: aspects?.aspects || fallbackChart.aspects,
    houses: positions.houses || fallbackChart.houses
  };
}

// ======================================================================
// 2) NUMEROLOGY ENGINE — Pythagorean Suite (Full)
// ======================================================================

function reduceNum(n) {
  while (n > 9 && ![11, 22, 33].includes(n)) {
    n = n
      .toString()
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

// ----------------------------------------------
// Life Path (DOB → digits)
// ----------------------------------------------
export function getLifePath(date) {
  if (!date) return null;
  const digits = date.replace(/\D/g, "").split("").map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceNum(sum);
}

// ----------------------------------------------
// Destiny, Soul Urge, Personality numbers (Name→letters)
// ----------------------------------------------
const vowels = ["A","E","I","O","U"];

function letterValue(letter) {
  const n = letter.toUpperCase().charCodeAt(0) - 64;
  return n >= 1 && n <= 26 ? ((n - 1) % 9) + 1 : 0;
}

export function getNumerologyProfile(fullName, birthDate) {
  if (!fullName) return null;

  const chars = fullName.toUpperCase().replace(/[^A-Z]/g, "").split("");

  const vowelSum = chars
    .filter(c => vowels.includes(c))
    .reduce((a, c) => a + letterValue(c), 0);

  const consonantSum = chars
    .filter(c => !vowels.includes(c))
    .reduce((a, c) => a + letterValue(c), 0);

  return {
    lifePath: getLifePath(birthDate),
    destiny: reduceNum(chars.reduce((a, c) => a + letterValue(c), 0)),
    soulUrge: reduceNum(vowelSum),
    personality: reduceNum(consonantSum),
    maturity: reduceNum(
      reduceNum(chars.reduce((a, c) => a + letterValue(c), 0)) +
      reduceNum(getLifePath(birthDate))
    ),
    raw: { vowelSum, consonantSum }
  };
}

// ======================================================================
// 3) PALMISTRY ENGINE — GPT-4.1 VISION
// ======================================================================

export async function analyzePalm(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return {
      ok: true,
      hasImage: false,
      summary: "Palm image not provided. Using general palmistry principles.",
      features: {
        lifeLine: "Unknown",
        heartLine: "Unknown",
        headLine: "Unknown",
        fateLine: "Unknown",
        specialMarks: []
      }
    };
  }

  const result = await askGPTVision({
    question: `
You are an expert palm reader. 
Analyze the uploaded palm image and produce:

- Summary of personality
- Life line interpretation
- Head line interpretation
- Heart line interpretation
- Fate line interpretation
- Markings: stars, crosses, islands, chains, forks
- Any unique observations
`,
    imagePath
  });

  if (!result.ok) {
    console.error("Palmistry Vision Error:", result.error);
    return {
      ok: true,
      hasImage: true,
      summary: "Could not analyze image; using general interpretations.",
      features: {}
    };
  }

  return {
    ok: true,
    hasImage: true,
    summary: result.text,
    features: { raw: result.text }
  };
}


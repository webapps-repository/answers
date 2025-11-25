// /api/system-test.js
//
// https://answers-rust.vercel.app/api/system-test.js
// https://answers-rust.vercel.app/api/system-test.js?token=TEST
// https://answers-rust.vercel.app/api/system-test.js?token=YOUR_TOKEN
// https://answers-rust.vercel.app/api/system-test.js?token=TEST123

// /api/system-test.js — ENV KEY SAFE VALUE MODE
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import formidable from "formidable";

/* ---------------------------------------------------------
   SAFE VALUE HIDING RULES
--------------------------------------------------------- */
const SENSITIVE_SUBSTRINGS = [
  "SECRET",
  "KEY",
  "PASSWORD",
  "TOKEN",
  "API",
  "PRIVATE",
  "AUTH",
  "RECAPTCHA",
  "RESEND",
  "OPENAI"
];

// mark a key as sensitive if it contains any of these patterns
function isSensitiveKey(keyName) {
  const upper = keyName.toUpperCase();
  return SENSITIVE_SUBSTRINGS.some(str => upper.includes(str));
}

// whitelist of keys YOU created for this application
const USER_DEFINED_KEYS = [
  "RECAPTCHA_SECRET_KEY",
  "RECAPTCHA_TOGGLE",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",

  // add future keys here:
  // "APP_VERSION",
  // "SERVICE_MODE"
];

/* ---------------------------------------------------------
   SYSTEM TEST ENDPOINT
--------------------------------------------------------- */
export default async function handler(req, res) {
  const start = Date.now();
  const method = req.method;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  if (method === "OPTIONS")
    return res.status(200).json({ ok: true });

  /* ---------------------------------------------------------
     ENVIRONMENT VARIABLE ANALYSIS
  --------------------------------------------------------- */

  const envKeys = {};
  const missing = [];

  for (const keyName of USER_DEFINED_KEYS) {
    if (process.env[keyName] === undefined) {
      envKeys[keyName] = null;
      missing.push(keyName);
    } else {
      envKeys[keyName] = isSensitiveKey(keyName)
        ? "*** hidden ***"
        : process.env[keyName];
    }
  }

  /* ---------------------------------------------------------
     RESPONSE
  --------------------------------------------------------- */
  return res.json({
    ok: true,
    time_ms: Date.now() - start,
    env: {
      userDefinedKeys: USER_DEFINED_KEYS,
      values: envKeys,
      missing
    }
  });
}

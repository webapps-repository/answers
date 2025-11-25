// /api/system-test.js
//
// https://answers-rust.vercel.app/api/system-test.js
// https://answers-rust.vercel.app/api/system-test.js?token=TEST
// https://answers-rust.vercel.app/api/system-test.js?token=YOUR_TOKEN

// /api/system-test.js
export const runtime = "nodejs";

import { verifyRecaptcha } from "../lib/utils.js";

export default async function handler(req, res) {
  const token =
    req.query.token ||
    req.body?.token ||
    req.query?.recaptchaToken ||
    req.body?.recaptchaToken ||
    null;

  // ENV checks
  const ENV = {
    RECAPTCHA_SECRET_PRESENT: !!process.env.RECAPTCHA_SECRET_KEY,
    RESEND_API_KEY_PRESENT: !!process.env.RESEND_API_KEY,
    OPENAI_API_KEY_PRESENT: !!process.env.OPENAI_API_KEY
  };

  // ⬇ Recaptcha diagnostic structure
  const RECAPTCHA = {
    TOKEN_RECEIVED: token,
    RAW: null,
    OK: false,
    ERROR_CODES: [],
    IP_USED: null
  };

  // If no token supplied — return instructions
  if (!token) {
    return res.json({
      ok: true,
      message: "Append ?token=YOUR_RECAPTCHA_TOKEN to this URL",
      example:
        "https://answers-rust.vercel.app/api/system-test.js?token=PASTE_HERE",

      tests: {
        TOKEN_PRESENT: false,
        ENV
      }
    });
  }

  // Determine IP — Vercel correct logic
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress;
  RECAPTCHA.IP_USED = ip;

  // 🔥 Perform reCAPTCHA validation
  try {
    const result = await verifyRecaptcha(token, ip);

    RECAPTCHA.RAW = result.raw || result;
    RECAPTCHA.OK = !!result.ok;

    if (result?.raw?.["error-codes"]) {
      RECAPTCHA.ERROR_CODES = result.raw["error-codes"];
    }

  } catch (err) {
    RECAPTCHA.RAW = { error: String(err) };
  }

  // Final output
  return res.json({
    ok: true,
    tests: {
      TOKEN_PRESENT: true,
      RECAPTCHA,
      ENV
    }
  });
}

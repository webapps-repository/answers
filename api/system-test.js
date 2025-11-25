// /api/system-test.js
//
// https://answers-rust.vercel.app/api/system-test.js
// https://answers-rust.vercel.app/api/system-test.js?token=TEST

// /api/system-test.js
export const runtime = "nodejs";

import { verifyRecaptcha } from "../lib/utils.js";

export default async function handler(req, res) {
  const token = req.query.token || req.body?.token;

  // Check env
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const ENV = {
    RECAPTCHA_SECRET_PRESENT: !!secret,
    RESEND_API_KEY_PRESENT: !!process.env.RESEND_API_KEY,
    OPENAI_API_KEY_PRESENT: !!process.env.OPENAI_API_KEY
  };

  let RECAPTCHA = {
    TOKEN_RECEIVED: token || null,
    RAW: null,
    OK: false,
    ERROR_CODES: []
  };

  if (!token) {
    return res.json({
      ok: true,
      tests: {
        INFO: "Add ?token=YOUR_RECAPTCHA_TOKEN to test",
        ENV
      }
    });
  }

  // Run recaptcha check
  try {
    const result = await verifyRecaptcha(token, "1.2.3.4");

    RECAPTCHA.RAW = result.raw || result;
    RECAPTCHA.OK = !!result.ok;

    if (result.raw && result.raw["error-codes"]) {
      RECAPTCHA.ERROR_CODES = result.raw["error-codes"];
    }

  } catch (err) {
    RECAPTCHA.RAW = { error: String(err) };
  }

  return res.json({
    ok: true,
    tests: {
      RECAPTCHA,
      ENV
    }
  });
}

// /api/utils/verify-recaptcha.js
// reCAPTCHA v2 Checkbox verification (server-side)
// Works on Node 18–22 and Vercel Edge/Serverless

export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      error: "Missing RECAPTCHA_SECRET_KEY env variable",
    };
  }

  if (!token || typeof token !== "string") {
    return {
      ok: false,
      error: "Missing or invalid token",
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const json = await verifyRes.json();

    if (!json.success) {
      return {
        ok: false,
        error: "reCAPTCHA rejected",
        details: json,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: "reCAPTCHA request failed",
      details: String(err),
    };
  }
}

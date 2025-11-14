// /api/utils/verify-recaptcha.js
// reCAPTCHA v2 Checkbox verification

export async function verifyRecaptcha(token) {
  if (!token) return { ok:false, error:"Missing token" };

  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY || "";
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token
      })
    });

    const json = await res.json();
    return json.success ? { ok:true } : { ok:false, details:json };

  } catch (e) {
    return { ok:false, error:"Network error", detail:e.message };
  }
}

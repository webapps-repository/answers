// /api/utils/verify-recaptcha.js
// Google reCAPTCHA v2 Checkbox verification (explicit render)
// Fully instrumented — logs all Google responses & identifies cause of 403 failures.

export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;

  if (!secret) {
    console.error("❌ RECAPTCHA_SECRET is missing in environment variables.");
    return {
      ok: false,
      reason: "missing-secret",
      detail: "Backend missing RECAPTCHA_SECRET",
    };
  }

  if (!token) {
    console.error("❌ Missing reCAPTCHA token from client.");
    return {
      ok: false,
      reason: "missing-token",
      detail: "Frontend did not send g-recaptcha-response",
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    // HIT GOOGLE VERIFY ENDPOINT
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await res.json();

    // 🔎 DETAILED LOGGING
    console.log("🔍 reCAPTCHA VERIFY RESPONSE:", JSON.stringify(data, null, 2));

    // ====== HANDLE ALL FAILURE STATES ======
    if (!data.success) {
      const errors = data["error-codes"] || [];

      // Known failure translations
      const reasons = {
        "missing-input-secret": "Backend secret key is missing or invalid",
        "invalid-input-secret": "Backend secret key does NOT match your sitekey project",
        "missing-input-response": "Token missing",
        "invalid-input-response": "Token invalid or malformed",
        "timeout-or-duplicate": "Token expired or already used once",
        "bad-request": "Malformed verification request",
      };

      let bestReason = errors[0] || "unknown-error";

      console.error("❌ reCAPTCHA FAILED:", errors);

      return {
        ok: false,
        reason: bestReason,
        reasonText: reasons[bestReason] || "Unknown error",
        detail: data,
      };
    }

    // ====== SUCCESS ======
    console.log("✅ reCAPTCHA validated successfully.");
    return {
      ok: true,
      detail: data,
    };
  } catch (err) {
    // NETWORK OR INTERNAL FAILURE
    console.error("❌ reCAPTCHA verification exception:", err);
    return {
      ok: false,
      reason: "exception",
      detail: err?.message || String(err),
    };
  }
}

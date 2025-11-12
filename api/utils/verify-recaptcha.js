// Verify reCAPTCHA v2
export async function verifyRecaptcha(token) {
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.error("Recaptcha error:", err);
    return false;
  }
}

export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;

  if (!secret) {
    return { ok: false, error: "Missing RECAPTCHA_SECRET" };
  }

  try {
    const res = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secret}&response=${token}`,
      }
    );

    const json = await res.json();
    return json.success
      ? { ok: true }
      : { ok: false, error: "Not verified", details: json };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

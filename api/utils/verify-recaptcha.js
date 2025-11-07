// verify-recaptcha.js
export async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!token || !secret) {
    return { success: false, error: 'Missing token or secret key' };
  }

  const params = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIp || '',
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();
  return data;
}


import { Resend } from "resend";

export async function sendEmailHTML({ to, subject, html, attachments = [] }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!key || !from) throw new Error("Resend not configured (RESEND_API_KEY / FROM_EMAIL).");

  const resend = new Resend(key);
  const r = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments: attachments.length ? attachments.map(a => ({
      filename: a.filename,
      content: a.buffer.toString("base64"),
    })) : undefined,
  });
  if (r.error) throw new Error(`Resend error: ${r.error.message || "unknown"}`);
  return r;
}

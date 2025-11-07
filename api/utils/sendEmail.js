// sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailWithAttachment({ to, subject, html, buffer, filename }) {
  const emailSender = process.env.EMAIL_SENDER;
  const attachments = buffer && filename ? [
    {
      filename,
      content: buffer.toString("base64"),
      type: "application/pdf",
      disposition: "attachment",
    },
  ] : [];

  await resend.emails.send({
    from: emailSender,
    to,
    subject,
    html,
    attachments,
  });
}

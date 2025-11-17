// /api/utils/send-email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailHTML({ to, subject, html, attachments = [] }) {
  try {
    const formattedAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString("base64"),
      encoding: "base64"
    }));

    const r = await resend.emails.send({
      from: "Melodies Web <noreply@hazcam.io>",
      to,
      subject,
      html,
      attachments: formattedAttachments
    });

    return { success: true, id: r.id };
  } catch (err) {
    console.error("EMAIL SEND FAILED:", err);
    return {
      success: false,
      error: err.message ?? "unknown"
    };
  }
}

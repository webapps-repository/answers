// /api/utils/email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmailHTML
 * -----------------------------------------------------
 * Safe wrapper around Resend's email API.
 * Always returns:
 * { success:true, id } OR { success:false, error }
 */
export async function sendEmailHTML({
  to,
  subject,
  html,
  attachments = []
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ Missing RESEND_API_KEY");
      return { success: false, error: "Missing API key" };
    }

    const formattedAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString("base64"),
      encoding: "base64"
    }));

    const res = await resend.emails.send({
      from: "Melodies Web <noreply@hazcam.io>",
      to,
      subject,
      html,
      attachments: formattedAttachments
    });

    return { success: true, id: res.id || null };
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return {
      success: false,
      error: err.message || "unexpected-mail-error"
    };
  }
}

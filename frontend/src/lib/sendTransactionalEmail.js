/**
 * Resend (preferred on Vercel) or Gmail SMTP fallback for help-desk / portal emails.
 */

export function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isValidEmail(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * @returns {Promise<{ success: boolean, channel?: string, error?: string, skipped?: boolean }>}
 */
export async function sendTransactionalEmail({ to, subject, html, text }) {
  const recipient = String(to || "").trim();
  if (!isValidEmail(recipient)) {
    return { success: false, error: "Invalid recipient email" };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM || "BrgyDesk <noreply@brgydesk.app>";
  const plainText =
    text ||
    String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: recipient,
        subject,
        html,
        text: plainText,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || "Failed to send email via Resend",
      };
    }
    return { success: true, channel: "resend" };
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = (await import("nodemailer")).default;
    const pass = String(process.env.SMTP_PASS).replace(/\s+/g, "");
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass },
    });
    await transport.sendMail({
      from: `"Barangay Help Desk" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject,
      html,
      text: plainText,
    });
    return { success: true, channel: "smtp" };
  }

  return { success: false, skipped: true, error: "No email provider configured" };
}

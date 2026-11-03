/**
 * Gmail SMTP for help-desk / portal transactional email.
 * All notification types share this sender and the same Gmail daily quota.
 */

/** Pause further SMTP attempts after Gmail returns 550 5.4.5. */
let smtpQuotaBlockedUntil = 0;

const QUOTA_MESSAGE =
  "Gmail daily sending limit exceeded for the SMTP account. Email notifications resume after Google resets the limit (usually within 24 hours).";

function isQuotaError(error) {
  const text = `${error?.message || ""} ${error?.response || ""}`;
  return (
    Number(error?.responseCode) === 550 &&
    /5\.4\.5|sending limit exceeded|daily user sending/i.test(text)
  );
}

export function getSmtpQuotaStatus() {
  if (Date.now() < smtpQuotaBlockedUntil) {
    return { blocked: true, error: QUOTA_MESSAGE, code: "SMTP_QUOTA" };
  }
  return { blocked: false };
}

function markQuotaBlocked() {
  if (Date.now() >= smtpQuotaBlockedUntil) {
    console.error(
      "[smtp] Gmail daily sending limit exceeded. Further email sends are paused for 1 hour. Google resets this on a rolling 24-hour window for SMTP_USER.",
    );
  }
  smtpQuotaBlockedUntil = Date.now() + 60 * 60 * 1000;
}

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
 * @returns {Promise<{ success: boolean, channel?: string, error?: string, skipped?: boolean, messageId?: string, from?: string, to?: string }>}
 */
export async function sendTransactionalEmail({ to, subject, html, text }) {
  const recipient = String(to || "").trim();
  if (!isValidEmail(recipient)) {
    return { success: false, error: "Invalid recipient email" };
  }

  const plainText =
    text ||
    String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
      success: false,
      skipped: true,
      error: "SMTP_USER and SMTP_PASS are not configured",
    };
  }

  const quota = getSmtpQuotaStatus();
  if (quota.blocked) {
    return { success: false, error: quota.error, code: quota.code };
  }

  const nodemailer = (await import("nodemailer")).default;
  const pass = String(process.env.SMTP_PASS).replace(/\s+/g, "");
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass },
  });
  const fromAddress = process.env.SMTP_USER;
  try {
    const info = await transport.sendMail({
      from: `"Barangay Iba O' Este" <${fromAddress}>`,
      replyTo: fromAddress,
      to: recipient,
      subject,
      html,
      text: plainText,
    });
    const rejected = info.rejected || [];
    if (rejected.length > 0) {
      return {
        success: false,
        channel: "smtp",
        error: `SMTP rejected: ${rejected.join(", ")}`,
      };
    }
    return {
      success: true,
      channel: "smtp",
      messageId: info.messageId,
      from: fromAddress,
      to: recipient,
    };
  } catch (error) {
    if (isQuotaError(error)) {
      markQuotaBlocked();
      return { success: false, error: QUOTA_MESSAGE, code: "SMTP_QUOTA" };
    }
    console.error("[smtp] send failed:", error.message || error);
    return {
      success: false,
      error: error.message || "SMTP send failed",
      code: "SMTP_ERROR",
    };
  }
}

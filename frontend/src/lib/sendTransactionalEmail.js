/**
 * Multi-tenant transactional email sender for help-desk / portal notifications.
 *
 * Provider is chosen by environment variables (first match wins):
 *   1. RESEND_API_KEY  -> Resend HTTP API   (https://resend.com)
 *   2. BREVO_API_KEY   -> Brevo HTTP API    (https://brevo.com)
 *
 * Tenant-aware sender identity:
 *   - For tenant "ibaoeste":
 *       Portal domain: ibaoeste.brgydesk.com (https://ibaoeste.brgydesk.com)
 *       Primary From:  notifications@ibaoeste.brgydesk.com (when ibaoeste.brgydesk.com is verified in Resend)
 *       Fallback From: ibaoeste@brgydesk.com (when root brgydesk.com is verified in Resend)
 *   - Can be overridden per tenant via EMAIL_FROM_<TENANT>, EMAIL_FROM_NAME_<TENANT>, EMAIL_REPLY_TO_<TENANT>
 *     or globally via EMAIL_FROM, EMAIL_FROM_NAME, EMAIL_REPLY_TO.
 */
import crypto from "crypto";

const TENANT_EMAIL_PROFILES = {
  ibaoeste: {
    tenantId: "ibaoeste",
    fromName: "Barangay Iba O' Este",
    locationName: "Barangay Iba O' Este, Calumpit, Bulacan",
    portalDomain: "ibaoeste.brgydesk.com",
    portalUrl: "https://ibaoeste.brgydesk.com",
    fromEmail: "notifications@ibaoeste.brgydesk.com",
    fallbackFromEmail: "ibaoeste@brgydesk.com",
    replyTo: "ibaoeste.portal@gmail.com",
  },
  demo: {
    tenantId: "demo",
    fromName: "BrgyDesk Demo Barangay",
    locationName: "BrgyDesk Demo Portal",
    portalDomain: "demo.brgydesk.com",
    portalUrl: "https://demo.brgydesk.com",
    fromEmail: "notifications@demo.brgydesk.com",
    fallbackFromEmail: "demo@brgydesk.com",
    replyTo: "support@brgydesk.com",
  },
};

function toTitleCase(str) {
  return String(str || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve tenant-specific email sender profile and portal domain.
 */
export function getTenantEmailProfile(tenantId = "ibaoeste") {
  const cleanTenant =
    String(tenantId || process.env.NEXT_PUBLIC_TENANT_ID || "ibaoeste")
      .trim()
      .toLowerCase() || "ibaoeste";
  const envSuffix = cleanTenant.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const preset = TENANT_EMAIL_PROFILES[cleanTenant];

  const portalDomain =
    process.env[`EMAIL_DOMAIN_${envSuffix}`] ||
    preset?.portalDomain ||
    `${cleanTenant}.brgydesk.com`;

  const portalUrl = `https://${portalDomain}`;

  const fromName = String(
    process.env[`EMAIL_FROM_NAME_${envSuffix}`] ||
      preset?.fromName ||
      process.env.EMAIL_FROM_NAME ||
      `Barangay ${toTitleCase(cleanTenant)}`,
  ).trim();

  const locationName = String(
    process.env[`EMAIL_LOCATION_${envSuffix}`] ||
      preset?.locationName ||
      fromName,
  ).trim();

  const fromEmail = String(
    process.env[`EMAIL_FROM_${envSuffix}`] ||
      process.env.EMAIL_FROM ||
      preset?.fromEmail ||
      `notifications@${portalDomain}`,
  ).trim();

  const fallbackFromEmail = String(
    preset?.fallbackFromEmail || `${cleanTenant}@brgydesk.com`,
  ).trim();

  const replyTo = String(
    process.env[`EMAIL_REPLY_TO_${envSuffix}`] ||
      preset?.replyTo ||
      process.env.EMAIL_REPLY_TO ||
      process.env.SMTP_USER ||
      fromEmail,
  ).trim();

  return {
    tenantId: cleanTenant,
    fromName,
    locationName,
    portalDomain,
    portalUrl,
    fromEmail,
    fallbackFromEmail,
    replyTo,
  };
}

export function getSmtpQuotaStatus() {
  return { blocked: false };
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

export function getEmailProvider() {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.BREVO_API_KEY) return "brevo";
  return null;
}

async function sendViaResend({
  recipient,
  subject,
  html,
  plainText,
  entityRefId,
  tenantId,
}) {
  const profile = getTenantEmailProfile(tenantId);
  const apiKey =
    process.env[`RESEND_API_KEY_${profile.tenantId.toUpperCase()}`] ||
    process.env.RESEND_API_KEY;

  const attemptSend = async (senderEmail) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${profile.fromName} <${senderEmail}>`,
        to: [recipient],
        reply_to: profile.replyTo || undefined,
        subject,
        html,
        text: plainText,
        headers: {
          "X-Entity-Ref-ID": entityRefId,
          "X-Tenant-ID": profile.tenantId,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data, senderEmail };
  };

  let { res, data, senderEmail } = await attemptSend(profile.fromEmail);

  // If subdomain (e.g. notifications@ibaoeste.brgydesk.com) is not separately verified on Resend
  // because only root brgydesk.com is verified, automatically retry with <tenant>@brgydesk.com.
  if (
    !res.ok &&
    profile.fallbackFromEmail &&
    profile.fallbackFromEmail !== profile.fromEmail &&
    /domain is not verified|not verified/i.test(data?.message || "")
  ) {
    console.warn(
      `[resend:${profile.tenantId}] ${profile.fromEmail} domain not verified yet; falling back to ${profile.fallbackFromEmail}`,
    );
    ({ res, data, senderEmail } = await attemptSend(profile.fallbackFromEmail));
  }

  if (!res.ok) {
    console.error(
      `[resend:${profile.tenantId}] send failed:`,
      res.status,
      data?.message || data,
    );
    return {
      success: false,
      channel: "resend",
      error: data?.message || `Resend error ${res.status}`,
      code: "RESEND_ERROR",
    };
  }
  return {
    success: true,
    channel: "resend",
    messageId: data?.id,
    from: senderEmail,
    to: recipient,
    tenantId: profile.tenantId,
  };
}

async function sendViaBrevo({
  recipient,
  subject,
  html,
  plainText,
  entityRefId,
  tenantId,
}) {
  const profile = getTenantEmailProfile(tenantId);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: profile.fromName, email: profile.fromEmail },
      to: [{ email: recipient }],
      replyTo: profile.replyTo ? { email: profile.replyTo } : undefined,
      subject,
      htmlContent: html,
      textContent: plainText,
      headers: {
        "X-Entity-Ref-ID": entityRefId,
        "X-Tenant-ID": profile.tenantId,
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(
      `[brevo:${profile.tenantId}] send failed:`,
      res.status,
      data?.message || data,
    );
    return {
      success: false,
      channel: "brevo",
      error: data?.message || `Brevo error ${res.status}`,
      code: "BREVO_ERROR",
    };
  }
  return {
    success: true,
    channel: "brevo",
    messageId: data?.messageId,
    from: profile.fromEmail,
    to: recipient,
    tenantId: profile.tenantId,
  };
}

/**
 * @returns {Promise<{ success: boolean, channel?: string, error?: string, skipped?: boolean, messageId?: string, from?: string, to?: string, tenantId?: string }>}
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  tenantId = "ibaoeste",
}) {
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

  const provider = getEmailProvider();
  if (!provider) {
    return {
      success: false,
      skipped: true,
      error: "No email provider configured (set RESEND_API_KEY or BREVO_API_KEY)",
    };
  }

  const entityRefId = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = {
    recipient,
    subject,
    html,
    plainText,
    entityRefId,
    tenantId,
  };

  try {
    if (provider === "resend") return await sendViaResend(payload);
    if (provider === "brevo") return await sendViaBrevo(payload);
    return {
      success: false,
      skipped: true,
      error: "No supported email provider configured (use RESEND_API_KEY)",
    };
  } catch (error) {
    console.error(`[email:${provider}] send failed:`, error.message || error);
    return {
      success: false,
      channel: provider,
      error: error.message || "Email send failed",
      code: "EMAIL_ERROR",
    };
  }
}

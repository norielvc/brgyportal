import {
  getTenantEmailProfile,
  isValidEmail,
  sendTransactionalEmail,
} from "./sendTransactionalEmail";
import { renderFormalEmailLayout } from "./mailer";
import {
  fetchEsumbongNotificationRecipients,
  getEsumbongSettings,
} from "./esumbongAccess";
import { isEmailNotificationsEnabled } from "./requestNotificationHelper";

function reportRef(report) {
  const id = String(report?.id || "");
  return id ? id.substring(0, 8).toUpperCase() : "—";
}

function helpDeskLink(tenantId) {
  const profile = getTenantEmailProfile(tenantId);
  const base = (
    profile.portalUrl ||
    process.env.FRONTEND_URL ||
    "http://localhost:3003"
  ).replace(/\/$/, "");
  return `${base}/help-desk?tab=esumbong`;
}

/**
 * Confirmation to resident + alert to help-desk staff when a new blotter is filed.
 */
export async function notifyNewBlotterReport({ supabase, tenantId, report }) {
  const enabled = await isEmailNotificationsEnabled(supabase);
  if (!enabled) {
    return { emailsSent: 0, skipped: true, reason: "notifications_disabled" };
  }

  const profile = getTenantEmailProfile(tenantId);
  const ref = reportRef(report);
  let emailsSent = 0;
  const errors = [];

  const email = String(report?.email || "").trim();
  if (isValidEmail(email)) {
    const html = renderFormalEmailLayout({
      profile,
      badgeText: "E-SUMBONG • REPORT RECEIVED",
      accentColor: "#991b1b",
      badgeBg: "#fee2e2",
      badgeColor: "#991b1b",
      titleEN: "We Have Received Your E-Sumbong Report",
      titleTL: "Natanggap na Namin ang Iyong E-Sumbong",
      recipientName: report.complainant_name || "Valued Resident",
      messageEN:
        "Your barangay blotter / E-Sumbong report has been submitted successfully. Barangay officers will review the details and may contact you via the phone number or email you provided.",
      messageTL:
        "Matagumpay na naisumite ang iyong E-Sumbong. Susuriin ito ng pamunuan ng barangay at maaaring makipag-ugnayan sa iyo gamit ang ibinigay mong numero o email.",
      detailsRows: [
        { label: "Reference Number", value: ref, isCode: true },
        { label: "Complainant Name", value: report.complainant_name || "—" },
        { label: "Respondent", value: report.respondent_name || "—" },
        { label: "Incident Date", value: report.incident_date || "—" },
        { label: "Current Status", value: "Pending Review / Naghihintay ng Pagsusuri" },
      ],
      ctaLabel: "Visit Barangay Portal",
      ctaUrl: profile.portalUrl,
    });

    const text = [
      `${profile.fromName.toUpperCase()} — E-SUMBONG CONFIRMATION`,
      "------------------------------------------------------------",
      `Dear ${report.complainant_name || "Valued Resident"},`,
      "",
      "We have received your E-Sumbong report.",
      "Matagumpay na naisumite ang iyong E-Sumbong.",
      "",
      `- Reference: ${ref}`,
      `- Complainant: ${report.complainant_name || "—"}`,
      `- Incident Date: ${report.incident_date || "—"}`,
      `- Status: Pending Review / Naghihintay ng Pagsusuri`,
    ].join("\n");

    const result = await sendTransactionalEmail({
      to: email,
      subject: `E-Sumbong Received [#${ref}] — ${profile.fromName}`,
      html,
      text,
      tenantId,
    });
    if (result.success) emailsSent += 1;
    else errors.push(result.error || "resident email failed");
  }

  const esumbongSettings = await getEsumbongSettings(supabase, tenantId);
  const staffList = await fetchEsumbongNotificationRecipients(
    supabase,
    tenantId,
    esumbongSettings,
  );
  const seenStaffEmails = new Set();
  for (const staff of staffList) {
    const staffKey = String(staff.email || "").trim().toLowerCase();
    if (!staffKey || seenStaffEmails.has(staffKey)) continue;
    seenStaffEmails.add(staffKey);
    if (!isValidEmail(staff.email)) continue;

    const name =
      `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || "Barangay Officer";

    const html = renderFormalEmailLayout({
      profile,
      badgeText: "NEW E-SUMBONG FILED",
      accentColor: "#991b1b",
      badgeBg: "#fee2e2",
      badgeColor: "#991b1b",
      titleEN: `New E-Sumbong Report (#${ref})`,
      titleTL: "May Bagong Sumbong na Isinumite",
      recipientName: name,
      messageEN:
        "A new E-Sumbong / blotter report has been filed on the Barangay Portal and requires official review.",
      messageTL:
        "May bagong E-Sumbong na isinumite sa portal ng barangay na nangangailangan ng opisyal na pagsusuri.",
      detailsRows: [
        { label: "Reference Number", value: ref, isCode: true },
        { label: "Complainant", value: report.complainant_name || "—" },
        { label: "Respondent", value: report.respondent_name || "—" },
        { label: "Incident Date", value: report.incident_date || "—" },
        { label: "Incident Type", value: report.incident_type || "—" },
      ],
      remarksLabel: "Incident Narrative / Salaysay",
      remarksText: report.narrative || report.description || "",
      ctaLabel: "Open Help Desk (E-Sumbong)",
      ctaUrl: helpDeskLink(tenantId),
    });

    const result = await sendTransactionalEmail({
      to: staff.email,
      subject: `New E-Sumbong [#${ref}] — ${profile.fromName}`,
      html,
      text: `New E-Sumbong #${ref} from ${report.complainant_name || "resident"}. Open Help Desk: ${helpDeskLink(tenantId)}`,
      tenantId,
    });
    if (result.success) emailsSent += 1;
    else errors.push(`staff ${staff.email}: ${result.error}`);
  }

  return { emailsSent, errors, skipped: false };
}

const STATUS_COPY = {
  under_review: {
    subject: "E-Sumbong Under Review",
    badgeText: "UNDER REVIEW",
    accentColor: "#1e3a8a",
    badgeBg: "#dbeafe",
    badgeColor: "#1e40af",
    statusLabel: "Under Review / Sinusuri ng Barangay",
    titleEn: "Your E-Sumbong Report is Under Review",
    titleTl: "Sinusuri na ang Iyong E-Sumbong",
    bodyEn:
      "Barangay officials have started reviewing your E-Sumbong report. We will keep you updated on the next steps.",
    bodyTl:
      "Sinimulan nang suriin ng pamunuan ng barangay ang iyong E-Sumbong. Ipapabatid namin sa iyo ang susunod na hakbang.",
  },
  resolved: {
    subject: "E-Sumbong Resolved",
    badgeText: "RESOLVED",
    accentColor: "#065f46",
    badgeBg: "#d1fae5",
    badgeColor: "#065f46",
    statusLabel: "Resolved / Nalutas na",
    titleEn: "Your E-Sumbong Report Has Been Resolved",
    titleTl: "Minarkahan nang Resolved ang Iyong E-Sumbong",
    bodyEn:
      "Your E-Sumbong report has been officially marked as resolved by the Barangay Office. Thank you for your cooperation.",
    bodyTl:
      "Opisyal nang minarkahan ng barangay ang iyong E-Sumbong bilang resolved. Maraming salamat sa iyong pakikipagtulungan.",
  },
  dismissed: {
    subject: "E-Sumbong Status Update",
    badgeText: "CLOSED / DISMISSED",
    accentColor: "#475569",
    badgeBg: "#e2e8f0",
    badgeColor: "#334155",
    statusLabel: "Closed / Dismissed",
    titleEn: "Update on Your E-Sumbong Report",
    titleTl: "Balita Tungkol sa Iyong E-Sumbong",
    bodyEn:
      "Your E-Sumbong report has been reviewed and marked as closed/dismissed. Please visit or contact the Barangay Office if you have any questions.",
    bodyTl:
      "Nasuri na ang iyong sumbong at minarkahan bilang closed/dismissed. Makipag-ugnayan sa tanggapan ng barangay kung may katanungan.",
  },
};

export async function notifyBlotterStatusChange({
  supabase,
  report,
  newStatus,
  previousStatus,
}) {
  const enabled = await isEmailNotificationsEnabled(supabase);
  if (!enabled) return { skipped: true };

  if (!report?.email || !isValidEmail(report.email)) {
    return { skipped: true, reason: "no_email" };
  }
  if (newStatus === previousStatus || newStatus === "pending") {
    return { skipped: true, reason: "no_notify_status" };
  }

  const copy = STATUS_COPY[newStatus];
  if (!copy) return { skipped: true, reason: "unknown_status" };

  const tenantId = report?.tenant_id || "ibaoeste";
  const profile = getTenantEmailProfile(tenantId);
  const ref = reportRef(report);

  const html = renderFormalEmailLayout({
    profile,
    badgeText: copy.badgeText,
    accentColor: copy.accentColor,
    badgeBg: copy.badgeBg,
    badgeColor: copy.badgeColor,
    titleEN: copy.titleEn,
    titleTL: copy.titleTl,
    recipientName: report.complainant_name || "Valued Resident",
    messageEN: copy.bodyEn,
    messageTL: copy.bodyTl,
    detailsRows: [
      { label: "Reference Number", value: ref, isCode: true },
      { label: "Complainant Name", value: report.complainant_name || "—" },
      { label: "Incident Date", value: report.incident_date || "—" },
      { label: "Updated Status", value: copy.statusLabel },
    ],
    remarksLabel: "Barangay Remarks / Tala",
    remarksText: report.resolution || report.remarks || "",
    ctaLabel: "Visit Barangay Portal",
    ctaUrl: profile.portalUrl,
  });

  const result = await sendTransactionalEmail({
    to: report.email,
    subject: `${copy.subject} [#${ref}] — ${profile.fromName}`,
    html,
    text: `${copy.titleEn}\n${copy.titleTl}\nReference: #${ref}\nStatus: ${copy.statusLabel}`,
    tenantId,
  });

  return result;
}

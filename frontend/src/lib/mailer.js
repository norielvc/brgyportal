import {
  sendTransactionalEmail,
  escapeHtml,
  getTenantEmailProfile,
} from "./sendTransactionalEmail";

const TYPE_NAMES = {
  barangay_clearance: "Barangay Clearance",
  first_time_job_seeker: "First Time Job Seeker",
  certificate_of_indigency: "Certificate of Indigency",
  barangay_residency: "Barangay Residency Certificate",
  medico_legal: "Medico-Legal Certificate",
  certification_same_person: "Certification of Same Person",
  same_person: "Certification of Same Person",
  natural_death: "Natural Death Certificate",
  barangay_guardianship: "Guardianship Certificate",
  barangay_cohabitation: "Cohabitation Certificate",
  cohabitation: "Cohabitation Certificate",
  educational_assistance: "Educational Assistance",
  business_permit: "Business Permit",
};

function getTemplates(fromName, portalDomain) {
  return {
    SUBMITTED: {
      subjectPrefix: "New Certificate Request",
      badgeText: "NEW APPLICATION",
      statusLabel: "Submitted for Review / Isinumite para sa Pagsusuri",
      accentColor: "#1e3a8a",
      badgeBg: "#dbeafe",
      badgeColor: "#1e40af",
      titleEN: "New Certificate Application Submitted",
      titleTL: "May Bagong Kahilingan ng Sertipiko",
      messageEN: `A new certificate application has been filed through the official ${fromName} portal (${portalDomain}) and requires staff review.`,
      messageTL: `May bagong kahilingan ng sertipiko na isinumite sa opisyal na portal ng ${fromName} (${portalDomain}) na nangangailangan ng pagsusuri.`,
      ctaLabel: "Open Staff Dashboard",
      ctaPath: "/requests",
    },
    RECEIVED: {
      subjectPrefix: "Certificate Request Received",
      badgeText: "APPLICATION RECEIVED",
      statusLabel: "In Process / Kasalukuyang Pinoproseso",
      accentColor: "#0f172a",
      badgeBg: "#e0f2fe",
      badgeColor: "#0369a1",
      titleEN: "Certificate Application Received",
      titleTL: "Natanggap na Namin ang Iyong Kahilingan",
      messageEN: `Thank you for using the ${fromName} online services. Your certificate application has been received and is currently being processed by the Barangay Office.`,
      messageTL: `Maraming salamat sa paggamit ng online portal ng ${fromName}. Ang iyong kahilingan ay natanggap na at kasalukuyang pinoproseso ng Tanggapan ng Barangay.`,
      ctaLabel: "Track Request on Portal",
      ctaPath: "",
    },
    REJECTED: {
      subjectPrefix: "Update on Certificate Request",
      badgeText: "NOT APPROVED",
      statusLabel: "Declined / Hindi Naaprubahan",
      accentColor: "#991b1b",
      badgeBg: "#fee2e2",
      badgeColor: "#991b1b",
      titleEN: "Notice Regarding Your Certificate Application",
      titleTL: "Abiso Tungkol sa Iyong Kahilingan",
      messageEN:
        "We regret to inform you that your certificate application could not be approved at this time. Please see the remarks below for details.",
      messageTL:
        "Ikinalulungkot po naming ipabatid na ang iyong kahilingan sa sertipiko ay hindi naaprubahan sa ngayon. Mangyaring basahin ang tala sa ibaba para sa karagdagang detalye.",
      ctaLabel: "Visit Barangay Portal",
      ctaPath: "",
    },
    RETURNED: {
      subjectPrefix: "Action Required: Certificate Request",
      badgeText: "RETURNED FOR CORRECTION",
      statusLabel: "Returned for Revision / Ibinalik para sa Pagtatama",
      accentColor: "#b45309",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      titleEN: "Application Returned for Correction",
      titleTL: "Ibinalik ang Kahilingan para sa Pagtatama",
      messageEN:
        "Your certificate application requires additional information or correction before it can proceed. Please review the remarks below.",
      messageTL:
        "Ang iyong kahilingan ay nangangailangan ng karagdagang impormasyon o pagtatama bago ito maipagpatuloy. Pakibasa ang tala sa ibaba.",
      ctaLabel: "Open Barangay Portal",
      ctaPath: "",
    },
    RESUBMITTED: {
      subjectPrefix: "Resubmitted Certificate Request",
      badgeText: "RESUBMITTED",
      statusLabel: "Resubmitted for Review / Muling Isinumite",
      accentColor: "#1e3a8a",
      badgeBg: "#dbeafe",
      badgeColor: "#1e40af",
      titleEN: "Certificate Application Resubmitted",
      titleTL: "Muling Isinumite ang Kahilingan",
      messageEN: `An updated certificate application has been resubmitted for verification at the ${fromName} office.`,
      messageTL:
        "May kahilingan ng sertipiko na muling isinumite para sa beripikasyon at pagsusuri.",
      ctaLabel: "Review Application",
      ctaPath: "/requests",
    },
    APPROVED_STEP: {
      subjectPrefix: "For Punong Barangay Approval",
      badgeText: "FOR APPROVAL",
      statusLabel: "Awaiting Final Approval / Naghihintay ng Pag-apruba",
      accentColor: "#1e3a8a",
      badgeBg: "#e0e7ff",
      badgeColor: "#3730a3",
      titleEN: "Endorsed for Review and Approval",
      titleTL: "Inendorso para sa Pagsusuri at Pag-apruba",
      messageEN: `The following certificate application has been verified by the ${fromName} staff and is now endorsed for your review and approval in the BrgyDesk dashboard.`,
      messageTL:
        "Ang sumusunod na kahilingan ng sertipiko ay nasuri na ng mga kawani at inendorso na po para sa inyong pag-apruba sa BrgyDesk dashboard.",
      ctaLabel: "Review & Approve Request",
      ctaPath: "/requests",
    },
    WITNESS_ASSIGNMENT: {
      subjectPrefix: "Witness Assignment — Action Required",
      badgeText: "WITNESS REQUIRED",
      statusLabel: "Awaiting Witness Verification / Naghihintay ng Pagpapatunay",
      accentColor: "#6d28d9",
      badgeBg: "#ede9fe",
      badgeColor: "#5b21b6",
      titleEN: "Request Assigned for Oath Witnessing",
      titleTL: "Nakatalaga sa Pagpapatunay ng Oath",
      messageEN: `A certificate application has been endorsed to you as the assigned witness. Please confirm the Oath of Undertaking (when applicable) and complete your verification in the BrgyDesk dashboard.`,
      messageTL:
        "Ang sumusunod na kahilingan ay inendorso na sa inyo bilang nakatalagang witness. Pakitiyak ang Oath of Undertaking (kung kinakailangan) at kumpletuhin ang inyong beripikasyon sa BrgyDesk dashboard.",
      ctaLabel: "Open Request in Dashboard",
      ctaPath: "/requests",
    },
    READY_FOR_PICKUP: {
      subjectPrefix: "Certificate Ready for Release",
      badgeText: "READY FOR RELEASE",
      statusLabel: "Approved & Ready / Handa nang Kunin",
      accentColor: "#065f46",
      badgeBg: "#d1fae5",
      badgeColor: "#065f46",
      titleEN: "Your Requested Document is Ready",
      titleTL: "Handa na po ang Iyong Hiniling na Sertipiko",
      messageEN: `We are pleased to inform you that your requested certificate has been approved and is now ready. You may claim your document at the ${fromName} Hall during regular office hours (please bring a valid ID and your Reference Number), or view it online on ${portalDomain} if online delivery was selected.`,
      messageTL: `Malugod po naming ipinababatid na ang iyong hiniling na sertipiko ay aprubado na at handa nang makuha. Maaari na po itong kunin sa Barangay Hall ng ${fromName} sa oras ng opisina (magdala lamang ng valid ID at Reference Number), o buksan sa ${portalDomain} kung online delivery ang pinili.`,
      ctaLabel: "Open Barangay Portal",
      ctaPath: "",
    },
    CERTIFICATE_DOWNLOAD_READY: {
      subjectPrefix: "Your Certificate Download Link",
      badgeText: "SECURE DOWNLOAD",
      statusLabel: "Approved — Online Delivery / Aprubado — Online",
      accentColor: "#1e40af",
      badgeBg: "#dbeafe",
      badgeColor: "#1e3a8a",
      titleEN: "Your Certificate PDF Is Ready to Download",
      titleTL: "Handa na ang Iyong Sertipiko para I-download",
      messageEN: `Your requested certificate has been approved. Use the secure button below to download your official PDF. This link is private and will expire after the validity period shown in this email. The Barangay office keeps a copy on file for records.`,
      messageTL:
        "Ang iyong hiniling na sertipiko ay aprubado na. Gamitin ang secure na button sa ibaba para i-download ang opisyal na PDF. Pribado ang link na ito at may petsa ng pag-expire. Nasa tanggapan ang kopya para sa talaan.",
      ctaLabel: "Download Certificate (Secure Link)",
      ctaPath: "",
    },
  };
}

/**
 * Renders a formal, government-grade HTML email layout.
 */
export function renderFormalEmailLayout({
  profile,
  badgeText = "OFFICIAL NOTICE",
  accentColor = "#0f172a",
  badgeBg = "#e2e8f0",
  badgeColor = "#0f172a",
  titleEN,
  titleTL = "",
  recipientName = "Resident",
  messageEN,
  messageTL = "",
  detailsRows = [],
  remarksLabel = "Official Remarks / Tala",
  remarksText = "",
  ctaLabel = "",
  ctaUrl = "",
}) {
  const safeFromName = escapeHtml(profile.fromName || "Barangay Office");
  const safeLocation = escapeHtml(profile.locationName || safeFromName);
  const safeDomain = escapeHtml(profile.portalDomain || "brgydesk.com");
  const safeBadge = escapeHtml(badgeText);
  const safeTitleEN = escapeHtml(titleEN || "Official Notification");
  const safeTitleTL = titleTL ? escapeHtml(titleTL) : "";
  const safeRecipient = escapeHtml(recipientName || "Good day");
  const safeMessageEN = escapeHtml(messageEN || "");
  const safeMessageTL = messageTL ? escapeHtml(messageTL) : "";
  const safeRemarksLabel = escapeHtml(remarksLabel);
  const safeRemarksText = remarksText ? escapeHtml(remarksText) : "";

  const rowsHtml = detailsRows
    .filter((row) => row && row.label)
    .map(({ label, value, isCode }, idx) => {
      const borderTop = idx === 0 ? "none" : "1px solid #e2e8f0";
      const valHtml = isCode
        ? `<span style="font-family:Consolas,'Courier New',monospace;font-size:13px;font-weight:700;color:#0f172a;background:#e2e8f0;padding:3px 8px;border-radius:4px;letter-spacing:0.03em;">${escapeHtml(value || "—")}</span>`
        : `<span style="font-weight:600;color:#0f172a;">${escapeHtml(value || "—")}</span>`;

      return `
        <tr>
          <td style="padding:11px 16px;border-top:${borderTop};color:#64748b;font-size:13px;width:42%;vertical-align:top;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:11px 16px;border-top:${borderTop};font-size:13px;color:#0f172a;vertical-align:top;">
            ${valHtml}
          </td>
        </tr>`;
    })
    .join("");

  const remarksHtml = safeRemarksText
    ? `
      <div style="margin:20px 0 0;padding:14px 16px;background:#fffbeb;border-left:4px solid #d97706;border-radius:6px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#92400e;margin-bottom:4px;">
          ${safeRemarksLabel}
        </div>
        <div style="font-size:14px;color:#451a03;line-height:1.55;white-space:pre-line;">${safeRemarksText}</div>
      </div>`
    : "";

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `
      <div style="margin:26px 0 6px;text-align:center;">
        <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 26px;border-radius:6px;letter-spacing:0.01em;">
          ${escapeHtml(ctaLabel)} &rarr;
        </a>
      </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitleEN}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.04);">
          
          <!-- Top Official Government Header -->
          <tr>
            <td style="background-color:${accentColor};padding:22px 28px;border-bottom:3px solid #d97706;">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#cbd5e1;margin-bottom:4px;">
                Republic of the Philippines &bull; Official Barangay Notice
              </div>
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.01em;line-height:1.25;">
                ${safeFromName}
              </div>
              <div style="font-size:12px;color:#e2e8f0;margin-top:2px;">
                ${safeLocation} &bull; <span style="color:#fde68a;">${safeDomain}</span>
              </div>
            </td>
          </tr>

          <!-- Status Banner & Subject Heading -->
          <tr>
            <td style="padding:24px 28px 8px;">
              <div style="display:inline-block;background-color:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:12px;">
                ${safeBadge}
              </div>
              <h1 style="margin:0;font-size:19px;font-weight:700;color:#0f172a;line-height:1.35;">
                ${safeTitleEN}
              </h1>
              ${
                safeTitleTL
                  ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b;font-weight:500;">${safeTitleTL}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Main Message Body -->
          <tr>
            <td style="padding:14px 28px 24px;font-size:14px;line-height:1.65;color:#1e293b;">
              <p style="margin:0 0 12px;font-weight:600;color:#0f172a;">
                Dear ${safeRecipient},
              </p>
              <p style="margin:0 0 14px;color:#334155;">
                ${safeMessageEN}
              </p>
              ${
                safeMessageTL
                  ? `<div style="margin:0 0 18px;padding:10px 14px;background-color:#f8fafc;border-left:3px solid #94a3b8;border-radius:4px;font-size:13px;color:#475569;">
                      <strong style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;display:block;margin-bottom:2px;">Filipino / Tagalog</strong>
                      ${safeMessageTL}
                    </div>`
                  : ""
              }

              <!-- Document / Request Details Table -->
              ${
                rowsHtml
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                      <tr>
                        <td colspan="2" style="background-color:#f1f5f9;padding:9px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;border-bottom:1px solid #e2e8f0;">
                          Transaction &amp; Document Details
                        </td>
                      </tr>
                      ${rowsHtml}
                    </table>`
                  : ""
              }

              ${remarksHtml}
              ${ctaHtml}

              <!-- Formal Sign-off -->
              <div style="margin-top:26px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155;">
                Respectfully yours,<br>
                <strong style="color:#0f172a;">Office of the Barangay Secretary &amp; Punong Barangay</strong><br>
                <span style="color:#64748b;">${safeLocation}</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
              <div>
                This is an official automated communication from <strong>${safeFromName}</strong> (<a href="${escapeHtml(profile.portalUrl)}" style="color:#1e40af;text-decoration:none;">${safeDomain}</a>).
              </div>
              <div style="margin-top:4px;font-size:11px;color:#94a3b8;">
                For inquiries or assistance, you may reply directly to this email or visit the Barangay Hall during regular office hours.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build clean, formal government email content for a specific tenant.
 */
export function buildProcessNotificationEmail({
  recipientName,
  eventType,
  certificateType,
  referenceNumber,
  applicantName,
  comments = "",
  tenantId = "ibaoeste",
  ctaUrlOverride = "",
  downloadExpiresAt = "",
}) {
  const profile = getTenantEmailProfile(tenantId);
  const templates = getTemplates(profile.fromName, profile.portalDomain);
  const template = templates[eventType] || templates.SUBMITTED;
  const certificateName =
    TYPE_NAMES[certificateType] || certificateType || "Certificate";
  const refLabel = referenceNumber ? ` [${referenceNumber}]` : "";
  const subject = `${template.subjectPrefix}: ${certificateName}${refLabel} — ${profile.fromName}`;

  const staffDashboardTypes = new Set([
    "SUBMITTED",
    "APPROVED_STEP",
    "WITNESS_ASSIGNMENT",
    "RESUBMITTED",
  ]);
  const staffOrigin = String(
    process.env.NEXT_PUBLIC_STAFF_LOGIN_URL ||
      process.env.FRONTEND_URL ||
      "https://brgydesk.com/login",
  )
    .trim()
    .replace(/\/login\/?$/i, "");
  let ctaUrl = template.ctaPath
    ? staffDashboardTypes.has(eventType)
      ? `${staffOrigin}${template.ctaPath}`
      : `${profile.portalUrl}${template.ctaPath}`
    : staffDashboardTypes.has(eventType)
      ? `${staffOrigin}/requests`
      : profile.portalUrl;

  if (ctaUrlOverride) {
    ctaUrl = ctaUrlOverride;
  }

  const expiresLabel = downloadExpiresAt
    ? (() => {
        try {
          return new Date(downloadExpiresAt).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          return String(downloadExpiresAt);
        }
      })()
    : "";

  const detailsRows = [
    { label: "Reference Number", value: referenceNumber || "—", isCode: true },
    { label: "Applicant Name", value: applicantName || "—" },
    { label: "Document Type", value: certificateName },
    { label: "Current Status", value: template.statusLabel },
    { label: "Official Portal", value: profile.portalDomain },
  ];

  if (expiresLabel) {
    detailsRows.push({
      label: "Download Link Valid Until",
      value: expiresLabel,
    });
  }

  const html = renderFormalEmailLayout({
    profile,
    badgeText: template.badgeText,
    accentColor: template.accentColor,
    badgeBg: template.badgeBg,
    badgeColor: template.badgeColor,
    titleEN: template.titleEN,
    titleTL: template.titleTL,
    recipientName: recipientName || "Valued Resident",
    messageEN: template.messageEN,
    messageTL: template.messageTL,
    detailsRows,
    remarksLabel: "Official Remarks / Tala mula sa Barangay",
    remarksText: comments || "",
    ctaLabel: template.ctaLabel,
    ctaUrl,
  });

  const text = [
    `${profile.fromName.toUpperCase()} — OFFICIAL NOTIFICATION`,
    `${template.titleEN} (${template.titleTL})`,
    "------------------------------------------------------------",
    `Dear ${recipientName || "Valued Resident"},`,
    "",
    template.messageEN,
    "",
    `[Filipino / Tagalog]`,
    template.messageTL,
    comments ? `\nOfficial Remarks: ${comments}` : "",
    "",
    "TRANSACTION & DOCUMENT DETAILS:",
    `- Reference No.: ${referenceNumber || "—"}`,
    `- Applicant Name: ${applicantName || "—"}`,
    `- Document Type: ${certificateName}`,
    `- Status: ${template.statusLabel}`,
    `- Barangay Portal: ${profile.portalUrl}`,
    "",
    "Respectfully yours,",
    "Office of the Barangay Secretary & Punong Barangay",
    profile.locationName,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return { subject, html, text };
}

/**
 * Send a bilingual process email for a tenant.
 */
export async function sendProcessNotification({
  recipientEmail,
  recipientName,
  eventType,
  certificateType,
  referenceNumber,
  applicantName,
  comments = "",
  requestId,
  tenantId = "ibaoeste",
}) {
  if (!recipientEmail) {
    return { success: false, error: "Recipient email missing" };
  }

  const { subject, html, text } = buildProcessNotificationEmail({
    recipientName,
    eventType,
    certificateType,
    referenceNumber,
    applicantName,
    comments,
    requestId,
    tenantId,
  });

  const sent = await sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    tenantId,
  });
  if (!sent.success) {
    return { success: false, error: sent.error, code: sent.code };
  }
  return { success: true, messageId: sent.messageId };
}

/**
 * Send a formal bilingual KapChat notification email for a tenant.
 */
export async function sendKapchatNotification({
  recipientEmail,
  recipientName,
  senderName,
  contactNumber = "",
  message = "",
  tenantId = "ibaoeste",
  isResidentConfirmation = false,
}) {
  if (!recipientEmail) {
    return { success: false, error: "Recipient email missing" };
  }

  const profile = getTenantEmailProfile(tenantId);
  const cleanSender = senderName || "Resident";
  const subject = isResidentConfirmation
    ? `KapChat Message Received — ${profile.fromName}`
    : `KapChat Message from ${cleanSender} — ${profile.fromName}`;

  const html = renderFormalEmailLayout({
    profile,
    badgeText: isResidentConfirmation
      ? "KAPCHAT • MENSAHE NATANGGAP"
      : "KAPCHAT • REKTA KAY KAP",
    accentColor: "#0f172a",
    badgeBg: "#dbeafe",
    badgeColor: "#1e40af",
    titleEN: isResidentConfirmation
      ? "Your KapChat Message Has Been Received"
      : "New Resident Message via KapChat",
    titleTL: isResidentConfirmation
      ? "Natanggap Namin ang Iyong Mensahe sa KapChat"
      : "Bagong Mensahe mula sa Residente sa KapChat",
    recipientName:
      recipientName || (isResidentConfirmation ? cleanSender : "Barangay Staff"),
    messageEN: isResidentConfirmation
      ? `Thank you for reaching out through KapChat on the official ${profile.fromName} portal. Your message has been routed to our duty desk officer and will be attended to promptly during office hours.`
      : `A verified resident has sent a direct message through KapChat (Rekta kay Kap) on the ${profile.fromName} portal.`,
    messageTL: isResidentConfirmation
      ? `Maraming salamat sa pag-abot sa pamamagitan ng KapChat sa opisyal na portal ng ${profile.fromName}. Ang iyong mensahe ay naipasa sa aming duty desk officer at tutugunan sa oras ng tanggapan.`
      : `May nagpadala po ng mensahe sa KapChat (Rekta kay Kap) sa opisyal na portal ng ${profile.fromName}.`,
    detailsRows: [
      { label: "Sender Name", value: cleanSender },
      { label: "Contact / Phone", value: contactNumber || "—" },
      { label: "Portal", value: profile.portalDomain },
    ],
    remarksLabel: isResidentConfirmation
      ? "Your Message / Iyong Mensahe"
      : "Resident Message / Mensahe ng Residente",
    remarksText: message || "—",
    ctaLabel: isResidentConfirmation
      ? "Open Barangay Portal"
      : "Open KapChat in Help Desk",
    ctaUrl: isResidentConfirmation
      ? profile.portalUrl
      : `${profile.portalUrl}/help-desk?tab=kapchat`,
  });

  const text = [
    `${profile.fromName.toUpperCase()} — KAPCHAT NOTIFICATION`,
    "------------------------------------------------------------",
    `Dear ${recipientName || "Punong Barangay"},`,
    "",
    `A verified resident sent a message through KapChat on ${profile.portalDomain}:`,
    "",
    `- Resident: ${cleanSender}`,
    `- Contact No.: ${contactNumber || "—"}`,
    `- Message: ${message || "—"}`,
    "",
    `Open KapChat: ${profile.portalUrl}/help-desk?tab=kapchat`,
    "",
    "Respectfully yours,",
    profile.locationName,
  ].join("\n");

  const sent = await sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    tenantId,
  });
  if (!sent.success) {
    return { success: false, error: sent.error, code: sent.code };
  }
  return { success: true, messageId: sent.messageId };
}

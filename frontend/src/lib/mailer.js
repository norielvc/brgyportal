import { sendTransactionalEmail, escapeHtml } from "./sendTransactionalEmail";

const TYPE_NAMES = {
  barangay_clearance: "Barangay Clearance",
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

const TEMPLATES = {
  SUBMITTED: {
    subjectPrefix: "New Certificate Request",
    titleEN: "New Certificate Request",
    titleTL: "Bagong Request ng Sertipiko",
    messageEN:
      "Good day! A new certificate request has been filed at the Barangay Iba O' Este portal.",
    messageTL:
      "Magandang araw! May bagong certificate request na isinumite sa portal ng Barangay Iba O' Este.",
  },
  RECEIVED: {
    subjectPrefix: "Certificate Request Received",
    titleEN: "We Have Received Your Request",
    titleTL: "Natanggap na Namin ang Iyong Request",
    messageEN:
      "Good day! Your certificate request has been received and is now being processed by the Barangay office.",
    messageTL:
      "Magandang araw! Ang iyong request ay natanggap na at kasalukuyang pinoproseso ng tanggapan ng Barangay.",
  },
  REJECTED: {
    subjectPrefix: "Update on Certificate Request",
    titleEN: "Update on Your Request",
    titleTL: "Balita tungkol sa Iyong Request",
    messageEN:
      "Your certificate request could not be approved for the following reason:",
    messageTL:
      "Ang iyong request ay hindi naaprubahan dahil sa sumusunod na dahilan:",
  },
  RETURNED: {
    subjectPrefix: "Update on Certificate Request",
    titleEN: "Request Returned for Correction",
    titleTL: "Ibinalik ang Request para sa Pagtatama",
    messageEN:
      "Your request was returned for corrections. Please review the note below.",
    messageTL:
      "Ibinalik ang iyong request para sa pagtatama. Pakibasa ang tala sa ibaba.",
  },
  RESUBMITTED: {
    subjectPrefix: "Resubmitted Certificate Request",
    titleEN: "Request Resubmitted",
    titleTL: "Muling Isinumite ang Request",
    messageEN:
      "A certificate request has been resubmitted for review at the Barangay office.",
    messageTL:
      "May certificate request na muling isinumite para sa pagsusuri.",
  },
  APPROVED_STEP: {
    subjectPrefix: "For Punong Barangay Approval",
    titleEN: "For Punong Barangay Review and Approval",
    titleTL: "Para sa Pagsusuri at Pag-apruba ng Punong Barangay",
    messageEN:
      "Good day Kap! The following certificate request has been reviewed by the Barangay staff and is now ready for your approval in the BrgyDesk dashboard.",
    messageTL:
      "Magandang araw Kap! Ang sumusunod na certificate request ay nasuri na at naghihintay na po ng inyong pag-apruba sa BrgyDesk dashboard.",
  },
  READY_FOR_PICKUP: {
    subjectPrefix: "Certificate Ready",
    titleEN: "Your Certificate is Ready",
    titleTL: "Handa na ang Iyong Sertipiko",
    messageEN:
      "Good day! Your requested certificate is now ready. If you selected online delivery, you may view it on the Barangay Iba O' Este portal using your reference number. Otherwise, you may claim it at the Barangay Hall.",
    messageTL:
      "Magandang araw! Handa na po ang iyong sertipiko. Kung online delivery ang pinili, maaari itong buksan sa portal ng Barangay Iba O' Este gamit ang iyong reference number, o kunin sa Barangay Hall.",
  },
};

/**
 * Build clean, spam-filter-safe bilingual email content (sent via Gmail SMTP).
 * Avoids phishing trigger words ("Action Required") and external CTA button links
 * that cause Gmail's outbound filter to block messages as suspicious.
 */
export function buildProcessNotificationEmail({
  recipientName,
  eventType,
  certificateType,
  referenceNumber,
  applicantName,
  comments = "",
}) {
  const template = TEMPLATES[eventType] || TEMPLATES.SUBMITTED;
  const certificateName =
    TYPE_NAMES[certificateType] || certificateType || "Certificate";
  const refLabel = referenceNumber ? ` [${referenceNumber}]` : "";
  const subject = `Barangay Iba O' Este - ${template.subjectPrefix}${refLabel} (${certificateName})`;

  const safeRecipient = escapeHtml(recipientName || "Good day");
  const safeRef = escapeHtml(referenceNumber || "—");
  const safeApplicant = escapeHtml(applicantName || "—");
  const safeCert = escapeHtml(certificateName);
  const safeComments = comments ? escapeHtml(comments) : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;max-width:560px;margin:0 auto;padding:16px">
      <p style="margin:0 0 4px;font-size:12px;color:#475569;font-weight:bold">Tanggapan ng Barangay Iba O' Este, Calumpit, Bulacan</p>
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">${template.titleEN} / ${template.titleTL}</h2>
      <p>Hello ${safeRecipient},</p>
      <p>${template.messageEN}</p>
      <p style="color:#334155">${template.messageTL}</p>
      ${safeComments ? `<p style="background:#f8fafc;border-left:3px solid #64748b;padding:10px 12px;margin:12px 0"><strong>Remarks:</strong> ${safeComments}</p>` : ""}
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Reference No.:</strong> ${safeRef}</p>
        <p style="margin:4px 0"><strong>Applicant Name:</strong> ${safeApplicant}</p>
        <p style="margin:4px 0"><strong>Document Type:</strong> ${safeCert}</p>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#64748b">Thank you,<br/>Barangay Iba O' Este Office</p>
    </div>
  `;

  const text = [
    "Tanggapan ng Barangay Iba O' Este, Calumpit, Bulacan",
    `${template.titleEN} / ${template.titleTL}`,
    "",
    `Hello ${recipientName || "Good day"},`,
    "",
    template.messageEN,
    template.messageTL,
    comments ? `Remarks: ${comments}` : "",
    "",
    `Reference No.: ${referenceNumber || "—"}`,
    `Applicant Name: ${applicantName || "—"}`,
    `Document Type: ${certificateName}`,
    "",
    "Thank you,",
    "Barangay Iba O' Este Office",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

/**
 * Send a bilingual process email via Gmail SMTP.
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
  });

  const sent = await sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
  if (!sent.success) {
    return { success: false, error: sent.error, code: sent.code };
  }
  return { success: true, messageId: sent.messageId };
}

/**
 * Send a bilingual KapChat notification email to the Barangay Captain.
 */
export async function sendKapchatNotification({
  recipientEmail,
  recipientName,
  senderName,
  contactNumber = "",
  message = "",
}) {
  if (!recipientEmail) {
    return { success: false, error: "Recipient email missing" };
  }

  const cleanSender = senderName || "Resident";
  const subject = `Barangay Iba O' Este KapChat - Message from ${cleanSender}`;

  const safeRecipient = escapeHtml(recipientName || "Kap");
  const safeSender = escapeHtml(cleanSender);
  const safeContact = escapeHtml(contactNumber || "—");
  const safeMessage = escapeHtml(message || "—");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;max-width:560px;margin:0 auto;padding:16px">
      <p style="margin:0 0 4px;font-size:12px;color:#475569;font-weight:bold">Tanggapan ng Barangay Iba O' Este • KapChat (Rekta kay Kap)</p>
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">New KapChat Message / Bagong Mensahe sa KapChat</h2>
      <p>Hello ${safeRecipient},</p>
      <p>Good day Kap! A resident sent a message through KapChat:</p>
      <p style="color:#334155">Magandang araw Kap! May nagpadala po ng mensahe sa KapChat:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Resident:</strong> ${safeSender}</p>
        <p style="margin:4px 0"><strong>Contact No.:</strong> ${safeContact}</p>
        <p style="margin:8px 0 4px"><strong>Message:</strong></p>
        <p style="margin:0;white-space:pre-wrap;color:#0f172a">${safeMessage}</p>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#64748b">Thank you,<br/>Barangay Iba O' Este Office</p>
    </div>
  `;

  const text = [
    "Tanggapan ng Barangay Iba O' Este • KapChat (Rekta kay Kap)",
    "New KapChat Message / Bagong Mensahe sa KapChat",
    "",
    `Hello ${recipientName || "Kap"},`,
    "",
    "Good day Kap! A resident sent a message through KapChat:",
    "Magandang araw Kap! May nagpadala po ng mensahe sa KapChat:",
    "",
    `Resident: ${cleanSender}`,
    `Contact No.: ${contactNumber || "—"}`,
    `Message: ${message || "—"}`,
    "",
    "Thank you,",
    "Barangay Iba O' Este Office",
  ].join("\n");

  const sent = await sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
  if (!sent.success) {
    return { success: false, error: sent.error, code: sent.code };
  }
  return { success: true, messageId: sent.messageId };
}

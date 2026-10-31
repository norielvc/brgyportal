import nodemailer from "nodemailer";

const TYPE_NAMES = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_indigency: "Certificate of Indigency",
  barangay_residency: "Barangay Residency Certificate",
  medico_legal: "Medico-Legal Certificate",
  certification_same_person: "Certification of Same Person",
  natural_death: "Natural Death Certificate",
  barangay_guardianship: "Guardianship Certificate",
  barangay_cohabitation: "Cohabitation Certificate",
  educational_assistance: "Educational Assistance",
  business_permit: "Business Permit",
};

const TEMPLATES = {
  SUBMITTED: {
    subject: "New Request Submitted / Bagong Request ay Isinumite",
    titleEN: "New Request Assigned",
    titleTL: "Bagong Request ay Itinalaga",
    messageEN: "A new request has been submitted and is waiting for your review.",
    messageTL: "Mayroong bagong request na isinumite at naghihintay para sa iyong pagsusuri.",
  },
  RECEIVED: {
    subject: "Request Received / Natanggap ang Request",
    titleEN: "We've Received Your Request",
    titleTL: "Natanggap na Namin ang Iyong Request",
    messageEN: "Your request has been received and is being processed by the Barangay staff.",
    messageTL: "Ang iyong request ay natanggap na at pinoproseso ng mga kawani ng Barangay.",
  },
  REJECTED: {
    subject: "Request Rejected / Tinanggihan ang Request",
    titleEN: "Update on Your Request",
    titleTL: "Balita tungkol sa Iyong Request",
    messageEN: "Your request was not approved for the following reason:",
    messageTL: "Ang iyong request ay hindi naaprubahan dahil sa sumusunod na dahilan:",
  },
  RETURNED: {
    subject: "Action Required: Request Sent Back / Ibinalik ang Request",
    titleEN: "Correction Needed",
    titleTL: "Kailangang Itama",
    messageEN: "Your request was sent back for corrections. Please review the comments.",
    messageTL: "Ibinalik ang iyong request para sa pagtatama. Pakibasa ang mga komento.",
  },
  RESUBMITTED: {
    subject: "Request Sent Back for Review / Ibinalik para Suriin",
    titleEN: "Request Needs Review",
    titleTL: "Kailangang Suriin ang Request",
    messageEN: "A request was sent back and needs your review.",
    messageTL: "May request na ibinalik at kailangan ng iyong pagsusuri.",
  },
  APPROVED_STEP: {
    subject: "Action Required: Next Approval / Susunod na Approval",
    titleEN: "Request Waiting for You",
    titleTL: "Request na Naghihintay sa Iyo",
    messageEN: "A request has moved to your step and needs your action.",
    messageTL: "Ang request ay nasa iyong hakbang na at kailangan ng iyong aksyon.",
  },
  READY_FOR_PICKUP: {
    subject: "Certificate Ready / Handa na ang Sertipiko",
    titleEN: "Certificate Ready",
    titleTL: "Handa na ang Sertipiko",
    messageEN: "Your certificate is ready. If you chose online delivery, use your reference number on the portal. Otherwise, claim it at the Barangay Hall.",
    messageTL: "Handa na ang iyong sertipiko. Kung online delivery ang pinili, gamitin ang reference number sa portal. Kung hindi, kunin ito sa Barangay Hall.",
  },
};

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  const pass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass,
    },
  });
}

/**
 * Send a bilingual process email via Gmail SMTP.
 * Used by Vercel API routes (no separate Express server).
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
  if (!smtpConfigured()) {
    return { success: false, error: "SMTP credentials missing" };
  }
  if (!recipientEmail) {
    return { success: false, error: "Recipient email missing" };
  }

  const template = TEMPLATES[eventType] || TEMPLATES.SUBMITTED;
  const certificateName = TYPE_NAMES[certificateType] || certificateType || "Certificate";
  const baseUrl = (process.env.FRONTEND_URL || "https://brgydesk.com").replace(/\/$/, "");
  const isResident = ["RECEIVED", "REJECTED", "RETURNED", "READY_FOR_PICKUP"].includes(eventType);
  const link = isResident ? `${baseUrl}/ibaoeste` : `${baseUrl}/requests`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#065f46;padding:24px 20px;color:#fff">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">Barangay Iba O' Este</div>
          <h1 style="margin:8px 0 0;font-size:20px">${template.titleEN}</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:.9">${template.titleTL}</p>
        </div>
        <div style="padding:24px 20px;font-size:14px;line-height:1.6">
          <p>Hello ${recipientName || "there"},</p>
          <p>${template.messageEN}</p>
          <p>${template.messageTL}</p>
          ${comments ? `<p style="background:#f1f5f9;padding:12px;border-radius:8px"><strong>Note:</strong> ${comments}</p>` : ""}
          <table style="width:100%;background:#f8fafc;border-radius:8px;margin:16px 0">
            <tr><td style="padding:8px 12px;color:#64748b">Reference</td><td style="padding:8px 12px;font-weight:600">${referenceNumber || "—"}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b">Name</td><td style="padding:8px 12px;font-weight:600">${applicantName || "—"}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b">Certificate</td><td style="padding:8px 12px;font-weight:600">${certificateName}</td></tr>
          </table>
          <p><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Open BrgyDesk</a></p>
          <p style="color:#94a3b8;font-size:12px">Request ID: ${requestId || "—"}</p>
        </div>
      </div>
    </div>
  `;

  const info = await createTransport().sendMail({
    from: `"Barangay Iba O' Este" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: template.subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

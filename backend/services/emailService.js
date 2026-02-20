const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Remove spaces from app password if present
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: pass
    },
    logger: true, // Log to console
    debug: true   // Include debug info
  });
};

const certificateTypeNames = {
  'barangay_clearance': 'Barangay Clearance',
  'certificate_of_indigency': 'Certificate of Indigency',
  'barangay_residency': 'Barangay Residency Certificate',
  'medico_legal': 'Medico-Legal Certificate',
  'certification_same_person': 'Certification of Same Person',
  'natural_death': 'Natural Death Certificate',
  'barangay_guardianship': 'Guardianship Certificate',
  'barangay_cohabitation': 'Cohabitation Certificate',
  'educational_assistance': 'Educational Assistance'
};

const eventTemplates = {
  SUBMITTED: {
    subject: "New Request Submitted / Bagong Request ay Isinumite",
    titleEN: "New Request Assigned",
    titleTL: "Bagong Request ay Itinalaga",
    messageEN: "A new request has been submitted and is waiting for your review.",
    messageTL: "Mayroong bagong request na isinumite at naghihintay para sa iyong pagsusuri.",
    actionEN: "View Request",
    actionTL: "Tingnan ang Request"
  },
  RECEIVED: {
    subject: "Request Received / Natanggap ang Request",
    titleEN: "We've Received Your Request",
    titleTL: "Natanggap na Namin ang Iyong Request",
    messageEN: "Your request has been successfully received and is currently being processed by the Barangay Staff.",
    messageTL: "Ang iyong request ay matagumpay na natanggap at kasalukuyang pinoproseso ng mga kawani ng Barangay.",
    actionEN: "Track Status",
    actionTL: "Suriin ang Status"
  },
  REJECTED: {
    subject: "Request Rejected / Tinanggihan ang Request",
    titleEN: "Update on Your Request",
    titleTL: "Balita tungkol sa Iyong Request",
    messageEN: "Unfortunately, your request has been rejected for the following reason:",
    messageTL: "Paumanhin, ang iyong request ay tinanggihan dahil sa sumusunod na dahilan:",
    actionEN: "View Details",
    actionTL: "Tingnan ang Detalye"
  },
  RETURNED: {
    subject: "Action Required: Request Sent Back / Kailangan ng Aksyon: Ibinalik ang Request",
    titleEN: "Correction Needed",
    titleTL: "Kailangang Itama",
    messageEN: "Your request has been sent back for corrections. Please review the comments and resubmit.",
    messageTL: "Ang iyong request ay ibinalik para sa mga pagtatama. Pakisuyong basahin ang mga komento at isumite itong muli.",
    actionEN: "Fix Request",
    actionTL: "Ayusin ang Request"
  },
  RESUBMITTED: {
    subject: "Request Resubmitted / Muling Isinumite ang Request",
    titleEN: "Updated Request Received",
    titleTL: "Natanggap ang Na-update na Request",
    messageEN: "An applicant has resubmitted their request with the requested changes.",
    messageTL: "Muling isinumite ng aplikante ang kanilang request na may mga hinihinging pagbabago.",
    actionEN: "Review Again",
    actionTL: "Suriin Muli"
  },
  APPROVED_STEP: {
    subject: "Action Required: Next Approval / Kailangan ng Susunod na Approval",
    titleEN: "Request Waiting for You",
    titleTL: "Request na Naghihintay sa Iyo",
    messageEN: "A request has moved to your stage and now requires your approval/signature.",
    messageTL: "Ang request ay narito na sa iyong hakbang at nangangailangan ng iyong approval o lagda.",
    actionEN: "Approve Now",
    actionTL: "Aprubahan Na"
  },
  READY_FOR_PICKUP: {
    subject: "Request Ready for Pickup / Handa na para Kunin ang Request",
    titleEN: "Certificate Ready!",
    titleTL: "Ang Sertipiko ay Handa Na!",
    messageEN: "Good news! Your certificate is now ready for pickup at the Barangay Hall.",
    messageTL: "Magandang balita! Ang iyong sertipiko ay handa na para makuha sa Barangay Hall.",
    actionEN: "View Details",
    actionTL: "Tingnan ang Detalye"
  }
};

/**
 * Send process notification (English + Tagalog)
 */
const sendProcessNotification = async ({
  recipientEmail,
  recipientName,
  eventType, // From eventTemplates keys
  certificateType,
  referenceNumber,
  applicantName,
  comments = '',
  requestId
}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured. Email will not be sent.');
      return { success: false, error: 'SMTP credentials missing' };
    }

    const template = eventTemplates[eventType] || eventTemplates.SUBMITTED;
    const transporter = createTransporter();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Determine if this is a resident notification or a staff notification
    const isResidentEvent = ['RECEIVED', 'REJECTED', 'RETURNED', 'READY_FOR_PICKUP'].includes(eventType);
    const requestLink = isResidentEvent
      ? `${baseUrl}/requests/${requestId}`
      : `${baseUrl}/dashboard/requests/${requestId}`;

    const certificateName = certificateTypeNames[certificateType] || certificateType;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Brgy. Iba O' Este Notification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #065f46 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Barangay Iba O' Este</h1>
                    <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Online Service Portal</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <!-- English Section -->
                    <div style="margin-bottom: 30px; border-left: 4px solid #3b82f6; padding-left: 20px;">
                      <h2 style="color: #1e293b; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">${template.titleEN}</h2>
                      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                        Dear <strong>${recipientName}</strong>,<br><br>
                        ${template.messageEN}
                      </p>
                    </div>

                    <!-- Tagalog Section -->
                    <div style="margin-bottom: 30px; border-left: 4px solid #10b981; padding-left: 20px; background-color: #f0fdf4; padding-top: 15px; padding-bottom: 15px;">
                      <h2 style="color: #064e3b; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">${template.titleTL}</h2>
                      <p style="color: #065f46; font-size: 16px; line-height: 1.6; margin: 0;">
                        Mahal na <strong>${recipientName}</strong>,<br><br>
                        ${template.messageTL}
                      </p>
                    </div>

                    ${comments ? `
                    <!-- Comments Box -->
                    <div style="background-color: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; padding: 20px; margin-bottom: 30px;">
                      <h3 style="color: #9a3412; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Remarks / Komento:</h3>
                      <p style="color: #7c2d12; margin: 0; font-size: 15px; font-style: italic; line-height: 1.5;">"${comments}"</p>
                    </div>
                    ` : ''}

                    <!-- Details Table -->
                    <table width="100%" style="background-color: #f1f5f9; border-radius: 12px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px;">
                          <table width="100%" cellpadding="5">
                            <tr>
                              <td style="color: #64748b; font-size: 13px; width: 150px;">Reference Number:</td>
                              <td style="color: #0f172a; font-size: 14px; font-weight: 600;">${referenceNumber}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; font-size: 13px;">Name / Pangalan:</td>
                              <td style="color: #0f172a; font-size: 14px; font-weight: 600;">${applicantName}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; font-size: 13px;">Certificate / Sertipiko:</td>
                              <td style="color: #0f172a; font-size: 14px; font-weight: 600;">${certificateName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${requestLink}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; margin-bottom: 10px; min-width: 200px;">
                            ${template.actionEN}
                          </a>
                          <br>
                          <a href="${requestLink}" style="display: inline-block; background-color: #f1f5f9; color: #1e293b; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; min-width: 200px;">
                            ${template.actionTL}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                      This is an automated notification from Barangay Iba O' Este Management System.<br>
                      Calumpit, Bulacan, Philippines
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Brgy. Iba O' Este" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: template.subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send workflow notification email to assigned approvers (Old compatibility wrapper)
 */
const sendWorkflowNotification = async (data) => {
  return sendProcessNotification({
    ...data,
    eventType: 'SUBMITTED' // Default for approvers
  });
};

/**
 * Send notification to multiple users
 */
const sendWorkflowNotifications = async ({
  recipients, // Array of { email, name }
  eventType,
  ...rest
}) => {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendProcessNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      eventType,
      ...rest
    });
    results.push({ ...result, email: recipient.email });
  }
  return results;
};

module.exports = {
  sendWorkflowNotification,
  sendWorkflowNotifications,
  sendProcessNotification
};

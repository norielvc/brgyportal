import {
  escapeHtml,
  isValidEmail,
  sendTransactionalEmail,
} from "./sendTransactionalEmail";
import {
  fetchTenantReviewStaff,
  isEmailNotificationsEnabled,
} from "./requestNotificationHelper";

function reportRef(report) {
  const id = String(report?.id || "");
  return id ? id.substring(0, 8).toUpperCase() : "—";
}

function helpDeskLink(tenantId) {
  const base = (process.env.FRONTEND_URL || "http://localhost:3003").replace(
    /\/$/,
    "",
  );
  return `${base}/help-desk?tab=esumbong`;
}

function residentEmailShell({ titleEn, titleTl, bodyEn, bodyTl, report, extraRows = [] }) {
  const ref = reportRef(report);
  const rows = [
    ["Reference / Sanggunian", ref],
    ["Complainant / Nagsusumbong", report.complainant_name || "—"],
    ["Incident date / Petsa", report.incident_date || "—"],
    ...extraRows,
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#64748b;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#b91c1c;padding:20px;color:#fff">
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.85">E-Sumbong</div>
          <h1 style="margin:6px 0 0;font-size:18px">${escapeHtml(titleEn)}</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:.9">${escapeHtml(titleTl)}</p>
        </div>
        <div style="padding:20px;font-size:14px">
          <p>${escapeHtml(bodyEn)}</p>
          <p style="color:#475569">${escapeHtml(bodyTl)}</p>
          <table style="width:100%;background:#f8fafc;border-radius:8px;margin:16px 0;font-size:13px">${tableRows}</table>
          <p style="color:#64748b;font-size:12px">Do not reply to this automated message. Contact the barangay office for follow-up.<br/>Huwag sumagot sa awtomatikong email na ito. Makipag-ugnayan sa barangay kung kailangan ng follow-up.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Confirmation to resident + alert to help-desk staff when a new blotter is filed.
 */
export async function notifyNewBlotterReport({ supabase, tenantId, report }) {
  const enabled = await isEmailNotificationsEnabled(supabase);
  if (!enabled) {
    return { emailsSent: 0, skipped: true, reason: "notifications_disabled" };
  }

  let emailsSent = 0;
  const errors = [];

  const email = String(report?.email || "").trim();
  if (isValidEmail(email)) {
    const html = residentEmailShell({
      titleEn: "We received your E-Sumbong",
      titleTl: "Natanggap ang iyong E-Sumbong",
      bodyEn:
        "Your barangay blotter report was submitted successfully. Staff will review it and may contact you using the phone number you provided.",
      bodyTl:
        "Matagumpay na naisumite ang iyong sumbong. Susuriin ito ng barangay at maaaring kontakin ka sa cellphone na ibinigay mo.",
      report,
      extraRows: [["Status", "Pending / Naghihintay"]],
    });
    const text = [
      "Natanggap ang iyong E-Sumbong / We received your E-Sumbong",
      `Reference: ${reportRef(report)}`,
      `Petsa ng pangyayari: ${report.incident_date || "—"}`,
    ].join("\n");

    const result = await sendTransactionalEmail({
      to: email,
      subject: "E-Sumbong Received / Natanggap ang Sumbong",
      html,
      text,
    });
    if (result.success) emailsSent += 1;
    else errors.push(result.error || "resident email failed");
  }

  const staffList = await fetchTenantReviewStaff(supabase, tenantId);
  const ref = reportRef(report);
  for (const staff of staffList) {
    if (!isValidEmail(staff.email)) continue;
    const name =
      `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || "Staff";
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Hello ${escapeHtml(name)},</p>
        <p>A new <strong>E-Sumbong</strong> report was submitted and needs review.</p>
        <ul>
          <li><strong>Ref:</strong> ${escapeHtml(ref)}</li>
          <li><strong>Complainant:</strong> ${escapeHtml(report.complainant_name || "—")}</li>
          <li><strong>Respondent:</strong> ${escapeHtml(report.respondent_name || "—")}</li>
          <li><strong>Incident date:</strong> ${escapeHtml(report.incident_date || "—")}</li>
        </ul>
        <p><a href="${escapeHtml(helpDeskLink(tenantId))}">Open Help Desk</a></p>
      </div>
    `;
    const result = await sendTransactionalEmail({
      to: staff.email,
      subject: `New E-Sumbong #${ref}`,
      html,
      text: `New E-Sumbong #${ref} from ${report.complainant_name || "resident"}. Open Help Desk to review.`,
    });
    if (result.success) emailsSent += 1;
    else errors.push(`staff ${staff.email}: ${result.error}`);
  }

  return { emailsSent, errors, skipped: false };
}

const STATUS_COPY = {
  under_review: {
    subject: "E-Sumbong Under Review / Sinusuri ang Sumbong",
    titleEn: "Your report is under review",
    titleTl: "Sinusuri na ang iyong sumbong",
    bodyEn: "Barangay staff have started reviewing your E-Sumbong report.",
    bodyTl: "Sinimulan nang suriin ng barangay ang iyong E-Sumbong.",
  },
  resolved: {
    subject: "E-Sumbong Resolved / Natapos ang Sumbong",
    titleEn: "Your report was marked resolved",
    titleTl: "Minarkahan nang resolved ang iyong sumbong",
    bodyEn: "Your E-Sumbong report has been marked as resolved by the barangay.",
    bodyTl: "Minarkahan ng barangay ang iyong E-Sumbong bilang resolved.",
  },
  dismissed: {
    subject: "E-Sumbong Update / Balita sa Sumbong",
    titleEn: "Update on your E-Sumbong",
    titleTl: "Balita sa iyong E-Sumbong",
    bodyEn: "Your E-Sumbong report was reviewed and marked dismissed. Contact the barangay office if you have questions.",
    bodyTl: "Nasuri ang iyong sumbong at minarkahan bilang dismissed. Makipag-ugnayan sa barangay kung may tanong.",
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

  const html = residentEmailShell({
    titleEn: copy.titleEn,
    titleTl: copy.titleTl,
    bodyEn: copy.bodyEn,
    bodyTl: copy.bodyTl,
    report,
    extraRows: [["Status", newStatus.replace(/_/g, " ")]],
  });

  const result = await sendTransactionalEmail({
    to: report.email,
    subject: copy.subject,
    html,
    text: `${copy.titleEn}\n${copy.titleTl}\nRef: ${reportRef(report)}`,
  });

  return result;
}

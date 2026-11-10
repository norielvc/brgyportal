/**
 * Request notification helpers:
 * - New request: resident RECEIVED + Review Request team SUBMITTED (if step sendEmail).
 * - Chairman step: APPROVED_STEP when status becomes captain_approval.
 */

import {
  fetchBarangayCaptainUsers,
  fetchTenantReviewStaff,
  fetchUsersByIds,
} from "./staffUserQueries";

export {
  fetchBarangayCaptainUsers,
  fetchTenantReviewStaff,
  fetchUsersByIds,
} from "./staffUserQueries";

export async function isEmailNotificationsEnabled(supabase) {
  try {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "emailNotifications")
      .maybeSingle();
    if (data?.value === false || data?.value === "false") return false;
  } catch {
    /* default on */
  }
  return true;
}

async function createInAppNotification(supabase, payload) {
  const { error } = await supabase.from("notifications").insert([payload]);
  if (error) console.error("[notify] in-app:", error.message);
  return !error;
}

function isReleasingOrTerminalStep(step) {
  if (!step) return true;
  const status = String(step.status || "").toLowerCase();
  const name = String(step.name || "").toLowerCase();
  return (
    status === "oic_review" ||
    status === "ready" ||
    status === "released" ||
    name.includes("releasing")
  );
}

/** First review step in tenant workflow (staff_review or earliest requiresApproval). */
function findInitialReviewStep(steps) {
  if (!steps?.length) return null;
  const staffReview = steps.find(
    (s) => String(s.status || "").toLowerCase() === "staff_review",
  );
  if (staffReview) return staffReview;
  return steps.find(
    (s) => s.requiresApproval && !isReleasingOrTerminalStep(s),
  );
}

/**
 * Email assignees on the Barangay Chairman step (captain_approval) when a request is endorsed.
 */
export async function notifyBarangayCaptainStep({
  supabase,
  tenantId,
  requestId,
  referenceNumber,
  certificateType,
  applicantName,
  comments = "",
  captainUserIds = [],
}) {
  const enabled = await isEmailNotificationsEnabled(supabase);
  if (!enabled) {
    return { emailsSent: 0, skipped: true, reason: "notifications_disabled" };
  }

  try {
    const { data: wfRow } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("tenant_id", tenantId)
      .eq("certificate_type", certificateType)
      .maybeSingle();
    const steps = wfRow?.workflow_config?.steps || [];
    const chairmanStep = steps.find((s) => {
      const st = String(s.status || "").toLowerCase();
      const name = String(s.name || "").toLowerCase();
      const role = String(s.officialRole || "").toLowerCase();
      return (
        st === "captain_approval" ||
        name.includes("chairman") ||
        name.includes("captain") ||
        role.includes("chairman")
      );
    });
    if (chairmanStep && chairmanStep.sendEmail === false) {
      return { emailsSent: 0, skipped: true, reason: "step_send_email_off" };
    }
  } catch (wfErr) {
    console.warn("[notify] chairman step workflow check:", wfErr.message);
  }

  let recipients = await fetchUsersByIds(supabase, captainUserIds, tenantId);
  if (!recipients.length) {
    recipients = await fetchBarangayCaptainUsers(
      supabase,
      tenantId,
      certificateType,
      captainUserIds,
    );
  }

  const { sendProcessNotification } = await import("./mailer");
  const seenEmails = new Set();
  let emailsSent = 0;

  for (const user of recipients) {
    const email = String(user.email || "").trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);

    const recipientName =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      "Barangay Chairman";

    const result = await sendProcessNotification({
      recipientEmail: email,
      recipientName,
      eventType: "APPROVED_STEP",
      certificateType,
      referenceNumber,
      applicantName: applicantName || "Applicant",
      comments: comments || "",
      requestId,
      tenantId,
    });

    if (result.success) emailsSent += 1;
    else
      console.warn(
        "[notify] chairman step email:",
        email,
        result.error || result.code,
      );
  }

  if (!emailsSent) {
    console.warn(
      "[notify] chairman step: no emails sent",
      referenceNumber,
      "recipients:",
      recipients.length,
    );
  }

  return {
    emailsSent,
    captainsEmailed: emailsSent,
    skipped: emailsSent === 0,
    reason: emailsSent === 0 ? "no_recipients" : undefined,
  };
}

/**
 * Notify resident (RECEIVED) and Review Request assignees (SUBMITTED) for a new request.
 */
export async function notifyNewCertificateRequest({
  supabase,
  tenantId,
  requestId,
  referenceNumber,
  certificateType,
  applicantName,
  applicantEmail,
  staffUserIds = [],
  residentId = null,
}) {
  const enabled = await isEmailNotificationsEnabled(supabase);
  if (!enabled) {
    console.warn("[notify] Email notifications disabled in system_settings");
    return { emailsSent: 0, skipped: true };
  }

  const { sendProcessNotification } = await import("./mailer");
  let emailsSent = 0;

  if (applicantEmail) {
    const result = await sendProcessNotification({
      recipientEmail: applicantEmail,
      recipientName: applicantName || "Applicant",
      eventType: "RECEIVED",
      certificateType,
      referenceNumber,
      applicantName: applicantName || "Applicant",
      comments: "",
      requestId,
      tenantId,
    });
    if (result.success) emailsSent += 1;
    else console.warn("[notify] resident email:", result.error || result.code);
  }

  let staffList = await fetchUsersByIds(supabase, staffUserIds, tenantId);
  if (!staffList.length) {
    staffList = await fetchTenantReviewStaff(supabase, tenantId);
  }

  let reviewStepSendEmail = true;
  try {
    const { data: wfRow } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("tenant_id", tenantId)
      .eq("certificate_type", certificateType)
      .maybeSingle();
    const reviewStep = findInitialReviewStep(
      wfRow?.workflow_config?.steps || [],
    );
    if (reviewStep && reviewStep.sendEmail === false) {
      reviewStepSendEmail = false;
    }
  } catch (wfErr) {
    console.warn("[notify] review step workflow check:", wfErr.message);
  }

  let staffEmailed = 0;
  if (reviewStepSendEmail && staffList.length) {
    const seenStaffEmail = new Set();
    for (const staff of staffList) {
      const email = String(staff.email || "").trim();
      if (!email) continue;
      const key = email.toLowerCase();
      if (seenStaffEmail.has(key)) continue;
      seenStaffEmail.add(key);

      const recipientName =
        [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim() ||
        "Review Team";

      const result = await sendProcessNotification({
        recipientEmail: email,
        recipientName,
        eventType: "SUBMITTED",
        certificateType,
        referenceNumber,
        applicantName: applicantName || "Applicant",
        comments: "",
        requestId,
        tenantId,
      });
      if (result.success) {
        emailsSent += 1;
        staffEmailed += 1;
      } else {
        console.warn(
          "[notify] review team email:",
          email,
          result.error || result.code,
        );
      }
    }
  }

  const captainUsers = await fetchBarangayCaptainUsers(
    supabase,
    tenantId,
    certificateType,
  );

  const seenInApp = new Set();
  for (const staff of [...staffList, ...captainUsers]) {
    const uid = String(staff.id);
    if (seenInApp.has(uid)) continue;
    seenInApp.add(uid);

    await createInAppNotification(supabase, {
      tenant_id: tenantId,
      user_id: staff.id,
      title: "New Request Assigned",
      message: `New request ${referenceNumber} from ${applicantName || "Applicant"} needs your review.`,
      type: "info",
      category: "assignment",
      reference_number: referenceNumber,
      request_id: requestId,
      link: `/requests?id=${encodeURIComponent(String(requestId))}`,
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  if (residentId) {
    const { data: residentUser } = await supabase
      .from("users")
      .select("id")
      .eq("resident_id", residentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (residentUser?.id) {
      await createInAppNotification(supabase, {
        tenant_id: tenantId,
        user_id: residentUser.id,
        title: "Request Received",
        message: `Your request ${referenceNumber} has been received and is being processed.`,
        type: "success",
        category: "request_submitted",
        reference_number: referenceNumber,
        request_id: requestId,
        link: `/track/${referenceNumber}`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return {
    emailsSent,
    staffEmailed,
    captainsEmailed: 0,
    staffNotified: seenInApp.size,
    skipped: false,
  };
}

/** Resolve users table rows by id (Supabase column is `id`, not `_id`). */
export async function fetchUsersForNotifications(supabase, userIds, tenantId) {
  return fetchUsersByIds(supabase, userIds, tenantId);
}

/**
 * Request notification helpers:
 * - New certificate request: resident email (RECEIVED) + Barangay Captain email (SUBMITTED).
 * - Captain step: email to Barangay Captain/Chairman only (APPROVED_STEP).
 * - Other staff steps receive in-app notifications only.
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

/**
 * Send email notification ONLY to the Barangay Captain when a request reaches captain_approval.
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
    return { emailsSent: 0, skipped: true };
  }

  const { sendProcessNotification } = await import("./mailer");
  const captainUsers = await fetchBarangayCaptainUsers(
    supabase,
    tenantId,
    certificateType,
    captainUserIds,
  );

  let emailsSent = 0;
  const seenEmails = new Set();
  for (const cap of captainUsers) {
    const email = String(cap.email || "").trim().toLowerCase();
    if (!email || seenEmails.has(email)) continue;
    seenEmails.add(email);

    const result = await sendProcessNotification({
      recipientEmail: cap.email,
      recipientName:
        `${cap.first_name || ""} ${cap.last_name || ""}`.trim() ||
        "Brgy. Captain",
      eventType: "APPROVED_STEP",
      certificateType,
      referenceNumber,
      applicantName: applicantName || "Applicant",
      comments,
      requestId,
      tenantId,
    });
    if (result.success) {
      emailsSent += 1;
      console.log(
        `📧 Captain step email sent to ${cap.email} for ${referenceNumber}`,
      );
    } else {
      console.warn(
        `[notify] captain email ${cap.email}:`,
        result.error || result.code,
      );
    }
  }

  return { emailsSent, captainsNotified: captainUsers.length };
}

/**
 * Notify applicant (RECEIVED) and send staff email ONLY to the Barangay Captain (SUBMITTED)
 * for a newly submitted certificate request of any type.
 * Step 1 review staff still receive in-app notifications.
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

  // Send staff email notification ONLY to the Barangay Captain
  const captainUsers = await fetchBarangayCaptainUsers(
    supabase,
    tenantId,
    certificateType,
  );
  const seenCaptainEmails = new Set();
  for (const cap of captainUsers) {
    const email = String(cap.email || "").trim().toLowerCase();
    if (!email || seenCaptainEmails.has(email)) continue;
    seenCaptainEmails.add(email);

    const result = await sendProcessNotification({
      recipientEmail: cap.email,
      recipientName:
        `${cap.first_name || ""} ${cap.last_name || ""}`.trim() ||
        "Brgy. Captain",
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
      console.log(
        `📧 New request email sent to Brgy. Captain (${cap.email}): ${referenceNumber}`,
      );
    } else {
      console.warn(
        `[notify] captain ${cap.email}:`,
        result.error || result.code,
      );
    }
  }

  // In-app notifications for Step 1 review staff + Barangay Captain
  let staffList = await fetchUsersByIds(supabase, staffUserIds, tenantId);
  if (!staffList.length) {
    staffList = await fetchTenantReviewStaff(supabase, tenantId);
  }

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
      link: "/requests",
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
    captainsEmailed: captainUsers.length,
    staffNotified: seenInApp.size,
    skipped: false,
  };
}

/** Resolve users table rows by id (Supabase column is `id`, not `_id`). */
export async function fetchUsersForNotifications(supabase, userIds, tenantId) {
  return fetchUsersByIds(supabase, userIds, tenantId);
}

/**
 * New-request emails: resident confirmation + staff assignment alerts.
 */

const REVIEW_ROLES = [
  "admin",
  "superadmin",
  "staff",
  "secretary",
  "captain",
  "treasurer",
  "clerk",
];

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

export async function fetchUsersByIds(supabase, userIds, tenantId) {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, status")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) {
    console.error("[notify] fetchUsersByIds:", error.message);
    return [];
  }
  return (data || []).filter((u) => u.status !== "inactive");
}

export async function fetchTenantReviewStaff(supabase, tenantId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, status")
    .eq("tenant_id", tenantId)
    .in("role", REVIEW_ROLES);
  if (error) {
    console.error("[notify] fetchTenantReviewStaff:", error.message);
    return [];
  }
  return (data || []).filter(
    (u) => u.status !== "inactive" && String(u.email || "").trim(),
  );
}

async function createInAppNotification(supabase, payload) {
  const { error } = await supabase.from("notifications").insert([payload]);
  if (error) console.error("[notify] in-app:", error.message);
  return !error;
}

/**
 * Notify applicant (RECEIVED) and review staff (SUBMITTED) for a new request.
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
    });
    if (result.success) emailsSent += 1;
    else console.warn("[notify] resident email:", result.error);
  }

  let staffList = await fetchUsersByIds(supabase, staffUserIds, tenantId);
  if (!staffList.length) {
    staffList = await fetchTenantReviewStaff(supabase, tenantId);
  }

  const seen = new Set();
  for (const staff of staffList) {
    const uid = String(staff.id);
    if (seen.has(uid)) continue;
    seen.add(uid);

    if (staff.email) {
      const result = await sendProcessNotification({
        recipientEmail: staff.email,
        recipientName: `${staff.first_name || ""} ${staff.last_name || ""}`.trim(),
        eventType: "SUBMITTED",
        certificateType,
        referenceNumber,
        applicantName: applicantName || "Applicant",
        comments: "",
        requestId,
      });
      if (result.success) emailsSent += 1;
      else console.warn(`[notify] staff ${staff.email}:`, result.error);
    }

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

  return { emailsSent, staffNotified: staffList.length, skipped: false };
}

/** Resolve users table rows by id (Supabase column is `id`, not `_id`). */
export async function fetchUsersForNotifications(supabase, userIds, tenantId) {
  return fetchUsersByIds(supabase, userIds, tenantId);
}

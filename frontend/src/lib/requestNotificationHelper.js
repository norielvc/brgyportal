/**
 * Request notification helpers:
 * - Staff email notifications are sent ONLY to the Barangay Captain (all certificate types + KapChat).
 * - Other staff steps receive in-app notifications only.
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
    .select("id, email, first_name, last_name, role, position, status")
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
    .select("id, email, first_name, last_name, role, position, status")
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

/**
 * Resolve active Barangay Captain user(s) for a tenant.
 * Matches users by:
 * 1) role === 'captain' or position matching Captain/Chairman/Punong Barangay
 * 2) assignedUsers on the 'captain_approval' / Barangay Captain step in workflow_configurations
 * 3) explicitCaptainUserIds passed by the caller
 */
export async function fetchBarangayCaptainUsers(
  supabase,
  tenantId,
  certificateType = null,
  explicitCaptainUserIds = [],
) {
  if (!tenantId) return [];

  const { data: tenantUsers, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role, position, status")
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("[notify] fetchBarangayCaptainUsers users:", error.message);
    return [];
  }

  const activeUsers = (tenantUsers || []).filter(
    (u) => u.status !== "inactive" && String(u.email || "").trim(),
  );

  const isCaptainRoleOrPosition = (u) => {
    const role = String(u.role || "").toLowerCase();
    const pos = String(u.position || "").toLowerCase();
    return (
      role === "captain" ||
      /captain|chairman|punong|kapitan/i.test(pos)
    );
  };

  const captainStepUserIds = new Set(
    (explicitCaptainUserIds || []).filter(Boolean).map(String),
  );

  try {
    const { data: wfRows } = await supabase
      .from("workflow_configurations")
      .select("certificate_type, workflow_config")
      .eq("tenant_id", tenantId);

    const rows = wfRows || [];
    const targetRows = certificateType
      ? rows.filter((r) => r.certificate_type === certificateType)
      : rows;
    const rowsToInspect = targetRows.length > 0 ? [...targetRows, ...rows] : rows;

    for (const row of rowsToInspect) {
      const steps = row?.workflow_config?.steps || [];
      for (const step of steps) {
        const stStatus = String(step.status || "").toLowerCase();
        const stName = String(step.name || "").toLowerCase();
        const stRole = String(step.officialRole || "").toLowerCase();
        if (
          stStatus === "captain_approval" ||
          /captain|chairman|punong/i.test(stName) ||
          /captain|chairman|punong/i.test(stRole)
        ) {
          for (const uid of step.assignedUsers || []) {
            if (uid) captainStepUserIds.add(String(uid));
          }
        }
      }
    }
  } catch (err) {
    console.warn("[notify] workflow_configurations captain lookup:", err.message);
  }

  const seen = new Set();
  const captains = [];
  for (const u of activeUsers) {
    const uid = String(u.id);
    if (seen.has(uid)) continue;
    if (isCaptainRoleOrPosition(u) || captainStepUserIds.has(uid)) {
      seen.add(uid);
      captains.push(u);
    }
  }

  return captains;
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
      recipientName: `${cap.first_name || ""} ${cap.last_name || ""}`.trim() || "Brgy. Captain",
      eventType: "APPROVED_STEP",
      certificateType,
      referenceNumber,
      applicantName: applicantName || "Applicant",
      comments,
      requestId,
    });
    if (result.success) {
      emailsSent += 1;
      console.log(`📧 Captain step email sent to ${cap.email} for ${referenceNumber}`);
    } else {
      console.warn(`[notify] captain email ${cap.email}:`, result.error || result.code);
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
      recipientName: `${cap.first_name || ""} ${cap.last_name || ""}`.trim() || "Brgy. Captain",
      eventType: "SUBMITTED",
      certificateType,
      referenceNumber,
      applicantName: applicantName || "Applicant",
      comments: "",
      requestId,
    });
    if (result.success) {
      emailsSent += 1;
      console.log(`📧 New request email sent to Brgy. Captain (${cap.email}): ${referenceNumber}`);
    } else {
      console.warn(`[notify] captain ${cap.email}:`, result.error || result.code);
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

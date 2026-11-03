/**
 * Supabase user lookups for notifications and access — no mailer/email dependencies.
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

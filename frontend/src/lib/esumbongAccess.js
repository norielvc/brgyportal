/**
 * E-Sumbong help desk: who receives new-report emails and who may open the tab/API.
 * Stored in barangay_settings (key esumbong_help_desk) — not workflow_configurations,
 * so we avoid certificate_type check constraints.
 */

import {
  fetchBarangayCaptainUsers,
  fetchUsersByIds,
} from "./staffUserQueries";

export const ESUMBONG_WORKFLOW_TYPE = "esumbong_help_desk";
export const ESUMBONG_SETTINGS_KEY = "esumbong_help_desk";

export const DEFAULT_ESUMBONG_SETTINGS = {
  notificationReceiverIds: [],
  accessUserIds: [],
};

const HELP_DESK_ROLES = new Set([
  "superadmin",
  "admin",
  "captain",
  "secretary",
  "staff",
  "clerk",
  "treasurer",
]);

function normalizeIdList(list) {
  return [...new Set((list || []).filter(Boolean).map(String))];
}

export function normalizeEsumbongSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_ESUMBONG_SETTINGS };
  }
  return {
    notificationReceiverIds: normalizeIdList(raw.notificationReceiverIds),
    accessUserIds: normalizeIdList(raw.accessUserIds),
  };
}

export async function getEsumbongSettings(supabase, tenantId) {
  if (!supabase || !tenantId) {
    return { ...DEFAULT_ESUMBONG_SETTINGS };
  }
  try {
    const { data, error } = await supabase
      .from("barangay_settings")
      .select("value")
      .eq("tenant_id", tenantId)
      .eq("key", ESUMBONG_SETTINGS_KEY)
      .maybeSingle();
    if (error) {
      console.warn("[esumbong] settings load:", error.message);
      return { ...DEFAULT_ESUMBONG_SETTINGS };
    }
    const value = data?.value;
    if (value?.esumbongSettings) {
      return normalizeEsumbongSettings(value.esumbongSettings);
    }
    return normalizeEsumbongSettings(value);
  } catch (err) {
    console.warn("[esumbong] settings load:", err.message);
    return { ...DEFAULT_ESUMBONG_SETTINGS };
  }
}

export async function saveEsumbongSettings(supabase, tenantId, settings) {
  const esumbongSettings = normalizeEsumbongSettings(settings);
  const { error } = await supabase.from("barangay_settings").upsert(
    {
      key: ESUMBONG_SETTINGS_KEY,
      tenant_id: tenantId,
      value: { esumbongSettings },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key,tenant_id" },
  );
  if (error) throw error;
  return esumbongSettings;
}

export function userIdFromAuthUser(user) {
  return String(user?._id || user?.id || "").trim();
}

/** Admin and Captain roles that always manage E-Sumbong settings and access when list is restricted. */
export function canAlwaysAccessEsumbong(user) {
  const role = String(user?.role || "").toLowerCase();
  const pos = String(user?.position || "").toLowerCase();
  return (
    role === "superadmin" ||
    role === "super_admin" ||
    role === "admin" ||
    role === "captain" ||
    /captain|chairman|punong/i.test(pos)
  );
}

/**
 * When accessUserIds is empty, any help-desk staff role may view E-Sumbong.
 * When set, only listed users plus superadmin/admin/captain.
 */
export function userHasEsumbongAccess(user, settings) {
  if (!user) return false;
  if (canAlwaysAccessEsumbong(user)) return true;

  const role = String(user?.role || "").toLowerCase();
  const accessIds = settings?.accessUserIds || [];
  const uid = userIdFromAuthUser(user);

  if (accessIds.length > 0) {
    return uid && accessIds.includes(uid);
  }

  return HELP_DESK_ROLES.has(role);
}

export async function fetchEsumbongNotificationRecipients(
  supabase,
  tenantId,
  settings,
) {
  const ids = settings?.notificationReceiverIds || [];
  if (ids.length > 0) {
    return fetchUsersByIds(supabase, ids, tenantId);
  }
  // Chairman does NOT automatically receive E-Sumbong emails.
  // Only staff explicitly selected in "New report email receivers" receive emails.
  return [];
}

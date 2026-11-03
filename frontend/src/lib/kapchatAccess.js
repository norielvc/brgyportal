/**
 * KapChat help desk: who receives new-message emails and who may open KapChat.
 * Stored in barangay_settings (key kapchat_help_desk).
 */

import {
  fetchBarangayCaptainUsers,
  fetchUsersByIds,
} from "./staffUserQueries";

export const KAPCHAT_WORKFLOW_TYPE = "kapchat_help_desk";
export const KAPCHAT_SETTINGS_KEY = "kapchat_help_desk";

export const DEFAULT_KAPCHAT_SETTINGS = {
  notificationReceiverIds: [],
  accessUserIds: [],
};

const HELP_DESK_ROLES = new Set([
  "superadmin",
  "super_admin",
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

export function normalizeKapchatSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_KAPCHAT_SETTINGS };
  }
  return {
    notificationReceiverIds: normalizeIdList(raw.notificationReceiverIds),
    accessUserIds: normalizeIdList(raw.accessUserIds),
  };
}

export async function getKapchatSettings(supabase, tenantId) {
  if (!supabase || !tenantId) {
    return { ...DEFAULT_KAPCHAT_SETTINGS };
  }
  try {
    const { data, error } = await supabase
      .from("barangay_settings")
      .select("value")
      .eq("tenant_id", tenantId)
      .eq("key", KAPCHAT_SETTINGS_KEY)
      .maybeSingle();
    if (error) {
      console.warn("[kapchat] settings load:", error.message);
      return { ...DEFAULT_KAPCHAT_SETTINGS };
    }
    const value = data?.value;
    if (value?.kapchatSettings) {
      return normalizeKapchatSettings(value.kapchatSettings);
    }
    return normalizeKapchatSettings(value);
  } catch (err) {
    console.warn("[kapchat] settings load:", err.message);
    return { ...DEFAULT_KAPCHAT_SETTINGS };
  }
}

export async function saveKapchatSettings(supabase, tenantId, settings) {
  const kapchatSettings = normalizeKapchatSettings(settings);
  const { error } = await supabase.from("barangay_settings").upsert(
    {
      key: KAPCHAT_SETTINGS_KEY,
      tenant_id: tenantId,
      value: { kapchatSettings },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key,tenant_id" },
  );
  if (error) throw error;
  return kapchatSettings;
}

export function userIdFromAuthUser(user) {
  return String(user?._id || user?.id || "").trim();
}

/** Admin roles that always manage KapChat settings and access when list is restricted. */
export function canAlwaysAccessKapchat(user) {
  const role = String(user?.role || "").toLowerCase();
  return role === "superadmin" || role === "super_admin" || role === "admin";
}

/**
 * When accessUserIds is empty, any help-desk staff role may view KapChat.
 * When set, only listed users plus superadmin/admin.
 */
export function userHasKapchatAccess(user, settings) {
  if (!user) return false;
  if (canAlwaysAccessKapchat(user)) return true;

  const role = String(user?.role || "").toLowerCase();
  const accessIds = settings?.accessUserIds || [];
  const uid = userIdFromAuthUser(user);

  if (accessIds.length > 0) {
    return Boolean(uid && accessIds.includes(uid));
  }

  return HELP_DESK_ROLES.has(role);
}

export async function fetchKapchatNotificationRecipients(
  supabase,
  tenantId,
  settings,
) {
  const ids = settings?.notificationReceiverIds || [];
  if (ids.length > 0) {
    return fetchUsersByIds(supabase, ids, tenantId);
  }
  return fetchBarangayCaptainUsers(supabase, tenantId);
}


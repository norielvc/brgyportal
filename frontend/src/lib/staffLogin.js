import { normalizeHostname } from "@/lib/tenantHost";

const DEFAULT_STAFF_LOGIN = "https://brgydesk.com/login";

/** Hosts where /login is allowed (local dev + official staff domain). */
export function isStaffLoginHost(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "brgydesk.com") return true;
  return false;
}

/** Full URL for staff sign-in (used from tenant portals and redirects). */
export function getStaffLoginUrl(query = "") {
  const base = (
    process.env.NEXT_PUBLIC_STAFF_LOGIN_URL || DEFAULT_STAFF_LOGIN
  ).replace(/\/$/, "");
  const url = base.endsWith("/login") ? base : `${base}/login`;
  if (!query) return url;
  const q = String(query).startsWith("?") ? query : `?${query}`;
  return `${url}${q}`;
}

export function redirectToStaffLogin() {
  if (typeof window === "undefined") return;
  window.location.href = getStaffLoginUrl();
}

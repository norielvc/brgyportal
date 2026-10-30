/** Hosts that serve the staff app, not a barangay portal. */
const PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "brgydesk.com",
  "www.brgydesk.com",
  "brgydesk.vercel.app",
  "brgydesk.up.railway.app",
]);

const BRGYDESK_SUFFIX = ".brgydesk.com";

export function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .split(":")[0];
}

/**
 * Tenant id implied by the hostname.
 * Platform hosts (apex, www, Vercel, localhost) return null so /{tenant} still works.
 * ibaoeste.brgydesk.com → "ibaoeste"
 */
export function tenantFromHostname(hostname) {
  const host = normalizeHostname(hostname);
  if (!host || PLATFORM_HOSTS.has(host) || host.endsWith(".vercel.app")) {
    return null;
  }

  if (host.endsWith(BRGYDESK_SUFFIX)) {
    const sub = host.slice(0, -BRGYDESK_SUFFIX.length);
    if (!sub || sub === "www" || sub.includes(".")) return null;
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub)) return null;
    return sub;
  }

  if (host.includes("-brgydesk.up.railway.app")) {
    return host.split("-brgydesk")[0] || null;
  }

  if (host.startsWith("ibaoeste.")) return "ibaoeste";
  if (host.includes("demo")) return "demo";

  if (host.includes("railway.app") && !host.startsWith("brgydesk.")) {
    const prefix = host.split(".")[0];
    const tenant = prefix.includes("-") ? prefix.split("-")[0] : prefix;
    return tenant || null;
  }

  return null;
}

/** Public path for a tenant page. On that tenant's subdomain the tenant prefix is omitted. */
export function publicTenantPath(tenantId, subpath = "") {
  const tenant = String(tenantId || "").toLowerCase();
  const extra = subpath ? `/${String(subpath).replace(/^\/+/, "")}` : "";
  if (typeof window !== "undefined") {
    const fromHost = tenantFromHostname(window.location.hostname);
    if (fromHost && fromHost === tenant) return extra || "/";
  }
  return `/${tenant}${extra}`;
}

/** Canonical public origin. Iba O' Este uses the custom domain; other tenants stay on the path URL. */
export function publicPortalCanonical(tenantId) {
  const tenant = String(tenantId || "").toLowerCase();
  if (tenant === "ibaoeste") return "https://ibaoeste.brgydesk.com";
  return `https://brgydesk.vercel.app/${tenant}`;
}

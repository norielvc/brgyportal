import { publicPortalCanonical } from "@/lib/tenantHost";

/** Preferred static OG assets under /public/og/{tenant}.jpg|.png */
const TENANT_OG_FILES = {
  ibaoeste: ["/og/ibaoeste.jpg", "/og/ibaoeste.png", "/images/community.jpg"],
  demo: ["/og/demo.jpg", "/images/bdlogo.png"],
};

export function portalSiteOrigin(tenantId) {
  return publicPortalCanonical(String(tenantId || "ibaoeste").toLowerCase()).replace(
    /\/$/,
    "",
  );
}

/**
 * Absolute URL for link previews (Open Graph / Messenger / Facebook).
 * Prefer a static file under /public/og — crawlers often HEAD the URL and
 * reject API routes that only allow GET.
 */
export function buildPortalShareImageUrl(tenantId) {
  const tenant = String(tenantId || "ibaoeste").toLowerCase();
  const origin = portalSiteOrigin(tenant);
  const [primaryStatic] = tenantOgFileCandidates(tenant);
  if (primaryStatic?.startsWith("/og/")) {
    return `${origin}${primaryStatic}`;
  }
  return `${origin}/api/portal/share-image?tenant=${encodeURIComponent(tenant)}`;
}

export function buildPortalSharePageUrl(tenantId) {
  return portalSiteOrigin(tenantId);
}

export function tenantOgFileCandidates(tenantId) {
  const tenant = String(tenantId || "ibaoeste").toLowerCase();
  return TENANT_OG_FILES[tenant] || TENANT_OG_FILES.ibaoeste;
}

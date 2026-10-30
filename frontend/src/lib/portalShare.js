import { publicPortalCanonical } from "@/lib/tenantHost";
import { getPortalStrings } from "@/lib/portalLang";

/** Preferred static OG assets under /public/og/{tenant}.jpg|.png */
const TENANT_OG_FILES = {
  ibaoeste: ["/og/ibaoeste.jpg", "/og/ibaoeste.png", "/images/community.jpg"],
  demo: ["/og/demo.jpg", "/images/bdlogo.png"],
};

/** Bump when replacing thumbnail so Facebook/Messenger refetch the image. */
const OG_IMAGE_CACHE_VERSION =
  process.env.NEXT_PUBLIC_OG_IMAGE_VERSION || "2";

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
    return `${origin}${primaryStatic}?v=${OG_IMAGE_CACHE_VERSION}`;
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

function toTitleCaseName(name) {
  return String(name || "")
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build share meta on the server so crawlers see og: tags in the first HTML byte. */
export async function fetchPortalShareMetaForSSR(tenantId) {
  const tenant = String(tenantId || "ibaoeste").toLowerCase();
  const p = getPortalStrings();
  let displayName = tenant === "ibaoeste" ? "Iba O' Este" : toTitleCaseName(tenant);
  let municipality = "";
  let region = "";

  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await supabase
        .from("tenants")
        .select("name, municipality, region")
        .eq("id", tenant)
        .maybeSingle();
      if (data?.name) displayName = data.name;
      municipality = data?.municipality || "";
      region = data?.region || "";
    }
  } catch {
    /* use defaults */
  }

  const shortName = toTitleCaseName(displayName);
  const nameUpper = String(displayName).toUpperCase();
  const subtitleParts = [municipality, region].filter(Boolean);
  const geoSubtitle =
    subtitleParts.length > 0
      ? `${subtitleParts.join(", ")} · ${p.pageTitleSuffix}`
      : p.pageTitleSuffix;

  return {
    tenantId: tenant,
    shortName,
    nameUpper,
    subtitle: geoSubtitle,
    pageTitleSuffix: p.pageTitleSuffix,
    pageDescription: p.pageDescription,
    description: `${nameUpper}, ${geoSubtitle}. ${p.pageDescription}`,
    sharePageUrl: buildPortalSharePageUrl(tenant),
    shareImageUrl: buildPortalShareImageUrl(tenant),
    imageWidth: 1200,
    imageHeight: 630,
    primaryColor: "#112e1f",
  };
}

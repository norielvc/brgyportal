import PortalPageContent from "@/components/Portal/PortalPageContent";
import PortalShareHead from "@/components/Portal/PortalShareHead";
import { tenantFromHostname } from "@/lib/tenantHost";
import { fetchPortalShareMetaForSSR } from "@/lib/portalShare";

export default function Home({ initialTenantId, shareMeta }) {
  return (
    <>
      <PortalShareHead meta={shareMeta} />
      <PortalPageContent initialTenantId={initialTenantId} />
    </>
  );
}

export async function getServerSideProps({ req, query }) {
  const host = req.headers.host || "";
  const fromQuery =
    typeof query.tenant === "string" ? query.tenant.trim().toLowerCase() : "";
  const tenantId = (fromQuery || tenantFromHostname(host) || "").toLowerCase();

  if (!tenantId) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const shareMeta = await fetchPortalShareMetaForSSR(tenantId);
  const proto =
    req.headers["x-forwarded-proto"] === "http" ? "http" : "https";
  const rawUrl = req.url || "/";
  const requestUrl = `${proto}://${host}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`.split("#")[0];
  shareMeta.canonicalUrl = shareMeta.sharePageUrl;
  shareMeta.sharePageUrl = requestUrl;

  return {
    props: {
      initialTenantId: tenantId,
      shareMeta,
    },
  };
}

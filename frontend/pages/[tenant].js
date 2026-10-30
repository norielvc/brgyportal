import { useRouter } from "next/router";
import PortalPageContent from "@/components/Portal/PortalPageContent";
import PortalShareHead from "@/components/Portal/PortalShareHead";
import { fetchPortalShareMetaForSSR } from "@/lib/portalShare";

export default function DynamicTenantPortal({ initialTenantId, shareMeta }) {
  const router = useRouter();
  const { tenant } = router.query || {};
  const effectiveTenant = initialTenantId || (Array.isArray(tenant) ? tenant[0] : tenant);

  if (!effectiveTenant) return null; // Wait for router to be ready

  // Handle cases where the tenant might be a static route that Next.js didn't pick up correctly
  // (though Next.js usually handles this automatically by prioritizing static routes)
  const staticRoutes = [
    "login",
    "pricing",
    "landing",
    "api",
    "admin",
    "dashboard",
    "robots.txt",
    "sitemap.xml",
    "favicon.ico",
  ];
  if (staticRoutes.includes(effectiveTenant)) {
    return null; // Let the other page handle it
  }

  return (
    <>
      <PortalShareHead meta={shareMeta} />
      <PortalPageContent initialTenantId={effectiveTenant} />
    </>
  );
}

export async function getStaticPaths() {
  // Generate tenant pages on-demand
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const tenant = (params?.tenant || "").toLowerCase();
  const shareMeta = tenant ? await fetchPortalShareMetaForSSR(tenant) : null;
  return {
    props: {
      initialTenantId: tenant || null,
      shareMeta,
    },
  };
}

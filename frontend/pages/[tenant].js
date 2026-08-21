import { useRouter } from "next/router";
import PortalPageContent from "@/components/Portal/PortalPageContent";

export default function DynamicTenantPortal({ initialTenantId }) {
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
  ];
  if (staticRoutes.includes(effectiveTenant)) {
    return null; // Let the other page handle it
  }

  return <PortalPageContent initialTenantId={effectiveTenant} />;
}

export async function getStaticPaths() {
  // Generate tenant pages on-demand
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      initialTenantId: params?.tenant?.toLowerCase() || null,
    },
  };
}

import { useRouter } from 'next/router';
import PortalPageContent from '@/components/Portal/PortalPageContent';

export default function DynamicTenantPortal() {
  const router = useRouter();
  const { tenant } = router.query;

  if (!tenant) return null; // Wait for router to be ready

  // Handle cases where the tenant might be a static route that Next.js didn't pick up correctly
  // (though Next.js usually handles this automatically by prioritizing static routes)
  const staticRoutes = ['login', 'pricing', 'landing', 'api', 'admin', 'dashboard'];
  if (staticRoutes.includes(tenant)) {
     return null; // Let the other page handle it
  }

  return <PortalPageContent initialTenantId={tenant} />;
}

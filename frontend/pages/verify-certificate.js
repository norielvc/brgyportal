import { useRouter } from "next/router";
import CertificateVerificationPage from "@/components/Portal/CertificateVerificationPage";
import { tenantFromHostname } from "@/lib/tenantHost";

export default function VerifyCertificateRoute() {
  const router = useRouter();
  const { no, tenant } = router.query;
  const queryTenant = Array.isArray(tenant) ? tenant[0] : tenant;
  const hostTenant =
    typeof window !== "undefined" ? tenantFromHostname(window.location.hostname) : "";
  const tenantId = queryTenant || hostTenant;
  const verifyNo = Array.isArray(no) ? no[0] : no;

  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-[#eceae4] flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <CertificateVerificationPage
      tenantId={tenantId}
      verifyNo={verifyNo}
    />
  );
}

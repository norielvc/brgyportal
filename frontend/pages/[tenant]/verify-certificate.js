import { useRouter } from "next/router";
import CertificateVerificationPage from "@/components/Portal/CertificateVerificationPage";

/** QR target: /ibaoeste/verify-certificate?no=BD-... */
export default function TenantVerifyCertificateRoute() {
  const router = useRouter();
  const { tenant, no } = router.query;
  const tenantId = Array.isArray(tenant) ? tenant[0] : tenant;
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

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PortalPageContent from "@/components/Portal/PortalPageContent";
import { tenantFromHostname } from "@/lib/tenantHost";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState("loading"); // 'loading', 'portal'
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      const fromQuery = (urlParams.get("tenant") || "").trim().toLowerCase();
      const tenant = fromQuery || tenantFromHostname(hostname);

      if (tenant) {
        setTenantId(tenant);
        setView("portal");
      } else {
        router.replace("/login");
      }
    }
  }, [router]);

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "portal") {
    return <PortalPageContent initialTenantId={tenantId} />;
  }

  return null;
}

import { Construction } from "lucide-react";
import { portalMaintenanceOverlayMessage } from "@/lib/portalMaintenance";

export default function PortalMaintenanceOverlay({ barangayName = "Barangay" }) {
  const message = portalMaintenanceOverlayMessage();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-6 py-12 bg-[#022c22]/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-maint-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#064e3b] shadow-2xl p-8 text-center text-white">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Construction className="h-7 w-7 text-emerald-200" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/90 mb-2">
          Maintenance
        </p>
        <h1 id="portal-maint-title" className="text-xl font-bold mb-3">
          {barangayName}
        </h1>
        <p className="text-sm text-emerald-50/90 leading-relaxed">{message}</p>
        <p className="mt-4 text-xs text-emerald-200/70">
          Hindi muna available ang mga form at serbisyo online. Salamat po sa
          pag-unawa.
        </p>
      </div>
    </div>
  );
}

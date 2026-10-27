import React from "react";
import {
  ClipboardList,
  FilePlus2,
  ShieldAlert,
  Download,
  CheckCircle2,
} from "lucide-react";
import { getPortalStrings } from "@/lib/portalLang";

/** Keep in sync with page bottom padding / FAB offset in PortalPageContent */
export const MOBILE_ACTION_BAR_CLEARANCE =
  "calc(4.875rem + env(safe-area-inset-bottom, 0px))";

const ICON_SIZE = "w-[1.125rem] h-[1.125rem]";
const ICON_STROKE = 1.75;

export default function ResidentMobileActionBar({
  onRequestDocs,
  onTrackStatus,
  onESumbong,
  onInstallApp,
  isInstalled,
}) {
  const p = getPortalStrings();

  const items = [
    {
      key: "track",
      onClick: onTrackStatus,
      icon: ClipboardList,
      label: p.mobileTrack,
    },
    {
      key: "apply",
      onClick: onRequestDocs,
      icon: FilePlus2,
      label: p.mobileApply,
      emphasis: true,
    },
    {
      key: "sumbong",
      onClick: onESumbong,
      icon: ShieldAlert,
      label: p.esumbong,
    },
    {
      key: "install",
      onClick: onInstallApp,
      icon: isInstalled ? CheckCircle2 : Download,
      label: isInstalled ? p.mobileAppActive : p.mobileInstall,
      showBadge: !isInstalled,
    },
  ];

  return (
    <nav
      aria-label={p.mobileActionBarAria}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
    >
      <div className="pointer-events-auto border-t border-white/10 bg-[#112e1f]/98 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.2)] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="grid grid-cols-4 gap-1 max-w-lg mx-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const emphasis = item.emphasis;

            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center gap-1 min-h-[56px] py-1 rounded-lg active:bg-white/[0.06] touch-manipulation transition-colors"
              >
                <span
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full shrink-0 ${
                    emphasis
                      ? "bg-white text-[#112e1f] shadow-sm"
                      : "bg-white/10 text-white/90"
                  }`}
                  aria-hidden
                >
                  <Icon className={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  {item.showBadge && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/90 ring-1 ring-[#112e1f]" />
                  )}
                </span>
                <span
                  className={`text-[10px] leading-tight text-center line-clamp-2 max-w-[5rem] ${
                    emphasis ? "font-semibold text-white" : "font-medium text-white/70"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

import { useEffect } from "react";

function clearPanelViewportStyles(panel) {
  if (!panel) return;
  panel.style.top = "";
  panel.style.left = "";
  panel.style.width = "";
  panel.style.height = "";
  panel.style.maxHeight = "";
}

/**
 * Keeps a fixed full-screen modal panel aligned with visualViewport on mobile
 * (iOS/Android software keyboard shrinks the layout viewport otherwise).
 */
export default function useMobileModalViewport(panelRef, isActive) {
  useEffect(() => {
    if (!isActive) return;
    const panel = panelRef?.current;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!panel || !vv) return;

    const syncPanelToViewport = () => {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      if (!mobile) {
        clearPanelViewportStyles(panel);
        return;
      }
      const layoutH = window.innerHeight || vv.height;
      const keyboardLikelyOpen =
        vv.height < layoutH * 0.82 || vv.offsetTop > 8;
      if (!keyboardLikelyOpen) {
        clearPanelViewportStyles(panel);
        return;
      }
      panel.style.top = `${vv.offsetTop}px`;
      panel.style.left = `${vv.offsetLeft}px`;
      panel.style.width = `${vv.width}px`;
      panel.style.height = `${vv.height}px`;
      panel.style.maxHeight = `${vv.height}px`;
    };

    syncPanelToViewport();
    vv.addEventListener("resize", syncPanelToViewport);
    vv.addEventListener("scroll", syncPanelToViewport);
    return () => {
      vv.removeEventListener("resize", syncPanelToViewport);
      vv.removeEventListener("scroll", syncPanelToViewport);
      clearPanelViewportStyles(panel);
    };
  }, [isActive, panelRef]);
}

/** Panel + overlay wrapper classes used by certificate request modals. */
export const certModalOverlayClass =
  "fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center sm:p-4";

export const certModalPanelClass =
  "fixed z-[51] inset-0 flex flex-col min-h-0 bg-white overflow-hidden shadow-2xl sm:static sm:z-auto sm:inset-auto sm:w-full sm:max-w-2xl sm:max-h-[92vh] sm:rounded-2xl sm:animate-in sm:zoom-in-95 sm:fade-in sm:duration-300";

export const certModalScrollClass =
  "flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-3 sm:py-6";

/** Extra bottom space on small screens so purpose dropdowns clear the action bar. */
export const certModalScrollPurposeClass =
  `${certModalScrollClass} max-sm:pb-28`;

export const certModalFooterClass =
  "relative z-[70] border-t border-gray-200 bg-white px-3 sm:px-8 py-2 sm:py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] pb-[max(0.375rem,env(safe-area-inset-bottom))]";

export const certModalFooterBackClass =
  "shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors touch-manipulation min-h-[40px] sm:min-h-0";

export const certModalFooterPrimaryClass =
  "shrink-0 flex-1 sm:flex-none min-w-0 max-w-[58%] sm:max-w-none justify-center px-3 py-2 sm:px-6 sm:py-2.5 text-white rounded-lg font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[40px] sm:min-h-0";

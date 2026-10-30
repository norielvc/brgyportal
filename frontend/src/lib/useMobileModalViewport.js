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

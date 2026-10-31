import { useEffect } from "react";

function clearPanelViewportStyles(panel) {
  if (!panel) return;
  panel.style.top = "";
  panel.style.left = "";
  panel.style.width = "";
  panel.style.height = "";
  panel.style.maxHeight = "";
  panel.style.bottom = "";
}

function isFormFieldFocused() {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  if (!el || el === document.body) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    return !["button", "submit", "checkbox", "radio", "file", "hidden", "image"].includes(
      type,
    );
  }
  return Boolean(el.isContentEditable);
}

/**
 * Keeps a fixed full-screen modal panel aligned with visualViewport on mobile
 * when the software keyboard is open. Avoids shrinking the panel for browser
 * chrome / false visualViewport deltas (which left a gap above the footer).
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
      const heightLost = Math.max(0, layoutH - vv.height);
      const focusedField = isFormFieldFocused();

      const keyboardLikelyOpen =
        focusedField &&
        (heightLost > 120 || (vv.offsetTop > 28 && heightLost > 48));

      if (!keyboardLikelyOpen) {
        clearPanelViewportStyles(panel);
        return;
      }

      panel.style.top = `${vv.offsetTop}px`;
      panel.style.left = `${vv.offsetLeft}px`;
      panel.style.width = `${vv.width}px`;
      panel.style.height = `${vv.height}px`;
      panel.style.maxHeight = `${vv.height}px`;
      panel.style.bottom = "auto";
    };

    const onFocusChange = () => {
      requestAnimationFrame(syncPanelToViewport);
    };

    syncPanelToViewport();
    vv.addEventListener("resize", syncPanelToViewport);
    vv.addEventListener("scroll", syncPanelToViewport);
    window.addEventListener("focusin", onFocusChange);
    window.addEventListener("focusout", onFocusChange);

    return () => {
      vv.removeEventListener("resize", syncPanelToViewport);
      vv.removeEventListener("scroll", syncPanelToViewport);
      window.removeEventListener("focusin", onFocusChange);
      window.removeEventListener("focusout", onFocusChange);
      clearPanelViewportStyles(panel);
    };
  }, [isActive, panelRef]);
}

/** Full-screen overlay wrapper (centers panel on sm+). */
export const certModalOverlayClass =
  "fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center sm:p-4";

/**
 * Backdrop must stay inside the overlay (absolute, not fixed) so it does not
 * stack above the panel body and block clicks while the footer (high z) still works.
 */
export const certModalBackdropClass =
  "absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]";

export const certModalBackdropHeavyClass =
  "absolute inset-0 z-0 bg-black/80 backdrop-blur-md";

export const certModalPanelClass =
  "relative z-10 pointer-events-auto w-full flex flex-col min-h-0 bg-white overflow-hidden shadow-2xl max-sm:fixed max-sm:z-[51] max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] sm:static sm:inset-auto sm:max-w-2xl sm:max-h-[92vh] sm:rounded-2xl sm:animate-in sm:zoom-in-95 sm:fade-in sm:duration-300";

export const certModalScrollClass =
  "min-h-0 overscroll-contain overflow-y-auto px-4 sm:px-8 py-3 sm:py-6 max-sm:flex-1 sm:flex-none sm:max-h-[calc(92vh-13rem)]";

/** Extra bottom space on purpose step (dropdowns use portal; padding helps scroll). */
export const certModalScrollPurposeClass =
  `${certModalScrollClass} max-sm:pb-28 sm:pb-8`;

export const certModalFooterClass =
  "relative border-t border-gray-200 bg-white px-3 sm:px-8 py-2 sm:py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 max-sm:mt-auto shadow-[0_-2px_8px_rgba(0,0,0,0.05)] pb-[max(0.375rem,env(safe-area-inset-bottom))]";

export const certModalFooterBackClass =
  "shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors touch-manipulation min-h-[40px] sm:min-h-0";

export const certModalFooterPrimaryClass =
  "shrink-0 flex-1 sm:flex-none min-w-0 max-w-[58%] sm:max-w-none justify-center px-3 py-2 sm:px-6 sm:py-2.5 text-white rounded-lg font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 sm:gap-2 touch-manipulation min-h-[40px] sm:min-h-0";

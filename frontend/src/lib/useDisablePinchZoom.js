import { useEffect } from "react";
import { isIosBrowser, resetIosViewportAfterKeyboard } from "./iosViewport";

export const VIEWPORT_ZOOM_LOCKED =
  "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";

/** Disable pinch / double-tap zoom on mobile (restores prior viewport on unmount). */
export function useDisablePinchZoom(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const prevViewport = viewportMeta?.getAttribute("content") ?? "";

    if (viewportMeta) viewportMeta.setAttribute("content", VIEWPORT_ZOOM_LOCKED);

    const onTouchMove = (e) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });

    const onFocusOut = (e) => {
      if (!isIosBrowser()) return;
      const t = e.target;
      if (!t || !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      window.setTimeout(() => {
        if (document.activeElement?.tagName === "BODY" || !isFormControl(document.activeElement)) {
          resetIosViewportAfterKeyboard();
        }
      }, 80);
    };

    function isFormControl(el) {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "TEXTAREA" || tag === "SELECT" || tag === "INPUT";
    }

    document.addEventListener("focusout", onFocusOut);

    return () => {
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("touchmove", onTouchMove);
      if (viewportMeta && prevViewport) {
        viewportMeta.setAttribute("content", prevViewport);
      }
    };
  }, [enabled]);
}

export default useDisablePinchZoom;

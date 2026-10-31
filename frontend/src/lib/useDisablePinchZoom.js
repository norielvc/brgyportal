import { useEffect } from "react";

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

    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      if (viewportMeta && prevViewport) {
        viewportMeta.setAttribute("content", prevViewport);
      }
    };
  }, [enabled]);
}

export default useDisablePinchZoom;

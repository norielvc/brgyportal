import { useEffect } from "react";
import { useDisablePinchZoom } from "./useDisablePinchZoom";

/** Horizontal swipe lock + pinch zoom lock while E-Sumbong full page is open (mobile/PWA). */
export function useEsumbongPageInteractionLock(enabled = true) {
  useDisablePinchZoom(enabled);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    html.style.overflowX = "hidden";
    body.style.overflowX = "hidden";
    html.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorX = "none";
    html.style.touchAction = "pan-y";
    body.style.touchAction = "pan-y";

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        return;
      }
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 8) e.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      html.style.overflowX = "";
      body.style.overflowX = "";
      html.style.overscrollBehaviorX = "";
      body.style.overscrollBehaviorX = "";
      html.style.touchAction = "";
      body.style.touchAction = "";
    };
  }, [enabled]);
}

export default useEsumbongPageInteractionLock;

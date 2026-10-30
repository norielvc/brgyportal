import { useEffect } from "react";

// Reference counter so multiple stacked modals don't prematurely unlock scroll
let activeLocks = 0;
let originalStyles = null;

/** Restore scroll without smooth animation (portal uses global scroll-behavior: smooth). */
function restoreScrollPosition(scrollY) {
  const html = document.documentElement;
  const prevHtmlBehavior = html.style.scrollBehavior;
  const prevBodyBehavior = document.body.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";

  try {
    window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, scrollY);
  }

  requestAnimationFrame(() => {
    html.style.scrollBehavior = prevHtmlBehavior;
    document.body.style.scrollBehavior = prevBodyBehavior;
  });
}

function prefersLightScrollLock() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

export function lockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocks++;
  if (activeLocks === 1) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const lightLock = prefersLightScrollLock();

    originalStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      scrollY,
      lightLock,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (!lightLock) {
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
  }
}

export function unlockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0 && originalStyles) {
    const scrollY = originalStyles.scrollY ?? 0;

    document.documentElement.style.overflow = originalStyles.htmlOverflow || "";
    document.body.style.overflow = originalStyles.overflow || "";
    document.body.style.paddingRight = originalStyles.paddingRight || "";
    document.body.style.position = originalStyles.bodyPosition || "";
    document.body.style.top = originalStyles.bodyTop || "";
    document.body.style.left = originalStyles.bodyLeft || "";
    document.body.style.right = originalStyles.bodyRight || "";
    document.body.style.width = originalStyles.bodyWidth || "";
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");

    originalStyles = null;
    restoreScrollPosition(scrollY);
  }
}

/**
 * React hook to disable background scrolling when a modal is active.
 * @param {boolean} isLocked - Whether scroll should be locked (defaults to true)
 */
export default function useScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}

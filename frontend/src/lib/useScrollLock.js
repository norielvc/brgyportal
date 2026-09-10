import { useEffect } from "react";

// Reference counter so multiple stacked modals don't prematurely unlock scroll
let activeLocks = 0;
let originalStyles = null;

export function lockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocks++;
  if (activeLocks === 1) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    originalStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
      scrollY,
    };

    // Lock both html and body without breaking viewport or pointer clicks
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
  }
}

export function unlockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0 && originalStyles) {
    document.documentElement.style.overflow = originalStyles.htmlOverflow || "";
    document.body.style.overflow = originalStyles.overflow || "";
    document.body.style.paddingRight = originalStyles.paddingRight || "";
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");

    const scrollY = originalStyles.scrollY;
    originalStyles = null;

    if (scrollY !== undefined && Math.abs((window.scrollY || 0) - scrollY) > 5) {
      window.scrollTo(0, scrollY);
    }
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


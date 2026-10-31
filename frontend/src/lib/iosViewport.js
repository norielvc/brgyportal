/** True for iPhone / iPad Safari (including iPadOS desktop UA). */
export function isIosBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * After the software keyboard closes, iOS Safari can leave the page zoomed.
 * Nudge viewport meta + scroll position back to 1:1 scale.
 */
export function resetIosViewportAfterKeyboard() {
  if (typeof window === "undefined" || !isIosBrowser()) return;

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  const prev = meta.getAttribute("content") || "";
  if (!prev) return;

  const locked =
    "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, viewport-fit=cover";
  meta.setAttribute("content", locked);
  window.setTimeout(() => {
    meta.setAttribute("content", prev);
    window.scrollTo(0, 0);
  }, 120);
}

export function isFormControlElement(el) {
  if (!el || el === document.body) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    return ![
      "button",
      "submit",
      "checkbox",
      "radio",
      "file",
      "hidden",
      "image",
      "reset",
    ].includes(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Reset viewport when leaving a text field (global, iOS only).
 * @returns {() => void} cleanup
 */
export function attachIosKeyboardZoomFixListeners() {
  if (typeof document === "undefined" || !isIosBrowser()) {
    return () => {};
  }

  const onFocusOut = (e) => {
    const t = e.target;
    if (!isFormControlElement(t)) return;
    window.setTimeout(() => {
      if (!isFormControlElement(document.activeElement)) {
        resetIosViewportAfterKeyboard();
      }
    }, 80);
  };

  document.addEventListener("focusout", onFocusOut, true);

  return () => {
    document.removeEventListener("focusout", onFocusOut, true);
  };
}

/** Google Fonts URL for certificate default (matches tailwind `font-sans` in tailwind.config.js). */
export const CERTIFICATE_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

/**
 * Map certificate layout font keys to CSS font-family stacks (requests.js / certificate-layout).
 * @param {string | undefined} fontKey - default | serif | sans | mono
 */
export function certificateFontCss(fontKey) {
  const key = String(fontKey || "default").toLowerCase();
  if (key === "serif") {
    return 'Georgia, "Times New Roman", Times, serif';
  }
  if (key === "mono") {
    return '"JetBrains Mono", Menlo, Monaco, Consolas, monospace';
  }
  if (key === "sans" || key === "default") {
    return '"Plus Jakarta Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  if (fontKey && String(fontKey).includes(",")) {
    return String(fontKey);
  }
  return '"Plus Jakarta Sans", Inter, system-ui, sans-serif';
}

/** Safe for HTML style="" attributes (uses single quotes around family names). */
export function certificateFontCssAttr(fontKey) {
  return certificateFontCss(fontKey).replace(/"/g, "'");
}

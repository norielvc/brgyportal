import { mergeOfficialsConfig } from "./officialsConfig";
import { certificateFontCssAttr } from "./certificateFontFamily";

/** Defaults aligned with barangay clearance certificate layout (requests.js / BarangayClearanceModal). */
export const DEFAULT_CERTIFICATE_OFFICIALS = {
  contactInfo: {
    address: "Purok 2 (Sitio Banawe) Barangay Iba O' Este, Calumpit, Bulacan",
    contactPerson: "Sec. Royce Ann C. Galvez",
    telephone: "0967 631 9168",
    email: "anneseriousme@gmail.com",
  },
  headerInfo: {
    country: "Republic of the Philippines",
    province: "Province of Bulacan",
    municipality: "Municipality of Calumpit",
    barangayName: "BARANGAY IBA O' ESTE",
    officeName: "Office of the Punong Barangay",
  },
  logos: {
    leftLogo: "/iba-o-este.png",
    rightLogo: "/calumpit.png",
    logoSize: 115,
  },
  headerStyle: {
    bgColor: "#ffffff",
    borderColor: "#1e40af",
    logoSpacing: 0,
    fontFamily: "default",
  },
  countryStyle: { color: "#4b5563", fontWeight: "normal", fontFamily: "default" },
  provinceStyle: { color: "#4b5563", fontWeight: "normal", fontFamily: "default" },
  municipalityStyle: { color: "#4b5563", fontWeight: "normal", fontFamily: "default" },
  barangayNameStyle: { color: "#1e40af", fontWeight: "bold", fontFamily: "default" },
  bodyStyle: {
    fontFamily: "default",
    textSize: 14,
    textColor: "#1f2937",
  },
  footerStyle: {
    textColor: "#374151",
    borderColor: "#9ca3af",
    textSize: 11,
    fontFamily: "default",
  },
};

export function resolveCertificateOfficials(overrides) {
  if (overrides && typeof overrides === "object") {
    return mergeOfficialsConfig(DEFAULT_CERTIFICATE_OFFICIALS, overrides);
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("barangayOfficials");
      if (saved) {
        return mergeOfficialsConfig(
          DEFAULT_CERTIFICATE_OFFICIALS,
          JSON.parse(saved),
        );
      }
    } catch {
      /* ignore */
    }
  }
  return { ...DEFAULT_CERTIFICATE_OFFICIALS };
}

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoBoxSize(logos) {
  const size = logos?.logoSize;
  return size && size > 80 ? size : 130;
}

/**
 * Barangay clearance–style header (logos + geo lines + chairman office line).
 */
export function buildClearanceLetterheadHtml(officials) {
  const o = officials || DEFAULT_CERTIFICATE_OFFICIALS;
  const headerInfo = o.headerInfo || {};
  const logos = o.logos || {};
  const headerStyle = o.headerStyle || {};
  const countryStyle = o.countryStyle || {};
  const provinceStyle = o.provinceStyle || {};
  const municipalityStyle = o.municipalityStyle || {};
  const barangayNameStyle = o.barangayNameStyle || {};
  const headerFont = certificateFontCssAttr(headerStyle.fontFamily);
  const countryFont = certificateFontCssAttr(countryStyle.fontFamily);
  const provinceFont = certificateFontCssAttr(provinceStyle.fontFamily);
  const municipalityFont = certificateFontCssAttr(municipalityStyle.fontFamily);
  const barangayFont = certificateFontCssAttr(barangayNameStyle.fontFamily);
  const box = logoBoxSize(logos);
  const spacing = headerStyle.logoSpacing || 0;

  const leftLogo = logos.leftLogo
    ? `<img src="${esc(logos.leftLogo)}" alt="" class="cert-logo-img" />`
    : "";
  const rightLogo = logos.rightLogo
    ? `<img src="${esc(logos.rightLogo)}" alt="" class="cert-logo-img" />`
    : "";

  return `
    <div class="cert-header-section" style="background-color:${esc(headerStyle.bgColor || "#ffffff")}; border-bottom: 2px solid #111827; font-family: ${headerFont};">
      <div class="cert-logo-box" style="width:${box}px;height:${box}px;margin-right:${spacing}px">${leftLogo}</div>
      <div class="cert-header-text">
        <p style="color:${esc(countryStyle.color || "#4b5563")};font-size:13px;font-weight:${esc(countryStyle.fontWeight || "normal")};font-family:${countryFont};line-height:1.2;margin:0">
          ${esc(headerInfo.country || "Republic of the Philippines")}
        </p>
        <p style="color:${esc(provinceStyle.color || "#4b5563")};font-size:13px;font-weight:${esc(provinceStyle.fontWeight || "normal")};font-family:${provinceFont};line-height:1.2;margin:0">
          ${esc(headerInfo.province || "Province of Bulacan")}
        </p>
        <p style="color:${esc(municipalityStyle.color || "#4b5563")};font-size:13px;font-weight:${esc(municipalityStyle.fontWeight || "normal")};font-family:${municipalityFont};line-height:1.2;margin:0">
          ${esc(headerInfo.municipality || "Municipality of Calumpit")}
        </p>
        <p class="cert-barangay-name" style="color:${esc(barangayNameStyle.color || "#1e40af")};font-size:18px;font-weight:bold;font-family:${barangayFont};line-height:1.2;margin:4px 0 0;text-transform:uppercase">
          ${esc(headerInfo.barangayName || "BARANGAY IBA O' ESTE")}
        </p>
        <p class="cert-chairman-office" style="font-family:${headerFont}">OFFICE OF THE BARANGAY CHAIRMAN</p>
      </div>
      <div class="cert-logo-box" style="width:${box}px;height:${box}px;margin-left:${spacing}px">${rightLogo}</div>
    </div>
  `;
}

/**
 * Barangay clearance–style footer (disclaimer + contact block).
 */
export function buildClearanceFooterHtml(officials, { documentRef = "" } = {}) {
  const o = officials || DEFAULT_CERTIFICATE_OFFICIALS;
  const contact = o.contactInfo || {};
  const footerStyle = o.footerStyle || {};
  const bodyStyle = o.bodyStyle || {};
  const fontSize = footerStyle.textSize || 11;
  const footerFont = certificateFontCssAttr(footerStyle.fontFamily);
  const bodyFont = certificateFontCssAttr(bodyStyle.fontFamily);
  const refLine = documentRef
    ? `<p class="cert-footer-ref">BrgyDesk E-Sumbong · ${esc(documentRef)} · Generated ${esc(
        new Date().toLocaleString("en-PH"),
      )}</p>`
    : "";

  return `
    <div class="cert-footer-block" style="font-family:${footerFont};color:${esc(footerStyle.textColor || "#374151")}">
      <div class="cert-footer-disclaimer">
        <p class="cert-disclaimer-text">
          This is a computer-generated document. The dry seal is replaced with a system-generated QR code—scan it to verify.
        </p>
      </div>
      <div class="cert-footer-contact" style="font-size:${fontSize}px;font-family:${footerFont}">
        <p class="cert-footer-line"><strong>Address:</strong> ${esc(contact.address || "—")}</p>
        <p class="cert-footer-line cert-footer-line-gap">
          <strong>Contact:</strong> ${esc(contact.contactPerson || "—")} Tel No.: ${esc(contact.telephone || "—")} email: ${esc(contact.email || "—")}
        </p>
      </div>
      ${refLine}
    </div>
  `;
}

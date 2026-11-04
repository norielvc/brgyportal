import {
  formatHearingScheduleDisplay,
  formatOrasNgPaghaharapDisplay,
  formatPetsaNgPaghaharapDisplay,
  isBlotterVerified,
} from "./blotterVerify";
import {
  buildClearanceFooterHtml,
  buildClearanceLetterheadHtml,
  resolveCertificateOfficials,
} from "./certificateLetterhead";
import {
  CERTIFICATE_GOOGLE_FONTS_HREF,
  certificateFontCssAttr,
} from "./certificateFontFamily";

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatStatusLabel(status) {
  const map = {
    pending: "Pending",
    under_review: "Under review",
    resolved: "Resolved",
    dismissed: "Dismissed",
  };
  const key = String(status || "pending").toLowerCase();
  return esc(map[key] || key.replace(/_/g, " "));
}

function formatIncidentTime(value) {
  if (value == null || value === "") return "—";
  const t = String(value).trim();
  const m = t.match(/^(\d{1,2}:\d{2})/);
  if (m) {
    const [h, min] = m[1].split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${min} ${ampm}`;
  }
  return esc(t);
}

const TAGALOG_MONTHS = [
  "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
  "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"
];

function formatTagalogFilingDate(dateVal) {
  const d = dateVal ? new Date(dateVal) : new Date();
  const day = d.getDate();
  const month = TAGALOG_MONTHS[d.getMonth()] || "Enero";
  const year = d.getFullYear();
  return { day, month, year };
}

function formatTagalogGeoName(name, prefix) {
  if (!name) return "";
  let clean = String(name).trim();
  clean = clean.replace(/^(province\s+of|municipality\s+of|city\s+of)\s+/i, "");
  return prefix ? `${prefix} ${clean}` : clean;
}
function formatFiledDate(createdAt) {
  if (!createdAt) return "—";
  try {
    return new Date(createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/** @typedef {'blotter' | 'summons'} BlotterDocVariant */

export const BLOTTER_DOC_VARIANT = {
  BLOTTER: "blotter",
  SUMMONS: "summons",
};

export function normalizeBlotterDocVariant(variant, report) {
  if (
    variant === BLOTTER_DOC_VARIANT.SUMMONS &&
    isBlotterVerified(report)
  ) {
    return BLOTTER_DOC_VARIANT.SUMMONS;
  }
  return BLOTTER_DOC_VARIANT.BLOTTER;
}

function buildPartiesSectionHtml(report) {
  return `
      <section>
        <h2 class="section-heading">I. Mga partido <span>/ Parties</span></h2>
        <div class="parties">
          <div class="party-box">
            <p class="party-label">Nagsusumbong · Complainant</p>
            <p class="party-name">${esc(report?.complainant_name || "—")}</p>
            <table class="kv-table">
              <tr><th>Cellphone</th><td>${esc(report?.contact_number || "—")}</td></tr>
              <tr><th>Email</th><td>${esc(report?.email || "—")}</td></tr>
            </table>
          </div>
          <div class="party-box">
            <p class="party-label">Inirereklamo · Respondent</p>
            <p class="party-name">${esc(report?.respondent_name || "—")}</p>
            <table class="kv-table">
              <tr><th>Petsa ng insidente</th><td>${esc(report?.incident_date || "—")}</td></tr>
              <tr><th>Oras</th><td>${formatIncidentTime(report?.incident_time)}</td></tr>
            </table>
          </div>
        </div>
      </section>
  `;
}

function formatPurposeLines(purposeText) {
  const text = String(purposeText || "").trim();
  if (!text) return { line1: "", line2: "" };
  if (text.length <= 42) return { line1: text, line2: "" };
  const words = text.split(/\s+/);
  let line1 = "";
  let line2 = "";
  for (const word of words) {
    if (!line2 && (line1 + " " + word).trim().length <= 42) {
      line1 = (line1 + " " + word).trim();
    } else {
      line2 = (line2 + " " + word).trim();
    }
  }
  return { line1, line2 };
}

/**
 * @param {object} report
 * @param {{ autoPrint?: boolean, embedded?: boolean, officials?: object, variant?: BlotterDocVariant }} options
 */
export function buildBlotterDocumentHtml(report, options = {}) {
  const {
    autoPrint = false,
    embedded = false,
    officials: officialsOverride,
    variant: variantOption,
  } = options;
  const officials = resolveCertificateOfficials(officialsOverride);
  const bodyStyle = officials.bodyStyle || {};
  const bodyFont = certificateFontCssAttr(bodyStyle.fontFamily);
  const bodyFontSize = bodyStyle.textSize || 14;
  const bodyTextColor = bodyStyle.textColor || "#1f2937";
  const monoFont = certificateFontCssAttr("mono");
  const verified = isBlotterVerified(report);
  const variant = normalizeBlotterDocVariant(variantOption, report);
  const isSummons = variant === BLOTTER_DOC_VARIANT.SUMMONS;
  const isLegal = !isSummons;

  const refBlotter = `BL-${String(report?.id || "").substring(0, 8).toUpperCase()}`;
  const usapingNo = esc(report.usaping_barangay_number || "—");
  const entryNo = isSummons ? usapingNo : esc(refBlotter);

  const docTitle = isSummons
    ? "PAANYAYA SA PAGHAHARAP"
    : "TANGGAPAN NG LUPONG TAGAPAMAYAPA";
  const docSubtitle = isSummons
    ? "Summons to Appear / Usaping Barangay"
    : "SUMBONG";

  const filed = esc(formatFiledDate(report?.created_at));
  const filingDate = formatTagalogFilingDate(report?.created_at);
  const caseYear = filingDate.year;
  const petsaDisplay = esc(
    formatPetsaNgPaghaharapDisplay(report.petsa_ng_paghaharap),
  );
  const orasDisplay = formatOrasNgPaghaharapDisplay(report?.oras_ng_paghaharap);
  const hearingScheduleDisplay = esc(formatHearingScheduleDisplay(report));
  const orasLine = orasDisplay
    ? esc(orasDisplay)
    : "9:00 AM (default kung walang oras na nakasaad)";

  const leftLogoUrl = officials?.logos?.leftLogo || "/iba-o-este.png";
  const rightLogoUrl = "/dilg.png";
  const provinceLine = formatTagalogGeoName(officials?.headerInfo?.province, "Lalawigan ng") || "Lalawigan ng Bulacan";
  const municipalityLine = formatTagalogGeoName(officials?.headerInfo?.municipality, "Bayan ng") || "Bayan ng Calumpit";
  const barangayLine = officials?.headerInfo?.barangayName || "Barangay Iba O' Este";
  const captainName = officials?.chairman || officials?.captain || "ALEXANDER C. MANIO";
  const captainSigImg = (officials?.signature || officials?.captainSignature)
    ? `<div class="kp-captain-sig-img-wrap"><img src="${esc(officials.signature || officials.captainSignature)}" alt="Signature" class="kp-captain-sig-img" /></div>`
    : "";

  const usapingNumberDisplay = report?.usaping_barangay_number ? esc(report.usaping_barangay_number) : "";
  const rawPurpose = report?.purpose
    ? String(report.purpose).trim()
    : (report?.incident_date ? `REKLAMO SA INSIDENTE NOONG ${report.incident_date}` : "");
  const { line1: casePurpose1, line2: casePurpose2 } = formatPurposeLines(rawPurpose);

  const verifiedMeta =
    verified && report?.verified_at && !isSummons
      ? `<div class="meta-cell"><span class="meta-label">Verified</span><span class="meta-value">${esc(
          new Date(report.verified_at).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        )}</span></div>`
      : "";

  const usapingMetaCell =
    verified && !isSummons
      ? `<div class="meta-cell"><span class="meta-label">Usaping no.</span><span class="meta-value mono">${usapingNo}</span></div>`
      : "";

  const metaGridHtml = isSummons
    ? `
      <div class="meta-grid">
        <div class="meta-cell">
          <span class="meta-label">Usaping barangay no.</span>
          <span class="meta-value mono">${usapingNo}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Petsa ng paghaharap</span>
          <span class="meta-value">${hearingScheduleDisplay}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Blotter ref.</span>
          <span class="meta-value mono">${esc(refBlotter)}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Status</span>
          <span class="meta-value"><span class="status-pill">${formatStatusLabel(report?.status)}</span></span>
        </div>
      </div>
    `
    : "";

  const summonsBodyHtml = `
      <section class="summons-letter">
        <p class="summons-salutation">SA LAHAT NG KAUUKULAN:</p>
        <p class="summons-para">
          Kayo ay <strong>INAANYAYAHAN</strong> na humarap sa Tanggapan ng Punong Barangay / Barangay Hall
          para sa <strong>Usaping Barangay</strong> alinsunod sa sumbong na naitala sa Blotter Ref.
          <span class="mono">${esc(refBlotter)}</span>.
        </p>
        <p class="summons-para">
          <strong>Petsa ng paghaharap:</strong> ${petsaDisplay}.
          <strong> Oras:</strong> ${orasLine}.
          Magdala ng valid ID at anumang ebidensya o dokumentong may kaugnayan.
        </p>
        <p class="summons-para">
          Ang hindi pagdalo nang walang matibay na dahilan ay maaaring gamitin bilang batayan sa susunod na hakbang
          ayon sa batas at sa mga alituntunin ng barangay.
        </p>
      </section>
      ${buildPartiesSectionHtml(report)}
      <p class="notice">
        Ito ay opisyal na paanyaya para sa paghaharap sa usaping barangay. Para sa kumpletong tala ng insidente,
        tingnan ang Barangay Blotter Record (${esc(refBlotter)}).
      </p>
      <div class="signatures">
        <div>
          <div class="sig-line">&nbsp;</div>
          <p class="sig-caption">Punong Barangay / Lupon Tagapamayapa</p>
        </div>
        <div>
          <div class="sig-line">&nbsp;</div>
          <p class="sig-caption">Barangay Secretary</p>
        </div>
      </div>
  `;

  return `<!DOCTYPE html>
<html lang="tl" class="${embedded ? "embedded-preview" : ""}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(docTitle)} — ${entryNo}</title>
    <link rel="stylesheet" href="${CERTIFICATE_GOOGLE_FONTS_HREF}" />
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html.embedded-preview,
      html.embedded-preview body {
        overflow: hidden;
        height: auto;
        min-height: 0;
      }
      html.embedded-preview body {
        display: flex;
        justify-content: center;
      }
      html.embedded-preview .page {
        transform-origin: top center;
        flex-shrink: 0;
      }
      body {
        margin: 0;
        padding: ${embedded ? "0" : "24px 16px 32px"};
        font-family: ${bodyFont};
        font-size: ${bodyFontSize}px;
        line-height: 1.45;
        color: ${isSummons ? esc(bodyTextColor) : "#000000"};
        background: ${embedded ? "#ffffff" : "#e5e7eb"};
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        max-width: 8.5in;
        margin: 0 auto 16px;
        padding: 10px 14px;
        background: #fff;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,.08);
      }
      .toolbar-title { font-size: 13px; font-weight: 600; color: #374151; }
      .toolbar-actions { display: flex; gap: 8px; }
      .toolbar button {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #111827;
      }
      .toolbar button.primary {
        background: #03254c;
        color: #fff;
        border-color: #03254c;
      }
      .page {
        width: 8.5in;
        max-width: 8.5in;
        margin: 0 auto;
        background: #fff;
        padding: ${isSummons ? "0" : "0.45in 0.75in 0.45in 0.75in"};
        box-shadow: ${embedded ? "none" : "0 8px 32px rgba(0,0,0,.12)"};
        min-height: ${isLegal ? "14in" : "11in"};
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .page-body {
        flex: 1 0 auto;
        display: flex;
        flex-direction: column;
        padding: ${isSummons ? "0.45in 0.75in 0.25in" : "0"};
        font-family: inherit;
        color: inherit;
      }
      .print-sheet-header {
        flex-shrink: 0;
      }
      .print-sheet-footer {
        flex-shrink: 0;
        width: 100%;
        box-sizing: border-box;
      }

      /* TANGGAPAN NG LUPONG TAGAPAMAYAPA Official Form Styles */
      .kp-header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 4px;
      }
      .kp-logo-box {
        width: 90px;
        height: 90px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kp-logo-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .kp-header-center {
        text-align: center;
        flex: 1;
        padding: 0 12px;
      }
      .kp-geo-line {
        margin: 0;
        font-size: 11pt;
        line-height: 1.35;
        color: #000;
        font-family: inherit;
        font-weight: normal;
      }
      .kp-office-heading {
        margin: 10px 0 6px 0;
        font-size: 13.5pt;
        font-weight: bold;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #000;
        font-family: inherit;
        text-align: center;
      }
      .kp-header-divider {
        width: 100%;
        border-top: 1.5px solid #000;
        margin: 0 0 14px 0;
      }
      .kp-print-layout-table {
        width: 100%;
        border-collapse: collapse;
        border: none;
        margin: 0;
        padding: 0;
      }
      .kp-print-layout-table > thead {
        display: table-header-group;
      }
      .kp-print-layout-table > tbody {
        display: table-row-group;
      }
      .kp-print-layout-table > thead > tr > td,
      .kp-print-layout-table > tbody > tr > td {
        border: none;
        padding: 0;
        margin: 0;
        vertical-align: top;
      }

      /* Parties & Case Meta Grid */
      .kp-parties-row {
        display: flex;
        flex-direction: column;
        width: 100%;
        font-size: 11pt;
        margin-bottom: 12px;
      }
      .kp-parties-row-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
      }
      .kp-parties-row-item.kp-row-mid {
        align-items: center;
        margin: 6px 0;
      }
      .kp-parties-left {
        width: 48%;
      }
      .kp-name-field {
        width: 100%;
        border-bottom: 1.5px solid #000;
        min-height: 24px;
        line-height: 1.35;
        padding-bottom: 5px;
        font-weight: bold;
        font-size: 10.5pt;
        word-break: break-word;
        box-sizing: border-box;
      }
      .kp-parties-label {
        font-size: 10pt;
        margin-top: 3px;
        padding-left: 1px;
      }
      .kp-parties-vs {
        text-align: center;
        font-size: 10.5pt;
        margin: 0;
      }
      .kp-parties-right {
        width: 48%;
      }
      .kp-case-no-line {
        font-size: 11pt;
        white-space: nowrap;
        text-align: right;
      }
      .kp-case-num-slot {
        display: inline-block;
        min-width: 120px;
        border-bottom: 1.5px solid #000;
        text-align: center;
        font-weight: bold;
        font-size: 10.5pt;
        line-height: 1.2;
        padding: 0 6px 3px 6px;
        box-sizing: border-box;
        vertical-align: baseline;
      }
      .kp-case-for-label {
        text-align: center;
        font-size: 10.5pt;
        margin: 0;
      }
      .kp-purpose-wrap {
        width: 100%;
        box-sizing: border-box;
      }
      .kp-purpose-line {
        width: 100%;
        border-bottom: 1.5px solid #000;
        min-height: 22px;
        line-height: 1.3;
        padding-bottom: 4px;
        font-size: 9.5pt;
        font-weight: 600;
        text-align: center;
        word-break: break-word;
        box-sizing: border-box;
      }
      .kp-purpose-line-second {
        margin-top: 8px;
      }

      /* Title & Statement */
      .kp-title-box {
        text-align: center;
        margin: 12px 0 10px 0;
      }
      .kp-main-title {
        font-size: 13.5pt;
        font-weight: bold;
        text-decoration: underline;
        letter-spacing: 0.1em;
      }
      .kp-text-para {
        font-size: 11pt;
        line-height: 1.5;
        text-indent: 2em;
        text-align: justify;
        margin: 0 0 10px 0;
      }

      /* Narrative Container */
      .kp-narrative-lined {
        width: 100%;
        min-height: 120px;
        box-sizing: border-box;
        margin: 8px 0 12px 0;
      }
      .kp-narrative-text {
        font-family: inherit;
        font-size: 11pt;
        line-height: 1.6;
        text-align: justify;
        text-indent: 2em;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        padding: 0;
      }

      /* Filing Date */
      .kp-filing-date {
        text-align: center;
        font-size: 11pt;
        margin: 14px 0 18px 0;
        line-height: 1.8;
      }
      .kp-date-slot {
        display: inline-block;
        border-bottom: 1.5px solid #000;
        text-align: center;
        font-weight: bold;
        font-size: 10.5pt;
        line-height: 1.2;
        padding: 0 6px 3px 6px;
        box-sizing: border-box;
        vertical-align: baseline;
        margin: 0 4px;
      }

      /* Signatures of Parties */
      .kp-parties-signatures {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin: 16px 0 20px 0;
      }
      .kp-party-sig {
        width: 44%;
        text-align: center;
      }
      .kp-sig-underline-box {
        width: 100%;
        border-bottom: 1.5px solid #000;
        font-weight: bold;
        font-size: 10.5pt;
        line-height: 1.35;
        padding-bottom: 5px;
        min-height: 24px;
        text-align: center;
        word-break: break-word;
        box-sizing: border-box;
      }
      .kp-sig-caption {
        font-size: 10pt;
        margin-top: 4px;
      }

      /* Pagpapatunay */
      .kp-papatunay-heading {
        text-align: center;
        font-size: 11.5pt;
        font-weight: bold;
        letter-spacing: 0.08em;
        margin: 18px 0 6px 0;
      }
      .kp-papatunay-body {
        font-size: 10.5pt;
        line-height: 1.5;
        text-indent: 2em;
        text-align: justify;
        margin: 0 0 16px 0;
      }

      /* Punong Barangay block */
      .kp-punong-barangay-block {
        display: flex;
        justify-content: flex-end;
        width: 100%;
        margin-top: 20px;
        margin-bottom: 24px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .kp-captain-signature-col {
        min-width: 240px;
        text-align: center;
      }
      .kp-captain-sig-img-wrap {
        min-height: 38px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        margin-bottom: -8px;
      }
      .kp-captain-sig-img {
        max-height: 48px;
        object-fit: contain;
      }
      .kp-captain-fullname {
        font-size: 11.5pt;
        font-weight: bold;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .kp-captain-designation {
        font-size: 9.5pt;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-top: 2px;
      }

      /* Summons specific styles */
      .doc-title-block { text-align: center; margin-bottom: 18px; }
      .doc-title {
        margin: 0;
        font-size: 15pt;
        font-weight: bold;
        color: #991b1b;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .doc-sub { font-size: 10pt; color: #6b7280; margin: 6px 0 0; font-style: italic; }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px 24px;
        margin-bottom: 20px;
        padding: 0;
      }
      .meta-cell { display: flex; flex-direction: column; gap: 2px; }
      .meta-label {
        font-size: 8pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
      }
      .meta-value { font-size: 11pt; font-weight: bold; }
      .meta-value.mono { font-family: ${monoFont}; letter-spacing: 0.02em; }
      .status-pill {
        display: inline;
        font-weight: bold;
        color: #92400e;
      }
      .summons-letter {
        padding: 16px 20px;
        border: 2px solid #b91c1c;
        border-radius: 8px;
        background: #fef2f2;
        margin-bottom: 22px;
      }
      .summons-salutation {
        color: #991b1b;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0 0 12px;
        font-size: 10.5pt;
      }
      .summons-para {
        margin: 0 0 12px;
        font-size: 11pt;
        line-height: 1.55;
        text-align: justify;
      }
      .notice {
        font-size: 9.5pt;
        color: #6b7280;
        font-style: italic;
        margin-top: 16px;
      }
      .signatures {
        margin-top: 36px;
        margin-bottom: 8px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        text-align: center;
        font-size: 10pt;
        page-break-inside: avoid;
      }
      .sig-line {
        border-top: 1px solid #111;
        margin-top: 48px;
        padding-top: 6px;
        font-weight: bold;
        font-size: 10.5pt;
        text-transform: uppercase;
      }
      .sig-caption { color: #6b7280; font-size: 9pt; margin-top: 4px; }
      .parties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 8px;
      }
      .party-box {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px 14px;
        background: #f9fafb;
      }
      .party-label {
        font-size: 8.5pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        margin: 0 0 6px;
      }
      .party-name {
        font-size: 12pt;
        font-weight: bold;
        margin: 0 0 8px;
      }
      .kv-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5pt;
      }
      .kv-table th {
        text-align: left;
        color: #6b7280;
        font-weight: normal;
        padding: 2px 8px 2px 0;
        width: 38%;
        vertical-align: top;
      }
      .kv-table td {
        padding: 2px 0;
        font-weight: 500;
        vertical-align: top;
      }

      @media print {
        body { background: #fff; padding: 0; }
        .toolbar { display: none !important; }
        .page {
          box-shadow: none;
          width: 8.5in;
          max-width: 8.5in;
          min-height: 0;
          height: auto !important;
          padding: ${isSummons ? "0" : "0.35in 0.65in 0.35in 0.65in"} !important;
          margin: 0;
        }
        .page-body.kp-sheet-body {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .kp-print-layout-table > thead {
          display: table-header-group !important;
        }
        .print-sheet-header {
          position: ${isSummons ? "fixed" : "static"} !important;
        }
        .print-sheet-footer {
          position: ${isSummons ? "fixed" : "static"} !important;
        }
        .kp-parties-row,
        .kp-title-box,
        .kp-parties-signatures,
        .kp-papatunay-heading,
        .kp-papatunay-body,
        .kp-punong-barangay-block {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
      @page {
        size: ${isLegal ? "legal portrait" : "letter portrait"};
        margin: 0;
      }
    </style>
  </head>
  <body>
    ${!autoPrint && !embedded ? `
    <div class="toolbar">
      <span class="toolbar-title">Preview — ${entryNo}</span>
      <div class="toolbar-actions">
        <button type="button" onclick="window.print()">Print</button>
        <button type="button" class="primary" onclick="window.close()">Close</button>
      </div>
    </div>
    ` : ""}

    <article class="page ${!isSummons ? "kp-page" : ""}">
      ${isSummons ? `
      <div class="print-sheet-header">
        ${buildClearanceLetterheadHtml(officials)}
      </div>
      <div class="page-body print-sheet-body">
        <header class="doc-title-block">
          <h1 class="doc-title">${esc(docTitle)}</h1>
          <p class="doc-sub">${esc(docSubtitle)}</p>
        </header>

        ${metaGridHtml}

        ${summonsBodyHtml}
      </div>
      <div class="print-sheet-footer">
        ${buildClearanceFooterHtml(officials, { documentRef: refBlotter })}
      </div>
      ` : `
      <table class="kp-print-layout-table">
        <thead>
          <tr>
            <td>
              <div class="print-sheet-header">
                <div class="kp-header-container">
                  <div class="kp-logo-box">
                    <img src="${esc(leftLogoUrl)}" alt="Barangay Logo" class="kp-logo-img" />
                  </div>
                  <div class="kp-header-center">
                    <p class="kp-geo-line">Republika ng Pilipinas</p>
                    <p class="kp-geo-line">${esc(provinceLine)}</p>
                    <p class="kp-geo-line">${esc(municipalityLine)}</p>
                    <p class="kp-geo-line">${esc(barangayLine)}</p>
                    <h1 class="kp-office-heading">TANGGAPAN NG LUPONG TAGAPAMAYAPA</h1>
                  </div>
                  <div class="kp-logo-box">
                    <img src="${esc(rightLogoUrl)}" alt="DILG Logo" class="kp-logo-img" />
                  </div>
                </div>
                <div class="kp-header-divider"></div>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="page-body print-sheet-body kp-sheet-body">
                <!-- Parties & Usaping Barangay No -->
                <div class="kp-parties-row">
                  <!-- Top Row: Complainant and Case No -->
                  <div class="kp-parties-row-item kp-row-top">
                    <div class="kp-parties-left">
                      <div class="kp-name-field">
                        ${esc(report?.complainant_name || "")}${report?.complainant_name ? "," : "&nbsp;"}
                      </div>
                      <div class="kp-parties-label">Nagsusumbong,</div>
                    </div>
                    <div class="kp-parties-right">
                      <div class="kp-case-no-line">
                        Usaping Barangay Blg. <span class="kp-case-num-slot">${esc(usapingNumberDisplay || "") || "&nbsp;"}</span> ${caseYear}
                      </div>
                    </div>
                  </div>

                  <!-- Middle Row: -laban- and -para sa- on the exact same line -->
                  <div class="kp-parties-row-item kp-row-mid">
                    <div class="kp-parties-left">
                      <div class="kp-parties-vs">-laban-</div>
                    </div>
                    <div class="kp-parties-right">
                      <div class="kp-case-for-label">-para sa-</div>
                    </div>
                  </div>

                  <!-- Bottom Row: Respondent and Purpose -->
                  <div class="kp-parties-row-item kp-row-bot">
                    <div class="kp-parties-left">
                      <div class="kp-name-field">
                        ${esc(report?.respondent_name || "")}${report?.respondent_name ? "," : "&nbsp;"}
                      </div>
                      <div class="kp-parties-label">Ipinagreklamo</div>
                    </div>
                    <div class="kp-parties-right">
                      <div class="kp-purpose-wrap">
                        <div class="kp-purpose-line">${esc(casePurpose1 || "") || "&nbsp;"}</div>
                        <div class="kp-purpose-line kp-purpose-line-second">${esc(casePurpose2 || "") || "&nbsp;"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Document Title -->
                <div class="kp-title-box">
                  <span class="kp-main-title">SUMBONG</span>
                </div>

                <!-- Opening Statement -->
                <p class="kp-text-para">
                  Ako / Kami ay nagsusumbong laban sa mga taong binabanggit sa itaas dahil sa paglabag sa akin / aming karapatan ayon sa mga sumusunod na paraan:
                </p>

                <!-- Ruled Narrative Lines -->
                <div class="kp-narrative-lined">
                  <div class="kp-narrative-text">${esc(report?.details || "Walang detalye na naitala.")}</div>
                </div>

                <!-- Closing Request Statement -->
                <p class="kp-text-para" style="margin-top: 14px; margin-bottom: 10px;">
                  Dahil dito, ako / kami ay magalang na humihiling na inyong ipagkaloob sa akin / amin ang nararapat ayon sa batas o katwiran.
                </p>

                <!-- Filing Date -->
                <div class="kp-filing-date">
                  Itinala ngayong ika 
                  <span class="kp-date-slot" style="min-width: 44px;">${filingDate.day || "&nbsp;"}</span> 
                  ng 
                  <span class="kp-date-slot" style="min-width: 110px;">${filingDate.month || "&nbsp;"}</span>, 
                  ${filingDate.year}
                </div>

                <!-- Signatures of Parties -->
                <div class="kp-parties-signatures">
                  <div class="kp-party-sig">
                    <div class="kp-sig-underline-box">
                      ${esc(report?.complainant_name || "") || "&nbsp;"}
                    </div>
                    <div class="kp-sig-caption">Nagsusumbong</div>
                  </div>
                  <div class="kp-party-sig">
                    <div class="kp-sig-underline-box">
                      &nbsp;
                    </div>
                    <div class="kp-sig-caption">Ipinagsusumbong</div>
                  </div>
                </div>

                <!-- PAGPAPATUNAY Section -->
                <div class="kp-papatunay-heading">
                  PAGPAPATUNAY
                </div>
                <p class="kp-papatunay-body">
                  Na aking pinapatunayan ang mga nakasaad sa kasunduang ito ay kusang loob na ginawa at napagka - sunduan ng magkabilang panig matapos kong ipaliwanag sa kanila ang katangian at kalalabasan nito.
                </p>

                <!-- Punong Barangay Signature Block -->
                <div class="kp-punong-barangay-block">
                  <div class="kp-captain-signature-col">
                    ${captainSigImg}
                    <div class="kp-captain-fullname">${esc(captainName)}</div>
                    <div class="kp-captain-designation">PUNONG BARANGAY</div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="print-sheet-footer" style="height:0;min-height:0;margin:0;padding:0;"></div>
      `}
    </article>

    ${autoPrint ? `<script>window.onload = function() { window.print(); }<\/script>` : ""}
  </body>
</html>`;
}

async function prepareBlotterPrintIframe(report, { officials, variant } = {}) {
  const html = buildBlotterDocumentHtml(report, {
    embedded: true,
    officials,
    variant,
  });
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "E-Sumbong print";
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return { ok: false, error: "iframe_failed" };
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  await new Promise((resolve) => {
    iframe.onload = () => setTimeout(resolve, 300);
    setTimeout(resolve, 2500);
  });

  await waitForImages(iframeDoc.body);
  try {
    if (iframeDoc.fonts?.ready) await iframeDoc.fonts.ready;
  } catch {
    /* ignore */
  }

  return { ok: true, iframe };
}

function removePrintIframe(iframe) {
  if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
}

/** Opens the system print dialog without leaving the current tab. */
export async function printBlotterDocument(report, { officials, variant } = {}) {
  if (typeof document === "undefined") {
    return { ok: false, error: "no_document" };
  }

  const prepared = await prepareBlotterPrintIframe(report, { officials, variant });
  if (!prepared.ok) return prepared;

  const { iframe } = prepared;
  const win = iframe.contentWindow;
  if (!win) {
    removePrintIframe(iframe);
    return { ok: false, error: "print_failed" };
  }

  const cleanup = () => removePrintIframe(iframe);
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 120000);

  try {
    win.focus();
    win.print();
  } catch (err) {
    cleanup();
    return { ok: false, error: "print_failed", detail: err?.message };
  }

  return { ok: true };
}

/** @deprecated Use in-app preview modal + printBlotterDocument */
export function openBlotterDocument(report, { preview = false, officials } = {}) {
  if (preview) {
    return { ok: false, error: "use_in_app_preview" };
  }
  void printBlotterDocument(report, { officials });
  return { ok: true };
}

const LETTER_PAGE_MM = { width: 215.9, height: 279.4 };

function blotterPdfFilename(report, variant = BLOTTER_DOC_VARIANT.BLOTTER) {
  const ref = `BL-${String(report?.id || "").substring(0, 8).toUpperCase()}`;
  const docVariant = normalizeBlotterDocVariant(variant, report);
  if (docVariant === BLOTTER_DOC_VARIANT.SUMMONS) {
    const ub = String(report?.usaping_barangay_number || ref).replace(/\s+/g, "-");
    return `Paanyaya-${ub}.pdf`;
  }
  return `Lupong-Tagapamayapa-${ref}.pdf`;
}

function waitForImages(root) {
  if (!root) return Promise.resolve();
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
}

const HTML2CANVAS_OPTS = {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: "#ffffff",
  logging: false,
};

function canvasHeightToMm(canvas, pageWidthMm) {
  return (canvas.height * pageWidthMm) / canvas.width;
}

function addCanvasRegionToPdf(pdf, canvas, sx, sy, sw, sh, xMm, yMm, wMm, hMm) {
  if (sh <= 0 || sw <= 0 || !canvas || canvas.width <= 0 || canvas.height <= 0) return;
  const slice = document.createElement("canvas");
  slice.width = Math.max(1, Math.floor(sw));
  slice.height = Math.max(1, Math.floor(sh));
  const ctx = slice.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, slice.width, slice.height);
  const dataUrl = slice.toDataURL("image/png", 1.0);
  if (!dataUrl || !dataUrl.startsWith("data:image/png;base64,") || dataUrl.length < 50) return;
  pdf.addImage(
    dataUrl,
    "PNG",
    xMm,
    yMm,
    wMm,
    hMm,
    undefined,
    "FAST",
  );
}

/**
 * Render the blotter HTML to a US Letter PDF and trigger browser download.
 */
export async function downloadBlotterDocumentPdf(report, { officials, variant } = {}) {
  if (typeof document === "undefined") {
    return { ok: false, error: "no_document" };
  }

  const docVariant = normalizeBlotterDocVariant(variant, report);
  const isLegal = docVariant !== BLOTTER_DOC_VARIANT.SUMMONS;
  const pdfSpec = isLegal
    ? { format: "legal", width: 215.9, height: 355.6, iframeH: 1344 }
    : { format: "letter", width: 215.9, height: 279.4, iframeH: 1056 };

  const html = buildBlotterDocumentHtml(report, {
    autoPrint: false,
    officials,
    variant: docVariant,
  });
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;right:0;bottom:0;width:816px;height:${pdfSpec.iframeH}px;visibility:hidden;border:0;z-index:-1;pointer-events:none`;
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframeWin?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return { ok: false, error: "iframe_failed" };
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  await new Promise((resolve) => {
    iframe.onload = () => setTimeout(resolve, 400);
    setTimeout(resolve, 2500);
  });

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const headerEl = iframeDoc.querySelector(".print-sheet-header");
  const bodyEl = iframeDoc.querySelector(".print-sheet-body");
  const footerEl = iframeDoc.querySelector(".print-sheet-footer");
  if (!headerEl || !bodyEl) {
    document.body.removeChild(iframe);
    return { ok: false, error: "render_failed" };
  }

  await waitForImages(iframeDoc.body);
  try {
    if (iframeDoc.fonts?.ready) await iframeDoc.fonts.ready;
  } catch {
    /* ignore */
  }

  let headerCanvas;
  let bodyCanvas;
  let footerCanvas;
  try {
    [headerCanvas, bodyCanvas, footerCanvas] = await Promise.all([
      html2canvas(headerEl, {
        ...HTML2CANVAS_OPTS,
        windowWidth: 816,
      }),
      html2canvas(bodyEl, {
        ...HTML2CANVAS_OPTS,
        windowWidth: 816,
        windowHeight: bodyEl.scrollHeight,
      }),
      footerEl && footerEl.offsetHeight > 0 ? html2canvas(footerEl, HTML2CANVAS_OPTS) : null,
    ]);
  } catch (err) {
    document.body.removeChild(iframe);
    return { ok: false, error: "capture_failed", detail: err?.message };
  }

  document.body.removeChild(iframe);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: pdfSpec.format,
    compress: true,
  });

  const pageWidth = pdfSpec.width;
  const pageHeight = pdfSpec.height;
  const marginX = isLegal ? 17 : 14;
  const marginY = isLegal ? 14 : 12;
  const printableWidth = pageWidth - 2 * marginX;

  const headerHmm = (headerCanvas.height * printableWidth) / headerCanvas.width;
  const footerHmm = footerCanvas && footerCanvas.height > 0 ? (footerCanvas.height * printableWidth) / footerCanvas.width : 0;
  const headerGapMm = 4;
  const bodyY = marginY + headerHmm + headerGapMm;
  const safetyBottomMm = 14;
  const maxSliceHmm = Math.max(
    pageHeight - marginY - bodyY - (footerHmm > 0 ? footerHmm + 4 : safetyBottomMm),
    pageHeight * 0.4,
  );
  const contentSlotHmm = maxSliceHmm;
  const bodyHmm = (bodyCanvas.height * printableWidth) / bodyCanvas.width;

  // Function to scan upwards for a clean blank pixel row between text lines
  function findBlankRowY(ctx, width, targetY, maxSearchPx = 90) {
    const minY = Math.max(0, targetY - maxSearchPx);
    try {
      for (let y = targetY; y >= minY; y -= 1) {
        const row = ctx.getImageData(0, y, width, 1).data;
        let isBlank = true;
        for (let x = 0; x < row.length; x += 16) {
          if (row[x] < 248 || row[x + 1] < 248 || row[x + 2] < 248) {
            isBlank = false;
            break;
          }
        }
        if (isBlank) return y;
      }
    } catch {
      /* ignore */
    }
    return targetY;
  }

  // Pre-calculate clean page slice boundaries without cutting lines of text in half
  const bodyCtx = bodyCanvas.getContext("2d");
  const pxPerMm = bodyCanvas.width / printableWidth;
  const contentSlotPx = Math.floor(contentSlotHmm * pxPerMm);
  const isSinglePage = bodyCanvas.height <= contentSlotPx;
  const slices = [];

  if (isSinglePage) {
    slices.push({ startY: 0, height: bodyCanvas.height });
  } else {
    let currentY = 0;
    while (currentY < bodyCanvas.height) {
      const remainingPx = bodyCanvas.height - currentY;
      if (remainingPx <= contentSlotPx) {
        slices.push({ startY: currentY, height: remainingPx });
        break;
      }
      let rawCutY = Math.min(bodyCanvas.height, Math.round(currentY + contentSlotPx));
      let cleanCutY = findBlankRowY(bodyCtx, bodyCanvas.width, rawCutY, 120);
      if (cleanCutY <= currentY + 60) {
        cleanCutY = rawCutY;
      }
      let sliceHeight = Math.max(50, cleanCutY - currentY);
      slices.push({ startY: currentY, height: sliceHeight });
      currentY = cleanCutY;
    }
  }

  const headerImg = headerCanvas.toDataURL("image/png", 1.0);
  const footerImg = footerCanvas && footerCanvas.height > 0 ? footerCanvas.toDataURL("image/png", 1.0) : null;
  const totalPages = slices.length;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage();

    // RETAIN HEADER ON EVERY PAGE with proper margins
    if (headerHmm > 0 && headerImg && headerImg.startsWith("data:image/png;base64,")) {
      pdf.addImage(
        headerImg,
        "PNG",
        marginX,
        marginY,
        printableWidth,
        headerHmm,
        undefined,
        "FAST",
      );
    }

    const slice = slices[pageIndex];
    if (slice && slice.height > 0) {
      let sliceHmm = (slice.height * printableWidth) / bodyCanvas.width;
      let drawWmm = printableWidth;
      let drawXmm = marginX;

      // Extra safeguard: if sliceHmm somehow exceeds maxSliceHmm, scale it down proportionally
      // so PUNONG BARANGAY and any bottom elements have guaranteed clearance above page bottom!
      if (sliceHmm > maxSliceHmm) {
        const scale = maxSliceHmm / sliceHmm;
        sliceHmm = maxSliceHmm;
        drawWmm = printableWidth * scale;
        drawXmm = marginX + (printableWidth - drawWmm) / 2;
      }

      addCanvasRegionToPdf(
        pdf,
        bodyCanvas,
        0,
        slice.startY,
        bodyCanvas.width,
        slice.height,
        drawXmm,
        bodyY,
        drawWmm,
        sliceHmm,
      );
    }

    if (footerHmm > 0 && footerImg && footerImg.startsWith("data:image/png;base64,")) {
      pdf.addImage(
        footerImg,
        "PNG",
        marginX,
        pageHeight - marginY - footerHmm,
        printableWidth,
        footerHmm,
        undefined,
        "FAST",
      );
    }
  }

  pdf.save(blotterPdfFilename(report, docVariant));
  return { ok: true };
}

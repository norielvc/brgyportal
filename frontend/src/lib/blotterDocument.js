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

  const refBlotter = `BL-${String(report?.id || "").substring(0, 8).toUpperCase()}`;
  const usapingNo = esc(report.usaping_barangay_number || "—");
  const entryNo = isSummons
    ? usapingNo
    : esc(refBlotter);

  const docTitle = isSummons
    ? "PAANYAYA SA PAGHAHARAP"
    : "E-SUMBONG — BLOTTER RECORD";
  const docSubtitle = isSummons
    ? "Summons to Appear / Usaping Barangay"
    : "Opisyal na tala ng insidente / Incident record";

  const filed = esc(formatFiledDate(report?.created_at));
  const petsaDisplay = esc(
    formatPetsaNgPaghaharapDisplay(report.petsa_ng_paghaharap),
  );
  const orasDisplay = formatOrasNgPaghaharapDisplay(report?.oras_ng_paghaharap);
  const hearingScheduleDisplay = esc(formatHearingScheduleDisplay(report));
  const orasLine = orasDisplay
    ? esc(orasDisplay)
    : "9:00 AM (default kung walang oras na nakasaad)";

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
    : `
      <div class="meta-grid">
        <div class="meta-cell">
          <span class="meta-label">Blotter ref.</span>
          <span class="meta-value mono">${esc(refBlotter)}</span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Status</span>
          <span class="meta-value"><span class="status-pill">${formatStatusLabel(report?.status)}</span></span>
        </div>
        <div class="meta-cell">
          <span class="meta-label">Petsa ng pagsusumite</span>
          <span class="meta-value">${filed}</span>
        </div>
        ${usapingMetaCell}
        ${verifiedMeta}
      </div>
    `;

  const blotterBodyHtml = `
      ${buildPartiesSectionHtml(report)}
      <section>
        <h2 class="section-heading">II. Detalye ng sumbong <span>/ Narrative</span></h2>
        <div class="narrative">${esc(report?.details || "Walang detalye na naitala.")}</div>
      </section>
      <div class="signatures">
        <div>
          <div class="sig-line">${esc(report?.complainant_name || "Nagsusumbong")}</div>
          <p class="sig-caption">Affiant / Nagsusumbong</p>
        </div>
        <div>
          <div class="sig-line">Barangay Desk Officer</div>
          <p class="sig-caption">Recorded by / Kawani ng desk</p>
        </div>
      </div>
  `;

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

  const mainBodyHtml = isSummons ? summonsBodyHtml : blotterBodyHtml;

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
        color: ${esc(bodyTextColor)};
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
        padding: 0;
        box-shadow: ${embedded ? "none" : "0 8px 32px rgba(0,0,0,.12)"};
        min-height: 11in;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .page-body {
        flex: 1 0 auto;
        display: flex;
        flex-direction: column;
        padding: 0.45in 0.75in 0.25in;
        font-family: ${bodyFont};
        color: ${esc(bodyTextColor)};
      }
      .print-sheet-footer {
        flex-shrink: 0;
        width: 100%;
        box-sizing: border-box;
        padding: 0 0.75in 0.42in;
        margin-top: auto;
      }
      .cert-header-section {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        padding: 12px 28px 16px;
        box-sizing: border-box;
      }
      .cert-logo-box { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .cert-logo-img { width: 100%; height: 100%; object-fit: contain; }
      .cert-header-text { text-align: center; flex: 0 1 auto; max-width: 420px; }
      .cert-chairman-office {
        margin: 8px 0 0;
        font-size: 14px;
        font-weight: bold;
        color: #b91c1c;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        line-height: 1.2;
      }
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
      .cert-footer-block {
        margin-top: 8px;
        padding-top: 10px;
        border-top: 1px solid #9ca3af;
        width: 100%;
      }
      .print-sheet-header {
        flex-shrink: 0;
      }
      .cert-footer-disclaimer { margin-bottom: 6px; }
      .cert-disclaimer-text {
        margin: 0;
        font-style: italic;
        color: #6b7280;
        font-size: 10px;
        line-height: 1.45;
        font-family: inherit;
        text-align: left;
      }
      .cert-footer-contact {
        padding: 0;
        line-height: 1.4;
        text-align: left;
      }
      .cert-footer-line {
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }
      .cert-footer-line-gap { margin-top: 4px; }
      .cert-footer-ref {
        margin: 8px 0 0;
        padding: 0;
        font-size: 9px;
        color: #6b7280;
        line-height: 1.35;
        text-align: left;
        font-family: inherit;
      }
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
        font-family: inherit;
      }
      .meta-value { font-size: 11pt; font-weight: bold; }
      .meta-value.mono { font-family: ${monoFont}; letter-spacing: 0.02em; }
      .status-pill {
        display: inline;
        padding: 0;
        font-size: inherit;
        background: none;
        border: none;
        font-weight: bold;
        color: #92400e;
      }
      section { margin-bottom: 18px; }
      .section-heading {
        font-size: 10pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #991b1b;
        margin: 0 0 10px;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      }
      .section-heading span { font-weight: normal; color: #6b7280; text-transform: none; letter-spacing: 0; font-size: 9pt; }
      .parties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 560px) { .parties { grid-template-columns: 1fr; } }
      .party-box {
        padding: 0;
      }
      .party-label {
        font-size: 8pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        margin-bottom: 6px;
        font-family: inherit;
      }
      .party-name { font-size: 11.5pt; font-weight: bold; margin: 0 0 8px; line-height: 1.3; }
      .kv-table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
      .kv-table th {
        text-align: left;
        font-weight: normal;
        color: #4b5563;
        padding: 3px 8px 3px 0;
        vertical-align: top;
        width: 38%;
      }
      .kv-table td { padding: 3px 0; font-weight: 600; vertical-align: top; }
      .notice {
        margin: 12px 0 0;
        font-size: 10pt;
        line-height: 1.5;
        color: #374151;
      }
      .summons-letter { margin-bottom: 16px; }
      .summons-salutation {
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 12px;
        font-size: 10.5pt;
      }
      .summons-para {
        margin: 0 0 12px;
        font-size: 11pt;
        line-height: 1.55;
        text-align: justify;
      }
      .narrative {
        padding: 0;
        min-height: 0;
        font-size: 11pt;
        line-height: 1.55;
        white-space: pre-wrap;
        word-wrap: break-word;
        background: transparent;
        text-align: justify;
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
      .emphasis { font-weight: bold; }
      .mono { font-family: ${monoFont}; }
      @media print {
        body { background: #fff; padding: 0; }
        .toolbar { display: none !important; }
        .page {
          box-shadow: none;
          width: 8.5in;
          max-width: 8.5in;
          min-height: 0;
          padding: 0;
          margin: 0;
        }
        /* Repeat barangay clearance header & footer on every printed page */
        .print-sheet-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 8.5in;
          margin: 0 auto;
          background: #fff;
          z-index: 1000;
        }
        .print-sheet-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 8.5in;
          margin: 0 auto;
          padding: 0 0.75in 0.28in;
          background: #fff;
          z-index: 1000;
          box-sizing: border-box;
        }
        .print-sheet-body {
          padding-top: 2.15in;
          padding-bottom: 1.55in;
        }
        .print-sheet-footer .cert-footer-block {
          margin-top: 0;
          padding-top: 8px;
        }
      }
      @page {
        size: letter portrait;
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

    <article class="page">
      <div class="print-sheet-header">
        ${buildClearanceLetterheadHtml(officials)}
      </div>
      <div class="page-body print-sheet-body">
      <header class="doc-title-block">
        <h1 class="doc-title">${esc(docTitle)}</h1>
        <p class="doc-sub">${esc(docSubtitle)}</p>
      </header>

      ${metaGridHtml}

      ${mainBodyHtml}

      </div>
      <div class="print-sheet-footer">
        ${buildClearanceFooterHtml(officials, { documentRef: refBlotter })}
      </div>
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
  return `E-Sumbong-Blotter-${ref}.pdf`;
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
  if (sh <= 0 || sw <= 0) return;
  const slice = document.createElement("canvas");
  slice.width = sw;
  slice.height = sh;
  slice.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  pdf.addImage(
    slice.toDataURL("image/png", 1.0),
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
  const html = buildBlotterDocumentHtml(report, {
    autoPrint: false,
    officials,
    variant: docVariant,
  });
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:816px;height:1056px;visibility:hidden;border:0;z-index:-1;pointer-events:none";
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

  const headerEl = iframeDoc.querySelector(".print-sheet-header");
  const bodyEl = iframeDoc.querySelector(".print-sheet-body");
  const footerEl = iframeDoc.querySelector(".print-sheet-footer");
  if (!headerEl || !bodyEl || !footerEl) {
    document.body.removeChild(iframe);
    return { ok: false, error: "render_failed" };
  }

  await waitForImages(iframeDoc.body);
  try {
    if (iframeDoc.fonts?.ready) await iframeDoc.fonts.ready;
  } catch {
    /* ignore */
  }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  let headerCanvas;
  let bodyCanvas;
  let footerCanvas;
  try {
    [headerCanvas, bodyCanvas, footerCanvas] = await Promise.all([
      html2canvas(headerEl, HTML2CANVAS_OPTS),
      html2canvas(bodyEl, {
        ...HTML2CANVAS_OPTS,
        windowWidth: bodyEl.scrollWidth,
        windowHeight: bodyEl.scrollHeight,
      }),
      html2canvas(footerEl, HTML2CANVAS_OPTS),
    ]);
  } catch (err) {
    document.body.removeChild(iframe);
    return { ok: false, error: "capture_failed", detail: err?.message };
  }

  document.body.removeChild(iframe);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
    compress: true,
  });

  const pageWidth = LETTER_PAGE_MM.width;
  const pageHeight = LETTER_PAGE_MM.height;
  const headerHmm = canvasHeightToMm(headerCanvas, pageWidth);
  const footerHmm = canvasHeightToMm(footerCanvas, pageWidth);
  const contentSlotHmm = Math.max(
    pageHeight - headerHmm - footerHmm,
    pageHeight * 0.45,
  );
  const bodyHmm = canvasHeightToMm(bodyCanvas, pageWidth);
  const pageCount = Math.max(1, Math.ceil(bodyHmm / contentSlotHmm));

  const headerImg = headerCanvas.toDataURL("image/png", 1.0);
  const footerImg = footerCanvas.toDataURL("image/png", 1.0);
  const contentSlotPx =
    bodyCanvas.height > 0 ? (contentSlotHmm / bodyHmm) * bodyCanvas.height : 0;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage();

    pdf.addImage(
      headerImg,
      "PNG",
      0,
      0,
      pageWidth,
      headerHmm,
      undefined,
      "FAST",
    );

    const startPx = pageIndex * contentSlotPx;
    const slicePx = Math.min(
      contentSlotPx,
      Math.max(0, bodyCanvas.height - startPx),
    );
    if (slicePx > 0) {
      const sliceHmm = (slicePx * pageWidth) / bodyCanvas.width;
      addCanvasRegionToPdf(
        pdf,
        bodyCanvas,
        0,
        startPx,
        bodyCanvas.width,
        slicePx,
        0,
        headerHmm,
        pageWidth,
        sliceHmm,
      );
    }

    pdf.addImage(
      footerImg,
      "PNG",
      0,
      pageHeight - footerHmm,
      pageWidth,
      footerHmm,
      undefined,
      "FAST",
    );
  }

  pdf.save(blotterPdfFilename(report, docVariant));
  return { ok: true };
}

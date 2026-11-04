import { useCallback, useEffect, useRef } from "react";
import { Download, Printer } from "lucide-react";
import Modal from "@/components/UI/Modal";
import {
  BLOTTER_DOC_VARIANT,
  buildBlotterDocumentHtml,
} from "@/lib/blotterDocument";
import { isBlotterVerified } from "@/lib/blotterVerify";

/** US Letter width at 96 CSS px/in — matches `.page { width: 8.5in }`. */
const LETTER_PAGE_PX = 816;

function waitForPreviewReady(doc) {
  if (!doc) return Promise.resolve();
  const imgs = Array.from(doc.querySelectorAll("img"));
  const imgWait = Promise.all(
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
  const fontWait = doc.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();
  return Promise.all([imgWait, fontWait]);
}

export default function BlotterDocumentPreviewModal({
  report,
  officials,
  variant,
  onVariantChange,
  isOpen,
  onClose,
  onPrint,
  onDownload,
  downloading = false,
}) {
  const iframeRef = useRef(null);
  const viewportRef = useRef(null);
  const verified = isBlotterVerified(report);

  const fitPreviewToViewport = useCallback(() => {
    const iframe = iframeRef.current;
    const viewport = viewportRef.current;
    const doc = iframe?.contentDocument;
    const page = doc?.querySelector(".page");
    if (!iframe || !viewport || !page) return;

    const available = Math.max(viewport.clientWidth - 4, 280);
    const scale = Math.min(1, available / LETTER_PAGE_PX);

    page.style.width = `${LETTER_PAGE_PX}px`;
    page.style.maxWidth = `${LETTER_PAGE_PX}px`;
    page.style.transform = scale < 1 ? `scale(${scale})` : "none";
    page.style.transformOrigin = "top center";
    page.style.marginBottom =
      scale < 1 ? `${-page.offsetHeight * (1 - scale)}px` : "0";

    const visualHeight = Math.ceil(page.offsetHeight * scale);
    iframe.style.height = `${visualHeight}px`;
    iframe.style.width = `${Math.ceil(LETTER_PAGE_PX * scale)}px`;
    iframe.style.maxWidth = "100%";
  }, []);

  useEffect(() => {
    if (!isOpen || !report) return;

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const html = buildBlotterDocumentHtml(report, {
      embedded: true,
      officials,
      variant,
    });
    doc.open();
    doc.write(html);
    doc.close();

    let cancelled = false;
    const runFit = () => {
      if (!cancelled) fitPreviewToViewport();
    };

    void waitForPreviewReady(doc).then(() => {
      runFit();
      requestAnimationFrame(runFit);
    });
    const t1 = window.setTimeout(runFit, 400);
    const t2 = window.setTimeout(runFit, 1200);

    const viewport = viewportRef.current;
    const ro =
      viewport && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(runFit)
        : null;
    ro?.observe(viewport);
    window.addEventListener("resize", runFit);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener("resize", runFit);
    };
  }, [isOpen, report, officials, variant, fitPreviewToViewport]);

  const refLabel = report?.id
    ? `BL-${String(report.id).substring(0, 8).toUpperCase()}`
    : "";

  const variantLabel =
    variant === BLOTTER_DOC_VARIANT.SUMMONS
      ? "Paanyaya sa Paghaharap"
      : "Tanggapan ng Lupong Tagapamayapa";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={refLabel ? `Preview — ${refLabel}` : "E-Sumbong preview"}
      size="xl"
      dense
      headerActions={
        <>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-[#03254c] rounded-lg hover:bg-[#021c38] disabled:opacity-50"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {downloading ? "Generating…" : "Download PDF"}
            </span>
          </button>
        </>
      }
    >
      {verified && onVariantChange ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => onVariantChange(BLOTTER_DOC_VARIANT.BLOTTER)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              variant === BLOTTER_DOC_VARIANT.BLOTTER
                ? "bg-[#03254c] text-white border-[#03254c]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Tanggapan ng Lupong Tagapamayapa
          </button>
          <button
            type="button"
            onClick={() => onVariantChange(BLOTTER_DOC_VARIANT.SUMMONS)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              variant === BLOTTER_DOC_VARIANT.SUMMONS
                ? "bg-[#03254c] text-white border-[#03254c]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Paanyaya sa Paghaharap
          </button>
        </div>
      ) : null}
      <p className="text-xs text-gray-500 mb-2">{variantLabel}</p>
      <div
        ref={viewportRef}
        className="w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg bg-slate-100/90 border border-gray-200 max-h-[min(68vh,820px)] py-3 px-2 sm:py-4 sm:px-3"
      >
        <div className="flex justify-center min-w-0">
          <iframe
            ref={iframeRef}
            title="E-Sumbong document preview"
            className="block bg-white shadow-md ring-1 ring-gray-200/80 border-0"
            scrolling="no"
          />
        </div>
      </div>
    </Modal>
  );
}

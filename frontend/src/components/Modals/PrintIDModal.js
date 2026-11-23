import React, { useState } from "react";
import { X, Printer, Download, Eye, Sparkles } from "lucide-react";
import BarangayIDCard from "../UI/BarangayIDCard";
import useScrollLock from "@/lib/useScrollLock";

export default function PrintIDModal({
  isOpen,
  onClose,
  idData,
  tenantConfig = {},
}) {
  useScrollLock(isOpen);

  const SIDESLIDE_MS = 280;
  const SIDESLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
  const [rendered, setRendered] = useState(isOpen);
  const [slideIn, setSlideIn] = useState(false);

  const [printLayout, setPrintLayout] = useState("both"); // 'both' | 'front' | 'back'
  const handleClose = () => {
    setSlideIn(false);
    setTimeout(() => {
      setRendered(false);
      if (typeof onClose === "function") {
        onClose();
      }
    }, SIDESLIDE_MS);
  };

  React.useEffect(() => {
    if (isOpen) {
      setRendered(true);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setSlideIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else if (rendered) {
      setSlideIn(false);
      const t = setTimeout(() => setRendered(false), SIDESLIDE_MS);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keyboard Escape listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!(isOpen || rendered) || !idData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] cursor-pointer"
        style={{
          opacity: slideIn ? 1 : 0,
          transition: `opacity ${SIDESLIDE_MS}ms ${SIDESLIDE_EASE}`,
        }}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-10 h-full w-full sm:w-[min(96vw,64rem)] lg:w-[calc(100vw-16rem)] max-w-[100vw] bg-white rounded-none shadow-[-8px_0_28px_rgba(0,0,0,0.16)] border-l border-slate-200/90 flex flex-col overflow-hidden"
        style={{
          transform: slideIn ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: `transform ${SIDESLIDE_MS}ms ${SIDESLIDE_EASE}`,
          willChange: "transform",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#03254c] px-4 sm:px-6 py-3 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Printer className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Print Official Barangay ID Card
              </h3>
              <p className="text-xs text-blue-200/80">
                {idData.full_name} • {idData.id_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Print Layout Selector */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintLayout("both")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  printLayout === "both" ? "bg-white text-[#03254c]" : "text-white/80 hover:text-white"
                }`}
              >
                Front & Back
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout("front")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  printLayout === "front" ? "bg-white text-[#03254c]" : "text-white/80 hover:text-white"
                }`}
              >
                Front Only
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout("back")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  printLayout === "back" ? "bg-white text-[#03254c]" : "text-white/80 hover:text-white"
                }`}
              >
                Back Only
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 flex flex-col items-center justify-center min-h-[350px]">
          <div className="print-area p-4 bg-white/50 rounded-3xl border border-dashed border-slate-300 shadow-inner flex items-center justify-center">
            <BarangayIDCard
              idData={idData}
              tenantConfig={tenantConfig}
              side={printLayout}
              scale={1}
            />
          </div>

          <p className="text-xs text-slate-500 font-semibold mt-4 text-center">
            Standard CR80 format dimensions (85.6mm × 53.98mm). Printable on standard PVC card printers or thermal laminators.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-[#03254c] hover:from-blue-700 hover:to-blue-900 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Card Now
          </button>
        </div>
      </div>
    </div>
  );
}

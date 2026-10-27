import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShieldAlert } from "lucide-react";
import useScrollLock from "@/lib/useScrollLock";
import ESumbongForm from "./ESumbongForm";

export default function ESumbongModal({ isOpen, onClose, publicMode = false }) {
  useScrollLock(isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalMaxHeight =
    "min(720px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem))";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-default"
        aria-label="Isara ang dialog"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="esumbong-modal-title"
        className="relative z-[101] bg-white w-full max-w-lg md:max-w-xl flex flex-col min-h-0 overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: modalMaxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 flex items-center gap-3 border-b border-red-800/20">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="esumbong-modal-title" className="text-base sm:text-lg font-bold text-white leading-tight">
              E-Sumbong
            </h3>
            <p className="text-[11px] sm:text-xs text-red-100/95 truncate">
              Opisyal na ulat sa barangay blotter
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Isara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ESumbongForm
          variant="modal"
          publicMode={publicMode}
          isActive={isOpen}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}

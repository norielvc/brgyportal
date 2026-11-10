import React, { useEffect, useId, useState } from "react";
import { AlertTriangle, Ban, Download, X } from "lucide-react";
import useScrollLock from "@/lib/useScrollLock";

const VARIANTS = {
  warning: {
    Icon: Download,
    header: "from-amber-500 to-amber-700",
    ring: "ring-amber-100",
    iconBg: "bg-amber-500/15 text-amber-700",
    confirm:
      "bg-amber-600 hover:bg-amber-700 shadow-amber-200/80 text-white",
    strip: "bg-amber-50 border-amber-100 text-amber-700",
  },
  danger: {
    Icon: Ban,
    header: "from-rose-500 to-rose-700",
    ring: "ring-rose-100",
    iconBg: "bg-rose-500/15 text-rose-700",
    confirm: "bg-rose-600 hover:bg-rose-700 shadow-rose-200/80 text-white",
    strip: "bg-rose-50 border-rose-100 text-rose-700",
  },
  neutral: {
    Icon: AlertTriangle,
    header: "from-[#03254c] to-[#0a3d6e]",
    ring: "ring-blue-100",
    iconBg: "bg-blue-500/15 text-[#03254c]",
    confirm: "bg-[#03254c] hover:bg-[#021a33] shadow-blue-200/80 text-white",
    strip: "bg-blue-50 border-blue-100 text-[#03254c]",
  },
};

export default function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  footnote,
  variant = "neutral",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  isLoading = false,
  input,
}) {
  const [value, setValue] = useState(input?.defaultValue ?? "");
  const inputId = useId();
  const style = VARIANTS[variant] || VARIANTS.neutral;
  const Icon = style.Icon;

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setValue(input?.defaultValue ?? "");
    }
  }, [isOpen, input?.defaultValue]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !isLoading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const trimmed = String(value || "").trim();
  const inputInvalid = input?.required && !trimmed;

  const handleConfirm = () => {
    if (inputInvalid) return;
    onConfirm?.(input ? trimmed : undefined);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isLoading ? undefined : onClose}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] animate-in zoom-in-95 fade-in duration-200 ${style.ring} ring-4 ring-offset-0`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-title`}
      >
        <div
          className={`bg-gradient-to-br ${style.header} px-5 py-5 text-white relative`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <div
              className={`p-2.5 rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm shrink-0`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                id={`${inputId}-title`}
                className="text-lg font-black leading-tight tracking-tight"
              >
                {title}
              </h2>
              {footnote ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-1">
                  {footnote}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {description ? (
            <div className="text-sm text-gray-600 leading-relaxed font-medium space-y-2">
              {typeof description === "string" ? <p>{description}</p> : description}
            </div>
          ) : null}

          {input ? (
            <div>
              <label
                htmlFor={inputId}
                className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5"
              >
                {input.label}
              </label>
              {input.multiline ? (
                <textarea
                  id={inputId}
                  rows={input.rows || 3}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#03254c]/30 focus:border-[#03254c] outline-none resize-none"
                  disabled={isLoading}
                />
              ) : (
                <input
                  id={inputId}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#03254c]/30 focus:border-[#03254c] outline-none"
                  disabled={isLoading}
                />
              )}
            </div>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || inputInvalid}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 min-w-[8rem] ${style.confirm}`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>

        {variant === "warning" ? (
          <div className={`py-2 px-5 text-center border-t ${style.strip}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Large exports use Supabase egress quota
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

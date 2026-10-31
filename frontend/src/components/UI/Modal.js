import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import useScrollLock from "@/lib/useScrollLock";
import useMobileModalViewport from "@/lib/useMobileModalViewport";

export default function Modal({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  footer,
  size = "md",
  dense = false,
  bodyScroll = true,
  showCloseButton = true,
}) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-4xl",
    /** Resident profile — landscape, moderate width */
    profile: "w-[min(94vw,72rem)]",
    xl: "max-w-6xl",
    full: "max-w-screen-2xl",
  };

  const panelRef = useRef(null);
  useScrollLock(isOpen);
  useMobileModalViewport(panelRef, isOpen);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Background overlay */}
      <div
        className="fixed inset-0 transition-opacity bg-gray-500/75"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 w-full overflow-hidden text-left bg-white shadow-2xl rounded-2xl flex flex-col max-h-[96dvh] sm:max-h-[90vh] max-sm:max-h-[100dvh]",
          sizeClasses[size],
        )}
      >
        {/* Header */}
        {(title || headerActions || showCloseButton) && (
          <div
            className={cn(
              "flex items-center gap-2 sm:gap-3 shrink-0 border-b border-gray-100 min-w-0",
              dense ? "px-3 py-2" : "px-4 py-3 sm:px-6 sm:py-4",
            )}
          >
            {title && (
              <h3
                className={cn(
                  "font-bold text-gray-900 truncate min-w-0 mr-3",
                  dense ? "text-sm" : "text-base sm:text-lg",
                )}
              >
                {title}
              </h3>
            )}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
              {headerActions ? (
                <div className="flex items-center gap-2 min-w-0">
                  {headerActions}
                </div>
              ) : null}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#03254c] rounded-md transition-colors shrink-0"
                >
                  <X className={dense ? "w-4 h-4" : "w-5 h-5"} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "flex-1 min-h-0",
            bodyScroll ? "overflow-y-auto" : "overflow-hidden flex flex-col",
            dense ? "p-2.5 sm:p-3" : "p-4 sm:p-6",
            footer ? (dense ? "pb-2" : "pb-3") : "",
          )}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              "shrink-0 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]",
              dense ? "px-3 py-2.5" : "px-4 py-3 sm:px-6 sm:py-4",
              "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}) {
  const buttonClass = type === "danger" ? "btn-danger" : "btn-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mb-6">
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
        <button onClick={onClose} className="btn-secondary w-full sm:w-auto">
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`${buttonClass} w-full sm:w-auto`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

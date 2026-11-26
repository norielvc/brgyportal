import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  presentation = "center",
  zIndexClass = "z-50",
}) {
  const isSideSlide = presentation === "side-slide";
  const [rendered, setRendered] = useState(isOpen);
  const [slideIn, setSlideIn] = useState(false);
  const closeTimerRef = useRef(null);
  const closingRef = useRef(false);

  const SIDESLIDE_MS = 280;
  const SIDESLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-4xl",
    /** Resident profile — landscape, moderate width */
    profile: "w-[min(94vw,72rem)]",
    xl: "max-w-6xl",
    full: "max-w-screen-2xl",
  };

  const sideSlideSizeClasses = {
    sm: "sm:w-[min(92vw,28rem)]",
    md: "sm:w-[min(94vw,42rem)]",
    lg: "sm:w-[min(96vw,58rem)] lg:w-[min(82vw,66rem)]",
    profile: "sm:w-[min(96vw,74rem)] lg:w-[calc(100vw-16rem)]",
    xl: "sm:w-[min(96vw,74rem)] lg:w-[calc(100vw-16rem)]",
    full: "sm:w-[98vw] lg:w-[calc(100vw-16rem)]",
  };

  const panelRef = useRef(null);
  useScrollLock(isOpen || (isSideSlide && rendered));
  useMobileModalViewport(panelRef, isOpen && !isSideSlide);

  const handleRequestClose = () => {
    if (!isSideSlide) {
      onClose();
      return;
    }
    if (closingRef.current) return;
    closingRef.current = true;
    setSlideIn(false);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      closingRef.current = false;
      setRendered(false);
      onClose();
    }, SIDESLIDE_MS);
  };

  useEffect(() => {
    if (!isSideSlide) {
      setRendered(isOpen);
      return;
    }
    clearTimeout(closeTimerRef.current);
    if (isOpen) {
      closingRef.current = false;
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
      closeTimerRef.current = setTimeout(() => {
        setRendered(false);
      }, SIDESLIDE_MS);
    }
  }, [isOpen, isSideSlide]);

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleRequestClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isSideSlide]);

  if (isSideSlide ? !(isOpen || rendered) : !isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0",
        zIndexClass,
        isSideSlide ? "" : "flex items-center justify-center p-2 sm:p-4",
      )}
    >
      {/* Background overlay */}
      <div
        className={cn(
          "fixed inset-0",
          isSideSlide
            ? "bg-slate-900/50 backdrop-blur-[2px]"
            : "bg-gray-500/75 transition-opacity",
        )}
        style={
          isSideSlide
            ? {
                opacity: slideIn ? 1 : 0,
                transition: `opacity ${SIDESLIDE_MS}ms ${SIDESLIDE_EASE}`,
              }
            : undefined
        }
        onClick={handleRequestClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        className={cn(
          "z-10 w-full overflow-hidden text-left bg-white flex flex-col",
          isSideSlide
            ? cn(
                "fixed inset-y-0 right-0 h-full max-w-[100vw] rounded-none shadow-[-8px_0_28px_rgba(0,0,0,0.14)] border-l border-slate-200/90",
                sideSlideSizeClasses[size] || sideSlideSizeClasses.xl,
              )
            : cn(
                "relative shadow-2xl rounded-2xl max-h-[96dvh] sm:max-h-[90vh] max-sm:max-h-[100dvh]",
                sizeClasses[size],
              ),
        )}
        style={
          isSideSlide
            ? {
                transform: slideIn
                  ? "translate3d(0, 0, 0)"
                  : "translate3d(100%, 0, 0)",
                transition: `transform ${SIDESLIDE_MS}ms ${SIDESLIDE_EASE}`,
                willChange: "transform",
              }
            : undefined
        }
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
                  onClick={handleRequestClose}
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

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
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

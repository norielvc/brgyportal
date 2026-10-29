import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import useScrollLock from "@/lib/useScrollLock";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dense = false,
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

  useScrollLock(isOpen);

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
        className={cn(
          "relative w-full overflow-hidden text-left bg-white shadow-2xl rounded-2xl flex flex-col max-h-[96dvh] sm:max-h-[90vh]",
          sizeClasses[size],
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between shrink-0 border-b border-gray-100",
              dense ? "px-3 py-2" : "p-4 sm:p-6 pb-3 sm:pb-4",
            )}
          >
            {title && (
              <h3
                className={cn(
                  "font-bold text-gray-900 truncate pr-2",
                  dense ? "text-sm" : "text-base sm:text-lg",
                )}
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#03254c] rounded-md transition-colors ml-auto shrink-0"
              >
                <X className={dense ? "w-4 h-4" : "w-5 h-5"} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto flex-1",
            dense ? "p-2.5 sm:p-3" : "p-4 sm:p-6",
          )}
        >
          {children}
        </div>
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

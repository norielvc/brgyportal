import { AlertCircle } from "lucide-react";

/** Keep in sync with src/lib/blotterConstants.js */
export const DETAILS_MAX_CHARS = 10000;

export const inputClass =
  "w-full min-w-0 px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-shadow break-words [overflow-wrap:anywhere]";

export function FieldLabel({ icon: Icon, children, optional }) {
  return (
    <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5 leading-snug">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden />}
      <span>{children}</span>
      {optional && (
        <span className="text-gray-400 font-normal normal-case">(opsyonal)</span>
      )}
    </label>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

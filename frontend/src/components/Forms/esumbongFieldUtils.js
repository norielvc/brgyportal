import { AlertCircle } from "lucide-react";

/** Keep in sync with src/lib/blotterConstants.js */
export const DETAILS_MAX_CHARS = 10000;

/** Text fields on E-Sumbong are stored and displayed in ALL CAPS. */
export const ESUMBONG_UPPERCASE_FIELDS = new Set([
  "complainant_name",
  "respondent_name",
  "details",
  "contact_number",
  "email",
]);

export function toEsumbongUppercase(value) {
  return String(value ?? "").toUpperCase();
}

export const inputClass =
  "w-full min-w-0 px-3 py-2.5 text-sm font-medium uppercase text-gray-900 placeholder:text-gray-400 placeholder:uppercase bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-shadow break-words [overflow-wrap:anywhere]";

export function FieldLabel({ icon: Icon, children, optional, optionalLabel = "(opsyonal)" }) {
  return (
    <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5 leading-snug">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden />}
      <span>{children}</span>
      {optional && (
        <span className="text-gray-400 font-normal normal-case">{optionalLabel}</span>
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

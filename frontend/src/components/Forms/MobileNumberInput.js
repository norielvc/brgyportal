import { useEffect, useRef } from "react";
import { Phone } from "lucide-react";

/** Full stored number: 09 plus up to 9 more digits. */
export function phMobileDigits(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("63") && digits.length >= 11) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = `0${digits}`;
  } else if (digits.startsWith("9") && digits.length >= 10) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}

/** The 9 digits after the fixed 09, taken from a stored full number. */
export function phMobileRest(raw) {
  const digits = phMobileDigits(raw);
  return digits.startsWith("09") ? digits.slice(2) : digits.slice(0, 9);
}

/**
 * Digits from the suffix box.
 * 0 and 9 are kept as typed. A pasted full number (0917…, 917…, +63917…) is reduced to the 9-digit suffix.
 */
export function restDigitsFromSuffix(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length >= 12) {
    digits = digits.slice(2);
    if (digits.startsWith("0") || digits.startsWith("9")) digits = digits.slice(1);
  } else if (digits.startsWith("09") && digits.length >= 11) {
    digits = digits.slice(2);
  } else if (digits.startsWith("9") && digits.length >= 10) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

function formatGrouped(digits) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

/** 17 123 4567 — the part after 09. */
export function formatPhMobileRest(raw) {
  return formatGrouped(phMobileRest(raw));
}

/** 0917 123 4567 */
export function formatPhMobile(raw) {
  const digits = phMobileDigits(raw);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function isValidPhMobile(raw) {
  return /^09\d{9}$/.test(phMobileDigits(raw));
}

/** Mask a PH mobile number as *********67 (last 2 digits visible). */
export function maskPhMobile(raw) {
  const digits = phMobileDigits(raw);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  return `${"*".repeat(digits.length - 2)}${digits.slice(-2)}`;
}

function caretForDigitCount(formatted, count) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return formatted.length;
}

export default function MobileNumberInput({
  id,
  name = "contactNumber",
  value,
  onChange,
  error = false,
  className = "",
  isMasked = false,
  onUnmask,
}) {
  const inputRef = useRef(null);
  const caretDigits = useRef(null);
  const rest = formatPhMobileRest(value);
  const maskedDisplay = isMasked ? maskPhMobile(value) : "";
  const showMasked = Boolean(isMasked && maskedDisplay);

  useEffect(() => {
    if (showMasked || caretDigits.current == null) return;
    const node = inputRef.current;
    if (!node) return;
    const pos = caretForDigitCount(node.value, caretDigits.current);
    node.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [rest, showMasked]);

  return (
    <div className="relative">
      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      {!showMasked && (
        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-[15px] font-semibold tracking-wide text-gray-900 pointer-events-none">
          09
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="tel"
        name={name}
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={18}
        placeholder="17 123 4567"
        value={showMasked ? maskedDisplay : rest}
        onFocus={() => {
          if (showMasked) {
            onUnmask?.();
          }
        }}
        onChange={(e) => {
          if (showMasked) {
            onUnmask?.();
            return;
          }
          const raw = e.target.value;
          const caret = e.target.selectionStart ?? raw.length;
          const prevDigits = phMobileRest(value);
          const typedDigits = raw.replace(/\D/g, "");
          let digitsBefore = raw.slice(0, caret).replace(/\D/g, "").length;

          let nextDigits = typedDigits;
          const removedOnlySpace = nextDigits === prevDigits && raw.length < rest.length;
          if (removedOnlySpace && digitsBefore > 0) {
            nextDigits = prevDigits.slice(0, digitsBefore - 1) + prevDigits.slice(digitsBefore);
            digitsBefore -= 1;
          } else if (typedDigits.length >= 10) {
            nextDigits = restDigitsFromSuffix(raw);
            digitsBefore = nextDigits.length;
          } else {
            nextDigits = typedDigits.slice(0, 9);
            digitsBefore = Math.min(digitsBefore, nextDigits.length);
          }

          caretDigits.current = digitsBefore;
          const full = nextDigits ? `09${nextDigits}` : "";
          onChange({
            target: { name: "contactNumber", value: formatPhMobile(full) },
          });
        }}
        className={
          className ||
          `w-full ${showMasked ? "pl-10" : "pl-[4.25rem]"} pr-4 py-3 bg-white border rounded-lg text-[15px] tracking-wide text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-offset-0 ${
            error
              ? "border-red-400 focus:ring-red-100"
              : "border-gray-300 focus:ring-gray-200"
          }`
        }
      />
    </div>
  );
}

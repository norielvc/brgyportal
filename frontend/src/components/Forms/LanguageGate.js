/**
 * LanguageGate — First screen of every certificate request modal.
 */
import React from "react";
import { Check, Globe } from "lucide-react";
import { LANGUAGES, getStrings } from "../../lib/certLang";

export default function LanguageGate({ accentColor, onSelect, lang }) {
  const t = getStrings(lang || "tl");

  const globeIcon = (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center"
      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
    >
      <Globe className="w-6 h-6" aria-hidden />
    </div>
  );

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-lg mx-auto w-full">
      <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
        <div className="hidden sm:block mb-4">{globeIcon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1.5">
          Pumili ng wika / Choose your language
        </h3>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          Inirerekomenda ang Tagalog para sa karamihan ng mga residente. Maaari
          ring magpatuloy sa English kung mas komportable kayo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto w-full">
        {LANGUAGES.map(({ code, label, hint }) => {
          const selected = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelect(code)}
              className={`p-5 rounded-xl border-2 text-left transition-colors touch-manipulation ${
                selected ? "bg-white" : "bg-white border-gray-200 hover:border-gray-300"
              }`}
              style={
                selected
                  ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` }
                  : undefined
              }
            >
              <span className="flex items-center justify-between gap-2 mb-1">
                <span
                  className="text-base font-bold"
                  style={selected ? { color: accentColor } : { color: "#111827" }}
                >
                  {label}
                </span>
                {selected && (
                  <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                )}
              </span>
              <span className="block text-xs text-gray-500">{hint}</span>
            </button>
          );
        })}
      </div>

      <div className="flex sm:hidden justify-center mt-5" aria-hidden>
        {globeIcon}
      </div>

      <p className="text-xs text-gray-400 text-center mt-5 sm:mt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {t.langNote}
      </p>
    </div>
  );
}

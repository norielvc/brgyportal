/**
 * LanguageGate — First screen of every certificate request modal.
 * The resident chooses English or Tagalog before the wizard begins,
 * so all downstream copy renders in their preferred language.
 */
import React from "react";
import { Check, Globe } from "lucide-react";
import { LANGUAGES, getStrings } from "../../lib/certLang";

export default function LanguageGate({ accentColor, onSelect, lang }) {
  const t = getStrings(lang || "en");

  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="flex flex-col items-center text-center mb-7">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1.5">
          Choose your language / Pumili ng wika
        </h3>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          Select the language you are most comfortable with. Piliin ang wikang
          mas komportable sa iyo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
        {LANGUAGES.map(({ code, label, hint }) => {
          const selected = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelect(code)}
              className={`p-5 rounded-xl border-2 text-left transition-colors ${
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

      <p className="text-xs text-gray-400 text-center mt-6">{t.langNote}</p>
    </div>
  );
}

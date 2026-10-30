import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

/**
 * Purpose picker with inline search — mobile-safe (no auto-focus keyboard jump,
 * opens downward so it does not fight the software keyboard).
 */
export default function CertSearchableDropdown({
  items,
  onSelect,
  placeholder,
  label,
  colorClass,
  searchPlaceholder = "Search...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (mobile) {
      rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const filtered = items.filter(
    (p) => !search || p.toUpperCase().includes(search.toUpperCase()),
  );

  return (
    <div className="relative space-y-1.5" ref={rootRef}>
      <p className={`text-xs font-semibold ${colorClass.label}`}>{label}</p>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-medium ${colorClass.text} flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-gray-200`}
      >
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3.5 h-3.5 shrink-0 ${colorClass.icon}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[120] top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[min(160px,32dvh)] sm:max-h-[220px]">
          <div className="p-2 border-b border-gray-100 shrink-0 bg-white">
            <div className="relative">
              <Search
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${colorClass.icon} pointer-events-none`}
              />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="done"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full pl-8 pr-3 py-2 text-sm ${colorClass.bg || "bg-white"} border border-gray-100 rounded-md outline-none focus:ring-2 ${colorClass.ring || "focus:ring-gray-200"} ${colorClass.text} placeholder-gray-400 font-medium`}
              />
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 py-1">
            {filtered.length > 0 ? (
              filtered.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm ${colorClass.text} hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0`}
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                &mdash;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

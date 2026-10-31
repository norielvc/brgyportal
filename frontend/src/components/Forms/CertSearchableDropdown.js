import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

const MENU_Z = 200;

/**
 * Purpose picker with inline search — list renders in a portal so it is not
 * clipped by certificate modal overflow on desktop or mobile.
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
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);

  const updateMenuPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const maxMenuH = Math.min(260, Math.floor(window.innerHeight * 0.42));
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const height = Math.max(120, Math.min(maxMenuH, available));

    setMenuPos({
      left: rect.left,
      width: rect.width,
      top: openUp ? rect.top - height - gap : rect.bottom + gap,
      maxHeight: height,
    });
  }, []);

  useEffect(() => {
    const handleOutside = (event) => {
      const root = rootRef.current;
      const menu = document.getElementById(`cert-purpose-menu-${label}`);
      if (
        root &&
        !root.contains(event.target) &&
        menu &&
        !menu.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [label]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }
    updateMenuPos();
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (mobile) {
      buttonRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    }
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
    };
  }, [isOpen, updateMenuPos]);

  const filtered = items.filter(
    (p) => !search || p.toUpperCase().includes(search.toUpperCase()),
  );

  const menuId = `cert-purpose-menu-${label}`;

  const menu =
    isOpen &&
    menuPos &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        id={menuId}
        role="listbox"
        className="fixed bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
        style={{
          zIndex: MENU_Z,
          left: menuPos.left,
          width: menuPos.width,
          top: menuPos.top,
          maxHeight: menuPos.maxHeight,
        }}
      >
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
      </div>,
      document.body,
    );

  return (
    <div className="relative space-y-1.5" ref={rootRef}>
      <p className={`text-xs font-semibold ${colorClass.label}`}>{label}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-medium ${colorClass.text} flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-gray-200`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3.5 h-3.5 shrink-0 ${colorClass.icon}`} />
      </button>
      {menu}
    </div>
  );
}

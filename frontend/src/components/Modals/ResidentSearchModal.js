import { useState, useEffect } from "react";
import {
  Search,
  X,
  User,
  Check,
  Users,
  UserPlus,
  ShieldAlert,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { getStrings } from "../../lib/certLang";

export default function ResidentSearchModal({
  isOpen,
  onClose,
  onSelect,
  isDemo = false,
  tenantConfig = {},
  tenantId: tenantIdProp,
  lang = "en",
}) {
  const t = getStrings(lang);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOpen) {
        // Save current scroll position
        const scrollY = window.scrollY;
        
        // Calculate scrollbar width to prevent layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        // Lock scroll and maintain position
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        // Get the scroll position before unlocking
        const scrollY = document.body.style.top;
        
        // Restore scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        // Get the scroll position before unlocking
        const scrollY = document.body.style.top;
        
        // Restore scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isOpen]);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPendingCaseModal, setShowPendingCaseModal] = useState(false);

  const handleResidentClick = (resident) => {
    if (resident.pending_case) {
      setShowPendingCaseModal(true);
    } else {
      onSelect(resident);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 3) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tenantId = (
        tenantIdProp ||
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("tenant") ||
            window.location.pathname.replace(/^\//, "").split("/")[0] ||
            "ibaoeste"
          : "ibaoeste")
      ).toLowerCase();

      const response = await fetch(
        `/api/residents/search?name=${encodeURIComponent(searchTerm)}`,
        {
          headers: { "x-tenant-id": tenantId },
        },
      );

      const data = await response.json();
      if (data.success && data.residents?.length > 0) {
        setResults(data.residents);
      } else {
        // No results found - don't show fake data
        setResults([]);
      }
    } catch (err) {
      console.error("❌ Resident search API failed:", err.message);
      setError(
        "Network services interrupted. Please utilize Manual Entry below.",
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    // Fallback for demo/testing when DB is inaccessible
    onSelect({
      full_name: searchTerm.toUpperCase() || "MANUAL ENTRY GUEST",
      age: "",
      gender: "",
      civil_status: "",
      residential_address: "",
      id: "TEMPORARY-" + Math.floor(Math.random() * 10000),
      pending_case: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  const accentColor = tenantConfig.primaryColor || (isDemo ? "#111111" : "#059669");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div
          className="px-6 sm:px-8 py-5 flex items-start justify-between shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-white/15 p-2.5 rounded-xl border border-white/25 shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">
                {tenantConfig.shortName || "Barangay"} &middot; {t.dirSubtitle}
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {t.dirTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Field */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 bg-gray-50 shrink-0">
          <label htmlFor="resident-search" className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.dirTitle}
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="resident-search"
              type="text"
              autoFocus
              placeholder={t.dirPlaceholder}
              className="w-full pl-10 pr-11 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">{t.dirEmptyBody}</p>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 bg-white">
          {error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
                <ShieldAlert className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">
                {t.dirErrTitle}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {t.dirErrBody}
              </p>

              <button
                onClick={handleManualEntry}
                className="px-5 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <UserPlus className="w-4 h-4" />
                {t.dirManual}
              </button>
              <p className="mt-3 text-xs text-gray-400">{t.dirManualNote}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-3">
                {results.length} {results.length === 1 ? "record" : "records"}
              </p>
              {results.map((resident) => {
                const brgy = resident.residential_address?.match(/brgy\.?\s[\w\s']+/i);
                return (
                  <button
                    key={resident.id}
                    onClick={() => handleResidentClick(resident)}
                    className="w-full flex items-center gap-3.5 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      <User className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-900 leading-snug truncate">
                        {resident.full_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Check className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
                        <span className="text-xs text-gray-500 truncate">
                          {t.dirVerified}
                          {brgy && ` · ${brgy[0].trim()}`}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          ) : searchTerm.length >= 3 && !isLoading ? (
            <div className="py-8 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-1.5">
                {t.dirNoneTitle}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {t.dirNoneBody}
              </p>

              <button
                onClick={handleManualEntry}
                className="px-5 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <UserPlus className="w-4 h-4" />
                {t.dirManual}
              </button>
              <p className="mt-3 text-xs text-gray-400">{t.dirManualNote}</p>
            </div>
          ) : (
            <div className="py-10 text-center max-w-sm mx-auto">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
              >
                <Users className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-1.5">
                {t.dirEmptyTitle}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t.dirEmptyBody}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4 shrink-0">
          <span className="text-xs text-gray-500">
            {tenantConfig.shortName || "Barangay"} official records
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Pending Case Modal */}
      {showPendingCaseModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
                <ShieldAlert className="w-7 h-7 text-amber-600" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t.dirVisitTitle}
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                {t.dirVisitBody}
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 w-full text-left">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {t.dirVisitAt}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {tenantConfig.shortName || 'Barangay'} Office
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {t.dirOfficeHours}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowPendingCaseModal(false);
                  onClose();
                }}
                className="w-full px-6 py-3 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accentColor }}
              >
                {t.dirUnderstand}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

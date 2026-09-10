import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Phone,
  Copy,
  Check,
  QrCode,
  FileText,
  Building2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "../UI/BarangayIDCard";
import useScrollLock from "@/lib/useScrollLock";

export default function ViewBarangayIDModal({
  isOpen,
  onClose,
  card,
  onPrint,
  onRenew,
  onRevoke,
  tenantConfig = {},
}) {
  useScrollLock(isOpen);

  const [cardSide, setCardSide] = useState("front"); // 'front' | 'back' | 'both'
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("card"); // 'card' | 'dossier'

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const handleCopyID = () => {
    if (card?.id_number) {
      navigator.clipboard.writeText(card.id_number);
      setCopied(true);
      toast.success("Barangay ID Number copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired =
    card.status === "expired" ||
    (card.expiry_date && new Date(card.expiry_date) < new Date());

  const resolvedBirthDate =
    card.birth_date ||
    card.date_of_birth ||
    card.birthday ||
    card.dob ||
    card.resident?.date_of_birth ||
    card.resident?.birth_date ||
    card.resident?.birthday ||
    card.resident?.dob ||
    null;

  let resolvedAge = card.age || card.resident?.age || null;
  if (!resolvedAge && resolvedBirthDate) {
    const b = new Date(resolvedBirthDate);
    if (!isNaN(b.getTime())) {
      const ageDiff = Date.now() - b.getTime();
      resolvedAge = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Clickable Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-id-modal-title"
        className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Government Header */}
        <div className="bg-gradient-to-r from-[#03254c] via-[#043b78] to-[#0a529e] p-4 sm:p-6 text-white flex items-center justify-between relative flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Building2 className="w-3 h-3 text-amber-300" />
                Barangay Iba O' Este • Citizen ID
              </div>
              <h3
                id="view-id-modal-title"
                className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2"
              >
                <span>Barangay EC Card Record</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Close modal"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer z-20 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Quick Bar */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCopyID}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-blue-50 text-[#03254c] border border-blue-200 rounded-xl font-mono font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer group"
              title="Click to copy ID Number"
            >
              <span>{card.id_number}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
              )}
            </button>

            <span className="text-xs font-bold text-gray-500 hidden sm:inline">
              {card.gender || "RESIDENT"} • DOB: {resolvedBirthDate || "N/A"}{resolvedAge ? ` (${resolvedAge} yrs old)` : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Status Pill */}
            {card.status === "active" && !isExpired && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                ACTIVE
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                EXPIRED
              </span>
            )}
            {card.status === "revoked" && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                REVOKED
              </span>
            )}

            {/* View Switcher */}
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold ml-1 sm:ml-2">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "card"
                    ? "bg-white text-[#03254c] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dossier")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "dossier"
                    ? "bg-white text-[#03254c] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50">
          {activeTab === "card" ? (
            /* TAB 1: CARD VISUAL RENDER */
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase">
                    Official PVC Card Render
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Standard CR80 PVC card format (85.6mm × 53.98mm).
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setCardSide("front")}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      cardSide === "front"
                        ? "bg-[#03254c] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardSide("back")}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      cardSide === "back"
                        ? "bg-[#03254c] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardSide("both")}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      cardSide === "both"
                        ? "bg-[#03254c] text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Dual
                  </button>
                </div>
              </div>

              {/* Card Canvas */}
              <div className="p-3 sm:p-8 bg-slate-100/90 rounded-2xl sm:rounded-3xl border border-slate-200/90 flex items-center justify-center min-h-[240px] sm:min-h-[300px] shadow-inner overflow-hidden">
                <BarangayIDCard
                  idData={{
                    ...card,
                    birth_date: resolvedBirthDate || card.birth_date,
                  }}
                  tenantConfig={tenantConfig}
                  side={cardSide}
                  scale={cardSide === "both" ? 0.65 : 0.85}
                />
              </div>
            </div>
          ) : null}

          {/* TAB 2 or BELOW: FULL RESIDENT & ISSUANCE DOSSIER */}
          <div className="space-y-5">
            {/* Section 1: Citizen Census Record */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="w-4 h-4 text-[#03254c]" />
                <h4 className="text-xs font-black text-[#03254c] uppercase tracking-wider">
                  Citizen Census Profile
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Full Legal Name
                  </span>
                  <span className="font-black text-gray-900 text-sm uppercase">
                    {card.full_name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Barangay ID Serial
                  </span>
                  <span className="font-mono font-bold text-[#03254c]">
                    {card.id_number}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Gender / Sex
                  </span>
                  <span className="font-bold text-gray-800">
                    {card.gender || "MALE"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Date of Birth
                  </span>
                  <span className="font-bold text-gray-800">
                    {resolvedBirthDate || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Age
                  </span>
                  <span className="font-bold text-gray-800">
                    {resolvedAge ? `${resolvedAge} years old` : "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Civil Status
                  </span>
                  <span className="font-bold text-gray-800">
                    {card.civil_status || "SINGLE"}
                  </span>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Official Residential Address
                  </span>
                  <span className="font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {card.purok ? `${card.purok}, ` : ""}
                    {card.address || "BARANGAY IBA O' ESTE, CALUMPIT, BULACAN"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Issuance & Government Validity Record */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-4 h-4 text-[#03254c]" />
                <h4 className="text-xs font-black text-[#03254c] uppercase tracking-wider">
                  Official Issuance & Security Registry
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Date Issued
                  </span>
                  <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {card.issue_date}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Expiration Date
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {card.expiry_date}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Issuing Authority
                  </span>
                  <span className="font-bold text-gray-800">
                    Office of the Punong Barangay
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Administrative Remarks
                  </span>
                  <span className="font-medium text-gray-600 italic">
                    {card.remarks || "Official Barangay EC Card generated via Master Census Registry."}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Anti-Tamper QR Security
                  </span>
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit mt-0.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    {card.id_number}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            Close Dossier
          </button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {card.status === "active" && onRenew ? (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onRenew(card);
                }}
                className="flex-1 sm:flex-none px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/80"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew</span>
              </button>
            ) : null}

            {card.status === "active" && onRevoke ? (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onRevoke(card);
                }}
                className="flex-1 sm:flex-none px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Revoke</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                handleClose();
                if (onPrint) onPrint(card);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#03254c] via-[#043b78] to-blue-700 hover:from-[#021b37] hover:to-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>Print Official Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Shield, QrCode, Phone, AlertCircle, MapPin, User, CheckCircle2 } from "lucide-react";

export default function BarangayIDCard({
  idData = {},
  tenantConfig = {},
  side = "both", // 'front' | 'back' | 'both'
  scale = 1,
  className = "",
  showHologram = true,
}) {
  const {
    id_number = "BID-IBA-2026-0001",
    full_name = "JUAN DELA CRUZ",
    gender = "MALE",
    civil_status = "SINGLE",
    birth_date = "1995-06-15",
    blood_type = "O+",
    address = "PUROK 1, IBA O' ESTE, CALUMPIT, BULACAN",
    purok = "Purok 1",
    precinct_no = "0042-A",
    tin_no = "---",
    contact_number = "09123456789",
    emergency_contact_name = "MARIA DELA CRUZ",
    emergency_contact_relation = "SPOUSE",
    emergency_contact_number = "09987654321",
    photo_url = null,
    cardholder_signature_url = null,
    captain_signature_url = null,
    issue_date = new Date().toISOString().split("T")[0],
    expiry_date = "2027-09-10",
    status = "active",
  } = idData;

  const brgyName = tenantConfig?.name || "BARANGAY IBA O' ESTE";
  const municipality = tenantConfig?.municipality || "CALUMPIT";
  const province = tenantConfig?.province || "BULACAN";
  const logo = tenantConfig?.logo || "/logo.png";
  const municipalLogo = "/calumpit.png";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // ── FRONT CARD ────────────────────────────────────────────────────────────
  const renderFront = () => (
    <div
      className="relative w-[340px] h-[215px] sm:w-[380px] sm:h-[240px] bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-200/90 overflow-hidden flex flex-col justify-between text-gray-900 select-none print:shadow-none print:border-gray-400"
      style={{
        boxShadow: "0 10px 25px -5px rgba(3, 37, 76, 0.15), 0 8px 10px -6px rgba(3, 37, 76, 0.1)",
      }}
    >
      {/* Background Guilloche Security Waves */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#03254c 1.5px, transparent 1.5px), radial-gradient(#03254c 1.5px, transparent 1.5px)`,
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0, 6px 6px",
        }}
      />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-blue-600/5 blur-2xl pointer-events-none" />

      {/* Header Band */}
      <div className="relative z-10 flex items-center justify-between pb-1.5 border-b-2 border-[#03254c]/15">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white p-0.5 shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Seal" className="w-full h-full object-contain" />
        </div>

        <div className="text-center flex-1 px-1.5 min-w-0">
          <p className="text-[7px] sm:text-[8px] font-bold text-gray-500 uppercase tracking-wider leading-none">
            Republic of the Philippines
          </p>
          <p className="text-[7px] sm:text-[8px] font-bold text-gray-600 uppercase tracking-wider leading-tight">
            Province of {province} • Municipality of {municipality}
          </p>
          <h3 className="text-[10px] sm:text-[12px] font-black text-[#03254c] uppercase tracking-tight leading-tight truncate">
            {brgyName}
          </h3>
          <div className="inline-block bg-[#03254c] text-white px-2 py-0.2 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-0.5">
            OFFICIAL RESIDENT IDENTIFICATION CARD
          </div>
        </div>

        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white p-0.5 shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
          <img src={municipalLogo} alt="Municipal Seal" className="w-full h-full object-contain" onError={(e) => { e.target.src = logo; }} />
        </div>
      </div>

      {/* Body: Photo + Resident Details */}
      <div className="relative z-10 flex items-center gap-3 my-auto py-1">
        {/* 2x2 Resident Photo */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 border-2 border-[#03254c] shadow-md overflow-hidden relative group">
            {photo_url ? (
              <img src={photo_url} alt={full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-gray-400">
                <User className="w-10 h-10" />
              </div>
            )}
            {/* Holographic badge overlay */}
            {showHologram && (
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-cyan-300 to-emerald-400 opacity-80 shadow-sm animate-pulse border border-white/80 flex items-center justify-center text-[7px] font-black text-white">
                ★
              </div>
            )}
          </div>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-[#03254c] mt-0.5 tracking-tight">
            {id_number}
          </span>
        </div>

        {/* Text Details Grid */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div>
            <span className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-wider block">
              Full Legal Name
            </span>
            <h4 className="text-[11px] sm:text-[13px] font-black text-gray-900 tracking-tight leading-tight truncate uppercase">
              {full_name}
            </h4>
          </div>

          <div>
            <span className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-wider block">
              Residential Address
            </span>
            <p className="text-[8.5px] sm:text-[9.5px] font-bold text-gray-700 leading-tight truncate">
              {address}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <div>
              <span className="text-[6.5px] sm:text-[7.5px] font-black text-gray-400 uppercase block">
                DOB
              </span>
              <p className="text-[8px] sm:text-[9px] font-bold text-gray-800 leading-none">
                {formatDate(birth_date)}
              </p>
            </div>
            <div>
              <span className="text-[6.5px] sm:text-[7.5px] font-black text-gray-400 uppercase block">
                Blood Type
              </span>
              <p className="text-[8px] sm:text-[9px] font-black text-red-600 leading-none">
                {blood_type || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-[6.5px] sm:text-[7.5px] font-black text-gray-400 uppercase block">
                Civil Status
              </span>
              <p className="text-[8px] sm:text-[9px] font-bold text-gray-800 uppercase leading-none truncate">
                {civil_status || "SINGLE"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Signature & Validity */}
      <div className="relative z-10 pt-1 border-t border-gray-200/80 flex items-end justify-between">
        {/* Cardholder Signature */}
        <div className="flex flex-col items-center">
          <div className="h-6 sm:h-7 w-28 sm:w-32 flex items-center justify-center overflow-hidden">
            {cardholder_signature_url ? (
              <img src={cardholder_signature_url} alt="Signature" className="h-full object-contain" />
            ) : (
              <span className="text-[8px] text-gray-300 italic font-serif">Signature Over Printed Name</span>
            )}
          </div>
          <div className="w-24 sm:w-28 border-t border-gray-800" />
          <span className="text-[6.5px] sm:text-[7.5px] font-bold uppercase text-gray-500 tracking-wider">
            Cardholder Signature
          </span>
        </div>

        {/* Validity Badge */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-sm">
            <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider">
              VALID UNTIL:
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black font-mono">
              {formatDate(expiry_date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── BACK CARD ─────────────────────────────────────────────────────────────
  const renderBack = () => (
    <div
      className="relative w-[340px] h-[215px] sm:w-[380px] sm:h-[240px] bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-200/90 overflow-hidden flex flex-col justify-between text-gray-900 select-none print:shadow-none print:border-gray-400"
      style={{
        boxShadow: "0 10px 25px -5px rgba(3, 37, 76, 0.15), 0 8px 10px -6px rgba(3, 37, 76, 0.1)",
      }}
    >
      {/* Background Watermark Seal */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <img src={logo} alt="Seal Watermark" className="w-40 h-40 object-contain" />
      </div>

      {/* Emergency Contact Header */}
      <div className="relative z-10 bg-[#03254c] text-white p-1.5 px-2.5 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
            IN CASE OF EMERGENCY, NOTIFY:
          </span>
        </div>
        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300">
          {emergency_contact_number || contact_number || "911 / 117"}
        </span>
      </div>

      {/* Emergency Details Box */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-gray-200/70 text-[8px] sm:text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold uppercase">Name:</span>
          <span className="font-black text-gray-900 uppercase truncate max-w-[180px]">
            {emergency_contact_name || "Barangay Office Desk"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold uppercase">Relationship:</span>
          <span className="font-bold text-gray-800 uppercase">
            {emergency_contact_relation || "Next of Kin"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold uppercase">Contact:</span>
          <span className="font-bold font-mono text-gray-900">
            {emergency_contact_number || contact_number || "N/A"}
          </span>
        </div>
      </div>

      {/* Terms & Conditions Notice */}
      <div className="relative z-10 text-[6.5px] sm:text-[7.5px] text-gray-500 leading-tight space-y-0.5">
        <p className="font-semibold">
          • This card is non-transferable and serves as official resident identification within Barangay {brgyName}.
        </p>
        <p className="font-semibold">
          • If found, please return to the Barangay Hall or drop in any postal mailbox.
        </p>
      </div>

      {/* Footer: QR Code & Punong Barangay Signature */}
      <div className="relative z-10 pt-1 border-t border-gray-200 flex items-center justify-between">
        {/* Verification QR Code */}
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white p-0.5 rounded border border-gray-300 flex items-center justify-center">
            {/* Display clean dynamic QR code placeholder or QR render */}
            <QrCode className="w-full h-full text-[#03254c]" />
          </div>
          <div>
            <p className="text-[6.5px] sm:text-[7.5px] font-black text-[#03254c] uppercase leading-none">
              VERIFIED RESIDENT
            </p>
            <p className="text-[6px] sm:text-[6.5px] font-mono text-gray-500 leading-tight">
              Scan for Auth
            </p>
          </div>
        </div>

        {/* Captain Signature & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="h-6 sm:h-7 w-24 sm:w-28 flex items-center justify-center overflow-hidden">
            {captain_signature_url ? (
              <img src={captain_signature_url} alt="Captain Signature" className="h-full object-contain" />
            ) : (
              <span className="text-[8px] text-gray-300 italic font-serif">Official Signature</span>
            )}
          </div>
          <div className="w-24 sm:w-28 border-t border-gray-800" />
          <p className="text-[7.5px] sm:text-[8.5px] font-black uppercase text-gray-900 leading-none mt-0.5">
            PUNONG BARANGAY
          </p>
          <span className="text-[6px] sm:text-[7px] text-gray-500 font-bold uppercase">
            Official Endorsement
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`inline-flex flex-wrap gap-4 items-center justify-center ${className}`}
      style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "center top" } : {}}
    >
      {(side === "both" || side === "front") && renderFront()}
      {(side === "both" || side === "back") && renderBack()}
    </div>
  );
}

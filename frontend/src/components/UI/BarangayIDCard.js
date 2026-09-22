import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function BarangayIDCard({
  idData = {},
  tenantConfig = {},
  side = "both", // 'front' | 'back' | 'both'
  scale = 1,
  className = "",
}) {
  const {
    id_number = "H00001-F00001",
    full_name = "ALEXANDER C. MANIO",
    first_name = "",
    middle_name = "",
    last_name = "",
    suffix = "",
    purok = "PUROK 2",
    barangay = "BARANGAY IBA O' ESTE",
    address = "PUROK 2, IBA O' ESTE, CALUMPIT, BULACAN",
    status = "active",
    qr_payload = null,
  } = idData;

  // Split name for template format (First Name + MI, and Last Name)
  let givenNames = "";
  let surname = "";

  if (first_name && last_name) {
    const mi = middle_name ? `${middle_name.trim()[0].toUpperCase()}.` : "";
    givenNames = [first_name.trim().toUpperCase(), mi].filter(Boolean).join(" ");
    surname = [last_name.trim().toUpperCase(), suffix ? suffix.trim().toUpperCase() : ""].filter(Boolean).join(" ");
  } else if (full_name) {
    const parts = full_name.trim().split(" ");
    if (parts.length > 1) {
      surname = parts[parts.length - 1].toUpperCase();
      givenNames = parts.slice(0, parts.length - 1).join(" ").toUpperCase();
    } else {
      givenNames = full_name.toUpperCase();
      surname = "";
    }
  }

  let purokName = (purok || "PUROK 2").trim().toUpperCase();
  if (
    !purokName.startsWith("PUROK") &&
    !purokName.startsWith("ZONE") &&
    !purokName.startsWith("SITIO")
  ) {
    purokName = `PUROK ${purokName}`;
  }
  const purokDisplay = purokName;

  let rawBrgy = (tenantConfig?.name || barangay || "IBA O' ESTE").trim().toUpperCase();
  if (!rawBrgy.startsWith("BARANGAY") && !rawBrgy.startsWith("BRGY")) {
    rawBrgy = `BARANGAY ${rawBrgy}`;
  }
  const barangayDisplay = rawBrgy;

  const idNumberDisplay = id_number || "H00001-F00001";

  // QR Code encodes the exact Card Number directly
  const qrValue = idNumberDisplay;

  // ── FRONT CARD (EC CARD) ───────────────────────────────────────────────────
  const renderFront = () => (
    <div
      className="relative w-[360px] h-[227px] sm:w-[440px] sm:h-[277px] rounded-2xl overflow-hidden shadow-2xl border border-gray-300 select-none flex-shrink-0 bg-cover bg-center print:shadow-none print:border-gray-400 print:m-0"
      style={{
        backgroundImage: "url('/images/id-templates/id_front_template.jpg')",
        aspectRatio: "1.586",
      }}
    >
      {/* Front Left Content Container matching Photoshop Coordinates */}
      <div className="absolute left-[8%] top-[18%] w-[49%] flex flex-col text-left">
        {/* EC Card Title */}
        <div className="mb-2 sm:mb-3">
          <h3 className="text-[16px] sm:text-[20px] font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">
            EC CARD
          </h3>
          <p className="text-[6px] sm:text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none mt-0.5">
            Emergency Calamity<br/>Identification Card
          </p>
        </div>

        {/* Resident Full Legal Name */}
        <div className="leading-none">
          <h2 className="text-[18px] sm:text-[23px] font-black text-white uppercase tracking-tight leading-none drop-shadow-sm truncate">
            {givenNames || "ALEXANDER C."}
          </h2>
          <h1 className="text-[28px] sm:text-[36px] font-black text-white uppercase tracking-tight leading-none drop-shadow-sm truncate mt-1">
            {surname || "MANIO"}
          </h1>
        </div>

        {/* Resident Location */}
        <div className="mt-4 sm:mt-5 space-y-0.5 leading-tight">
          <p className="text-[12px] sm:text-[15px] font-black text-white uppercase tracking-wide drop-shadow-sm truncate">
            {purokDisplay}
          </p>
          <p className="text-[12px] sm:text-[15px] font-black text-white uppercase tracking-wide drop-shadow-sm truncate">
            {barangayDisplay}
          </p>
        </div>


      </div>
    </div>
  );

  // ── BACK CARD (QR CODE & CHAIRMAN AUTH) ───────────────────────────────────
  const renderBack = () => (
    <div
      className="relative w-[360px] h-[227px] sm:w-[440px] sm:h-[277px] rounded-2xl overflow-hidden shadow-2xl border border-gray-300 select-none flex-shrink-0 bg-cover bg-center print:shadow-none print:border-gray-400 print:m-0"
      style={{
        backgroundImage: "url('/images/id-templates/id_back_template.jpg')",
        aspectRatio: "1.586",
      }}
    >
      {/* Center-Right QR Code Overlay */}
      <div className="absolute left-[64%] top-[49%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="p-2 sm:p-2.5 bg-white rounded-2xl shadow-xl border-4 border-[#1e293b] flex items-center justify-center">
          <QRCodeSVG
            value={qrValue}
            size={120}
            level="H"
            includeMargin={false}
            fgColor="#0f172a"
            bgColor="#ffffff"
            className="w-24 h-24 sm:w-[120px] sm:h-[120px]"
          />
        </div>
      </div>

      {/* EC Card Number on the Back */}
      <div className="absolute left-0 top-0 w-[55%] h-full flex items-center justify-center px-4">
        <p className="text-[14px] sm:text-[18px] font-black text-gray-800 tracking-tight font-sans">
          {idNumberDisplay}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`inline-flex flex-wrap gap-5 items-center justify-center ${className}`}
      style={
        scale !== 1
          ? {
              transform: `scale(${scale})`,
              transformOrigin: "center top",
            }
          : {}
      }
    >
      {(side === "both" || side === "front") && renderFront()}
      {(side === "both" || side === "back") && renderBack()}
    </div>
  );
}

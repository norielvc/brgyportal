import { QRCodeSVG } from "qrcode.react";
import {
  buildCertificateVerifyUrl,
  resolveBrgydeskNo,
} from "@/lib/certificateVerify";

/**
 * BrgyDesk No. + QR for printed / PDF certificates.
 */
export default function CertificateVerifyQR({
  request,
  tenantId,
  className = "",
  qrSize = 72,
  showLabel = true,
}) {
  const no = resolveBrgydeskNo(request);
  const tenant = tenantId || request?.tenant_id || "ibaoeste";
  if (!no) return null;

  const verifyUrl = buildCertificateVerifyUrl({
    brgydeskNo: no,
    tenantId: tenant,
  });

  return (
    <div
      className={`flex flex-col items-end gap-1 print:flex-col ${className}`}
      aria-label="BrgyDesk certificate verification"
    >
      {showLabel && (
        <div className="text-right leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            BrgyDesk No.
          </p>
          <p className="text-[11px] font-bold font-mono text-gray-900">{no}</p>
        </div>
      )}
      <div className="p-1 bg-white border border-gray-300 rounded print:border-gray-400">
        <QRCodeSVG
          value={verifyUrl}
          size={qrSize}
          level="M"
          includeMargin={false}
          fgColor="#0f172a"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-[8px] text-gray-500 text-right max-w-[90px] leading-tight">
        Scan to verify
      </p>
    </div>
  );
}

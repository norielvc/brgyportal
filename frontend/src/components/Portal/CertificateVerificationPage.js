import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileCheck,
  XCircle,
  Landmark,
} from "lucide-react";

function GovHeader({ branding, tenantId, tenantFromApi }) {
  const logos = branding?.logos || {};
  const header = branding?.headerInfo || {};
  const leftLogo = logos.leftLogo || logos.rightLogo || "/iba-o-este.png";
  const barangayName =
    header.barangayName ||
    tenantFromApi?.name ||
    (tenantId ? tenantId.toUpperCase() : "BARANGAY");
  const municipality = header.municipality || tenantFromApi?.municipality || "";
  const province = header.province || tenantFromApi?.region || "Province of Bulacan";
  const country = header.country || "Republic of the Philippines";

  return (
    <header className="border-b-2 border-[#1a365d] bg-white px-4 py-4 sm:px-6">
      <div className="flex items-center justify-center gap-3 sm:gap-5 max-w-lg mx-auto">
        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
          <img
            src={leftLogo}
            alt=""
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = "/logo.png";
            }}
          />
        </div>
        <div className="text-center min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] text-gray-800 leading-snug">{country}</p>
          <p className="text-[10px] sm:text-[11px] text-gray-800 leading-snug">{province}</p>
          {municipality ? (
            <p className="text-[10px] sm:text-[11px] text-gray-800 leading-snug">{municipality}</p>
          ) : null}
          <p className="text-sm sm:text-base font-bold text-[#1a365d] uppercase tracking-wide mt-1 leading-tight">
            {barangayName}
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c] mt-1">
            Office of the Barangay — Document Verification
          </p>
        </div>
        {logos.rightLogo && logos.rightLogo !== leftLogo ? (
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 hidden sm:flex items-center justify-center">
            <img src={logos.rightLogo} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 shrink-0 hidden sm:block" aria-hidden />
        )}
      </div>
    </header>
  );
}

function formatIssueDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function CertificateVerificationPage({ tenantId: tenantProp, verifyNo: noProp }) {
  const tenantId = (tenantProp || "").toString().toLowerCase().trim();
  const verifyNo = (noProp || "").toString().trim();

  const [loading, setLoading] = useState(!!verifyNo);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/config", {
          headers: { "x-tenant-id": tenantId },
        });
        const json = await res.json();
        if (!cancelled && json.success) setBranding(json.data);
      } catch {
        /* optional branding */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !verifyNo) {
      setLoading(false);
      if (!verifyNo && tenantId) {
        setError(null);
        setResult(null);
      } else if (!tenantId) {
        setError("Invalid barangay portal link.");
      }
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ no: verifyNo, tenant: tenantId });
        const res = await fetch(`/api/portal/verify-certificate?${params}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.message || "Certificate not found.");
          setResult(null);
        } else {
          setResult(json);
        }
      } catch {
        if (!cancelled) setError("Unable to verify. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, verifyNo]);

  const official = result?.verified === true;
  const data = result?.data;
  const tenantFromApi = data?.tenant;

  const pageTitle = useMemo(() => {
    const barangay =
      branding?.headerInfo?.barangayName || tenantFromApi?.name || "Barangay";
    return `Verify Certificate | ${barangay}`;
  }, [branding, tenantFromApi]);

  const portalHome = tenantId ? `/${tenantId}` : "/";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#eceae4] text-gray-900">
        <div className="max-w-lg mx-auto min-h-screen flex flex-col shadow-lg border-x border-[#c4bfb5] bg-[#faf9f6]">
          <GovHeader
            branding={branding}
            tenantId={tenantId}
            tenantFromApi={tenantFromApi}
          />

          <main className="flex-1 px-4 py-6 sm:px-6">
            <div className="border-2 border-[#1a365d] bg-white p-1">
              <div className="border border-[#94a3b8] px-4 py-5 sm:px-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <Landmark className="w-5 h-5 text-[#1a365d]" strokeWidth={1.75} />
                  <div>
                    <h1 className="text-sm font-bold uppercase tracking-wide text-[#1a365d]">
                      BrgyDesk Official Verification
                    </h1>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Pagpapatunay ng dokumento / Certificate authenticity
                    </p>
                  </div>
                </div>

                {!tenantId && (
                  <p className="text-sm text-center text-gray-600 py-6">
                    Use the QR code on the printed certificate to open this page.
                  </p>
                )}

                {tenantId && !verifyNo && (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-gray-700">
                      Scan the QR code on your barangay certificate to verify it here.
                    </p>
                    <p className="text-xs text-gray-500">
                      I-scan ang QR code sa sertipiko upang mapatunayan.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center py-10 text-gray-600">
                    <Loader2 className="w-9 h-9 animate-spin text-[#1a365d] mb-3" />
                    <p className="text-sm font-medium">Verifying record…</p>
                    <p className="text-[11px] text-gray-500 mt-1">Sinusuri ang rekord…</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-[#991b1b] mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-bold text-[#1a365d] uppercase text-sm tracking-wide">
                      Not verified / Hindi verified
                    </p>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">{error}</p>
                    {verifyNo && (
                      <p className="text-[11px] font-mono text-gray-500 mt-3 break-all">
                        BrgyDesk No.: {verifyNo}
                      </p>
                    )}
                  </div>
                )}

                {!loading && result && (
                  <div className="space-y-4">
                    <div
                      className={`flex gap-3 p-4 border-2 ${
                        official
                          ? "border-[#166534] bg-[#f0fdf4]"
                          : "border-[#b45309] bg-[#fffbeb]"
                      }`}
                    >
                      {official ? (
                        <ShieldCheck className="w-10 h-10 text-[#166534] shrink-0" strokeWidth={1.5} />
                      ) : (
                        <ShieldAlert className="w-10 h-10 text-[#b45309] shrink-0" strokeWidth={1.5} />
                      )}
                      <div>
                        <p
                          className={`font-bold text-sm uppercase tracking-wide ${
                            official ? "text-[#14532d]" : "text-[#92400e]"
                          }`}
                        >
                          {official
                            ? "Official barangay certificate"
                            : "On file — not yet released"}
                        </p>
                        <p className="text-xs text-gray-800 mt-1.5 leading-relaxed">
                          {official
                            ? "This document is recorded as an official certificate issued through BrgyDesk and this barangay."
                            : result.message}
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        {[
                          ["BrgyDesk No.", data?.brgydesk_no, true],
                          ["Reference No.", data?.reference_number, true],
                          ["Document type", data?.certificate_type_label, false],
                          ["Issued to", data?.applicant_name_masked, false],
                          ["Date recorded", formatIssueDate(data?.date_issued), false],
                          [
                            "Status",
                            (data?.status || "").replace(/_/g, " ").toUpperCase(),
                            false,
                          ],
                        ].map(([label, value, mono]) => (
                          <tr key={label} className="border-b border-gray-200">
                            <td className="py-2 pr-3 text-[11px] font-semibold uppercase text-gray-500 align-top w-[42%]">
                              {label}
                            </td>
                            <td
                              className={`py-2 text-right text-gray-900 font-medium break-all ${
                                mono ? "font-mono text-[12px]" : ""
                              }`}
                            >
                              {value || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {official && (
                      <div className="flex gap-2 pt-2 text-[11px] text-gray-600 leading-snug border-t border-dashed border-gray-300">
                        <FileCheck className="w-4 h-4 shrink-0 text-[#1a365d]" />
                        <p>
                          Computer-generated document. Physical dry seal is replaced by a
                          system-generated QR code—scan to verify on this official page.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed px-2">
              Powered by BrgyDesk · Secure barangay document management
            </p>
          </main>

          <footer className="px-4 py-4 border-t border-[#c4bfb5] bg-[#e8e6e0] text-center">
            <Link
              href={portalHome}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wide text-white bg-[#1a365d] hover:bg-[#03254c] transition-colors"
            >
              Bumalik sa portal / Back to portal
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
}

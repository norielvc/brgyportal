import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Download,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Layout from "@/components/Layout/Layout";

const API_URL = "/api";

export default function DownloadCertificatePage() {
  const router = useRouter();
  const { t } = router.query;

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!t) {
      setInfo({ valid: false, message: "No download token provided." });
      setLoading(false);
      return;
    }
    verifyLink();
  }, [router.isReady, t]);

  const verifyLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/public/certificate-delivery/verify?t=${encodeURIComponent(t)}`,
      );
      const data = await response.json();
      if (data.valid) {
        setInfo({ valid: true, data: data.data });
      } else {
        setInfo({
          valid: false,
          message: data.message || "Invalid or expired download link.",
        });
      }
    } catch (error) {
      console.error("Verify download link:", error);
      setInfo({
        valid: false,
        message: "Could not verify this link. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!t || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(
        `${API_URL}/public/certificate-delivery/download?t=${encodeURIComponent(t)}`,
      );
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/pdf")) {
        let message = "Download failed.";
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          /* ignore */
        }
        setInfo({ valid: false, message });
        return;
      }
      const blob = await response.blob();
      const fileName =
        info?.data?.file_name ||
        `${info?.data?.reference_number || "certificate"}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download certificate:", error);
      setInfo({
        valid: false,
        message: "Download failed. Please try again or contact the barangay office.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatExpiry = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
            <Shield className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Secure Certificate Download
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              Official Barangay document delivery
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                Verifying secure link…
              </p>
            </div>
          ) : info?.valid ? (
            <>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-900">
                    Your certificate is ready to download
                  </p>
                  <p className="text-xs text-emerald-800/80 mt-1">
                    This is a private link. Do not share it publicly.
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Reference
                    </dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {info.data.reference_number || "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Link expires
                    </dt>
                    <dd className="text-slate-800">{formatExpiry(info.data.expires_at)}</dd>
                  </div>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </button>
            </>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Download unavailable
                </p>
                <p className="text-xs text-red-800/90 mt-1 leading-relaxed">
                  {info?.message ||
                    "This link may have expired. Contact your barangay office for assistance."}
                </p>
              </div>
            </div>
          )}

          {!loading && !info?.valid && (
            <small className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              For a new link, email the barangay office or visit during office hours with
              your reference number.
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

DownloadCertificatePage.getLayout = (page) => (
  <Layout
    title="Download Certificate"
    subtitle="Secure online delivery"
    mainClassName="p-3"
  >
    {page}
  </Layout>
);

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Zap,
  X,
  RotateCcw,
} from "lucide-react";
import { isAuthenticated, getAuthToken } from "@/lib/auth";

const API_URL = "/api";

function parseQRMobile(qrData) {
  if (!qrData || typeof qrData !== "string")
    return { id: "N/A", name: "N/A", address: "N/A", remarks: "N/A" };
  if (qrData.startsWith("http"))
    return { id: "URL", name: "N/A", address: "N/A", remarks: "N/A" };

  const idMatch = qrData.match(/^H[a-z0-9]+-(?:F)?[a-z0-9]+/i);
  const id = idMatch ? idMatch[0] : "N/A";
  let remaining = qrData.replace(id, "").trim();

  const addressMarkers = ["PUROK","BARANGAY","BRGY","PHASE","BLOCK","LOT","ZONE","COMPOUND","SITIO","PUORK"];
  let nameEndIdx = -1;
  for (const marker of addressMarkers) {
    const idx = remaining.toUpperCase().indexOf(marker);
    if (idx !== -1 && (nameEndIdx === -1 || idx < nameEndIdx)) nameEndIdx = idx;
  }

  let name = "N/A", address = "N/A", remarks = "N/A";
  if (nameEndIdx !== -1) {
    name = remaining.substring(0, nameEndIdx).trim() || "N/A";
    const afterName = remaining.substring(nameEndIdx).trim();
    const remarkKeywords = ["GOODS RECD","GOODS RECEIVED","COMP","GEN NO","SIGN REQ","RECEIVED","PENDING"];
    let remarkIdx = -1;
    for (const kw of remarkKeywords) {
      const idx = afterName.toUpperCase().indexOf(kw);
      if (idx !== -1 && (remarkIdx === -1 || idx < remarkIdx)) remarkIdx = idx;
    }
    if (remarkIdx !== -1) {
      address = afterName.substring(0, remarkIdx).trim() || "N/A";
      remarks = afterName.substring(remarkIdx).trim() || "N/A";
    } else {
      address = afterName || "N/A";
    }
  } else {
    name = remaining || "N/A";
  }
  return { id, name, address, remarks };
}

export default function MobileQRScannerPage() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const readerDivId = "qr-reader";
  const isStartingRef = useRef(false);
  const lastScanRef = useRef(null);

  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [awaitingAcknowledgment, setAwaitingAcknowledgment] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [cameraFacing, setCameraFacing] = useState("environment");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    checkSubscription();
    loadStats();
    loadEvents();
    return () => { stopCamera(); };
  }, []);

  const checkSubscription = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/subscription/usage", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        const isProPlan = json.data.planId === "pro" || json.data.requests?.total === -1;
        if (!isProPlan) router.push("/dashboard?upgrade=qr-scanner");
      }
    } catch (e) { console.error("Subscription check failed:", e); }
    finally { setIsCheckingSubscription(false); }
  };

  const loadEvents = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/scan-events`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEvents(data.data.filter((e) => e.status === "ACTIVE") || []);
    } catch (err) { console.error("Error loading events:", err); }
  };

  const loadStats = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/qr-scans/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error("Error loading stats:", err); }
  };

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (_) {}
      try { scannerRef.current.clear(); } catch (_) {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current || cameraActive) return;
    if (!selectedEventId) { setError("Please select an active event first."); return; }
    isStartingRef.current = true;
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (_) {}
        try { scannerRef.current.clear(); } catch (_) {}
        scannerRef.current = null;
      }
      const scanner = new Html5Qrcode(readerDivId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: cameraFacing },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          rememberLastUsedCamera: true,
        },
        onQRSuccess,
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      if (err.message?.includes("ermission")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setError(`Could not start camera: ${err.message}`);
      }
    } finally { isStartingRef.current = false; }
  }, [selectedEventId, cameraFacing, cameraActive]);

  const flipCamera = useCallback(async () => {
    await stopCamera();
    setCameraFacing((f) => (f === "environment" ? "user" : "environment"));
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive) { stopCamera().then(() => startCamera()); }
  }, [cameraFacing]);

  const onQRSuccess = useCallback(async (decodedText) => {
    if (lastScanRef.current === decodedText) return;
    lastScanRef.current = decodedText;
    setTimeout(() => { lastScanRef.current = null; }, 2000);
    if (processing || awaitingAcknowledgment) return;
    if (scannerRef.current) { try { await scannerRef.current.pause(true); } catch (_) {} }
    setProcessing(true);
    setError(null);
    try {
      const timestamp = new Date();
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/qr-scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qr_data: decodedText,
          scan_timestamp: timestamp.toISOString(),
          scanner_type: "mobile-qr",
          event_id: selectedEventId || null,
          device_info: { userAgent: navigator.userAgent, platform: navigator.platform },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(decodedText);
        setStats((prev) => ({ ...prev, today: prev.today + 1, total: prev.total + 1 }));
        await stopCamera();
      } else if (data.isDuplicate) {
        setDuplicateInfo(data);
        setAwaitingAcknowledgment(true);
        await stopCamera();
      } else {
        setError(data.error || "Failed to save scan");
        if (scannerRef.current) { try { await scannerRef.current.resume(); } catch (_) {} }
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally { setProcessing(false); }
  }, [processing, awaitingAcknowledgment, selectedEventId, stopCamera]);

  const acknowledgeDuplicate = async () => {
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
    lastScanRef.current = null;
    await startCamera();
  };

  const resetScanner = async () => {
    setScanResult(null);
    setError(null);
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
    lastScanRef.current = null;
    await startCamera();
  };

  if (isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Checking access...</p>
        </div>
      </div>
    );
  }

  const showResult = scanResult || (duplicateInfo && awaitingAcknowledgment);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-5 text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight">QR Scanner</h1>
            <p className="text-blue-200 text-xs font-medium">Live Camera Mode</p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-white/10 rounded-2xl px-3 py-2">
              <p className="text-xl font-black">{stats.today}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase">Today</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2">
              <p className="text-xl font-black">{stats.total}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase">Total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Active Event</label>
          {events.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">No active events. Create one in the dashboard.</p>
            </div>
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); stopCamera(); setScanResult(null); setDuplicateInfo(null); setError(null); }}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select an event —</option>
              {events.map((e) => (<option key={e.id} value={e.id}>{e.name || 'Unnamed Event'}</option>))}
            </select>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-semibold flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        )}

        {showResult ? (
          <>
            {duplicateInfo && awaitingAcknowledgment ? (() => {
              const dup = parseQRMobile(duplicateInfo.existingScan?.qr_data || "");
              return (
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in duration-300">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-8 h-8 text-white" /></div>
                    <h3 className="text-xl font-black">Duplicate Scan</h3>
                    <p className="text-sm text-amber-100 font-medium">Already verified in this event</p>
                  </div>
                  <div className="bg-black/10 rounded-2xl p-4 mb-4 border border-white/10 space-y-2.5">
                    {[["Household ID", dup.id, "font-mono"], ["Name", dup.name, ""], ["Address", dup.address, ""], ["Remarks", dup.remarks, "italic"], ["Staff", duplicateInfo.existingScan?.scanned_by_name || "Unknown", ""], ["Original Time", new Date(duplicateInfo.existingScan?.scan_timestamp).toLocaleString(), ""]].map(([label, val, extra]) => (
                      <div key={label} className="pt-2 first:pt-0 border-t first:border-0 border-white/10">
                        <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-0.5">{label}</div>
                        <div className={`text-sm font-bold text-white ${extra}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={acknowledgeDuplicate} className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">Acknowledge &amp; Continue Scanning</button>
                </div>
              );
            })() : (() => {
              const parsed = parseQRMobile(scanResult);
              return (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in duration-300">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-white" /></div>
                    <h3 className="text-2xl font-black mb-1">Verification Success</h3>
                    <p className="text-emerald-50 text-sm">Record added to event logs</p>
                  </div>
                  <div className="bg-black/10 rounded-2xl p-4 mb-5 border border-white/10 space-y-2.5">
                    {[["Household ID", parsed.id, "font-mono"], ["Name", parsed.name, "text-base"], ["Address", parsed.address, ""], ["Remarks", parsed.remarks, "italic"]].map(([label, val, extra]) => (
                      <div key={label} className="pt-2 first:pt-0 border-t first:border-0 border-white/10">
                        <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-0.5">{label}</div>
                        <div className={`text-sm font-bold text-white ${extra}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={resetScanner} className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />Scan Next Individual
                  </button>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div id="qr-reader" className="w-full" style={{ minHeight: cameraActive ? 320 : 0 }} />
            {processing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <div className="bg-white rounded-2xl p-6 text-center shadow-xl">
                  <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="font-bold text-gray-700">Saving scan...</p>
                </div>
              </div>
            )}
            {!cameraActive && (
              <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center" style={{ minHeight: 200 }}>
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center">
                  <Camera className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 tracking-tight text-lg">{!selectedEventId ? "Select Event First" : "Ready to Scan"}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedEventId ? "Tap Launch Live Scanner below" : "Choose an event above"}</p>
                </div>
              </div>
            )}
            {cameraActive && (
              <div className="p-3 bg-gray-900 flex items-center justify-between">
                <button onClick={flipCamera} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                  <RotateCcw className="w-4 h-4" />Flip
                </button>
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE
                </div>
                <button onClick={stopCamera} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-2 bg-red-500/80 rounded-xl hover:bg-red-500 transition-all">
                  <X className="w-4 h-4" />Stop
                </button>
              </div>
            )}
          </div>
        )}

        {!showResult && (
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            disabled={!selectedEventId || processing}
            className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${!selectedEventId ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none" : cameraActive ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25" : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-500/25"}`}
          >
            {processing ? <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" /> : <Camera className="w-6 h-6" />}
            {processing ? "Processing..." : cameraActive ? "Stop Camera" : "Launch Live Scanner"}
          </button>
        )}

        <div className="space-y-2 pb-8">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Quick Guide</p>
          {[
            [Zap, "Point camera at the QR code — no button press needed"],
            [Camera, "Hold steady at any distance — live scanner auto-detects"],
            [CheckCircle, "Green success card = saved. Tap Scan Next to continue"],
            [Clock, "Duplicate scans are automatically blocked"],
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
              <p className="text-xs text-gray-600 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

MobileQRScannerPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Zap,
  X,
  RotateCcw,
  RotateCw,
  MapPin,
  Home,
  Phone,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  CreditCard,
  AlertCircle,
  Calendar,
  Layers,
  Image as ImageIcon,
  Check,
  Ban,
  Sparkles
} from "lucide-react";
import { isAuthenticated, getAuthToken } from "@/lib/auth";
import jsQR from "jsqr";
import * as XLSX from "xlsx";

const API_URL = "/api";

// ── Robust QR Data Parser ──────────────────────────────────
function parseQRData(qrData) {
  if (!qrData || typeof qrData !== "string") {
    return { id: "N/A", name: "N/A", address: "N/A", remarks: "N/A", isUrl: false };
  }

  const trimmed = qrData.trim();

  // If JSON format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        id: parsed.reference_number || parsed.id || parsed.pickup_token || "JSON",
        name: parsed.applicant_name || parsed.name || "N/A",
        address: parsed.address || parsed.barangay || "N/A",
        remarks: parsed.certificate_type || parsed.type || "N/A",
        isUrl: false,
      };
    } catch (_) {}
  }

  // If URL format
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      const token = url.searchParams.get("token");
      const ref = url.searchParams.get("ref");
      return {
        id: ref || token || "URL",
        name: "URL Reference",
        address: url.pathname,
        remarks: token ? `Token: ${token.substring(0, 10)}...` : "Web Verification",
        isUrl: true,
      };
    } catch (_) {
      return { id: "URL", name: "N/A", address: "N/A", remarks: "N/A", isUrl: true };
    }
  }

  // Legacy String Pattern: HXXXXX-FXXXXX NAME ADDRESS REMARKS
  const idMatch = trimmed.match(/^H[a-z0-9]+-(?:F)?[a-z0-9]+/i) || trimmed.match(/^(?:EM|BC|CR|CI)-[A-Za-z0-9-]+/i);
  const id = idMatch ? idMatch[0] : "N/A";
  let remaining = trimmed.replace(id, "").trim();

  const addressMarkers = ["PUROK", "BARANGAY", "BRGY", "PHASE", "BLOCK", "LOT", "ZONE", "COMPOUND", "SITIO", "PUORK", "ST.", "AVE."];
  let nameEndIdx = -1;
  const upperRem = remaining.toUpperCase();
  for (const marker of addressMarkers) {
    const idx = upperRem.indexOf(marker);
    if (idx !== -1 && (nameEndIdx === -1 || idx < nameEndIdx)) nameEndIdx = idx;
  }

  let name = "N/A", address = "N/A", remarks = "N/A";
  if (nameEndIdx !== -1) {
    name = remaining.substring(0, nameEndIdx).trim() || "N/A";
    const afterName = remaining.substring(nameEndIdx).trim();
    const remarkKeywords = ["GOODS RECD", "GOODS RECEIVED", "COMP", "GEN NO", "SIGN REQ", "RECEIVED", "PENDING", "CLAIMED"];
    let remarkIdx = -1;
    const upperAfter = afterName.toUpperCase();
    for (const kw of remarkKeywords) {
      const idx = upperAfter.indexOf(kw);
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

  return { id, name, address, remarks, isUrl: false };
}

// ── Sound & Haptic Feedback ────────────────────────────────
const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (_) {}
  try {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  } catch (_) {}
};

const playWarningSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (_) {}
};

export default function MobileQRScannerPage() {
  const router = useRouter();

  // ── Mode State: 'camera' | 'capture' | 'manual' | 'traffic' ──
  const [activeMode, setActiveMode] = useState("camera");

  // ── Event & Subscription States ──
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  // ── Scanner Execution States ──
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [focusPoint, setFocusPoint] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });

  // ── Result & Feedback Overlays ──
  const [scanResult, setScanResult] = useState(null); // { type: 'success'|'duplicate'|'invalid'|'error', ... }
  const [recentScans, setRecentScans] = useState([]);

  // ── Capture Mode States ──
  const [capturedStatus, setCapturedStatus] = useState("idle"); // 'idle' | 'analyzing' | 'success' | 'failed'
  const fileInputRef = useRef(null);

  // ── Manual Mode States ──
  const [manualToken, setManualToken] = useState("EM-");
  const manualInputRef = useRef(null);

  // ── Traffic Feed States ──
  const [trafficRecords, setTrafficRecords] = useState([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficFilter, setTrafficFilter] = useState("");

  // ── Ref Concurrency Locks ──
  const scannerRef = useRef(null);
  const readerDivId = "dist-scanner-camera";
  const processingRef = useRef(false);
  const showingResultRef = useRef(false);
  const lastScanRef = useRef(null);
  const selectedEventIdRef = useRef("");
  const isStartingRef = useRef(false);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    checkSubscription();
    loadStats();
    loadEvents();
    return () => {
      stopCamera();
    };
  }, []);

  // ── Access & Subscription Guard ────────────────────────────
  const checkSubscription = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/subscription/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const isProPlan = json.data.planId === "pro" || json.data.requests?.total === -1;
        if (!isProPlan) router.push("/dashboard?upgrade=qr-scanner");
      }
    } catch (e) {
      console.error("Subscription check failed:", e);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const loadEvents = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/scan-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const activeEvents = data.data.filter((e) => e.status === "ACTIVE" || e.is_active !== false);
        setEvents(activeEvents);
        if (activeEvents.length > 0 && !selectedEventId) {
          setSelectedEventId(activeEvents[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  const loadStats = async (eventId = selectedEventId) => {
    try {
      const token = getAuthToken();
      let url = `${API_URL}/qr-scans/stats`;
      if (eventId) url += `?event_id=${eventId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const fetchTrafficRecords = async () => {
    setTrafficLoading(true);
    try {
      const token = getAuthToken();
      let url = `${API_URL}/qr-scans?limit=50`;
      if (selectedEventId) url += `&event_id=${selectedEventId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setTrafficRecords(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching traffic records:", err);
    } finally {
      setTrafficLoading(false);
    }
  };

  // ── Camera Management ─────────────────────────────────────
  const stopCamera = useCallback(async () => {
    const instance = scannerRef.current;
    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch (_) {}
      try {
        await instance.clear();
      } catch (_) {}
      scannerRef.current = null;
    }

    try {
      const container = document.getElementById(readerDivId);
      if (container) {
        const video = container.querySelector("video");
        if (video && video.srcObject) {
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => track.stop());
          }
          video.srcObject = null;
        }
        container.innerHTML = "";
      }
    } catch (_) {}

    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    if (!selectedEventId && events.length > 0) {
      setError("Please select an active event first.");
      return;
    }

    isStartingRef.current = true;
    setError(null);

    await stopCamera();

    // Allow DOM to finish rendering camera container
    await new Promise((r) => setTimeout(r, 80));

    const container = document.getElementById(readerDivId);
    if (!container) {
      isStartingRef.current = false;
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerDivId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: cameraFacing },
        {
          fps: 30,
          qrbox: { width: 280, height: 280 },
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
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [selectedEventId, cameraFacing, events.length, onQRSuccess, stopCamera]);

  const flipCamera = useCallback(async () => {
    await stopCamera();
    setCameraFacing((f) => (f === "environment" ? "user" : "environment"));
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive) {
      stopCamera().then(() => startCamera());
    }
  }, [cameraFacing]);

  // Tap-to-Focus Handler (Single-shot hardware constraint + reticle)
  const handleTapFocus = async (e) => {
    if (!cameraActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      try {
        await stopCamera();
        await new Promise((r) => setTimeout(r, 120));
        await startCamera();
      } catch (_) {}
    } else {
      try {
        const video = document.querySelector(`#${readerDivId} video`);
        if (video && video.srcObject) {
          const track = video.srcObject.getVideoTracks()[0];
          const caps = track.getCapabilities && track.getCapabilities();
          if (caps && caps.focusMode && caps.focusMode.includes("single-shot")) {
            await track.applyConstraints({ advanced: [{ focusMode: "single-shot" }] });
          }
        }
      } catch (_) {}
    }

    setTimeout(() => setFocusPoint(null), 1000);
  };

  // ── Core Scan Submission & Verification ───────────────────
  const handleScan = useCallback(async (scannedToken, photoUrl = null) => {
    if (!scannedToken || !scannedToken.trim()) return;
    const normalised = scannedToken.trim();

    setProcessing(true);
    setError(null);

    try {
      const timestamp = new Date();
      const token = getAuthToken();
      const eventId = selectedEventIdRef.current || selectedEventId;

      const res = await fetch(`${API_URL}/qr-scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qr_data: normalised,
          scan_timestamp: timestamp.toISOString(),
          scanner_type: activeMode,
          event_id: eventId || null,
          allow_duplicates: allowDuplicates,
          device_info: { userAgent: navigator.userAgent, platform: navigator.platform },
        }),
      });

      const data = await res.json();
      const parsed = parseQRData(normalised);

      if (data.success) {
        playSuccessSound();
        showingResultRef.current = true;
        setScanResult({
          type: "success",
          data: data.data,
          parsed,
          photo: photoUrl,
          rawToken: normalised,
          claimNumber: (stats.today || 0) + 1,
        });

        setStats((prev) => ({
          today: (prev.today || 0) + 1,
          total: (prev.total || 0) + 1,
        }));

        setRecentScans((prev) => [
          {
            id: data.data?.id || Date.now(),
            name: parsed.name,
            address: parsed.address,
            householdId: parsed.id,
            time: new Date().toLocaleTimeString(),
            raw: normalised,
          },
          ...prev.slice(0, 9),
        ]);
      } else if (data.isDuplicate) {
        playWarningSound();
        showingResultRef.current = true;
        setScanResult({
          type: "duplicate",
          existingScan: data.existingScan,
          parsed,
          photo: photoUrl,
          rawToken: normalised,
          message: data.message || "This QR code has already been scanned for this event.",
        });
      } else {
        lastScanRef.current = null;
        playWarningSound();
        setScanResult({
          type: "invalid",
          message: data.error || data.message || "Invalid QR Card or Verification Failed",
          rawToken: normalised,
        });
      }
    } catch (err) {
      lastScanRef.current = null;
      setScanResult({
        type: "error",
        message: err.message || "Network error. Failed to communicate with server.",
        rawToken: normalised,
      });
    } finally {
      processingRef.current = false;
      setProcessing(false);
      setManualToken("EM-");
    }
  }, [activeMode, allowDuplicates, selectedEventId, stats.today]);

  // Camera 30 FPS callback with atomic ref guard
  const onQRSuccess = useCallback(async (decodedText) => {
    const normalised = decodedText.trim();
    if (processingRef.current || showingResultRef.current || lastScanRef.current === normalised) return;

    processingRef.current = true;
    lastScanRef.current = normalised;

    await stopCamera();

    await handleScan(normalised);
  }, [handleScan, stopCamera]);

  // ── Dual-Tier QR Photo Decoder (Tier 1 jsQR + Tier 2 Sharp/ZXing) ──
  const detectQRSimple = async (file) => {
    if (!file) return { data: null, debug: "no_file" };

    // Step 1: Fast client-side scan directly on canvas (sub-50ms)
    const clientScanPromise = new Promise((resolve) => {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const maxDim = 800;

          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return resolve({ data: null, base64: null, debug: "no_ctx" });

          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);

          // Pass 1: Full frame (dontInvert)
          let code = jsQR(imgData.data, w, h, { inversionAttempts: "dontInvert" });

          // Pass 2: Center crop 70%
          if (!code && w > 100 && h > 100) {
            const cw = Math.round(w * 0.7);
            const ch = Math.round(h * 0.7);
            const ox = Math.round((width - cw) / 2);
            const oy = Math.round((height - ch) / 2);
            const cropData = ctx.getImageData(ox, oy, cw, ch);
            code = jsQR(cropData.data, cw, ch, { inversionAttempts: "attemptBoth" });
          }

          // Pass 3: Full frame (attemptBoth)
          if (!code) {
            code = jsQR(imgData.data, w, h, { inversionAttempts: "attemptBoth" });
          }

          if (code && code.data) {
            canvas.width = 1;
            canvas.height = 1;
            return resolve({ data: code.data.trim(), debug: "client:jsqr", base64: null });
          }

          // Prepare compressed base64 for Tier 2 server deep scan
          const base64Data = canvas.toDataURL("image/jpeg", 0.85);
          canvas.width = 1;
          canvas.height = 1;
          resolve({ data: null, base64: base64Data, debug: "client_miss" });
        } catch (err) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (_) {}
          resolve({ data: null, base64: null, debug: `client_err:${err.message}` });
        }
      };

      img.onerror = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
        resolve({ data: null, base64: null, debug: "img_load_err" });
      };

      img.src = objectUrl;
    });

    const clientRes = await clientScanPromise;

    // Fast path: decoded locally!
    if (clientRes.data) {
      return { data: clientRes.data, debug: clientRes.debug };
    }

    // Step 2: Server Fallback (ZXing QRCodeReader + HybridBinarizer)
    try {
      if (!clientRes.base64) return { data: null, debug: "no_base64" };
      const res = await fetch("/api/scan-photo-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: clientRes.base64 }),
      });

      const json = await res.json();
      return {
        data: json.qrText || null,
        debug: `fallback | ${json.debug || ""}`,
      };
    } catch (err) {
      return { data: null, debug: `upload_err:${err.message}` };
    }
  };

  // ── Reset & Navigation Handlers ───────────────────────────
  const resetScannerState = () => {
    showingResultRef.current = false;
    lastScanRef.current = null;
    processingRef.current = false;
    setScanResult(null);
    setError(null);
    setCapturedStatus("idle");
    setManualToken("EM-");

    if (activeMode === "camera") {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
    if (activeMode === "manual" && manualInputRef.current) {
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 50);
    }
  };

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    resetScannerState();
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    if (mode === "traffic") {
      fetchTrafficRecords();
    }
  };

  // ── Export Records to Excel ────────────────────────────────
  const exportTrafficExcel = () => {
    if (trafficRecords.length === 0) {
      alert("No records to export.");
      return;
    }

    const exportRows = trafficRecords.map((r, i) => {
      const parsed = parseQRData(r.qr_data);
      return {
        "No.": i + 1,
        "Timestamp": new Date(r.scan_timestamp || r.created_at).toLocaleString(),
        "Household / Ref ID": r.parsed_household_id || parsed.id,
        "Beneficiary Name": r.parsed_name || parsed.name,
        "Address": r.parsed_address || parsed.address,
        "Remarks": r.parsed_remarks || parsed.remarks,
        "Scanner Mode": r.scanner_type || "Mobile",
        "Scanned By": r.users ? `${r.users.first_name} ${r.users.last_name}` : "Staff",
        "Raw QR Data": r.qr_data,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scanned_Records");
    XLSX.writeFile(wb, `BrgyDesk_QR_Scans_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Subscription Loading Screen ────────────────────────────
  if (isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Authenticating scanner terminal...</p>
        </div>
      </div>
    );
  }

  const selectedEventObj = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-4 py-5 text-white shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                QR Verification System
                <span className="text-[10px] bg-emerald-500/40 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-widest">PRO</span>
              </h1>
              <p className="text-emerald-200 text-xs font-medium truncate max-w-[200px] sm:max-w-xs">
                {selectedEventObj ? selectedEventObj.name : "Event / Distribution Terminal"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 text-center">
            <div className="bg-white/10 rounded-2xl px-3 py-1.5 backdrop-blur-sm border border-white/10">
              <p className="text-lg font-black">{stats.today}</p>
              <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Today</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-1.5 backdrop-blur-sm border border-white/10">
              <p className="text-lg font-black">{stats.total}</p>
              <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* ── Event Selector & Duplicate Mode Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Active Relief / Verification Event
              </label>
              {events.length === 0 ? (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">No active events found. General scan mode active.</p>
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedEventId(newId);
                    loadStats(newId);
                    stopCamera();
                    resetScannerState();
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="">— Select an Event / General Mode —</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name || "Unnamed Event"}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="live-indicator-pulse" />
              <span>Real-Time Duplicate Checking</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(e) => setAllowDuplicates(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              Allow Multiple Claims
            </label>
          </div>
        </div>

        {/* ── 4 Scanner Modes Navigation Tabs (EM-CARD Style) ── */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl shadow-inner">
          <button
            onClick={() => handleModeChange("camera")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMode === "camera"
                ? "bg-white text-emerald-800 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => handleModeChange("capture")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMode === "capture"
                ? "bg-white text-emerald-800 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>Capture</span>
          </button>

          <button
            onClick={() => handleModeChange("manual")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMode === "manual"
                ? "bg-white text-emerald-800 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Manual</span>
          </button>

          <button
            onClick={() => handleModeChange("traffic")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeMode === "traffic"
                ? "bg-white text-emerald-800 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Traffic</span>
          </button>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── RESULT MODAL OVERLAY (EM-CARD Style) ── */}
        {scanResult && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* SUCCESS MODAL */}
            {scanResult.type === "success" && (
              <div className="p-6 space-y-5">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-center shadow-lg relative overflow-hidden">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Identity Verified</h2>
                  <p className="text-emerald-100 text-xs font-semibold">Eligible for Distribution / Release</p>
                  <span className="inline-block mt-2 text-[10px] bg-white/20 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Claim #{scanResult.claimNumber} Recorded
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                      {scanResult.parsed.name?.charAt(0) || <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-base leading-tight">
                        {scanResult.parsed.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                        ID: {scanResult.parsed.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Address</span>
                      <p className="font-bold text-slate-700 mt-0.5">{scanResult.parsed.address}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Remarks</span>
                      <p className="font-bold text-slate-700 mt-0.5">{scanResult.parsed.remarks}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetScannerState}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-4 rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Scan Next Citizen</span>
                </button>
              </div>
            )}

            {/* DUPLICATE MODAL */}
            {scanResult.type === "duplicate" && (
              <div className="p-6 space-y-5">
                <div className="bg-gradient-to-br from-amber-500 to-rose-600 rounded-2xl p-5 text-white text-center shadow-lg relative overflow-hidden">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/30">
                    <Ban className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">ALREADY CLAIMED</h2>
                  <p className="text-amber-100 text-xs font-semibold">Strict Duplicate Policy Notice</p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Beneficiary already received assistance</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-slate-700">
                    <p><strong>Name:</strong> {scanResult.parsed.name}</p>
                    <p><strong>Household ID:</strong> {scanResult.parsed.id}</p>
                    {scanResult.existingScan && (
                      <>
                        <p><strong>Original Scan Time:</strong> {new Date(scanResult.existingScan.scan_timestamp).toLocaleString()}</p>
                        <p><strong>Operator:</strong> {scanResult.existingScan.scanned_by || "Staff"}</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={resetScannerState}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Acknowledge &amp; Scan Next</span>
                </button>
              </div>
            )}

            {/* INVALID / ERROR MODAL */}
            {(scanResult.type === "invalid" || scanResult.type === "error") && (
              <div className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  {scanResult.type === "invalid" ? "Invalid QR Code" : "Scan Error"}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">{scanResult.message}</p>
                {scanResult.rawToken && (
                  <code className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg block font-mono break-all max-w-xs mx-auto">
                    Token: {scanResult.rawToken}
                  </code>
                )}
                <button
                  onClick={resetScannerState}
                  className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs active:scale-95 transition-all"
                >
                  Try Again / Retake
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SCANNER MODE CONTENT PANELS ── */}
        {!scanResult && (
          <>
            {/* 1. 📹 LIVE CAMERA MODE */}
            {activeMode === "camera" && (
              <div className="space-y-3">
                <div
                  className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative cursor-pointer"
                  onClick={handleTapFocus}
                >
                  {/* Tap to focus animated reticle */}
                  {focusPoint && (
                    <div
                      className="camera-focus-reticle"
                      style={{ left: focusPoint.x, top: focusPoint.y }}
                    />
                  )}

                  {/* Camera Viewport Container */}
                  <div id={readerDivId} className="w-full" style={{ minHeight: cameraActive ? 320 : 0 }} />

                  {processing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <div className="bg-white rounded-2xl p-5 text-center shadow-2xl space-y-2">
                        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                        <p className="text-xs font-black text-slate-800">Verifying QR code...</p>
                      </div>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[260px]">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Camera className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base">Live Camera Scanner</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          Continuous 30 FPS scanning with single-shot autofocus.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Camera Controls Bar */}
                  {cameraActive && (
                    <div className="p-3 bg-slate-900/90 backdrop-blur-sm flex items-center justify-between border-t border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          flipCamera();
                        }}
                        className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>30 FPS LIVE</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopCamera();
                        }}
                        className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 bg-rose-500/80 rounded-xl hover:bg-rose-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={processing}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
                    cameraActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{cameraActive ? "Stop Camera" : "Launch Live Camera"}</span>
                </button>
              </div>
            )}

            {/* 2. 📸 CAPTURE PHOTO MODE (Dual-Tier Decoder) */}
            {activeMode === "capture" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center space-y-4">
                <input
                  type="file"
                  id="qr-photo-input"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setProcessing(true);
                    setCapturedStatus("analyzing");
                    setError(null);

                    try {
                      const { data: decodedText, debug } = await detectQRSimple(file);

                      if (decodedText) {
                        setCapturedStatus("success");
                        await handleScan(decodedText);
                      } else {
                        setCapturedStatus("failed");
                        setScanResult({
                          type: "invalid",
                          message: "Could not decode QR code from the captured image. Please ensure good lighting and clear focus.",
                          rawToken: debug,
                        });
                      }
                    } catch (err) {
                      setCapturedStatus("failed");
                      setError("Failed to decode photo. Please try manual entry.");
                    } finally {
                      setProcessing(false);
                      e.target.value = "";
                    }
                  }}
                />

                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                  <ImageIcon className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-800">Ultra-Fast Photo QR Decoder</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Take a photo with your mobile camera or upload from gallery. Decodes locally in &lt;50ms with deep ZXing fallback.
                  </p>
                </div>

                {capturedStatus === "analyzing" ? (
                  <div className="py-4 space-y-2">
                    <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Dual-Engine jsQR &amp; ZXing Analyzing...</p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo / Select from Gallery</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. ⌨️ MANUAL TOKEN ENTRY MODE */}
            {activeMode === "manual" && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">Manual QR Token Entry</h3>
                  <p className="text-xs text-slate-500">
                    Type or paste the token / reference number from the card or application
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScan(manualToken);
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      ref={manualInputRef}
                      type="text"
                      value={manualToken}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.includes("/verify-pickup?") || val.includes("/card/")) {
                          const match = val.match(/(?:token=|ref=|\/card\/)([A-Za-z0-9-]+)/);
                          if (match) val = match[1];
                        }
                        setManualToken(val);
                      }}
                      onFocus={() => {
                        if (!manualToken) setManualToken("EM-");
                      }}
                      placeholder="e.g. EM-1234567890 or BC-2026-00001"
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 font-mono font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                      autoFocus
                    />
                    {manualToken && manualToken !== "EM-" && (
                      <button
                        type="button"
                        onClick={() => setManualToken("EM-")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !manualToken.trim() || manualToken.trim() === "EM-"}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    {processing ? "Verifying..." : "Verify & Record Claim"}
                  </button>
                </form>
              </div>
            )}

            {/* 4. 🚦 LIVE TRAFFIC & EXPORT MODE */}
            {activeMode === "traffic" && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="live-indicator-pulse" />
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                      Live Scan Stream
                    </h3>
                  </div>

                  <button
                    onClick={exportTrafficExcel}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={trafficFilter}
                      onChange={(e) => setTrafficFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={fetchTrafficRecords}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                    title="Refresh Feed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${trafficLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {trafficLoading ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Loading live records...</p>
                  </div>
                ) : trafficRecords.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No scan entries recorded yet for this event.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {trafficRecords
                      .filter((r) => {
                        if (!trafficFilter) return true;
                        const matchStr = `${r.qr_data} ${r.parsed_name || ""} ${r.parsed_address || ""}`.toLowerCase();
                        return matchStr.includes(trafficFilter.toLowerCase());
                      })
                      .map((r, idx) => {
                        const parsed = parseQRData(r.qr_data);
                        return (
                          <div
                            key={r.id || idx}
                            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 truncate">
                                {r.parsed_name || parsed.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {r.parsed_address || parsed.address}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(r.scan_timestamp || r.created_at).toLocaleTimeString()} • {r.scanner_type || "Mobile"}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Recent Scan History Strip (Session) ── */}
        {recentScans.length > 0 && !scanResult && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Recent Scans in This Session
            </h4>
            <div className="space-y-1.5">
              {recentScans.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{s.name}</span>
                    <span className="text-slate-400 text-[11px] truncate">({s.address})</span>
                  </div>
                  <span className="text-slate-400 text-[10px] shrink-0 font-mono">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MobileQRScannerPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

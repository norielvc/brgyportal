import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Zap,
  User,
  Calendar,
  HardDrive,
  Info
} from "lucide-react";
import { isAuthenticated, getAuthToken } from "@/lib/auth";

const API_URL = "/api";

export default function MobileQRScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [scanTimestamp, setScanTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [awaitingAcknowledgment, setAwaitingAcknowledgment] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const fileInputRef = useRef(null);
  const [subscription, setSubscription] = useState(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    checkSubscription();
    loadStats();
    loadEvents();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/subscription/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSubscription(json.data);
        // Check if user has Pro plan
        const isProPlan = json.data.planId === "pro" || json.data.requests?.total === -1;
        if (!isProPlan) {
          // Redirect to dashboard with message
          router.push("/dashboard?upgrade=qr-scanner");
        }
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const loadEvents = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/scan-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEvents(data.data.filter((e) => e.status === "ACTIVE") || []);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  const loadStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/qr-scans/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(
          `❌ Stats Error\n\nHTTP ${response.status}: ${data.error || "Failed to load stats"}\nURL: ${API_URL}/qr-scans/stats`,
        );
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      if (err.name === "TypeError") {
        setError(
          `❌ Connection Error\n\nCannot connect to server at ${API_URL}. Please check your connection.`,
        );
      }
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Prevent scanning if awaiting acknowledgment
    if (awaitingAcknowledgment) {
      event.target.value = "";
      return;
    }

    console.log("📱 Mobile QR scan started:", file.name);

    setError(null);
    setScanResult(null);
    setScanTimestamp(null);
    setProcessing(true);

    try {
      // Use the most reliable detection method for mobile
      const result = await detectQRSimple(file);
      if (result) {
        await handleScanSuccess(result);
      } else {
        setError(
          "No QR code detected. Please try again with better lighting and make sure the QR code is clearly visible.",
        );
      }
    } catch (err) {
      console.error("❌ Scan error:", err);
      setError(`Scan failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }

    event.target.value = "";
  };

  // ─────────────────────────────────────────────────────────
  //  Image pre-processing helpers
  // ─────────────────────────────────────────────────────────

  /** Draws an image onto a canvas at a given scale / crop, returns ImageData */
  const drawToCanvas = (img, opts = {}) => {
    const {
      scale = 1,
      sx = 0, sy = 0,
      sw = img.naturalWidth, sh = img.naturalHeight,
      maxSize = 2000,
    } = opts;

    let targetW = Math.floor(sw * scale);
    let targetH = Math.floor(sh * scale);

    // Clamp
    if (targetW > maxSize || targetH > maxSize) {
      const r = Math.min(maxSize / targetW, maxSize / targetH);
      targetW = Math.floor(targetW * r);
      targetH = Math.floor(targetH * r);
    }
    if (targetW < 1) targetW = 1;
    if (targetH < 1) targetH = 1;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return { canvas, ctx, imageData: ctx.getImageData(0, 0, targetW, targetH) };
  };

  /** Boost contrast & convert to grayscale in-place, return modified ImageData */
  const enhanceImageData = (imageData, contrast = 60) => {
    const d = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < d.length; i += 4) {
      // Grayscale (luminance)
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Contrast stretch
      const boosted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
      d[i] = d[i + 1] = d[i + 2] = boosted;
    }
    return imageData;
  };

  /** Run jsQR with all inversion modes on a given ImageData */
  const tryJsQR = (jsQR, imageData) => {
    const modes = ["dontInvert", "onlyInvert", "attemptBoth", "invertFirst"];
    for (const m of modes) {
      // jsQR only supports 3 modes; invertFirst is not valid — skip it
      if (m === "invertFirst") continue;
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: m });
      if (result && result.data) return result.data;
    }
    return null;
  };

  // ─────────────────────────────────────────────────────────
  //  Main detection function
  // ─────────────────────────────────────────────────────────
  const detectQRSimple = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const W = img.naturalWidth;
          const H = img.naturalHeight;
          console.log(`📐 Image loaded: ${W}x${H}`);

          // ── PASS 1: Native BarcodeDetector (fastest, best on modern Android) ──
          if ("BarcodeDetector" in window) {
            try {
              const bd = new window.BarcodeDetector({ formats: ["qr_code"] });
              const codes = await bd.detect(img);
              if (codes && codes.length > 0) {
                console.log("✅ Native BarcodeDetector hit:", codes[0].rawValue);
                resolve(codes[0].rawValue);
                return;
              }
              console.log("ℹ️ BarcodeDetector found nothing, continuing...");
            } catch (e) {
              console.warn("⚠️ BarcodeDetector error:", e.message);
            }
          }

          // ── Load jsQR ──
          let jsQR;
          try {
            const m = await import("jsqr");
            jsQR = m.default;
          } catch {
            try {
              await new Promise((res, rej) => {
                const s = document.createElement("script");
                s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
                s.onload = res; s.onerror = rej;
                document.head.appendChild(s);
              });
              jsQR = window.jsQR;
            } catch (cdnErr) {
              console.error("❌ Cannot load jsQR:", cdnErr);
              resolve(null);
              return;
            }
          }

          if (typeof jsQR !== "function") {
            console.error("❌ jsQR is not a function");
            resolve(null);
            return;
          }

          // ── PASS 2: Full image at multiple scales with preprocessing ──
          const scales = [1, 1.5, 0.75, 0.5, 2];
          for (const scale of scales) {
            // raw
            const { imageData: raw } = drawToCanvas(img, { scale });
            let found = tryJsQR(jsQR, raw);
            if (found) { console.log(`✅ jsQR raw scale=${scale}`); resolve(found); return; }

            // enhanced
            const { imageData: enhanced } = drawToCanvas(img, { scale });
            enhanceImageData(enhanced, 70);
            found = tryJsQR(jsQR, enhanced);
            if (found) { console.log(`✅ jsQR enhanced scale=${scale}`); resolve(found); return; }

            // high-contrast (binarize)
            const { imageData: bin } = drawToCanvas(img, { scale });
            enhanceImageData(bin, 120);
            found = tryJsQR(jsQR, bin);
            if (found) { console.log(`✅ jsQR binarized scale=${scale}`); resolve(found); return; }
          }

          // ── PASS 3: Multi-crop (center + corners + horizontal strips) ──
          const crops = [
            // center 60%
            { sx: W * 0.2, sy: H * 0.2, sw: W * 0.6, sh: H * 0.6 },
            // center 40%
            { sx: W * 0.3, sy: H * 0.3, sw: W * 0.4, sh: H * 0.4 },
            // top half
            { sx: 0, sy: 0, sw: W, sh: H * 0.5 },
            // bottom half
            { sx: 0, sy: H * 0.5, sw: W, sh: H * 0.5 },
            // top-left quadrant
            { sx: 0, sy: 0, sw: W * 0.5, sh: H * 0.5 },
            // top-right quadrant
            { sx: W * 0.5, sy: 0, sw: W * 0.5, sh: H * 0.5 },
            // bottom-left quadrant
            { sx: 0, sy: H * 0.5, sw: W * 0.5, sh: H * 0.5 },
            // bottom-right quadrant
            { sx: W * 0.5, sy: H * 0.5, sw: W * 0.5, sh: H * 0.5 },
          ];

          for (const crop of crops) {
            for (const contrastLevel of [0, 70, 130]) {
              const { imageData } = drawToCanvas(img, { ...crop, maxSize: 1500 });
              if (contrastLevel > 0) enhanceImageData(imageData, contrastLevel);
              const found = tryJsQR(jsQR, imageData);
              if (found) {
                console.log(`✅ jsQR crop hit contrast=${contrastLevel}`, crop);
                resolve(found);
                return;
              }
            }
          }

          console.log("❌ All detection strategies exhausted.");
          resolve(null);
        } catch (err) {
          console.error("❌ Detection error:", err);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.error("❌ Image load failed");
        resolve(null);
      };

      img.src = URL.createObjectURL(file);
    });
  };


  const handleScanSuccess = async (qrData) => {
    const timestamp = new Date();
    console.log("🎉 QR Code Scanned:", qrData);

    // Save to database and check for duplicates
    const saved = await saveQRScan(qrData, timestamp);

    // Only show success and update stats if successfully saved (not a duplicate)
    if (saved) {
      setScanResult(qrData);
      setScanTimestamp(timestamp);
      setStats((prev) => ({
        ...prev,
        today: prev.today + 1,
        total: prev.total + 1,
      }));
      console.log("✅ QR scan successful and saved to database");
    } else {
      console.log("❌ QR scan detected but not saved to database");
      // Error message is already set by saveQRScan function
      // This covers both duplicates and database save failures
    }
  };

  const saveQRScan = async (qrData, timestamp) => {
    try {
      const token = getAuthToken();

      if (!token) {
        setError(
          "❌ Authentication Error\n\nYou are not logged in. Please login and try again.",
        );
        return false;
      }

      const response = await fetch(`${API_URL}/qr-scans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_data: qrData,
          event_id: selectedEventId,
          scan_timestamp: timestamp.toISOString(),
          scanner_type: "mobile-qr",
          device_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "❌ Authentication Error\n\nYour session has expired. Please login again.",
          );
          return false;
        } else if (response.status === 500) {
          setError(
            "❌ Server Error\n\nDatabase connection failed. Please try again later.",
          );
          return false;
        } else if (response.status === 409) {
          // Handle duplicate - this will be processed below (result.isDuplicate)
        } else {
          setError(
            `❌ Network Error\n\nHTTP ${response.status}: Failed to connect to server.\nURL: ${API_URL}/qr-scans`,
          );
          return false;
        }
      }

      const result = await response.json();

      if (response.status === 409 && result.isDuplicate) {
        // Handle duplicate QR code - require acknowledgment
        console.log("⚠️ Duplicate QR code detected");
        setDuplicateInfo({
          qrData: qrData,
          message: result.message,
          existingScan: result.existingScan,
        });
        setAwaitingAcknowledgment(true);
        return false;
      } else if (result.success) {
        console.log("✅ QR scan saved to database");
        return true;
      } else {
        console.error("❌ Failed to save scan:", result.error);
        setError(
          `❌ Database Save Failed\n\n${result.error || "Unknown error occurred"}\n\nQR code was detected but not saved to database.`,
        );
        return false;
      }
    } catch (err) {
      console.error("❌ Database save error:", err);
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "❌ Connection Error\n\nCannot connect to server. Please check your internet connection and try again.",
        );
      } else {
        setError(
          `❌ Unexpected Error\n\n${err.message}\n\nQR code was detected but not saved to database.`,
        );
      }
      return false;
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanTimestamp(null);
    setError(null);
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
  };

  const acknowledgeDuplicate = () => {
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
    // Scanner is now ready for new scans
  };

  const triggerCamera = () => {
    // Prevent new scans if awaiting acknowledgment
    if (awaitingAcknowledgment) {
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-20">
        {/* Top Hero Section - Dynamic & Modern */}
        <div className="relative overflow-hidden bg-[#1e293b] pt-12 pb-24 px-6 rounded-b-[3rem] shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 max-w-md mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-2">
              <Zap className="w-3 h-3 fill-blue-400" />
              Field Operations Portal
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Secure QR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Validator</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">Quickly verify and log community distributions via mobile scan.</p>
          </div>
        </div>

        {/* Floating Stats Card */}
        <div className="max-w-md mx-auto px-6 -mt-16 relative z-20">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-white flex flex-col items-center justify-center group hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.today}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Today's Scans</div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-white flex flex-col items-center justify-center group hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.total}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Verified</div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 mt-8 space-y-6">
          {/* Main Action Area */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16"></div>
            
            <div className="relative z-10 space-y-8">
              {/* Event Context */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Event Context</label>
                  {selectedEventId && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      Context Locked
                    </span>
                  )}
                </div>
                
                <div className="relative group">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select Event Context --</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>{evt.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                
                {events.length === 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">No active events found. Please create one in the dashboard to start scanning.</p>
                  </div>
                )}
              </div>

              {/* Scanning Target */}
              <div className="space-y-6">
                {duplicateInfo && awaitingAcknowledgment ? (
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in duration-300">
                    <div className="text-center mb-5">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                        <AlertCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-black">Duplicate Scan</h3>
                      <p className="text-sm text-amber-100 font-medium">Already verified in this event</p>
                    </div>

                    <div className="bg-black/10 rounded-2xl p-4 mb-6 border border-white/10 space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1.5">Staff In-Charge</div>
                        <div className="flex items-center gap-2 text-white font-black text-sm">
                          <User className="w-4 h-4 text-amber-200" />
                          {duplicateInfo.existingScan.scanned_by_name || "Unknown"}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1.5">Original Timestamp</div>
                        <div className="flex items-center gap-2 text-white font-black text-sm">
                          <Clock className="w-4 h-4 text-amber-200" />
                          {new Date(duplicateInfo.existingScan.scan_timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={acknowledgeDuplicate}
                      className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
                    >
                      Acknowledge & Dismiss
                    </button>
                  </div>
                ) : scanResult ? (
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in duration-300 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-1">Verification Success</h3>
                    <p className="text-emerald-50 text-sm mb-6">Record successfully added to event logs</p>
                    
                    <div className="bg-black/10 rounded-2xl p-4 mb-6 text-left border border-white/10">
                      <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Log ID</div>
                      <div className="text-xs font-mono font-bold break-all opacity-80">{scanResult.substring(0, 40)}...</div>
                    </div>

                    <button
                      onClick={resetScanner}
                      className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Scan Next Individual
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-square w-full max-w-[280px] mx-auto group">
                      <div className="absolute inset-0 bg-blue-500/5 rounded-3xl border-4 border-dashed border-slate-200 group-hover:border-blue-400 transition-colors duration-500"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                          {processing ? (
                            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <Camera className="w-10 h-10 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 tracking-tight">
                            {processing ? "Analyzing QR..." : !selectedEventId ? "Select Event First" : "Ready to Scan"}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tap button below</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={triggerCamera}
                      disabled={processing || !selectedEventId}
                      className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                        !selectedEventId 
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none" 
                          : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                      }`}
                    >
                      <Camera className="w-6 h-6" />
                      Launch External Camera
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Feed */}
          {error && !duplicateInfo && (
            <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-6 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <h5 className="font-black text-red-900 leading-none">Detection Issue</h5>
                  <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setError(null); triggerCamera(); }} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest active:scale-95 transition-all">Retry Scan</button>
                    <button onClick={() => setError(null)} className="px-4 py-2 bg-white text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200 active:scale-95 transition-all">Dismiss</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guidance Section */}
          <div className="pt-4 px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Guide</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Zap, text: "Focus entirely on the QR grid", color: "text-amber-500" },
                { icon: HardDrive, text: "Offline storage syncs automatically", color: "text-blue-500" },
                { icon: Info, text: "Wait for the success vibration", color: "text-emerald-500" }
              ].map((tip, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <tip.icon className={`w-5 h-5 ${tip.color}`} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

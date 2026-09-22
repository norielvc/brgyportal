import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, Keyboard, CheckCircle, AlertTriangle, RefreshCw, Upload, Type } from "lucide-react";
import toast from "react-hot-toast";
import Tesseract from "tesseract.js";

// Simple robust parser for our ID formats
function parseIDNumber(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  
  // Try to find the pattern anywhere in the text (don't anchor to start)
  // We also remove whitespace around hyphens just in case OCR added them
  const normalizedText = rawText.replace(/\s+-\s+/g, '-');
  
  // Match standard format HXXXXX-FXXXXX or similar legacy IDs anywhere in the text
  const idMatch = normalizedText.match(/H[a-z0-9]+-(?:F)?[a-z0-9]+/i) || normalizedText.match(/(?:EM|BC|CR|CI)-[A-Za-z0-9-]+/i);
  if (idMatch) return idMatch[0].toUpperCase();
  
  // If no strict pattern is found, but the input is very short (like a clean QR scan)
  const trimmed = rawText.trim();
  if (trimmed.length < 25 && !trimmed.includes('\n')) {
    return trimmed.split(' ')[0].toUpperCase();
  }
  
  return null;
}

export default function QRScannerModal({ isOpen, onClose, onSuccess }) {
  const [activeMode, setActiveMode] = useState("camera"); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState("H");
  const [processing, setProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [ocrProgress, setOcrProgress] = useState("");

  const scannerRef = useRef(null);
  const ocrVideoRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const readerDivId = "id-management-qr-reader";
  const processingRef = useRef(false);

  // Sound feedback
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
  };

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!isOpen) return;
    setError(null);
    await stopCamera();
    
    // Give DOM time to mount reader div
    await new Promise((r) => setTimeout(r, 100));
    
    const container = document.getElementById(readerDivId);
    if (!container) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerDivId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;
          await stopCamera();
          await handleSubmitScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      setError("Could not access camera. Please allow permissions.");
      setCameraActive(false);
    }
  }, [isOpen, stopCamera]);

  const stopTextCamera = useCallback(() => {
    if (ocrStreamRef.current) {
      ocrStreamRef.current.getTracks().forEach((track) => track.stop());
      ocrStreamRef.current = null;
    }
  }, []);

  const startTextCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      ocrStreamRef.current = stream;
      if (ocrVideoRef.current) {
        ocrVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera for text scanning.");
    }
  }, []);

  useEffect(() => {
    if (isOpen && !scanResult && !scanError) {
      if (activeMode === "camera") {
        startCamera();
        stopTextCamera();
      } else if (activeMode === "text") {
        stopCamera();
        startTextCamera();
      } else {
        stopCamera();
        stopTextCamera();
      }
    } else {
      stopCamera();
      stopTextCamera();
    }
    return () => {
      stopCamera();
      stopTextCamera();
    };
  }, [isOpen, activeMode, startCamera, stopCamera, startTextCamera, stopTextCamera, scanResult, scanError]);

  const handleSubmitScan = async (rawScanData) => {
    const idNumber = parseIDNumber(rawScanData);
    if (!idNumber) {
      playWarningSound();
      setScanError("Invalid QR format. Could not extract ID number.");
      processingRef.current = false;
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/barangay-id/mark-printed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id_number: idNumber })
      });
      const data = await res.json();

      if (data.success) {
        playSuccessSound();
        setScanResult(data.data);
        if (onSuccess) onSuccess();
        processingRef.current = false;
        setProcessing(false);
      } else {
        playWarningSound();
        setScanError(data.message || "Failed to update record.");
        processingRef.current = false;
        setProcessing(false);
      }
    } catch (err) {
      playWarningSound();
      setScanError("Network error.");
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const handleCaptureText = async () => {
    if (!ocrVideoRef.current) return;
    setProcessing(true);
    setOcrProgress("Capturing image...");
    
    // Draw current video frame to a canvas
    const canvas = document.createElement("canvas");
    canvas.width = ocrVideoRef.current.videoWidth;
    canvas.height = ocrVideoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(ocrVideoRef.current, 0, 0, canvas.width, canvas.height);
    
    setOcrProgress("Reading text (this may take a moment)...");
    try {
      const { data: { text } } = await Tesseract.recognize(
        canvas,
        'eng',
        { logger: m => {
          if (m.status === "recognizing text") {
            setOcrProgress(`Reading text... ${Math.round(m.progress * 100)}%`);
          }
        }}
      );
      
      const idNumber = parseIDNumber(text);
      if (idNumber) {
        setOcrProgress("ID found! Verifying...");
        await handleSubmitScan(idNumber);
      } else {
        playWarningSound();
        setScanError(`Could not find a valid ID number in the text. Read: "${text.substring(0, 30)}..."`);
        setProcessing(false);
      }
    } catch (err) {
      playWarningSound();
      setScanError("OCR Processing failed.");
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleSubmitScan(manualToken);
  };

  const handleScanNext = () => {
    setScanResult(null);
    setScanError(null);
    setManualToken("H");
    setOcrProgress("");
    if (isOpen) {
      if (activeMode === "camera") startCamera();
      if (activeMode === "text") startTextCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#03254c] p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight">Mark ID as Printed</h2>
            <p className="text-xs text-blue-200">Scan QR to update ledger status</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode("camera")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
              activeMode === "camera" ? "text-[#03254c] border-b-2 border-[#03254c] bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Camera className="w-4 h-4 hidden sm:block" /> QR
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("text")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
              activeMode === "text" ? "text-[#03254c] border-b-2 border-[#03254c] bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Type className="w-4 h-4 hidden sm:block" /> Text (OCR)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("capture")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
              activeMode === "capture" ? "text-[#03254c] border-b-2 border-[#03254c] bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-4 h-4 hidden sm:block" /> Image
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
              activeMode === "manual" ? "text-[#03254c] border-b-2 border-[#03254c] bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Keyboard className="w-4 h-4 hidden sm:block" /> Manual
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {scanResult ? (
            <div className="flex flex-col items-center justify-center text-center space-y-5 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-50 mb-2 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Successfully Printed!</h3>
                <p className="text-sm text-gray-500">The ID has been recorded in the ledger.</p>
              </div>
              
              <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left shadow-inner">
                <div className="flex items-center gap-4">
                  {scanResult.photo_url ? (
                    <img src={scanResult.photo_url} alt="Resident" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center border border-gray-300">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase inline-block mb-1 border border-emerald-100">
                      ID: {scanResult.id_number}
                    </div>
                    <h4 className="text-sm font-black text-gray-900 truncate uppercase">{scanResult.full_name}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{scanResult.address}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScanNext}
                className="w-full py-4 bg-[#03254c] hover:bg-[#021b37] text-white font-black rounded-2xl shadow-md transition-all mt-4"
              >
                Scan Next ID
              </button>
            </div>
          ) : scanError ? (
            <div className="flex flex-col items-center justify-center text-center space-y-5 py-4">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center border-4 border-rose-50 mb-2 shadow-sm">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Scan Failed</h3>
                <p className="text-sm text-gray-500">{scanError}</p>
              </div>

              <button
                type="button"
                onClick={handleScanNext}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all mt-4"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

          {activeMode === "camera" && (
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square max-w-[300px] bg-black rounded-2xl overflow-hidden relative shadow-inner">
                {processing && (
                  <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[#03254c] animate-spin mb-2" />
                    <span className="text-sm font-bold text-[#03254c]">Verifying...</span>
                  </div>
                )}
                <div id={readerDivId} className="w-full h-full" />
              </div>
              <p className="text-xs text-gray-500 font-medium mt-4 text-center">
                Point your camera at the QR code on the back of the printed PVC card.
              </p>
            </div>
          )}

          {activeMode === "text" && (
            <div className="flex flex-col items-center">
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-inner">
                {processing && (
                  <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center px-4 text-center">
                    <RefreshCw className="w-8 h-8 text-[#03254c] animate-spin mb-2" />
                    <span className="text-sm font-bold text-[#03254c]">{ocrProgress}</span>
                  </div>
                )}
                <video 
                  ref={ocrVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleCaptureText}
                disabled={processing}
                className="w-full py-4 bg-[#03254c] hover:bg-[#021b37] disabled:bg-gray-300 text-white font-black rounded-2xl shadow-md transition-all mt-4 flex items-center justify-center gap-2"
              >
                <Type className="w-5 h-5" /> Capture & Read Text
              </button>
              <p className="text-xs text-gray-500 font-medium mt-3 text-center">
                Point the camera at the ID Number (e.g., H03015-F03015) and tap capture.
              </p>
            </div>
          )}

          {activeMode === "capture" && (
            <div className="flex flex-col items-center pt-4">
              <div className="w-full bg-slate-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#03254c] transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      try {
                        const { Html5Qrcode } = await import("html5-qrcode");
                        const scanner = new Html5Qrcode("hidden-scanner-div");
                        const decodedText = await scanner.scanFile(file, true);
                        await handleSubmitScan(decodedText);
                      } catch (err) {
                        toast.error("Could not read QR code from image.");
                        playWarningSound();
                      }
                      e.target.value = "";
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={processing}
                />
                <div className="pointer-events-none flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-[#03254c]">Upload QR Image</p>
                  <p className="text-xs text-gray-500 mt-1">Tap to select photo from gallery</p>
                </div>
              </div>
              {processing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#03254c] font-bold">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Verifying...
                </div>
              )}
              <div id="hidden-scanner-div" style={{ display: 'none' }}></div>
            </div>
          )}

          {activeMode === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Enter ID Number
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  placeholder="e.g. H00001-F00001"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#03254c]"
                  disabled={processing}
                />
              </div>
              <button
                type="submit"
                disabled={processing || !manualToken}
                className="w-full py-4 bg-[#03254c] hover:bg-[#021b37] disabled:bg-gray-300 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {processing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> Mark as Printed
                  </>
                )}
              </button>
            </form>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Zap,
  ShieldCheck,
  WifiOff,
  Sparkles,
} from "lucide-react";

export default function InstallAppModal({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  isInstallable,
  onInstallClick,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-[#03254c] via-[#043b78] to-[#0a529e] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <Smartphone className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Progressive Web App
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Install BrgyDesk App
              </h3>
            </div>
          </div>
          <p className="text-xs text-blue-100/80 leading-relaxed max-w-sm">
            Use like a native mobile app without downloading from the App Store or Google Play Store.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Advantages Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/80 text-center">
              <Zap className="w-5 h-5 text-[#03254c] mx-auto mb-1.5" />
              <p className="text-[11px] font-black text-gray-900 leading-tight">Instant Launch</p>
              <p className="text-[9px] text-gray-500 mt-0.5">1-Tap home screen</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 text-center">
              <WifiOff className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
              <p className="text-[11px] font-black text-gray-900 leading-tight">Works Offline</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Cached documents</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/80 text-center">
              <ShieldCheck className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
              <p className="text-[11px] font-black text-gray-900 leading-tight">Zero Storage</p>
              <p className="text-[9px] text-gray-500 mt-0.5">No 200MB download</p>
            </div>
          </div>

          {/* Platform Specific Instructions */}
          {isIOS ? (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <span>📱 iOS Safari Installation Steps:</span>
              </p>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    Tap the <strong>Share</strong> button{" "}
                    <span className="inline-flex items-center p-0.5 px-1 bg-gray-200 rounded text-gray-800">
                      <Share2 className="w-3 h-3 inline mr-0.5" /> Share
                    </span>{" "}
                    in your Safari browser bar at the bottom.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    Scroll down and tap{" "}
                    <strong className="text-gray-900">
                      "Add to Home Screen"
                    </strong>{" "}
                    <span className="inline-flex items-center p-0.5 px-1 bg-gray-200 rounded text-gray-800">
                      <PlusSquare className="w-3 h-3 inline mr-0.5" />
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    Tap <strong className="text-blue-600">Add</strong> at the top right corner. You're all set!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">
                Clicking <strong className="text-[#03254c]">"Install App Now"</strong> will add BrgyDesk directly to your Android app drawer or Desktop apps with full-screen native mobile features.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors"
            >
              Maybe Later
            </button>
            {!isIOS ? (
              <button
                onClick={onInstallClick}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-[#03254c] to-blue-700 hover:from-[#021b37] hover:to-blue-800 text-white font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App Now
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got It!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

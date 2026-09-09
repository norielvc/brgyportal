import React from "react";
import {
  FileText,
  Search,
  AlertTriangle,
  Download,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResidentMobileActionBar({
  onRequestDocs,
  onTrackStatus,
  onESumbong,
  onInstallApp,
  isInstalled,
}) {
  return (
    <div
      aria-label="Resident Quick Actions"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.1)] pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 px-3 transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Track Status */}
        <button
          type="button"
          onClick={onTrackStatus}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-600 hover:text-emerald-700 active:scale-95 transition-all"
        >
          <Search className="w-5 h-5 mb-1 text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Track
          </span>
        </button>

        {/* Request Docs (Center Highlighted) */}
        <button
          type="button"
          onClick={onRequestDocs}
          className="relative -top-3 flex flex-col items-center group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-[0_6px_15px_rgba(5,150,105,0.4)] border-3 border-white">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mt-0.5">
            Apply Docs
          </span>
        </button>

        {/* E-Sumbong */}
        <button
          type="button"
          onClick={onESumbong}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-600 hover:text-red-600 active:scale-95 transition-all"
        >
          <AlertTriangle className="w-5 h-5 mb-1 text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            E-Sumbong
          </span>
        </button>

        {/* Install App */}
        <button
          type="button"
          onClick={onInstallApp}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-gray-600 hover:text-blue-600 active:scale-95 transition-all"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5 mb-1 text-blue-600" />
            {!isInstalled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            {isInstalled ? "App Active" : "Install"}
          </span>
        </button>
      </div>
    </div>
  );
}

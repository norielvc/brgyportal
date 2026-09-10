import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestored(true);
        const timer = setTimeout(() => setShowRestored(false), 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md pointer-events-none transition-all duration-300 animate-in slide-in-from-top-4">
      {showRestored ? (
        <div className="pointer-events-auto bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-emerald-400/30 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Connection restored. Syncing data...</span>
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto bg-amber-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-amber-400/30 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-200 animate-bounce" />
            <span>You're offline. Viewing cached data.</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-[11px] uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Bell, BellRing, CheckCircle, X, Sparkles, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function PushNotificationPrompt({ className = "" }) {
  const [permission, setPermission] = useState("default");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setPermission(Notification.permission);

    // If permission is default and not dismissed recently (in last 5 days), show prompt
    if (Notification.permission === "default") {
      const dismissedUntil = localStorage.getItem("pushPromptDismissedUntil");
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        // Show after a brief delay for a pleasant first-time UX
        const timer = setTimeout(() => setShowPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Push Notifications are not supported in this browser.");
      return;
    }

    setIsSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Push notifications enabled! 🎉");
        setShowPrompt(false);

        // Send a test confirmation notification via service worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification("BrgyDesk Alerts Active 🔔", {
            body: "You will now receive instant push updates for document status, pickups, and alerts.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-72x72.png",
            vibrate: [100, 50, 100],
            data: { url: "/" },
          });
        }
      } else if (result === "denied") {
        toast.error("Notifications were blocked in browser settings.");
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable notifications.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Suppress for 5 days
    const nextPrompt = Date.now() + 5 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pushPromptDismissedUntil", nextPrompt.toString());
  };

  const handleSendTestNotification = async () => {
    if (permission !== "granted") {
      await handleRequestPermission();
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification("Document Status Update 📄", {
          body: "Your Certificate of Indigency (Ref: BC-2026-0042) is now APPROVED and Ready for Pickup!",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          data: { url: "/requests" },
        });
        toast.success("Test notification dispatched!");
      }
    } catch (e) {
      toast.error("Failed to dispatch notification.");
    }
  };

  if (!showPrompt && permission === "granted") {
    return null; // Silent when already granted
  }

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-300 ${className}`}>
      <div className="bg-white/95 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-[0_15px_35px_rgba(3,37,76,0.18)] p-5 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#03254c] to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-blue-900/20">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Instant Alerts
              </span>
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-tight">
              Enable Push Notifications
            </h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Get real-time updates when certificates are approved, ready for pickup, or emergency advisories are broadcast.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 px-3 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-center"
          >
            Not Now
          </button>
          <button
            onClick={handleRequestPermission}
            disabled={isSubscribing}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-[#03254c] to-blue-700 hover:from-[#021b37] hover:to-blue-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isSubscribing ? "Enabling..." : "Allow Alerts"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

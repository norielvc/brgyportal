import { useState, useEffect, useCallback } from "react";

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Detect device environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Detect if running in standalone / installed PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("📲 PWA beforeinstallprompt event captured!");
    };

    const handleAppInstalled = () => {
      console.log("🎉 PWA successfully installed!");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to PWA install prompt: ${outcome}`);
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
      return outcome;
    } else if (isIOS) {
      // For iOS, open modal showing instructions
      setShowInstallModal(true);
      return "ios_guided";
    } else {
      setShowInstallModal(true);
      return "modal_shown";
    }
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isOnline,
    showInstallModal,
    setShowInstallModal,
    promptInstall,
  };
}

export default usePwa;

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import InstallAppModal from "../UI/InstallAppModal";
import PushNotificationPrompt from "../UI/PushNotificationPrompt";
import ESumbongModal from "../Forms/ESumbongModal";
import { isAuthenticated } from "@/lib/auth";
import usePwa from "@/lib/usePwa";

export default function Layout({
  children,
  title,
  subtitle,
  requireAuth = true,
  onSearch,
  searchTerm,
  mainClassName,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showESumbong, setShowESumbong] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarDesktopOpen");
      if (saved !== null) {
        setIsDesktopSidebarOpen(saved === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarDesktopOpen", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    promptInstall,
  } = usePwa();

  useEffect(() => {
    setIsMounted(true);
    if (requireAuth) {
      if (!isAuthenticated()) {
        router.replace("/login");
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [requireAuth, router]);

  if (requireAuth && (!isMounted || isLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#03254c]"></div>
        <p className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Loading Barangay Portal...
        </p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#03254c]"></div>
        <p className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Redirecting to Login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {requireAuth ? (
        <>
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isDesktopOpen={isDesktopSidebarOpen}
            onToggleDesktop={toggleDesktopSidebar}
            onOpenInstall={() => setShowInstallModal(true)}
            isInstalled={isInstalled}
          />
          <div
            className={cn(
              "transition-[padding] duration-300 ease-out",
              isDesktopSidebarOpen ? "lg:pl-52" : "lg:pl-0",
            )}
          >
            <Header
              title={title}
              subtitle={subtitle}
              onSearch={onSearch}
              searchTerm={searchTerm}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              isDesktopSidebarOpen={isDesktopSidebarOpen}
              onToggleDesktopSidebar={toggleDesktopSidebar}
              onNeedHelp={() => setShowESumbong(true)}
              onOpenInstall={() => setShowInstallModal(true)}
              isInstalled={isInstalled}
            />
            <main className={mainClassName ?? "p-2 sm:p-3 pb-20 lg:pb-3"}>{children}</main>
            <ESumbongModal
              isOpen={showESumbong}
              onClose={() => setShowESumbong(false)}
            />
            {/* Field Staff / Admin Mobile Bottom Navigation */}
            <MobileBottomNav
              onOpenMenu={() => setIsMobileMenuOpen(true)}
              onOpenInstall={() => setShowInstallModal(true)}
            />
          </div>
        </>
      ) : (
        <main className="min-h-screen">{children}</main>
      )}

      {requireAuth && <PushNotificationPrompt />}

      {/* Global PWA Install Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstallable={isInstallable}
        onInstallClick={promptInstall}
      />
    </div>
  );
}


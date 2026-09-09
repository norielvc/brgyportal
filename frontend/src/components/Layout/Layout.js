import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ESumbongModal from "../Forms/ESumbongModal";
import { isAuthenticated } from "@/lib/auth";

export default function Layout({
  children,
  title,
  subtitle,
  requireAuth = true,
  onSearch,
  searchTerm,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showESumbong, setShowESumbong] = useState(false);

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
          />
          <div className="lg:pl-64">
            <Header
              title={title}
              subtitle={subtitle}
              onSearch={onSearch}
              searchTerm={searchTerm}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              onNeedHelp={() => setShowESumbong(true)}
            />
            <main className="p-6">{children}</main>
            <ESumbongModal
              isOpen={showESumbong}
              onClose={() => setShowESumbong(false)}
            />
          </div>
        </>
      ) : (
        <main className="min-h-screen">{children}</main>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Header from "./Header";
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (requireAuth && !isAuthenticated()) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [requireAuth, router]);

  if (requireAuth && (isLoading || !isMounted)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated()) {
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 overflow-x-hidden transition-opacity duration-150 ${isMounted ? "opacity-100" : "opacity-0"}`}
    >
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
            />
            <main className="p-6">{children}</main>
          </div>
        </>
      ) : (
        <main className="min-h-screen">{children}</main>
      )}
    </div>
  );
}

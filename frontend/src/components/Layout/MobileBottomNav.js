import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  ClipboardList,
  QrCode,
  Package,
  Menu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth";

export default function MobileBottomNav({ onOpenMenu, onOpenInstall }) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending request count for badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch("/api/dashboard/nav-counts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          setPendingCount(0);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPendingCount(
              json.data.pendingRequests ?? json.data.pendingCount ?? 0,
            );
          }
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 45000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Requests",
      href: "/requests",
      icon: ClipboardList,
      badge: pendingCount,
    },
    {
      name: "Scan QR",
      href: "/mobile-qr-scanner",
      icon: QrCode,
      isCenter: true,
    },
    {
      name: "Pickups",
      href: "/pickup-management",
      icon: Package,
    },
    {
      name: "Menu",
      onClick: onOpenMenu,
      icon: Menu,
      isButton: true,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#03254c]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 px-2 transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const isActive = item.href ? router.pathname === item.href : false;

          if (item.isCenter) {
            return (
              <div key={item.name} className="relative -top-3 flex flex-col items-center">
                <Link
                  href={item.href}
                  className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md border-[3px] border-[#03254c] active:scale-95 transition-all"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="sr-only">{item.name}</span>
                </Link>
                <span className="text-[9px] font-bold uppercase text-blue-200/90 mt-0.5">
                  Scan
                </span>
              </div>
            );
          }

          if (item.isButton) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-blue-200/70 hover:text-white active:scale-95 transition-all relative"
              >
                <item.icon className="w-4 h-4 mb-0.5" />
                <span className="text-[9px] font-bold uppercase">
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative",
                isActive
                  ? "text-white font-black"
                  : "text-blue-200/70 hover:text-white active:scale-95"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-4 h-4 mb-0.5 transition-transform",
                    isActive ? "scale-110 text-cyan-400" : ""
                  )}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#03254c] animate-bounce">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  isActive ? "text-cyan-400 font-black" : "font-semibold"
                )}
              >
                {item.name}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

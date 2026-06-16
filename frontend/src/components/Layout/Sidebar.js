import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldAlert,
  Activity,
  FileText,
  UserCog,
  Calendar,
  GitBranch,
  ClipboardList,
  Building2,
  Smartphone,
  History,
  ChevronDown,
  ChevronRight,
  Package,
  PenTool,
  Award,
  Lock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout, getUserData } from "@/lib/auth";

const mainMenuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
  },
  {
    name: "Resident Database",
    href: "/residents",
    icon: Users,
    description: "Master Census Record",
  },
  {
    name: "Certificate Requests",
    href: "/requests",
    icon: ClipboardList,
    description: "Manage requests",
  },
  {
    name: "Pickup Management",
    href: "/pickup-management",
    icon: Package,
    description: "Certificate pickups",
  },
  {
    name: "My Signature",
    href: "/signature-settings",
    icon: PenTool,
    description: "Manage your signature",
  },
  {
    name: "QR Scanner",
    icon: Smartphone,
    description: "QR code scanning tools",
    proOnly: true, // Lock for Starter and Standard plans
    children: [
      {
        name: "Mobile Scanner",
        href: "/mobile-qr-scanner",
        icon: Smartphone,
        description: "Scan QR codes",
        proOnly: true,
      },
      {
        name: "Scan History",
        href: "/qr-scan-history",
        icon: History,
        description: "View scanned codes",
        proOnly: true,
      },
    ],
  },
  {
    name: "Management",
    icon: UserCog,
    description: "Content management",
    adminOnly: true,
    children: [
      {
        name: "Employees",
        href: "/employees",
        icon: Users,
        adminOnly: true,
        description: "Manage team",
      },
      {
        name: "Officials",
        href: "/officials",
        icon: UserCog,
        adminOnly: true,
        description: "Barangay officials",
      },
      {
        name: "Facilities",
        href: "/facilities",
        icon: Building2,
        adminOnly: true,
        starterOnly: true, // Lock for Starter plan only
        description: "Manage facilities",
      },
      {
        name: "Certificate Layout",
        href: "/certificate-layout",
        icon: FileText,
        adminOnly: true,
        description: "Edit PDF design",
      },
      {
        name: "Events",
        href: "/events",
        icon: Calendar,
        adminOnly: true,
        description: "Homepage events",
      },
      {
        name: "Achievements",
        href: "/achievements",
        icon: Award,
        adminOnly: true,
        starterOnly: true, // Lock for Starter plan only
        description: "Awards & Recognition",
      },
      {
        name: "Programs",
        href: "/programs",
        icon: Activity,
        adminOnly: true,
        starterOnly: true, // Lock for Starter plan only
        description: "Barangay Initiatives",
      },
    ],
  },
  {
    name: "System",
    icon: Settings,
    description: "System configuration",
    adminOnly: true,
    children: [
      {
        name: "Workflows",
        href: "/workflows",
        icon: GitBranch,
        adminOnly: true,
        description: "Approval flow",
      },
      {
        name: "Roles",
        href: "/roles",
        icon: Shield,
        adminOnly: true,
        description: "Access control",
      },
      {
        name: "Activity",
        href: "/activity",
        icon: Activity,
        description: "System logs",
      },
      {
        name: "Reports",
        href: "/reports",
        icon: FileText,
        description: "Analytics",
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Configuration",
      },
    ],
  },
];

export default function Sidebar({
  className,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const router = useRouter();
  // Persist expanded state across re-mounts (page navigations)
  const [expandedItems, setExpandedItems] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("sidebarExpandedItems");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const navRef = useRef(null);
  const user = getUserData();
  const role = user?.role?.toLowerCase();
  const adminRoles = [
    "superadmin",
    "super_admin",
    "admin",
    "captain",
    "secretary",
    "staff",
  ];

  // Fetch subscription data to check plan
  const [subscription, setSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("");
  const [requiredPlanType, setRequiredPlanType] = useState("Pro"); // "Pro" or "Standard"
  
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/subscription/usage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setSubscription(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch subscription:", e);
      }
    };
    fetchSubscription();
  }, []);

  // Check if user has Pro plan
  const isProPlan = subscription?.planId === "pro" || subscription?.requests?.total === -1;
  
  // Check if user has Starter plan (lowest tier)
  const isStarterPlan = subscription?.planId === "starter";
  
  // Check if user has Standard or Pro plan (can access starter-locked features)
  const canAccessStarterLocked = subscription?.planId === "standard" || isProPlan;

  const handleLogout = () => {
    logout();
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems((prev) => {
      const newState = {
        ...prev,
        [itemName]: !prev[itemName],
      };
      // Save to sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "sidebarExpandedItems",
          JSON.stringify(newState),
        );
      }
      return newState;
    });
  };

  // Restore scroll position on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScrollPos = sessionStorage.getItem("sidebarScrollPos");
      if (savedScrollPos && navRef.current) {
        // Use a small timeout to ensure DOM is ready and rendered
        setTimeout(() => {
          if (navRef.current) {
            navRef.current.scrollTop = parseInt(savedScrollPos, 10);
          }
        }, 50);
      }
    }
  }, []);

  const handleScroll = (e) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "sidebarScrollPos",
        e.currentTarget.scrollTop.toString(),
      );
    }
  };

  // Check if any child item is active to auto-expand parent
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some((child) => router.pathname === child.href);
  };

  // Helper to check expansion state
  const getExpandedState = (item) => {
    if (expandedItems[item.name] !== undefined) {
      return expandedItems[item.name];
    }
    return isParentActive(item);
  };

  const filteredMenuItems = mainMenuItems.filter((item) => {
    if (item.adminOnly && (!role || !adminRoles.includes(role))) {
      return false;
    }
    return true;
  });

  const renderNav = (showClose) => (
    <div className="flex flex-col h-full bg-[#03254c]">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-8 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mr-4 border border-white/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight tracking-tight">
              BrgyDesk
            </h1>
            <p className="text-[10px] font-bold text-blue-300/80 uppercase tracking-[0.2em]">
              Management Portal
            </p>
          </div>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
      >
        <div className="mb-4">
          <p className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            Admin Navigator
          </p>
        </div>

        {filteredMenuItems.map((item) => {
          const isExpanded = getExpandedState(item);
          const hasChildren = item.children && item.children.length > 0;
          const isDirectActive = router.pathname === item.href;

          return (
            <div key={item.name} className="space-y-1">
              {/* Main Menu Item */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    "group flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                    isParentActive(item)
                      ? "bg-white/10 text-white shadow-lg shadow-black/20"
                      : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 mr-3 transition-all",
                      isParentActive(item)
                        ? "text-blue-400 scale-110"
                        : "text-white/20 group-hover:text-blue-300",
                    )}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm truncate">{item.name}</div>
                    <div
                      className={cn(
                        "text-[10px] truncate transition-colors",
                        isParentActive(item)
                          ? "text-blue-300"
                          : "text-blue-200/30 group-hover:text-blue-200/50",
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/20" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                    isDirectActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black"
                      : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 mr-3 transition-all",
                      isDirectActive
                        ? "text-white scale-110"
                        : "text-white/20 group-hover:text-blue-300",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.name}</div>
                    <div
                      className={cn(
                        "text-[10px] truncate",
                        isDirectActive
                          ? "text-blue-100/70"
                          : "text-blue-200/30 group-hover:text-blue-200/50",
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              )}

              {/* Child Menu Items */}
              {hasChildren && isExpanded && (
                <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {item.children
                    .filter(
                      (child) =>
                        !child.adminOnly || (role && adminRoles.includes(role)),
                    )
                    .map((child) => {
                      const isChildActive = router.pathname === child.href;
                      // Check if locked based on plan
                      const isProLocked = child.proOnly && !isProPlan;
                      const isStarterLocked = child.starterOnly && !canAccessStarterLocked;
                      const isLocked = isProLocked || isStarterLocked;
                      
                      // Determine which plan is required
                      const requiredPlan = child.proOnly ? "Pro" : child.starterOnly ? "Standard or Pro" : null;
                      
                      return (
                        <Link
                          key={child.name}
                          href={isLocked ? "#" : child.href}
                          className={cn(
                            "group flex items-center px-4 py-2 text-[12px] font-bold rounded-lg transition-all",
                            isLocked
                              ? "text-blue-100/20 cursor-not-allowed opacity-50"
                              : isChildActive
                              ? "bg-white/10 text-white"
                              : "text-blue-100/40 hover:bg-white/5 hover:text-white",
                          )}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault();
                              setLockedFeatureName(child.name);
                              setRequiredPlanType(child.proOnly ? "Pro" : "Standard");
                              setShowUpgradeModal(true);
                              return;
                            }
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <child.icon
                            className={cn(
                              "w-4 h-4 mr-3 transition-all",
                              isLocked
                                ? "text-white/10"
                                : isChildActive
                                ? "text-blue-400"
                                : "text-white/10 group-hover:text-blue-300",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{child.name}</div>
                          </div>
                          {isLocked && (
                            <Lock className="w-3 h-3 text-yellow-400 ml-2" />
                          )}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="flex items-center mb-4 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-sm font-black text-white">
                {user?.firstName?.charAt(0) || "U"}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-blue-300/60 uppercase flex items-center tracking-wider">
              <Shield className="w-3 h-3 mr-1" />
              {user?.role}
            </p>
          </div>
        </div>

        {role && ["superadmin", "super_admin"].includes(role) && (
          <button
            type="button"
            onClick={() => router.push("/superadmin")}
            className="flex items-center w-full px-4 py-3 mb-1 text-sm font-bold text-amber-400/80 rounded-xl hover:bg-amber-500/10 hover:text-amber-400 transition-all duration-300 group"
          >
            <ShieldAlert className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            Super Admin Panel
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-400/80 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
          Sign Out Portal
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay with sliding effect */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-all duration-500 overflow-hidden",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar Container */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] bg-[#03254c] shadow-2xl transition-transform duration-500 ease-out flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {renderNav(true)}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#03254c] border-r border-white/5",
          className,
        )}
      >
        {renderNav(false)}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Feature Locked</h3>
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                      {requiredPlanType} Plan Required
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
                  <Smartphone className="w-8 h-8 text-amber-600" />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-2">{lockedFeatureName}</h4>
                <p className="text-gray-600 leading-relaxed">
                  This feature is only available in the <span className="font-bold text-amber-600">{requiredPlanType} Plan</span>
                  {requiredPlanType === "Standard" && " or higher"}. 
                  Upgrade your subscription to unlock {lockedFeatureName} and other premium features.
                </p>
              </div>

              {/* Features List */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {requiredPlanType} Plan Includes:
                </p>
                <ul className="space-y-2">
                  {requiredPlanType === "Pro" ? (
                    <>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>QR Code Scanner & History</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Advanced Analytics Dashboard</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Unlimited Certificate Requests</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Bulk Data Export (Excel/CSV)</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Facilities Management</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Programs & Achievements</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>1,000 Requests per Month</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Physical Inspection Reports</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push("/pricing");
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

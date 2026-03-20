import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
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
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, getUserData } from '@/lib/auth';

const mainMenuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Analytics'
  },
  {
    name: 'Resident Database',
    href: '/residents',
    icon: Users,
    description: 'Master Census Record'
  },
  {
    name: 'Certificate Requests',
    href: '/requests',
    icon: ClipboardList,
    description: 'Manage requests'
  },
  {
    name: 'Pickup Management',
    href: '/pickup-management',
    icon: Package,
    description: 'Certificate pickups'
  },
  {
    name: 'My Signature',
    href: '/signature-settings',
    icon: PenTool,
    description: 'Manage your signature'
  },
  {
    name: 'QR Scanner',
    icon: Smartphone,
    description: 'QR code scanning tools',
    children: [
      {
        name: 'Mobile Scanner',
        href: '/mobile-qr-scanner',
        icon: Smartphone,
        description: 'Scan QR codes'
      },
      {
        name: 'Scan History',
        href: '/qr-scan-history',
        icon: History,
        description: 'View scanned codes'
      }
    ]
  },
  {
    name: 'Management',
    icon: UserCog,
    description: 'Content management',
    adminOnly: true,
    children: [
      {
        name: 'Employees',
        href: '/employees',
        icon: Users,
        adminOnly: true,
        description: 'Manage team'
      },
      {
        name: 'Officials',
        href: '/officials',
        icon: UserCog,
        adminOnly: true,
        description: 'Barangay officials'
      },
      {
        name: 'Facilities',
        href: '/facilities',
        icon: Building2,
        adminOnly: true,
        description: 'Manage facilities'
      },
      {
        name: 'Certificate Layout',
        href: '/certificate-layout',
        icon: FileText,
        adminOnly: true,
        description: 'Edit PDF design'
      },
      {
        name: 'Events',
        href: '/events',
        icon: Calendar,
        adminOnly: true,
        description: 'Homepage events'
      },
      {
        name: 'Achievements',
        href: '/achievements',
        icon: Award,
        adminOnly: true,
        description: 'Awards & Recognition'
      },
      {
        name: 'Programs',
        href: '/programs',
        icon: Activity,
        adminOnly: true,
        description: 'Barangay Initiatives'
      }
    ]
  },
  {
    name: 'System',
    icon: Settings,
    description: 'System configuration',
    adminOnly: true,
    children: [
      {
        name: 'Workflows',
        href: '/workflows',
        icon: GitBranch,
        adminOnly: true,
        description: 'Approval flow'
      },
      {
        name: 'Roles',
        href: '/roles',
        icon: Shield,
        adminOnly: true,
        description: 'Access control'
      },
      {
        name: 'Activity',
        href: '/activity',
        icon: Activity,
        description: 'System logs'
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: FileText,
        description: 'Analytics'
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Configuration'
      }
    ]
  }
];

export default function Sidebar({ className, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const router = useRouter();
  // Persist expanded state across re-mounts (page navigations)
  const [expandedItems, setExpandedItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('sidebarExpandedItems');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const navRef = useRef(null);
  const user = getUserData();
  const adminRoles = ['SuperAdmin', 'super_admin', 'admin', 'captain', 'secretary', 'SUPERADMIN', 'superadmin'];

  const handleLogout = () => {
    logout();
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => {
      const newState = {
        ...prev,
        [itemName]: !prev[itemName]
      };
      // Save to sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sidebarExpandedItems', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Restore scroll position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem('sidebarScrollPos');
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sidebarScrollPos', e.currentTarget.scrollTop.toString());
    }
  };

  // Check if any child item is active to auto-expand parent
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => router.pathname === child.href);
  };

  // Helper to check expansion state
  const getExpandedState = (item) => {
    if (expandedItems[item.name] !== undefined) {
      return expandedItems[item.name];
    }
    return isParentActive(item);
  };

  const filteredMenuItems = mainMenuItems.filter(item => {
    if (item.adminOnly && !adminRoles.includes(user?.role)) {
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
            <h1 className="text-sm font-black text-white leading-tight uppercase tracking-tighter">Barangay</h1>
            <p className="text-[10px] font-bold text-blue-300/80 uppercase tracking-[0.2em]">Management System</p>
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
                    'group flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300',
                    isParentActive(item)
                      ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                      : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 mr-3 transition-all",
                    isParentActive(item) ? "text-blue-400 scale-110" : "text-white/20 group-hover:text-blue-300"
                  )} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm truncate">{item.name}</div>
                    <div className={cn(
                      "text-[10px] truncate transition-colors",
                      isParentActive(item) ? "text-blue-300" : "text-blue-200/30 group-hover:text-blue-200/50"
                    )}>
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
                    'group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300',
                    isDirectActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
                      : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5 mr-3 transition-all",
                    isDirectActive ? "text-white scale-110" : "text-white/20 group-hover:text-blue-300"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.name}</div>
                    <div className={cn(
                      "text-[10px] truncate",
                      isDirectActive ? "text-blue-100/70" : "text-blue-200/30 group-hover:text-blue-200/50"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )}

              {/* Child Menu Items */}
              {hasChildren && isExpanded && (
                <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {item.children
                    .filter(child => !child.adminOnly || adminRoles.includes(user?.role))
                    .map((child) => {
                      const isChildActive = router.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'group flex items-center px-4 py-2 text-[12px] font-bold rounded-lg transition-all',
                            isChildActive
                              ? 'bg-white/10 text-white'
                              : 'text-blue-100/40 hover:bg-white/5 hover:text-white'
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <child.icon className={cn(
                            "w-4 h-4 mr-3 transition-all",
                            isChildActive ? "text-blue-400" : "text-white/10 group-hover:text-blue-300"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">
                              {child.name}
                            </div>
                          </div>
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
                {user?.firstName?.charAt(0) || 'U'}
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
      <div className={cn(
        "lg:hidden fixed inset-0 z-50 transition-all duration-500 overflow-hidden",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar Container */}
        <div className={cn(
          "absolute inset-y-0 left-0 w-[280px] bg-[#03254c] shadow-2xl transition-transform duration-500 ease-out flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {renderNav(true)}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#03254c] border-r border-white/5", className)}>
        {renderNav(false)}
      </div>
    </>
  );
}
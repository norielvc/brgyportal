import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  HelpCircle,
  Smartphone,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getUserData, logout, getAuthToken } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/router";

export default function Header({
  title,
  subtitle,
  onSearch,
  searchTerm,
  onMenuClick,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  onNeedHelp,
  onOpenInstall,
  isInstalled,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const user = getUserData();
  const router = useRouter();

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/notifications?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      
      if (data && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('Failed to fetch notifications:', error.message);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      await fetch('/api/notifications/all/read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '📢';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-2 sm:px-4 pt-[calc(env(safe-area-inset-top,0px)+0.35rem)] pb-2 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between gap-2 min-h-[2.25rem]">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 -ml-0.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop sidebar show/hide */}
        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            aria-label={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className={cn(
              "hidden lg:flex p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-[#03254c] transition-colors shrink-0",
              !isDesktopSidebarOpen && "-ml-0.5",
            )}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Title section */}
        <div className="flex-1 min-w-0 leading-tight">
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Install PWA App Button */}
          {onOpenInstall && !isInstalled && (
            <button
              onClick={onOpenInstall}
              title="Install BrgyDesk Progressive Web App"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#03254c] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-md transition-all"
            >
              <Smartphone className="w-3 h-3 text-blue-600" />
              <span className="hidden md:inline">Install</span>
            </button>
          )}

          {/* Need Help / E-Sumbong */}
          <button
            onClick={onNeedHelp}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-md transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">E-Sumbong</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-gray-500 hover:text-[#03254c] hover:bg-gray-100 rounded-md transition-all"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="fixed sm:absolute top-14 sm:top-auto right-3 sm:right-0 mt-2 sm:mt-3 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#03254c] hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">You'll see updates here</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-50 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50/80"}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.reference_number && (
                              <p className="text-xs text-blue-600 font-medium mt-1">
                                Ref: {notification.reference_number}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {getTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        router.push('/notifications');
                        setShowNotifications(false);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 pr-1.5 rounded-md hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-[#03254c] to-blue-800 rounded-md flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              <div className="hidden lg:block text-left max-w-[120px]">
                <p className="text-[11px] font-bold text-gray-900 truncate leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase truncate mt-0.5">
                  {user?.role}
                </p>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                </div>
                <div className="py-1 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}

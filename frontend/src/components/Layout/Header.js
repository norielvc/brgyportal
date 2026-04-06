import { Bell, Search, User, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { getUserData, logout } from '@/lib/auth';
import { getInitials } from '@/lib/utils';

export default function Header({ title, subtitle, onSearch, searchTerm, onMenuClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const user = getUserData();

  const notifications = [
    {
      id: 1,
      title: 'New employee onboarded',
      message: 'Sarah Johnson has been added to the system',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'Security update completed',
      message: 'System security patches have been applied',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      title: 'Weekly report ready',
      message: 'Employee activity report is available',
      time: '3 hours ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-6 py-4 sticky top-0 z-30 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Title section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 drop-shadow-sm truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="SEARCH EMPLOYEES, REPORTS..."
              value={searchTerm || ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="block w-64 md:w-80 pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-xl text-xs font-black uppercase tracking-wider placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 border-b border-gray-50 transition-colors cursor-pointer ${notification.unread ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50/80'}`}>
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#03254c] to-blue-800 rounded-lg flex items-center justify-center shadow-inner relative overflow-hidden group-hover:shadow-md transition-all">
                <span className="text-sm font-black text-white tracking-widest z-10">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-black uppercase text-gray-900 tracking-tight leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {user?.role} <span className="text-emerald-500 ml-0.5">• Online</span>
                </p>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
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
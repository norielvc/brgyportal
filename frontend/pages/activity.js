import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Clock,
  User,
  Shield,
  LogIn,
  LogOut,
} from "lucide-react";
import Layout from "@/components/Layout/Layout";
import { getAuthToken } from "@/lib/auth";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const activityTypes = [
    { id: "login", label: "Login", icon: LogIn, color: "text-green-600" },
    { id: "logout", label: "Logout", icon: LogOut, color: "text-blue-600" },
    {
      id: "user_created",
      label: "User Created",
      icon: User,
      color: "text-purple-600",
    },
    {
      id: "user_updated",
      label: "User Updated",
      icon: User,
      color: "text-orange-600",
    },
    {
      id: "user_deleted",
      label: "User Deleted",
      icon: User,
      color: "text-red-600",
    },
    {
      id: "role_changed",
      label: "Role Changed",
      icon: Shield,
      color: "text-indigo-600",
    },
  ];

  useEffect(() => {
    // Simulate loading activity logs
    // In a real app, this would fetch from the backend
    const mockLogs = [
      {
        id: 1,
        type: "login",
        user: "Admin User",
        email: "admin@example.com",
        description: "Logged in successfully",
        timestamp: new Date(Date.now() - 5 * 60000),
        ipAddress: "192.168.1.100",
      },
      {
        id: 2,
        type: "user_created",
        user: "Admin User",
        email: "admin@example.com",
        description: "Created new user: John Doe",
        timestamp: new Date(Date.now() - 15 * 60000),
        ipAddress: "192.168.1.100",
      },
      {
        id: 3,
        type: "user_updated",
        user: "Admin User",
        email: "admin@example.com",
        description: "Updated user: Jane Smith",
        timestamp: new Date(Date.now() - 30 * 60000),
        ipAddress: "192.168.1.100",
      },
      {
        id: 4,
        type: "role_changed",
        user: "Admin User",
        email: "admin@example.com",
        description: "Changed role for: Mike Johnson (user → admin)",
        timestamp: new Date(Date.now() - 1 * 3600000),
        ipAddress: "192.168.1.100",
      },
      {
        id: 5,
        type: "login",
        user: "John Doe",
        email: "user@example.com",
        description: "Logged in successfully",
        timestamp: new Date(Date.now() - 2 * 3600000),
        ipAddress: "192.168.1.101",
      },
      {
        id: 6,
        type: "logout",
        user: "John Doe",
        email: "user@example.com",
        description: "Logged out",
        timestamp: new Date(Date.now() - 3 * 3600000),
        ipAddress: "192.168.1.101",
      },
    ];

    setLogs(mockLogs);
    setIsLoading(false);
  }, []);

  const getActivityIcon = (type) => {
    const activity = activityTypes.find((a) => a.id === type);
    return activity ? activity.icon : Clock;
  };

  const getActivityColor = (type) => {
    const activity = activityTypes.find((a) => a.id === type);
    return activity ? activity.color : "text-gray-600";
  };

  const getActivityLabel = (type) => {
    const activity = activityTypes.find((a) => a.id === type);
    return activity ? activity.label : "Activity";
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || log.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
          Audit trail of system events & actions
        </p>
        <button className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95 transition-all shrink-0">
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, email, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs appearance-none"
          >
            <option value="all">All Activities</option>
            {activityTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-xs sm:text-sm">No activity logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => {
              const IconComponent = getActivityIcon(log.type);
              return (
                <div key={log.id} className="p-3.5 sm:p-4 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 ${getActivityColor(log.type)}`}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                            {log.description}
                          </p>
                          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
                            By <span className="font-semibold text-gray-700">{log.user}</span> ({log.email})
                          </p>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-md text-[9px] sm:text-[10px] font-bold text-gray-600 shrink-0 uppercase tracking-wider">
                          {getActivityLabel(log.type)}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.timestamp)}
                        </span>
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total</p>
          <p className="text-lg sm:text-2xl font-black text-gray-900 mt-0.5">{logs.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Logins</p>
          <p className="text-lg sm:text-2xl font-black text-green-600 mt-0.5">
            {logs.filter((l) => l.type === "login").length}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Created</p>
          <p className="text-lg sm:text-2xl font-black text-purple-600 mt-0.5">
            {logs.filter((l) => l.type === "user_created").length}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Changes</p>
          <p className="text-lg sm:text-2xl font-black text-orange-600 mt-0.5">
            {
              logs.filter(
                (l) => l.type.includes("updated") || l.type.includes("changed"),
              ).length
            }
          </p>
        </div>
      </div>
    </div>
  );
}

ActivityLogs.getLayout = (page) => (
  <Layout title="Activity Logs" subtitle="System activity and user actions">
    {page}
  </Layout>
);

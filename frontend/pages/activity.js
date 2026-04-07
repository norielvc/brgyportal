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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">System activity and user actions</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, email, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input pl-10 w-full"
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
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const IconComponent = getActivityIcon(log.type);
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-lg bg-gray-100 flex-shrink-0 ${getActivityColor(log.type)}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.description}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            By <span className="font-medium">{log.user}</span> (
                            {log.email})
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                            {getActivityLabel(log.type)}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-gray-600 text-sm">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm">Logins</p>
          <p className="text-2xl font-bold text-green-600">
            {logs.filter((l) => l.type === "login").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm">Users Created</p>
          <p className="text-2xl font-bold text-purple-600">
            {logs.filter((l) => l.type === "user_created").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-gray-600 text-sm">Changes</p>
          <p className="text-2xl font-bold text-orange-600">
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

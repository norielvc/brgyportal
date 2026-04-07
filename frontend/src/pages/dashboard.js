import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import { dashboardAPI } from "@/lib/api";
import { formatNumber, formatDate, formatRelativeTime } from "@/lib/utils";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome to your admin dashboard">
        <LoadingCard message="Loading dashboard data..." />
      </Layout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };

    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(value)}
              </p>
              {change !== undefined && (
                <p
                  className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {change >= 0 ? "+" : ""}
                  {change}% from last month
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Dashboard" subtitle="Welcome to your admin dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.overview?.totalUsers || 0}
            icon={Users}
            change={stats?.overview?.growthPercentage}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={stats?.overview?.activeUsers || 0}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Admin Users"
            value={stats?.overview?.adminUsers || 0}
            icon={Activity}
            color="yellow"
          />
          <StatCard
            title="This Month"
            value={stats?.overview?.currentMonthUsers || 0}
            icon={Calendar}
            color="red"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
              <p className="text-sm text-gray-500">
                New user registrations over time
              </p>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.charts?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Login Activity Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Login Activity
              </h3>
              <p className="text-sm text-gray-500">
                Daily login activity (last 7 days)
              </p>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.charts?.loginActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="logins" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Role Distribution
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats?.charts?.roleDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, count, percent }) =>
                      `${role}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="role"
                  >
                    {(stats?.charts?.roleDistribution || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Status Distribution
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats?.charts?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) =>
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats?.charts?.statusDistribution || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Users
              </h3>
              <p className="text-sm text-gray-500">Latest user registrations</p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {(stats?.recentActivity?.recentUsers || []).map((user) => (
                  <div key={user._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.firstName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`badge ${user.role === "admin" ? "badge-info" : "badge-success"}`}
                      >
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Active Users */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Most Active Users
              </h3>
              <p className="text-sm text-gray-500">
                Users with highest login counts
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {(stats?.recentActivity?.activeUsers || []).map((user) => (
                  <div key={user._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.firstName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.loginCount} logins
                      </p>
                      <p className="text-xs text-gray-500">
                        Last: {formatRelativeTime(user.lastLogin)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

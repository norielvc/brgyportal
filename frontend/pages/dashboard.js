import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import {
  Users,
  UserCheck,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  UserX
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetchStats(token);
  }, []);

  useEffect(() => {
    if (stats?.recentActivity?.recentUsers) {
      const filtered = stats.recentActivity.recentUsers.filter(emp =>
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [stats, searchTerm]);

  const fetchStats = async (token) => {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
      const response = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", description }) => {
    const colorClasses = {
      blue: {
        gradient: 'from-blue-600 to-indigo-800',
        iconBg: 'bg-white/10',
        iconColor: 'text-white',
        shadow: 'shadow-blue-200'
      },
      green: {
        gradient: 'from-emerald-600 to-teal-800',
        iconBg: 'bg-white/10',
        iconColor: 'text-white',
        shadow: 'shadow-emerald-200'
      },
      purple: {
        gradient: 'from-purple-600 to-fuchsia-800',
        iconBg: 'bg-white/10',
        iconColor: 'text-white',
        shadow: 'shadow-purple-200'
      },
      orange: {
        gradient: 'from-orange-600 to-amber-800',
        iconBg: 'bg-white/10',
        iconColor: 'text-white',
        shadow: 'shadow-orange-200'
      }
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div className={`bg-gradient-to-br ${colors.gradient} rounded-2xl p-6 text-white shadow-xl ${colors.shadow} border border-white/10 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${colors.iconBg} border border-white/10`}>
              <Icon className={`w-5 h-5 ${colors.iconColor}`} />
            </div>
            {trend && (
              <div className="flex items-center bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                {trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400 mr-1" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trendValue}%
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-4xl font-black tracking-tighter leading-none mb-3">{value}</p>
            {description && (
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-tight">{description}</p>
            )}
          </div>
        </div>
        {/* Decorative background icon */}
        <Icon className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
      </div>
    );
  };

  const EmployeeTable = ({ employees }) => {
    const getStatusBadge = (status) => {
      const badges = {
        active: 'badge-success',
        inactive: 'badge-warning',
        suspended: 'badge-danger'
      };
      return badges[status] || 'badge-info';
    };

    const getRoleBadge = (role) => {
      return role === 'admin' ? 'badge-info' : 'badge bg-gray-100 text-gray-800';
    };

    const formatLastLogin = (date) => {
      if (!date) return 'Never';
      const now = new Date();
      const loginDate = new Date(date);
      const diffTime = Math.abs(now - loginDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      return loginDate.toLocaleDateString();
    };

    if (!employees || employees.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">Get started by adding your first team member.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Profile</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role / Designation</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">System Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {employees.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                      <span className="text-xs font-black text-indigo-600 uppercase">
                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 uppercase text-[13px] tracking-tight">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-gray-400 tracking-tighter">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${employee.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {employee.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${employee.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[12px] font-black text-gray-500 uppercase tracking-tight">
                    {formatLastLogin(employee.lastLogin)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const SystemAlerts = () => (
    <div className="space-y-4">
      <div className="flex items-start p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
        <div className="bg-amber-100 p-2 rounded-xl border border-amber-200 mr-4">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Security Audit Required</h4>
          <p className="text-[12px] text-amber-700 font-bold uppercase tracking-tight">3 Staff members require credential verification</p>
        </div>
      </div>

      <div className="flex items-start p-4 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
        <div className="bg-blue-100 p-2 rounded-xl border border-blue-200 mr-4">
          <CheckCircle className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">System Integrity Check</h4>
          <p className="text-[12px] text-blue-700 font-bold uppercase tracking-tight">Daily backup vault synchronized at 02:00 AM</p>
        </div>
      </div>

      <div className="flex items-start p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
        <div className="bg-emerald-100 p-2 rounded-xl border border-emerald-200 mr-4">
          <Activity className="w-5 h-5 text-emerald-700" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest mb-1">Performance Index</h4>
          <p className="text-[12px] text-emerald-700 font-bold uppercase tracking-tight">Server response latency improved by 15%</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Company Internal Management System">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Unified Command Dashboard"
      subtitle="BARANGAY MANAGEMENT & INTERNAL MONITORING"
      onSearch={setSearchTerm}
      searchTerm={searchTerm}
    >
      <div className="space-y-6">
        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={stats?.overview?.totalUsers || 0}
            icon={Users}
            trend="up"
            trendValue="12"
            color="blue"
            description="All registered employees"
          />

          <MetricCard
            title="Active Employees"
            value={stats?.overview?.activeUsers || 0}
            icon={UserCheck}
            trend="up"
            trendValue="8"
            color="green"
            description="Currently active staff"
          />

          <MetricCard
            title="Administrators"
            value={stats?.overview?.adminUsers || 0}
            icon={Shield}
            color="purple"
            description="System administrators"
          />

          <MetricCard
            title="New This Month"
            value={stats?.overview?.currentMonthUsers || 0}
            icon={TrendingUp}
            trend="up"
            trendValue="25"
            color="orange"
            description="Recently onboarded"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Management Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Administrative Directory</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Personnel and Authorization Levels</p>
                  </div>
                  <button
                    onClick={() => router.push('/employees')}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Register Personnel
                  </button>
                </div>
              </div>
              <div className="p-0">
                <EmployeeTable employees={filteredEmployees} />
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-white">
                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] leading-none">System Intelligence</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Real-time status monitoring</p>
              </div>
              <div className="p-5 bg-gray-50/30">
                <SystemAlerts />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-white">
                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] leading-none">Command Center</h3>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={() => router.push('/employees')}
                  className="w-full px-5 py-3.5 bg-indigo-50 text-indigo-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center group transition-all hover:bg-indigo-100 hover:translate-x-1"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Personnel Control
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full px-5 py-3.5 bg-gray-50 text-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center group transition-all hover:bg-gray-100 hover:translate-x-1"
                >
                  <Shield className="w-4 h-4 mr-3" />
                  Vault Settings
                </button>
                <button
                  onClick={() => router.push('/reports')}
                  className="w-full px-5 py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center group transition-all hover:bg-emerald-100 hover:translate-x-1"
                >
                  <Activity className="w-4 h-4 mr-3" />
                  Analytics Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

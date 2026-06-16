import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Activity,
  RefreshCw,
  ArrowRight,
  Calendar,
  Package,
  Users,
  Target,
  Bell,
  Award,
  Zap,
  Filter,
} from "lucide-react";

/**
 * Optimized Dashboard UI
 * 1. Cleaned up color noise (replaced overwhelming gradients with white-card aesthetic)
 * 2. Improved visual hierarchy
 * 3. Grouped metrics logically
 */

const API_URL = "/api";

const TYPE_LABELS = {
  barangay_clearance: "Clearance",
  certificate_of_indigency: "Indigency",
  barangay_residency: "Residency",
  natural_death: "Natural Death",
  barangay_guardianship: "Guardianship",
  barangay_cohabitation: "Co-habitation",
  business_permit: "Business Permit",
  same_person: "Same Person",
  medico_legal: "Medico Legal",
  educational_assistance: "Educational Assistance",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-100", iconColor: "text-amber-500" },
  approved: { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-100", iconColor: "text-emerald-500" },
  released: { label: "Released", color: "text-blue-600 bg-blue-50 border-blue-100", iconColor: "text-blue-500" },
  rejected: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-100", iconColor: "text-red-500" },
  returned: { label: "Returned", color: "text-orange-600 bg-orange-50 border-orange-100", iconColor: "text-orange-500" },
  cancelled: { label: "Cancelled", color: "text-gray-500 bg-gray-50 border-gray-100", iconColor: "text-gray-400" },
  forwarded: { label: "Forwarded", color: "text-purple-600 bg-purple-50 border-purple-100", iconColor: "text-purple-500" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Optimized Metric Card (Clean White Aesthetic matching new design)
const MetricCard = ({ icon: Icon, label, value, sub, iconBgColor, iconColor }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2 rounded-lg ${iconBgColor || 'bg-gray-50'}`}>
        <Icon className={`w-4 h-4 ${iconColor || 'text-gray-600'}`} />
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-gray-900">{value ?? "0"}</p>
      </div>
      {sub && (
        <p className="text-xs text-gray-400 font-medium mt-1">{sub}</p>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", certificateType: "", status: "" });

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("❌ No auth token - redirecting to login");
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      
      const url = `${API_URL}/dashboard/certificate-analytics?${params.toString()}`;
      console.log("📊 Fetching dashboard data...");
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const json = await res.json();
      
      console.log("📊 API Response:", {
        success: json.success,
        totalRequests: json.data?.overview?.totalRequests,
        status: res.status,
        fullResponse: json, // Log the full response to see the error
      });
      
      if (!res.ok) {
        console.error("❌ API Error:", res.status, json);
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
      }
      
      if (json.success) {
        setData(json.data);
        console.log("✅ Dashboard data loaded successfully");
      } else {
        console.error("❌ API returned success:false", json);
      }
    } catch (e) { 
      console.error("❌ Dashboard error:", e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const [subData, setSubData] = useState(null);
  
  const fetchSubData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/subscription/usage", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setSubData(json.data);
    } catch (e) { console.error("Sub fetch error:", e); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchData().then(() => setIsFirstLoad(false));
    fetchSubData();
  }, []);

  useEffect(() => { if (!isFirstLoad) { fetchData(); fetchSubData(); } }, [filters]);

  if (loading) return <div className="p-8 animate-pulse space-y-8"><div className="h-20 bg-gray-100 rounded-2xl w-full" /><div className="grid grid-cols-4 gap-6"><div className="h-32 bg-gray-100 rounded-2xl" /><div className="h-32 bg-gray-100 rounded-2xl" /><div className="h-32 bg-gray-100 rounded-2xl" /><div className="h-32 bg-gray-100 rounded-2xl" /></div></div>;

  const ov = data?.overview || {};
  const maxTrend = Math.max(...(data?.monthlyTrend || []).map(m => m.total), 1);
  const maxDaily = Math.max(...(data?.dailyTrend || []).map(d => d.count), 1);
  const maxType = Math.max(...(data?.byType || []).map(t => t.count), 1);
  
  const growthBadge = ov.monthGrowth != null ? `${ov.monthGrowth >= 0 ? '+' : ''}${ov.monthGrowth}%` : null;

  const SubscriptionWidget = ({ data }) => {
    if (!data) return null;
    const requestPct = data.requests.isUnlimited ? 0 : Math.min(100, (data.requests.used / data.requests.total) * 100);
    const staffPct = data.staff.isUnlimited ? 0 : Math.min(100, (data.staff.used / data.staff.total) * 100);
    
    return (
        <div className="bg-white rounded-2xl border border-[#2d5a3d]/10 p-5 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-[#2d5a3d] animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-[#2d5a3d]/10 rounded-xl">
                    <Zap className="w-6 h-6 text-[#2d5a3d]" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Barangay Active Plan</h4>
                    <p className="text-xl font-black text-gray-900">{data.planName}</p>
                </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full px-0 md:px-8 md:border-x border-gray-50">
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <Activity className="w-3 h-3" /> Monthly Requests
                        </span>
                        <span className="text-xs font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                            {data.requests.used} / {data.requests.isUnlimited ? '∞' : data.requests.total}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-all duration-1000 ${requestPct > 90 ? 'bg-red-500' : 'bg-[#2d5a3d]'}`} 
                            style={{ width: `${data.requests.isUnlimited ? 100 : requestPct}%` }} 
                        />
                    </div>
                </div>
                
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Staff Slots
                        </span>
                        <span className="text-xs font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                            {data.staff.used} / {data.staff.isUnlimited ? '∞' : data.staff.total}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-all duration-1000 ${staffPct > 90 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                            style={{ width: `${data.staff.isUnlimited ? 100 : staffPct}%` }} 
                        />
                    </div>
                </div>
            </div>
            
            <div className="w-full md:w-auto">
                <button 
                  onClick={() => router.push('/pricing')}
                  className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                >
                    Upgrade Plan
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Area - Cleaned up */}
      <div className="pb-2 border-b border-gray-100 mb-2">
        {/* Buttons removed as requested */}
      </div>

      <SubscriptionWidget data={subData} />

      {/* Row 1: Core Performance Lifecycle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard icon={FileText} label="Total Volume" value={ov.totalRequests} sub="All time" colorClass="bg-gray-100 text-gray-900" onClick={() => router.push("/requests")} />
        <MetricCard icon={Clock} label="In Progress" value={ov.pending} sub="Pending actions" colorClass="bg-amber-50 text-amber-600" onClick={() => router.push("/requests?status=pending")} />
        <MetricCard icon={CheckCircle} label="Success" value={ov.approved} sub="Finalized" colorClass="bg-emerald-50 text-emerald-600" onClick={() => router.push("/requests?status=approved")} />
        <MetricCard icon={Package} label="Released" value={ov.released} sub="Claimed" colorClass="bg-blue-50 text-blue-600" onClick={() => router.push("/requests?status=released")} />
        <MetricCard icon={AlertCircle} label="Returned" value={ov.returned} sub="Corrections" colorClass="bg-orange-50 text-orange-600" onClick={() => router.push("/requests?status=returned")} />
        <MetricCard icon={XCircle} label="Declined" value={ov.rejected} sub="Rejected" colorClass="bg-red-50 text-red-600" onClick={() => router.push("/requests?status=rejected")} />
      </div>

      {/* Row 2: Operational Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard icon={Calendar} label="This Month" value={ov.thisMonth} badge={growthBadge} sub="Submissions" colorClass="bg-indigo-50 text-indigo-600" />
        <MetricCard icon={Target} label="Completion" value={`${ov.completionRate}%`} sub="Success Rate" colorClass="bg-teal-50 text-teal-600" />
        <MetricCard icon={Bell} label="Overdue" value={ov.overdueCount} sub=">7 days" colorClass="bg-rose-50 text-rose-600" />
        <MetricCard icon={Users} label="Residents" value={ov.residentsCount} sub="Registered" colorClass="bg-sky-50 text-sky-600" onClick={() => router.push("/residents")} />
        <MetricCard icon={Award} label="Active Staff" value={ov.usersCount} sub="Accountancy" colorClass="bg-violet-50 text-violet-600" />
      </div>

      {/* Charts & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              7-Day Activity
            </h3>
          </div>
          <div className="h-48 flex items-end justify-between gap-3 px-2">
            {(data?.dailyTrend || []).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex items-end justify-center h-40 pb-2">
                  <div 
                    className="w-1/2 bg-[#2d5a3d]/20 rounded-t-lg group-hover:bg-[#2d5a3d] transition-all duration-300 border-x border-t border-[#2d5a3d]/10" 
                    style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: '4px' }} 
                  />
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Bottlenecks
          </h3>
          <div className="space-y-4">
            {(data?.byStep || []).slice(0, 5).map((s, i) => {
              const pct = Math.round((s.count / (ov.pending || 1)) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                    <span className="truncate w-40">{s.step}</span>
                    <span className="text-gray-900">{s.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Annual Volume
          </h3>
          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {(data?.monthlyTrend || []).map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex items-end justify-center h-32 gap-1 pb-2">
                  <div className="w-1/3 bg-blue-500/30 rounded-t-sm group-hover:bg-blue-500 transition-colors" style={{ height: `${(m.total / maxTrend) * 100}%` }} />
                  <div className="w-1/3 bg-[#2d5a3d]/50 rounded-t-sm group-hover:bg-[#2d5a3d] transition-colors" style={{ height: `${(m.approved / maxTrend) * 100}%` }} />
                </div>
                <span className="text-[8px] font-black text-gray-400 uppercase">{m.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requests by Type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Category Mix
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {(data?.byType || []).slice(0, 10).map((t, i) => {
              const pct = Math.round((t.count / maxType) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                    <span className="truncate">{TYPE_LABELS[t.type] || t.type}</span>
                    <span className="text-gray-900">{t.count}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Interactions List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-900" />
            Recent Interactions
          </h3>
          <button onClick={() => router.push("/requests")} className="text-[10px] font-black uppercase text-[#2d5a3d] hover:underline flex items-center gap-1">
            View Logs <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).slice(0, 8).map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: "text-gray-500 bg-gray-50" };
                return (
                  <tr key={i} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push("/requests")}>
                    <td className="py-3 text-xs font-black text-[#2d5a3d]">{r.referenceNumber}</td>
                    <td className="py-3 text-xs font-bold text-gray-800">{r.applicantName}</td>
                    <td className="py-3 text-[10px] font-bold text-gray-400 uppercase">{TYPE_LABELS[r.certificateType] || r.certificateType}</td>
                    <td className="py-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="py-3 text-[10px] font-bold text-gray-400 text-right">{formatDate(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


Dashboard.getLayout = (page) => (
  <Layout
    title="Overview Analytics"
    subtitle="Real-time monitoring system"
  >
    {page}
  </Layout>
);

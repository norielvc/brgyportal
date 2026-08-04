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
  TrendingDown,
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
  Timer,
  AlertTriangle,
  TrendingFlat,
} from "lucide-react";

/**
 * Optimized Dashboard UI
 * 1. Cleaned up color noise (replaced overwhelming gradients with white-card aesthetic)
 * 2. Improved visual hierarchy
 * 3. Grouped metrics logically
 */

const API_URL = "/api";

const CHART_COLORS = {
  primary: "#03254c",
  primaryLight: "#03254c33",
  blue: "#3b82f6",
  blueLight: "#3b82f633",
  amber: "#f59e0b",
  amberLight: "#f59e0b33",
  indigo: "#6366f1",
  indigoLight: "#6366f133",
};

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

const MetricCard = ({ icon: Icon, label, value, sub, iconBgColor, iconColor, badge, onClick }) => (
  <div
    className={`bg-white rounded-xl p-5 border border-gray-200 transition-all ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-md' : 'hover:border-gray-200'}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-lg ${iconBgColor || 'bg-gray-50'}`}>
        <Icon className={`w-4 h-4 ${iconColor || 'text-gray-600'}`} />
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {badge}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className="text-3xl font-black text-gray-900 tabular-nums">{value ?? "0"}</p>
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
      if (!token) { router.push("/login"); return; }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const url = `${API_URL}/dashboard/certificate-analytics?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
      }
      
      if (json.success) setData(json.data);
    } catch (e) {
      // silently fail — dashboard shows last known data
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

  if (loading) return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="hidden sm:flex gap-8">
            <div className="space-y-2"><div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" /><div className="h-2 w-24 bg-gray-100 rounded-full animate-pulse" /></div>
            <div className="space-y-2"><div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" /><div className="h-2 w-24 bg-gray-100 rounded-full animate-pulse" /></div>
          </div>
          <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse mb-4" />
            <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-7 w-12 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-8" />
          <div className="h-48 flex items-end gap-3">
            {[0,1,2,3,4,5,6].map(i => <div key={i} className="flex-1 bg-gray-100 rounded-t animate-pulse" style={{ height: `${30 + Math.random() * 60}%` }} />)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[0,1,2,3].map(i => <div key={i}><div className="h-2.5 w-full bg-gray-100 rounded animate-pulse mb-2" /><div className="h-1.5 w-3/4 bg-gray-100 rounded-full animate-pulse" /></div>)}
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-[#03254c]">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-[#03254c]/10 rounded-xl">
                    <Zap className="w-5 h-5 text-[#03254c]" />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Plan</h4>
                    <p className="text-lg font-bold text-gray-900">{data.planName}</p>
                </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full px-0 md:px-8 md:border-x border-gray-50">
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <Activity className="w-3 h-3" /> Monthly Requests
                        </span>
                        <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded tabular-nums">
                            {data.requests.used} / {data.requests.isUnlimited ? '∞' : data.requests.total}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-all duration-1000 ${requestPct > 90 ? 'bg-red-500' : 'bg-[#03254c]'}`} 
                            style={{ width: `${data.requests.isUnlimited ? 100 : requestPct}%` }} 
                        />
                    </div>
                </div>
                
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Staff Slots
                        </span>
                        <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded tabular-nums">
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
                  className="w-full md:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                >
                    Upgrade Plan
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time certificate processing metrics</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <SubscriptionWidget data={subData} />

      {/* Row 1: Core Request Lifecycle */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard icon={FileText} label="Total Volume" value={ov.totalRequests} sub="All time" iconBgColor="bg-gray-50" iconColor="text-gray-700" onClick={() => router.push("/requests")} />
        <MetricCard icon={Calendar} label="Today" value={ov.todayCount} sub={`${ov.yesterdayCount || 0} yesterday`} iconBgColor="bg-indigo-50" iconColor="text-indigo-600" onClick={() => router.push("/requests")} />
        <MetricCard icon={Clock} label="In Progress" value={ov.pending} sub="Pending actions" iconBgColor="bg-amber-50" iconColor="text-amber-600" onClick={() => router.push("/requests?status=pending")} />
        <MetricCard icon={CheckCircle} label="Approved" value={ov.approved} sub="Finalized" iconBgColor="bg-emerald-50" iconColor="text-emerald-600" onClick={() => router.push("/requests?status=approved")} />
        <MetricCard icon={Package} label="Released" value={ov.released} sub="Claimed" iconBgColor="bg-blue-50" iconColor="text-blue-600" onClick={() => router.push("/requests?status=released")} />
        <MetricCard icon={XCircle} label="Rejected" value={ov.rejected} sub={`${ov.rejectionRate || 0}% rate`} iconBgColor="bg-red-50" iconColor="text-red-600" onClick={() => router.push("/requests?status=rejected")} />
      </div>

      {/* Row 2: Performance & Quality Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard icon={TrendingUp} label="This Month" value={ov.thisMonth} badge={growthBadge} sub="vs last month" iconBgColor="bg-indigo-50" iconColor="text-indigo-600" />
        <MetricCard icon={Timer} label="Avg Processing" value={ov.avgProcessingDays ? `${ov.avgProcessingDays}d` : "—"} sub="Per request" iconBgColor="bg-teal-50" iconColor="text-teal-600" />
        <MetricCard icon={Target} label="Completion" value={`${ov.completionRate}%`} sub="Success rate" iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard icon={AlertTriangle} label="Returned" value={ov.returned} sub={`${ov.returnRate || 0}% rate`} iconBgColor="bg-orange-50" iconColor="text-orange-600" onClick={() => router.push("/requests?status=returned")} />
        <MetricCard icon={Bell} label="Overdue" value={ov.overdueCount} sub=">7 days pending" iconBgColor="bg-rose-50" iconColor="text-rose-600" />
      </div>

      {/* Charts & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              7-Day Activity
            </h3>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Daily Volume</span>
          </div>
          <div className="h-44 flex items-end justify-between gap-3 px-2">
            {(data?.dailyTrend || []).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                  {d.count} requests
                </div>
                <div className="w-full flex items-end justify-center h-36 pb-2">
                  <div
                    className="w-1/2 rounded-t-md group-hover:bg-[#03254c] transition-all duration-300"
                    style={{
                      height: `${(d.count / maxDaily) * 100}%`,
                      minHeight: '4px',
                      backgroundColor: CHART_COLORS.primaryLight,
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Bottlenecks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Workflow Bottlenecks
          </h3>
          <div className="space-y-4">
            {(data?.byStep || []).slice(0, 5).map((s, i) => {
              const pct = Math.round((s.count / (ov.pending || 1)) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                    <span className="truncate w-32">{s.step}</span>
                    <span className="text-gray-900 tabular-nums">{s.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS.amber }} />
                  </div>
                </div>
              );
            })}
            {(data?.byStep || []).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No active bottlenecks</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Annual Volume Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Annual Volume
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_COLORS.blueLight }} />Total</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_COLORS.primary }} />Approved</span>
            </div>
          </div>
          <div className="h-36 flex items-end justify-between gap-2 px-2">
            {(data?.monthlyTrend || []).map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                  {m.total} total, {m.approved} approved
                </div>
                <div className="w-full flex items-end justify-center h-28 gap-0.5 pb-2">
                  <div className="w-1/3 rounded-t-sm group-hover:opacity-100 transition-all" style={{ height: `${(m.total / maxTrend) * 100}%`, minHeight: '2px', backgroundColor: CHART_COLORS.blueLight }} />
                  <div className="w-1/3 rounded-t-sm group-hover:opacity-100 transition-all" style={{ height: `${(m.approved / maxTrend) * 100}%`, minHeight: '2px', backgroundColor: CHART_COLORS.primary }} />
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase">{m.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requests by Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Category Mix
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {(data?.byType || []).slice(0, 10).map((t, i) => {
              const pct = Math.round((t.count / maxType) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                    <span className="truncate">{TYPE_LABELS[t.type] || t.type}</span>
                    <span className="text-gray-900 tabular-nums">{t.count}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS.indigo }} />
                  </div>
                </div>
              );
            })}
            {(data?.byType || []).length === 0 && (
              <p className="col-span-2 text-xs text-gray-400 text-center py-4">No certificate data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Requests + Top Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Requests — Actionable List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Overdue Requests
            </h3>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              {ov.overdueCount || 0} total
            </span>
          </div>
          <div className="space-y-3">
            {(data?.overdueRequests || []).slice(0, 5).map((r, i) => {
              const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: "text-gray-500 bg-gray-50" };
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push("/requests")}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 shrink-0">
                    <Clock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{r.referenceNumber}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.applicantName} · {TYPE_LABELS[r.certificateType] || r.certificateType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-rose-600">{r.daysOverdue}d</p>
                    <p className="text-[9px] text-gray-400 uppercase">overdue</p>
                  </div>
                </div>
              );
            })}
            {(data?.overdueRequests || []).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No overdue requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Staff Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top Staff Performance
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">By Completions</span>
          </div>
          <div className="space-y-3">
            {(data?.topStaff || []).slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-amber-50 text-amber-600" :
                  i === 1 ? "bg-gray-100 text-gray-600" :
                  i === 2 ? "bg-orange-50 text-orange-600" :
                  "bg-gray-50 text-gray-400"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {s.userId?.substring(0, 8) || `Staff ${i + 1}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(s.completed / Math.max(...(data?.topStaff || []).map(t => t.completed), 1)) * 100}%`,
                          backgroundColor: i === 0 ? CHART_COLORS.amber : CHART_COLORS.primary,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 tabular-nums shrink-0">{s.completed}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-gray-500 tabular-nums">{s.avgHours}h</p>
                  <p className="text-[8px] text-gray-400 uppercase">avg</p>
                </div>
              </div>
            ))}
            {(data?.topStaff || []).length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No staff activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Interactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-700" />
            Recent Interactions
          </h3>
          <button onClick={() => router.push("/requests")} className="text-[10px] font-bold uppercase text-[#03254c] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Applicant</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).slice(0, 8).map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: "text-gray-500 bg-gray-50" };
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push("/requests")}>
                    <td className="py-3 text-xs font-bold text-[#03254c]">{r.referenceNumber}</td>
                    <td className="py-3 text-xs font-semibold text-gray-800">{r.applicantName}</td>
                    <td className="py-3 text-[10px] font-bold text-gray-400 uppercase">{TYPE_LABELS[r.certificateType] || r.certificateType}</td>
                    <td className="py-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="py-3 text-[10px] font-semibold text-gray-400 text-right">{formatDate(r.createdAt)}</td>
                  </tr>
                );
              })}
              {(data?.recent || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">No recent interactions</td>
                </tr>
              )}
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
    subtitle="Certificate processing dashboard"
  >
    {page}
  </Layout>
);

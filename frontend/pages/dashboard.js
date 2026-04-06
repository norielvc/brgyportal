import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import {
  FileText, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, TrendingDown, BarChart2, Activity,
  RefreshCw, ArrowRight, Calendar, Package, Users,
  Download, Filter, Printer
} from 'lucide-react';

const API_URL = '/api';

const TYPE_LABELS = {
  barangay_clearance: 'Clearance',
  certificate_of_indigency: 'Indigency',
  barangay_residency: 'Residency',
  natural_death: 'Natural Death',
  barangay_guardianship: 'Guardianship',
  barangay_cohabitation: 'Co-habitation',
  business_permit: 'Business Permit',
  same_person: 'Same Person',
  medico_legal: 'Medico Legal',
  educational_assistance: 'Educational Assistance',
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved:  { label: 'Approved',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  released:  { label: 'Released',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 border-red-200' },
  returned:  { label: 'Returned',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  forwarded: { label: 'Forwarded', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dashboard/certificate-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-gray-100 rounded-2xl" />
        <div className="h-72 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  const ov = data?.overview || {};
  const maxTrend = Math.max(...(data?.monthlyTrend || []).map(m => m.total), 1);
  const maxType = Math.max(...(data?.byType || []).map(t => t.count), 1);

  const MetricCard = ({ icon: Icon, label, value, sub, gradient, badge, badgeColor }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient} border border-white/10 hover:scale-[1.02] transition-transform`}>
      <div className="absolute -bottom-4 -right-4 opacity-10">
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        {badge !== undefined && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor || 'bg-white/20 text-white'} uppercase tracking-wide`}>
            {badge >= 0 ? `+${badge}` : badge}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">{label}</p>
      <p className="text-4xl font-black leading-none mb-1">{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-white/60 font-bold uppercase tracking-wide mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Certificate Request Analytics</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            Complete Report & Audit Dashboard
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => router.push('/requests')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2d5a3d] to-[#112e1f] text-white rounded-xl text-xs font-black uppercase tracking-wide hover:opacity-90 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            View All Requests
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={FileText} label="Total Requests" value={ov.totalRequests} sub="All time" gradient="from-[#1e3a8a] to-[#1d4ed8]" />
        <MetricCard icon={Clock} label="In Progress" value={ov.pending} sub="Active requests" gradient="from-amber-500 to-orange-600" />
        <MetricCard icon={CheckCircle} label="Approved / Released" value={ov.approved} sub="Completed" gradient="from-emerald-600 to-teal-700" />
        <MetricCard icon={XCircle} label="Rejected" value={ov.rejected} sub="Declined" gradient="from-red-500 to-rose-700" />
        <MetricCard icon={Package} label="Released" value={ov.released} sub="Picked up" gradient="from-blue-500 to-cyan-600" />
        <MetricCard icon={AlertCircle} label="Returned" value={ov.returned} sub="Sent back" gradient="from-orange-500 to-amber-600" />
        <MetricCard icon={Calendar} label="This Month" value={ov.thisMonth ?? 0} badge={ov.monthGrowth} badgeColor={ov.monthGrowth >= 0 ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'} sub={`vs ${ov.lastMonth ?? 0} last month`} gradient="from-purple-600 to-fuchsia-700" />
        <MetricCard icon={Activity} label="Avg Processing" value={`${ov.avgProcessingDays ?? '—'}${ov.avgProcessingDays != null ? 'd' : ''}`} sub="Days to approve" gradient="from-slate-600 to-gray-800" />
      </div>

      {/* Today + Step Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Monthly Request Trend</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Last 12 months — Total vs Approved</p>
            </div>
            <BarChart2 className="w-5 h-5 text-gray-300" />
          </div>
          <div className="flex items-end gap-1 h-36">
            {(data?.monthlyTrend || []).map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
                  <div className="bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {m.month}<br />Total: {m.total} · Approved: {m.approved}
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
                </div>
                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div
                    className="w-2/5 bg-gradient-to-t from-[#1e3a8a] to-[#3b82f6] rounded-t-sm transition-all"
                    style={{ height: `${(m.total / maxTrend) * 100}%`, minHeight: m.total > 0 ? '3px' : '0' }}
                  />
                  <div
                    className="w-2/5 bg-gradient-to-t from-[#16a34a] to-[#4ade80] rounded-t-sm transition-all"
                    style={{ height: `${(m.approved / maxTrend) * 100}%`, minHeight: m.approved > 0 ? '3px' : '0' }}
                  />
                </div>
                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wide text-center leading-tight mt-1">
                  {m.month.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-[10px] font-bold text-gray-500 uppercase">Total Requests</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-[10px] font-bold text-gray-500 uppercase">Approved</span></div>
          </div>
        </div>

        {/* Step Queue (Active) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Step Queue</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Active requests by step</p>
            </div>
            <Activity className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-3">
            {(data?.byStep || []).length === 0 && (
              <p className="text-xs text-gray-400 font-bold text-center py-6">No active requests</p>
            )}
            {(data?.byStep || []).map((s, i) => {
              const pct = Math.round((s.count / (ov.pending || 1)) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide truncate">{s.step}</span>
                    <span className="text-[10px] font-black text-gray-500 ml-2 shrink-0">{s.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2d5a3d] to-[#8dc63f] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Type Breakdown + Status Breakdown + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Certificate Type Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">By Certificate Type</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Request volume per type</p>
            </div>
            <FileText className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-3">
            {(data?.byType || []).map((t, i) => {
              const pct = Math.round((t.count / maxType) * 100);
              const colors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-fuchsia-600', 'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600', 'from-lime-500 to-green-600', 'from-violet-500 to-purple-600', 'from-red-500 to-rose-600', 'from-amber-500 to-yellow-600'];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide">{TYPE_LABELS[t.type] || t.type}</span>
                    <span className="text-[10px] font-black text-gray-500">{t.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Status Breakdown</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">All-time status distribution</p>
            </div>
            <CheckCircle className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-3">
            {(data?.byStatus || []).map((s, i) => {
              const cfg = STATUS_CONFIG[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
              const pct = ov.totalRequests > 0 ? Math.round((s.count / ov.totalRequests) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                      <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-600 ml-3 shrink-0">{s.count} <span className="text-gray-400">({pct}%)</span></span>
                </div>
              );
            })}
          </div>

          {/* Summary Row */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            {[
              { label: 'Today', val: ov.todayCount },
              { label: 'This Month', val: ov.thisMonth },
              { label: 'Last Month', val: ov.lastMonth },
              { label: 'Avg Days', val: `${ov.avgProcessingDays}d` },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-black text-gray-800">{item.val}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Recent Requests</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Latest 10 submissions</p>
            </div>
            <button onClick={() => router.push('/requests')} className="text-[10px] font-black text-[#2d5a3d] hover:underline uppercase tracking-wide flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-80 pr-1 custom-scrollbar">
            {(data?.recent || []).map((r, i) => {
              const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
              return (
                <div key={i} className="flex flex-col gap-0.5 p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-[#2d5a3d] uppercase tracking-tight truncate">{r.referenceNumber || '—'}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 border rounded-full uppercase tracking-wide shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 truncate">{r.applicantName || '—'}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-400">{TYPE_LABELS[r.certificateType] || r.certificateType}</span>
                    <span className="text-[9px] font-bold text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.getLayout = (page) => (
  <Layout title="Request Analytics Dashboard" subtitle="CERTIFICATE REQUESTS — COMPLETE REPORT & AUDIT">
    {page}
  </Layout>
);

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  FileText,
  Clock,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowRight,
  PackageCheck,
  Users,
  QrCode,
  ShieldCheck,
  Landmark,
  Award,
  Zap,
  Filter,
  ChevronRight,
  Layers,
  FilePlus2,
  HelpCircle,
  Clock3,
  CheckCircle,
  X,
} from "lucide-react";

const API_URL = "/api";

const TYPE_LABELS = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_indigency: "Certificate of Indigency",
  barangay_residency: "Certificate of Residency",
  natural_death: "Certificate of Natural Death",
  barangay_guardianship: "Certificate of Guardianship",
  barangay_cohabitation: "Certificate of Co-Habitation",
  business_permit: "Barangay Business Clearance",
  same_person: "Certificate of Same Person",
  medico_legal: "Medico Legal Certification",
  educational_assistance: "Educational Assistance Endorsement",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    badgeClass: "text-amber-700 bg-amber-50 border border-amber-200/80",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Approved / Certified",
    badgeClass: "text-emerald-700 bg-emerald-50 border border-emerald-200/80",
    dotClass: "bg-emerald-500",
  },
  released: {
    label: "Claimed / Released",
    badgeClass: "text-blue-700 bg-blue-50 border border-blue-200/80",
    dotClass: "bg-blue-500",
  },
  rejected: {
    label: "Disapproved / Rejected",
    badgeClass: "text-rose-700 bg-rose-50 border border-rose-200/80",
    dotClass: "bg-rose-500",
  },
  returned: {
    label: "Returned for Rectification",
    badgeClass: "text-orange-700 bg-orange-50 border border-orange-200/80",
    dotClass: "bg-orange-500",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "text-gray-600 bg-gray-100 border border-gray-200",
    dotClass: "bg-gray-400",
  },
  forwarded: {
    label: "Forwarded to Office",
    badgeClass: "text-purple-700 bg-purple-50 border border-purple-200/80",
    dotClass: "bg-purple-500",
  },
};

function formatPSTDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    certificateType: "",
    status: "",
  });

  // Live Philippine Standard Time (PST) Clock
  const [pstTime, setPstTime] = useState("");
  const [pstDate, setPstDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setPstTime(timeStr);
      setPstDate(dateStr);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const url = `${API_URL}/dashboard/certificate-analytics?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
      }

      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/subscription/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSubData(json.data);
    } catch (e) {
      console.error("Subscription usage fetch error:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
    fetchSubData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", certificateType: "", status: "" });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const ov = data?.overview || {};
  const maxDaily = Math.max(...(data?.dailyTrend || []).map((d) => d.count), 1);
  const maxType = Math.max(...(data?.byType || []).map((t) => t.count), 1);
  const growthBadge =
    ov.monthGrowth != null
      ? `${ov.monthGrowth >= 0 ? "+" : ""}${ov.monthGrowth}%`
      : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-10 w-48 bg-gray-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((g) => (
            <div key={g} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-gray-100 rounded-xl" />
                <div className="h-20 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 h-80" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-gray-900">
      {/* 1. OFFICIAL LGU EXECUTIVE COMMAND HEADER & LIVE PST CLOCK */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#032042] via-[#052d5b] to-[#0a3f78] p-6 text-white shadow-lg border border-[#0d4f96]">
        {/* Subtle Decorative Background Pattern */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* LGU Title & Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#032042] rounded-[14px] flex items-center justify-center">
                <Landmark className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Republic of the Philippines
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  ARTA & DILG e-Governance Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 drop-shadow-sm">
                Barangay Executive Command Center
              </h1>
              <p className="text-xs text-blue-100/80 font-medium">
                Real-Time Civil Registry, Clearance Processing & SLA Performance Tracking
              </p>
            </div>
          </div>

          {/* Live Philippine Standard Time (PST) & Operational Badge */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 w-full lg:w-auto bg-black/25 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-300">
                Live LGU Operations • Online
              </span>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-lg font-black tracking-tight text-white tabular-nums">
                {pstTime || "—"}
              </p>
              <p className="text-[11px] text-blue-200/90 font-semibold tracking-wide">
                {pstDate || "Philippine Standard Time (PST, GMT+8)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE QUICK ACTION COMMAND BAR */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/requests")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#03254c] text-white rounded-xl text-xs font-bold hover:bg-[#053870] active:scale-[0.98] transition-all shadow-sm"
          >
            <FilePlus2 className="w-4 h-4 text-amber-400" />
            <span>Issue Certificate / Request</span>
          </button>

          <button
            onClick={() => router.push("/mobile-qr-scanner")}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Scan Citizen QR</span>
          </button>

          <button
            onClick={() => router.push("/residents")}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
          >
            <Users className="w-4 h-4 text-gray-500" />
            <span>Resident Census</span>
          </button>

          <button
            onClick={() => router.push("/pickup-management")}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
          >
            <PackageCheck className="w-4 h-4 text-blue-600" />
            <span>Pickup Counter</span>
          </button>

          <button
            onClick={() => router.push("/help-desk")}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
          >
            <HelpCircle className="w-4 h-4 text-red-500" />
            <span>E-Sumbong Blotter</span>
          </button>
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeFilterCount > 0 || showFilters
                ? "bg-blue-50 text-[#03254c] border-blue-200"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 bg-[#03254c] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 active:scale-[0.98] transition-all disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-gray-500"}`}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Syncing..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* EXPANDABLE FILTER DRAWER */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filter Analytics Data
            </h4>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear All Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Certificate Type
              </label>
              <select
                value={filters.certificateType}
                onChange={(e) =>
                  handleFilterChange("certificateType", e.target.value)
                }
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">All Certificate Types</option>
                {Object.entries(TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Workflow Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="released">Released</option>
                <option value="returned">Returned</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. STRUCTURED GOVERNANCE KPI COMMAND GRID (3 DOMAINS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOMAIN A: CIVIL REGISTRY & INTAKE STREAM */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#03254c] to-blue-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#03254c]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Civil Registry & Intake
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Applications filed & logged
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Live Inflow
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Total Inflow */}
              <div
                onClick={() => router.push("/requests")}
                className="p-3 bg-gray-50/80 hover:bg-gray-100 rounded-xl border border-gray-100 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  All Time
                </p>
                <p className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">
                  {ov.totalRequests ?? 0}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium truncate">
                  Cumulative records
                </p>
              </div>

              {/* Today's Intake */}
              <div
                onClick={() => router.push("/requests")}
                className="p-3 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-xl border border-indigo-100/80 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-indigo-700 uppercase">
                  Today
                </p>
                <p className="text-2xl font-black text-indigo-900 tabular-nums mt-0.5">
                  {ov.todayCount ?? 0}
                </p>
                <p className="text-[10px] text-indigo-600/80 mt-1 font-semibold truncate">
                  {ov.yesterdayCount ?? 0} yesterday
                </p>
              </div>

              {/* In Progress */}
              <div
                onClick={() => router.push("/requests?status=pending")}
                className="p-3 bg-amber-50/70 hover:bg-amber-100/80 rounded-xl border border-amber-100/80 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Active
                </p>
                <p className="text-2xl font-black text-amber-900 tabular-nums mt-0.5">
                  {ov.pending ?? 0}
                </p>
                <p className="text-[10px] text-amber-700/80 mt-1 font-medium truncate">
                  Under processing
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">Monthly Inflow:</span>
            <span className="font-bold text-gray-900 flex items-center gap-1">
              {ov.thisMonth ?? 0} filed this month
              {growthBadge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    ov.monthGrowth >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-red-700 bg-red-50"
                  }`}
                >
                  {growthBadge}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* DOMAIN B: PUBLIC SERVICE DELIVERY & SLA COMPLIANCE */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Service Delivery & SLA
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    ARTA compliance & releases
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                SLA Track
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Approved */}
              <div
                onClick={() => router.push("/requests?status=approved")}
                className="p-3 bg-emerald-50/70 hover:bg-emerald-100/80 rounded-xl border border-emerald-100/80 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-emerald-700 uppercase">
                  Approved
                </p>
                <p className="text-2xl font-black text-emerald-900 tabular-nums mt-0.5">
                  {ov.approved ?? 0}
                </p>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold truncate">
                  Finalized seals
                </p>
              </div>

              {/* Released */}
              <div
                onClick={() => router.push("/requests?status=released")}
                className="p-3 bg-blue-50/70 hover:bg-blue-100/80 rounded-xl border border-blue-100/80 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-blue-700 uppercase">
                  Released
                </p>
                <p className="text-2xl font-black text-blue-900 tabular-nums mt-0.5">
                  {ov.released ?? 0}
                </p>
                <p className="text-[10px] text-blue-600 mt-1 font-semibold truncate">
                  Handed to citizen
                </p>
              </div>

              {/* Avg Turnaround */}
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100/80">
                <p className="text-[10px] font-bold text-teal-700 uppercase">
                  Avg Duration
                </p>
                <p className="text-2xl font-black text-teal-900 tabular-nums mt-0.5">
                  {ov.avgProcessingDays != null ? `${ov.avgProcessingDays}d` : "0d"}
                </p>
                <p className="text-[10px] text-teal-600 mt-1 font-semibold truncate">
                  ARTA Benchmark
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">Completion Rate:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {ov.completionRate ?? 0}% Citizen Satisfaction
            </span>
          </div>
        </div>

        {/* DOMAIN C: GOVERNANCE BACKLOG & ATTENTION ITEMS */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-rose-600" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Governance Attention
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Overdue backlog & rectifications
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (ov.overdueCount || 0) > 0
                    ? "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                {(ov.overdueCount || 0) > 0 ? "Action Required" : "Compliant"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Overdue */}
              <div
                onClick={() => router.push("/requests?overdue=true")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  (ov.overdueCount || 0) > 0
                    ? "bg-rose-50/90 border-rose-200 hover:bg-rose-100"
                    : "bg-gray-50/80 border-gray-100"
                }`}
              >
                <p className="text-[10px] font-bold text-rose-700 uppercase">
                  Overdue
                </p>
                <p className="text-2xl font-black text-rose-900 tabular-nums mt-0.5">
                  {ov.overdueCount ?? 0}
                </p>
                <p className="text-[10px] text-rose-600 mt-1 font-semibold truncate">
                  &gt;7 days pending
                </p>
              </div>

              {/* Returned */}
              <div
                onClick={() => router.push("/requests?status=returned")}
                className="p-3 bg-orange-50/70 hover:bg-orange-100/80 rounded-xl border border-orange-100/80 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-orange-700 uppercase">
                  Returned
                </p>
                <p className="text-2xl font-black text-orange-900 tabular-nums mt-0.5">
                  {ov.returned ?? 0}
                </p>
                <p className="text-[10px] text-orange-600 mt-1 font-semibold truncate">
                  Citizen req missing
                </p>
              </div>

              {/* Rejected */}
              <div
                onClick={() => router.push("/requests?status=rejected")}
                className="p-3 bg-gray-50/80 hover:bg-gray-100 rounded-xl border border-gray-100 cursor-pointer transition-all"
              >
                <p className="text-[10px] font-bold text-gray-600 uppercase">
                  Disapproved
                </p>
                <p className="text-2xl font-black text-gray-900 tabular-nums mt-0.5">
                  {ov.rejected ?? 0}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 font-medium truncate">
                  {ov.rejectionRate ?? 0}% denial rate
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">Return Rate:</span>
            <span className="font-bold text-orange-700">
              {ov.returnRate ?? 0}% Requires Citizen Follow-up
            </span>
          </div>
        </div>
      </div>

      {/* 4. OPERATIONAL COMMAND GRID: PIPELINE & INTAKE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: 7-DAY INTAKE VELOCITY & CATEGORY MIX */}
        <div className="lg:col-span-2 space-y-6">
          {/* 7-Day Activity Velocity Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  7-Day Public Service Intake & Output
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Daily comparison of citizen requests filed vs clearances certified
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-600" />
                  Total Intake
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  Certified / Approved
                </span>
              </div>
            </div>

            {/* Bar Visualizer */}
            <div className="h-48 flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-gray-100">
              {(data?.dailyTrend || []).map((d, i) => {
                const totalPct = Math.round((d.count / maxDaily) * 100);
                const approvedPct = Math.round(((d.approved || 0) / maxDaily) * 100);
                const isToday = i === (data?.dailyTrend || []).length - 1;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-xl">
                      <p className="font-extrabold text-amber-300">{d.date}</p>
                      <p>{d.count} requests filed</p>
                      <p>{d.approved || 0} approved</p>
                    </div>

                    {/* Dual Bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      {/* Total Inflow Bar */}
                      <div
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isToday
                            ? "bg-blue-600 group-hover:bg-blue-700"
                            : "bg-blue-400/70 group-hover:bg-blue-600"
                        }`}
                        style={{
                          height: `${Math.max(totalPct, 6)}%`,
                        }}
                      />
                      {/* Approved Bar */}
                      <div
                        className="w-1/2 rounded-t-md bg-emerald-500/80 group-hover:bg-emerald-600 transition-all duration-300"
                        style={{
                          height: `${Math.max(approvedPct, 6)}%`,
                        }}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-bold mt-2 uppercase ${
                        isToday ? "text-blue-700 font-black" : "text-gray-400"
                      }`}
                    >
                      {isToday ? "Today" : d.date.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium">
                Peak Daily Volume:{" "}
                <strong className="text-gray-900">{maxDaily} applications</strong>
              </span>
              <button
                onClick={() => router.push("/reports")}
                className="text-xs font-bold text-[#03254c] hover:underline flex items-center gap-1"
              >
                View Detailed Census Reports <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Certificate & Permit Category Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Civil Registry & Certificate Issuance Mix
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Breakdown by document classification and requested volume
                </p>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {(data?.byType || []).length} Document Services
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {(data?.byType || []).map((t, i) => {
                const pct = Math.round((t.count / maxType) * 100);
                const sharePct = Math.round(
                  (t.count / (ov.totalRequests || 1)) * 100
                );
                return (
                  <div
                    key={i}
                    onClick={() => router.push(`/requests?certificateType=${t.type}`)}
                    className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
                      <span className="truncate pr-2">
                        {TYPE_LABELS[t.type] || t.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[10px] font-semibold">
                          {sharePct}%
                        </span>
                        <span className="text-gray-900 tabular-nums font-black bg-gray-100 px-2 py-0.5 rounded-md">
                          {t.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.byType || []).length === 0 && (
                <div className="col-span-2 text-center py-8 text-xs text-gray-400">
                  No certificate records found for selected period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 1 COL: ARTA WORKFLOW PIPELINE & ACTIONABLE OVERDUE QUEUE */}
        <div className="space-y-6">
          {/* ARTA Citizen's Charter Workflow Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-amber-500" />
                ARTA Workflow Stages
              </h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                {ov.pending || 0} In Progress
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-5">
              Active bottlenecks across administrative processing steps
            </p>

            <div className="space-y-4">
              {(data?.byStep || []).slice(0, 6).map((s, i) => {
                const pct = Math.round((s.count / (ov.pending || 1)) * 100);
                return (
                  <div key={i} className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="truncate pr-2">{s.step}</span>
                      <span className="text-amber-700 font-black tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.byStep || []).length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 font-semibold">
                    Workflow Clear
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Zero active administrative bottlenecks
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actionable Overdue Backlog Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Urgent Action Queue
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (ov.overdueCount || 0) > 0
                    ? "bg-rose-100 text-rose-700 font-black"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {ov.overdueCount || 0} Overdue
              </span>
            </div>

            <div className="space-y-3">
              {(data?.overdueRequests || []).slice(0, 4).map((r, i) => (
                <div
                  key={i}
                  onClick={() => router.push("/requests")}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/90 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-gray-900 truncate">
                      {r.applicantName || "Unknown Applicant"}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {TYPE_LABELS[r.certificateType] || r.certificateType} • {r.referenceNumber}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
                      +{r.daysOverdue}d Late
                    </span>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 group-hover:text-rose-600 flex items-center justify-end gap-0.5">
                      Expedite <ChevronRight className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </div>
              ))}

              {(data?.overdueRequests || []).length === 0 && (
                <div className="text-center py-6">
                  <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-600 font-bold">
                    Zero SLA Breaches
                  </p>
                  <p className="text-[10px] text-gray-400">
                    All citizen requests within standard turnaround time
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Duty Staff Productivity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Duty Staff Output
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Ranked By Completions
              </span>
            </div>

            <div className="space-y-3">
              {(data?.topStaff || []).slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      i === 0
                        ? "bg-amber-100 text-amber-800"
                        : i === 1
                        ? "bg-gray-200 text-gray-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {s.userId?.substring(0, 8) || `Officer ${i + 1}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${
                              (s.completed /
                                Math.max(
                                  ...(data?.topStaff || []).map(
                                    (t) => t.completed
                                  ),
                                  1
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 tabular-nums">
                        {s.completed} certified
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-gray-600 tabular-nums">
                      {s.avgHours}h
                    </p>
                    <p className="text-[8px] text-gray-400 uppercase">avg SLA</p>
                  </div>
                </div>
              ))}
              {(data?.topStaff || []).length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                  No duty officer completions recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. LIVE CITIZEN TRANSACTIONS & CIVIL REGISTRY AUDIT LEDGER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-700" />
              Live Citizen Document Transactions
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Real-time audit ledger of recent barangay certificate applications
            </p>
          </div>
          <button
            onClick={() => router.push("/requests")}
            className="text-xs font-bold text-[#03254c] hover:underline flex items-center gap-1 self-start sm:self-auto bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200"
          >
            <span>View Master Certificate Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Reference Code</th>
                <th className="pb-3 px-4">Applicant Name</th>
                <th className="pb-3 px-4">Document Type</th>
                <th className="pb-3 px-4">Workflow Step</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Date Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {(data?.recent || []).slice(0, 8).map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] || {
                  label: r.status,
                  badgeClass: "text-gray-600 bg-gray-100",
                  dotClass: "bg-gray-400",
                };
                return (
                  <tr
                    key={i}
                    onClick={() => router.push("/requests")}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#03254c] group-hover:text-blue-700">
                      {r.referenceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {r.applicantName || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {TYPE_LABELS[r.certificateType] || r.certificateType}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-semibold text-[11px]">
                      {r.currentStep || "Processing"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${cfg.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`}
                        />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right font-medium text-gray-400 text-[11px] whitespace-nowrap">
                      {formatPSTDate(r.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {(data?.recent || []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-xs text-gray-400 font-medium"
                  >
                    No recent certificate interactions recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. LGU CLOUD INFRASTRUCTURE & MUNICIPAL CAPACITY (Relocated & Restyled) */}
      {subData && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#03254c]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  LGU Cloud Infrastructure
                </span>
                <p className="text-base font-black text-gray-900">
                  {subData.planName || "Standard LGU Tier"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  DILG ARTA e-Services • 256-Bit SSL Encrypted
                </p>
              </div>
            </div>

            {/* Quota Gauges */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:px-8 lg:border-x border-gray-100">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500">
                    <Activity className="w-3 h-3 text-blue-600" /> Monthly Transaction Limit
                  </span>
                  <span className="text-gray-900 font-black tabular-nums">
                    {subData.requests?.used ?? 0} /{" "}
                    {subData.requests?.isUnlimited ? "∞" : subData.requests?.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#03254c] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        subData.requests?.isUnlimited
                          ? 100
                          : Math.min(
                              100,
                              ((subData.requests?.used || 0) /
                                (subData.requests?.total || 1)) *
                                100
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500">
                    <Users className="w-3 h-3 text-indigo-600" /> Authorized Staff Seats
                  </span>
                  <span className="text-gray-900 font-black tabular-nums">
                    {subData.staff?.used ?? 0} /{" "}
                    {subData.staff?.isUnlimited ? "∞" : subData.staff?.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        subData.staff?.isUnlimited
                          ? 100
                          : Math.min(
                              100,
                              ((subData.staff?.used || 0) /
                                (subData.staff?.total || 1)) *
                                100
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <button
                onClick={() => router.push("/pricing")}
                className="w-full lg:w-auto px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Manage LGU Tier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Dashboard.getLayout = (page) => (
  <Layout
    title="Executive Command Center"
    subtitle="Barangay e-Governance & Public Service Overview"
  >
    {page}
  </Layout>
);

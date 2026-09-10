import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Shield,
  ShieldCheck,
  LayoutGrid,
  List,
  MapPin,
  QrCode,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "@/components/UI/BarangayIDCard";
import IssueIDModal from "@/components/Modals/IssueIDModal";
import PrintIDModal from "@/components/Modals/PrintIDModal";
import ViewBarangayIDModal from "@/components/Modals/ViewBarangayIDModal";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal";
import Pagination from "@/components/UI/Pagination";

const PUROK_LIST = [
  "All Puroks",
  "Purok 1",
  "Purok 2",
  "Purok 3",
  "Purok 4",
  "Purok 5",
  "Purok 6",
  "Purok 7",
];

export default function IDManagement() {
  const router = useRouter();
  const [ids, setIds] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0,
    expiringSoon: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purokFilter, setPurokFilter] = useState("All Puroks");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [viewCardModal, setViewCardModal] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch IDs
  const fetchIDs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "24",
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/barangay-id?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIds(json.data || []);
          setStats(
            json.stats || {
              total: 0,
              active: 0,
              expired: 0,
              revoked: 0,
              expiringSoon: 0,
            }
          );
          setTotalPages(json.totalPages || 1);
          setTotalCount(json.total || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Barangay IDs:", error);
      toast.error("Failed to load Barangay IDs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIDs();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchIDs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered IDs by Purok
  const filteredIDs = useMemo(() => {
    if (purokFilter === "All Puroks") return ids;
    return ids.filter(
      (item) =>
        item.purok?.toLowerCase() === purokFilter.toLowerCase() ||
        item.address?.toLowerCase().includes(purokFilter.toLowerCase())
    );
  }, [ids, purokFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (ids.length === 0) {
      toast.error("No ID records to export");
      return;
    }

    const headers = [
      "Barangay ID No",
      "Full Legal Name",
      "Gender",
      "Civil Status",
      "Date of Birth",
      "Purok",
      "Address",
      "Contact Number",
      "Issue Date",
      "Expiry Date",
      "Status",
    ];

    const rows = ids.map((c) => [
      `"${c.id_number || ""}"`,
      `"${c.full_name || ""}"`,
      `"${c.gender || ""}"`,
      `"${c.civil_status || ""}"`,
      `"${c.birth_date || ""}"`,
      `"${c.purok || ""}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${c.contact_number || ""}"`,
      `"${c.issue_date || ""}"`,
      `"${c.expiry_date || ""}"`,
      `"${c.status || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Barangay_IDs_Ledger_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Barangay ID Ledger exported successfully!");
  };

  // Handle Renew
  const handleRenew = async (card) => {
    if (!confirm(`Renew Barangay ID for ${card.full_name} for another 1 year?`))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/barangay-id/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "renew", validity_years: 1 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "ID renewed successfully!");
        fetchIDs();
      } else {
        toast.error(json.message || "Failed to renew ID");
      }
    } catch (err) {
      toast.error("Renewal failed");
    }
  };

  // Handle Revoke
  const handleRevoke = async (card) => {
    const reason = prompt(
      `Reason for revoking Barangay ID of ${card.full_name}:`,
      "Card lost / Resident relocated"
    );
    if (!reason) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/barangay-id/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "revoke", remarks: reason }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Barangay ID revoked.");
        fetchIDs();
      } else {
        toast.error(json.message || "Failed to revoke ID");
      }
    } catch (err) {
      toast.error("Revocation failed");
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!idToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/barangay-id/${idToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Barangay ID record deleted.");
        setIdToDelete(null);
        fetchIDs();
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status, expiry_date) => {
    const isExpired = expiry_date && new Date(expiry_date) < new Date();
    if (status === "revoked") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <Ban className="w-3 h-3 text-rose-600" /> Revoked
        </span>
      );
    }
    if (status === "expired" || isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active
      </span>
    );
  };

  return (
    <Layout
      title="Barangay ID Management"
      subtitle="OFFICIAL CITIZEN IDENTIFICATION REGISTRY & PVC CARD ISSUANCE"
    >
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-28 sm:pb-10">
        {/* Official Republic Banner Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#021b38] via-[#03254c] to-[#0d3b66] p-4 sm:p-8 text-white shadow-xl border border-blue-900/40">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
              backgroundSize: "100px 100px",
            }}
          />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-[9px] sm:text-xs font-black uppercase tracking-widest">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                Republic of the Philippines • Official Citizen Registry
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase">
                Barangay Citizen Identification System
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-blue-100/80 font-medium max-w-2xl leading-relaxed">
                Centralized biometric & credential registry. Issuing authorized,
                high-security CR80 PVC Barangay IDs with anti-tamper QR code
                validation exclusively for registered master census residents.
              </p>

              {/* Official Badges (Desktop/Tablet) */}
              <div className="hidden sm:flex flex-wrap items-center gap-2.5 pt-1 text-[11px] font-bold text-blue-200">
                <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Master Census Verified
                </span>
                <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                  <QrCode className="w-3.5 h-3.5 text-cyan-300" /> 2D Dynamic QR Verification
                </span>
                <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                  <CreditCard className="w-3.5 h-3.5 text-amber-300" /> CR80 Dual-Sided PVC Print
                </span>
              </div>
            </div>

            {/* Quick Master Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                title="Export Official ID Registry Ledger (CSV)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                <span className="whitespace-nowrap">Export</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/qr-scan-history")}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                title="Scan and Verify Barangay ID QR"
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
                <span className="whitespace-nowrap">Scan QR</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="flex-[2] sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-[11px] sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[3]" />
                <span className="whitespace-nowrap">+ Issue ID</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Stat KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Total Issued */}
          <div
            onClick={() => setStatusFilter("all")}
            className={`p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
              statusFilter === "all"
                ? "border-[#03254c] ring-2 ring-[#03254c]/15"
                : "border-gray-100 hover:border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider truncate">
                Total Issued
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 text-[#03254c] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-gray-900 mt-1 sm:mt-2">
              {stats.total.toLocaleString()}
            </h3>
            <div className="mt-1 sm:mt-2 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-gray-500 truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
              Official Registry
            </div>
          </div>

          {/* Active Valid */}
          <div
            onClick={() => setStatusFilter("active")}
            className={`p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
              statusFilter === "active"
                ? "border-emerald-600 ring-2 ring-emerald-600/15"
                : "border-gray-100 hover:border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider truncate">
                Active Valid
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-emerald-600 mt-1 sm:mt-2">
              {stats.active.toLocaleString()}
            </h3>
            <div className="mt-1 sm:mt-2 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% active`
                : "100% active"}
            </div>
          </div>

          {/* Expiring Soon */}
          <div
            onClick={() => setStatusFilter("expired")}
            className={`p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
              statusFilter === "expired"
                ? "border-amber-500 ring-2 ring-amber-500/15"
                : "border-gray-100 hover:border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider truncate">
                Expiring (30D)
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-amber-600 mt-1 sm:mt-2">
              {stats.expiringSoon.toLocaleString()}
            </h3>
            <div className="mt-1 sm:mt-2 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-700 truncate">
              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
              Due for Renewal
            </div>
          </div>

          {/* Revoked / Lost */}
          <div
            onClick={() => setStatusFilter("revoked")}
            className={`p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
              statusFilter === "revoked"
                ? "border-rose-600 ring-2 ring-rose-600/15"
                : "border-gray-100 hover:border-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider truncate">
                Revoked / Lost
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-rose-600 mt-1 sm:mt-2">
              {stats.revoked.toLocaleString()}
            </h3>
            <div className="mt-1 sm:mt-2 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-rose-600 truncate">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
              Voided Cards
            </div>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search citizen name, ID number, or street..."
                className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-gray-50/80 border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white transition-all shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sub-row on Mobile for Purok and Views */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Purok Selector */}
              <div className="flex-1 lg:w-48">
                <select
                  value={purokFilter}
                  onChange={(e) => setPurokFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50/80 border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white cursor-pointer"
                >
                  {PUROK_LIST.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl sm:rounded-2xl border border-gray-200 text-xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#03254c] shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-900 font-bold"
                  }`}
                  title="Digital PVC Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-[#03254c] shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-900 font-bold"
                  }`}
                  title="Official Ledger Table View"
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Ledger</span>
                </button>
              </div>

              {/* + Issue ID Button (Desktop/Tablet) */}
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="hidden sm:flex px-5 py-3 bg-[#03254c] hover:bg-[#021b37] text-white text-xs sm:text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Issue ID</span>
              </button>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 sm:pt-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
              {[
                { id: "all", label: "All Records", count: stats.total },
                { id: "active", label: "Active", count: stats.active },
                { id: "expired", label: "Expired", count: stats.expired },
                { id: "revoked", label: "Revoked", count: stats.revoked },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[#03254c] text-white shadow-xs"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      statusFilter === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400">
              Showing {filteredIDs.length} of {totalCount} records
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="p-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-[#03254c] rounded-full mx-auto" />
            <p className="text-xs font-black text-gray-600 uppercase tracking-widest">
              Connecting to Barangay ID Master Ledger...
            </p>
          </div>
        ) : filteredIDs.length === 0 ? (
          /* Government Standard Empty State with Issuance Steps */
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 sm:p-14 text-center overflow-hidden relative">
            <div className="max-w-xl mx-auto space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#03254c] flex items-center justify-center mx-auto shadow-inner border border-blue-100">
                <CreditCard className="w-10 h-10 text-blue-700" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {search
                    ? "No Matching Barangay IDs Found"
                    : "Barangay ID Issuance Station Ready"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {search
                    ? `No ID card records match "${search}". Try searching with another name or ID number.`
                    : "No Barangay IDs have been issued yet. The system is calibrated and connected to the Master Census to issue official citizen ID cards."}
                </p>
              </div>

              {/* 3-Step Guided Workflow */}
              {!search && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-black text-[#03254c] bg-blue-100/70 px-2 py-0.5 rounded uppercase">
                      Step 1
                    </span>
                    <h5 className="text-xs font-black text-gray-900 mt-1">
                      Census Lookup
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Search and verify registered resident from master census records.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-black text-[#03254c] bg-blue-100/70 px-2 py-0.5 rounded uppercase">
                      Step 2
                    </span>
                    <h5 className="text-xs font-black text-gray-900 mt-1">
                      Live Preview
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Instantly inspect the front and back official EC Card layout.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-black text-[#03254c] bg-blue-100/70 px-2 py-0.5 rounded uppercase">
                      Step 3
                    </span>
                    <h5 className="text-xs font-black text-gray-900 mt-1">
                      Print PVC Card
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Generate dual-sided CR80 PVC card with unique barcode and QR.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(true)}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#03254c] via-[#043b78] to-blue-700 hover:from-[#021b37] hover:to-blue-800 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Issue New Barangay ID</span>
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW: Official Visual Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIDs.map((card) => (
              <div
                key={card.id}
                onClick={() => setViewCardModal(card)}
                className="bg-white rounded-3xl border border-gray-200/90 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between group p-5 space-y-4 cursor-pointer relative"
              >
                {/* Header Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-mono font-black text-[#03254c] bg-blue-50/90 group-hover:bg-blue-100 group-hover:text-blue-900 px-3 py-1 rounded-lg border border-blue-200/80 transition-all shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>{card.id_number}</span>
                      <ExternalLink className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <div>
                      {getStatusBadge(card.status, card.expiry_date)}
                    </div>
                  </div>

                  <div>
                    <h4
                      className="text-base font-black text-gray-900 group-hover:text-[#03254c] uppercase truncate transition-colors"
                    >
                      {card.full_name}
                    </h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      {card.gender || "RESIDENT"} • DOB: {card.birth_date || card.date_of_birth || card.birthday || card.resident?.date_of_birth || "N/A"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 truncate flex items-center gap-1.5 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {card.purok ? `${card.purok}, ` : ""}
                    {card.address}
                  </p>
                </div>

                {/* Details Matrix */}
                <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-slate-50 group-hover:bg-blue-50/40 rounded-2xl border border-gray-100 text-[11px] transition-colors">
                  <div>
                    <span className="text-gray-400 font-bold block text-[9px] uppercase">
                      Issued
                    </span>
                    <span className="font-bold text-gray-700 truncate block">
                      {card.issue_date}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block text-[9px] uppercase">
                      Expires
                    </span>
                    <span className="font-bold text-emerald-700 truncate block">
                      {card.expiry_date}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div
                  className="flex items-center gap-2 pt-2 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCard(card);
                      setShowPrintModal(true);
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#03254c] hover:bg-[#021b37] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-200" />
                    <span>Print PVC Card</span>
                  </button>

                  {card.status === "active" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenew(card);
                      }}
                      className="p-2.5 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-xl transition-colors border border-gray-200/60 cursor-pointer"
                      title="Renew ID (Extend 1 Year)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  ) : null}

                  {card.status === "active" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevoke(card);
                      }}
                      className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-colors border border-gray-200/60 cursor-pointer"
                      title="Revoke / Report Lost"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdToDelete(card);
                    }}
                    className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-colors border border-gray-200/60 cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW: Official Government Ledger */
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#03254c] text-white uppercase tracking-wider font-black text-[10px]">
                  <tr>
                    <th className="py-4 px-4">Barangay ID No</th>
                    <th className="py-4 px-4">Citizen Legal Name</th>
                    <th className="py-4 px-4">Purok / Address</th>
                    <th className="py-4 px-4">Date Issued</th>
                    <th className="py-4 px-4">Valid Until</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIDs.map((card) => (
                    <tr
                      key={card.id}
                      onClick={() => setViewCardModal(card)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-[#03254c] bg-blue-50 group-hover:bg-blue-100 group-hover:text-blue-900 px-2.5 py-1 rounded-md border border-blue-200/80 transition-all inline-flex items-center gap-1">
                          <span>{card.id_number}</span>
                          <ExternalLink className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-gray-900 group-hover:text-[#03254c] uppercase transition-colors">
                          {card.full_name}
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {card.gender || "RESIDENT"} • DOB: {card.birth_date || card.date_of_birth || card.birthday || card.resident?.date_of_birth || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium max-w-xs truncate">
                        <span className="font-bold text-[#03254c]">
                          {card.purok ? `${card.purok}, ` : ""}
                        </span>
                        {card.address}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-semibold">
                        {card.issue_date}
                      </td>
                      <td className="py-4 px-4 text-gray-800 font-bold">
                        {card.expiry_date}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(card.status, card.expiry_date)}
                      </td>
                      <td
                        className="py-4 px-4 text-right space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewCardModal(card);
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl transition-colors inline-flex items-center gap-1 font-bold cursor-pointer"
                          title="View Official Dossier"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#03254c]" />
                          <span className="text-[11px]">View</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCard(card);
                            setShowPrintModal(true);
                          }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-[#03254c] rounded-xl transition-colors inline-flex items-center gap-1 font-black cursor-pointer"
                          title="Print PVC Card"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-700" />
                          <span className="text-[11px]">Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenew(card);
                          }}
                          className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                          title="Renew ID"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIdToDelete(card);
                          }}
                          className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* View Full Barangay ID Record Modal */}
      {viewCardModal && (
        <ViewBarangayIDModal
          isOpen={Boolean(viewCardModal)}
          onClose={() => setViewCardModal(null)}
          card={viewCardModal}
          onPrint={(c) => {
            setSelectedCard(c);
            setShowPrintModal(true);
          }}
          onRenew={handleRenew}
          onRevoke={handleRevoke}
        />
      )}

      {/* Issue ID Modal */}
      {showIssueModal && (
        <IssueIDModal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => fetchIDs()}
        />
      )}

      {/* Print ID Modal */}
      {showPrintModal && (
        <PrintIDModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedCard(null);
          }}
          idData={selectedCard}
        />
      )}

      {/* Delete Confirmation Modal */}
      {idToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(idToDelete)}
          onClose={() => setIdToDelete(null)}
          onCancel={() => setIdToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Barangay ID Record"
          message={`Are you sure you want to delete the Barangay ID record for ${idToDelete?.full_name}? This action cannot be undone.`}
          isLoading={isDeleting}
        />
      )}
    </Layout>
  );
}

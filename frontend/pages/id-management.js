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
  CheckCircle2,
  Ban,
  Shield,
  ShieldCheck,
  LayoutGrid,
  List,
  QrCode,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import BarangayIDCard from "@/components/UI/BarangayIDCard";
import IssueIDModal from "@/components/Modals/IssueIDModal";
import PrintIDModal from "@/components/Modals/PrintIDModal";
import ViewBarangayIDModal from "@/components/Modals/ViewBarangayIDModal";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal";
import QRScannerModal from "@/components/Modals/QRScannerModal";
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
    revoked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printedFilter, setPrintedFilter] = useState(""); // '' | 'printed' | 'not_printed'
  const [purokFilter, setPurokFilter] = useState("All Puroks");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [viewCardModal, setViewCardModal] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [idToDelete, setIdToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Fetch IDs
  const fetchIDs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "48",
        search: search.trim(),
        status: statusFilter,
        printed_status: printedFilter,
        purok: purokFilter !== "All Puroks" ? purokFilter : "",
      });

      const res = await fetch(`/api/barangay-id?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIds(json.data || []);
          setStats({
            total: 0,
            active: 0,
            revoked: 0,
            householdHead: 0,
            familyMember: 0,
            printed: 0,
            notPrinted: 0,
            ...(json.stats || {}),
          });
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
  }, [page, statusFilter, printedFilter, purokFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchIDs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered IDs by Purok (purok is filtered on server, so filteredIDs matches ids)
  const filteredIDs = useMemo(() => {
    return ids;
  }, [ids]);

  // Export ALL matching records to Excel
  const handleExportExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);
    const toastId = toast.loading("Preparing all ID records for export...");

    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        search: search.trim(),
        status: statusFilter,
        printed_status: printedFilter,
        purok: purokFilter !== "All Puroks" ? purokFilter : "",
      });

      const res = await fetch(`/api/barangay-id/export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch export data from server");
      }

      const json = await res.json();
      if (!json.success || !json.data || json.data.length === 0) {
        toast.error("No ID records found to export", { id: toastId });
        return;
      }

      const exportRows = json.data.map((c) => {
        // FIRST_MI - first name + middle initial
        let firstMi = "";
        if (c.first_name) {
          const middleInitial = c.middle_name ? `${c.middle_name.trim().charAt(0)}.` : "";
          firstMi = `${c.first_name.trim()} ${middleInitial}`.trim();
        } else if (c.full_name) {
          firstMi = c.full_name;
        }

        return {
          "FIRST_MI": firstMi,
          "LAST_NAME": c.last_name || "",
          "ADDRESS": c.address || "",
          "EC CARD_NUMBER": c.id_number || "",
          "EC CARD_NUMBER_QR_CODE": c.id_number || "", // Same as ID number for QR generation
          "PRINTED": c.is_printed ? "PRINTED" : "NOT PRINTED",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Barangay IDs");

      const dateStr = new Date().toISOString().split("T")[0];
      const filterSuffix = statusFilter !== "all" ? `_${statusFilter}` : "";
      XLSX.writeFile(workbook, `Barangay_IDs_Export${filterSuffix}_${dateStr}.xlsx`);

      toast.success(`Successfully exported all ${exportRows.length.toLocaleString()} Barangay ID records!`, { id: toastId });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Barangay IDs", { id: toastId });
    } finally {
      setIsExporting(false);
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

  // Toggle Printed Status
  const handleTogglePrintStatus = async (card) => {
    const newStatus = !card.is_printed;
    if (!confirm(`Manually mark this ID as ${newStatus ? "PRINTED" : "NOT PRINTED"}?`)) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/barangay-id/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "toggle_print", is_printed: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`ID marked as ${newStatus ? "Printed" : "Not Printed"}`);
        fetchIDs();
      } else {
        toast.error(json.message || "Failed to update print status");
      }
    } catch (err) {
      toast.error("Failed to update print status");
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

  const getGridCardAttention = (card) => {
    if (card.status === "revoked") {
      return (
        <span className="text-[9px] font-semibold text-rose-600 uppercase shrink-0">
          Revoked
        </span>
      );
    }
    if (!card.is_printed) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePrintStatus(card);
          }}
          className="text-[9px] font-semibold text-amber-700 hover:text-amber-800 uppercase shrink-0 cursor-pointer"
          title="Mark as printed"
        >
          Not printed
        </button>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    if (status === "revoked") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
          <Ban className="w-2.5 h-2.5 text-rose-600" /> Revoked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Active
      </span>
    );
  };

  return (
    <Layout
      title="EC Card"
      subtitle="Official citizen ID registry & PVC issuance"
      mainClassName="p-2 sm:p-4 pb-24 lg:pb-4"
    >
      <div className="space-y-2.5 max-w-[1600px] mx-auto pb-20 sm:pb-6 text-[13px]">
        {/* Official Republic Banner Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#021b38] via-[#03254c] to-[#0d3b66] p-3 sm:p-4 text-white shadow-md border border-blue-900/40">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
              backgroundSize: "100px 100px",
            }}
          />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="inline-flex items-center gap-1 px-2 py-px rounded-full bg-white/10 border border-white/15 text-amber-300 text-[8px] font-bold uppercase tracking-wide">
                <Shield className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span className="truncate">Official citizen registry</span>
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                EC Card
              </h1>
              <p className="hidden xl:block text-[10px] text-blue-100/75 max-w-xl leading-snug line-clamp-1">
                CR80 PVC IDs with QR validation for master census residents.
              </p>
            </div>

            {/* Quick Master Actions */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-md backdrop-blur-md border border-emerald-500/50 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                title="Scan Printed ID to update status"
              >
                <QrCode className="w-3 h-3 text-emerald-300 shrink-0" />
                <span className="whitespace-nowrap">Scan ID</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-md backdrop-blur-md border border-white/20 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                title="Export Official ID Registry Ledger (Excel)"
              >
                {isExporting ? (
                  <RefreshCw className="w-3 h-3 text-emerald-300 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-3 h-3 text-emerald-300 shrink-0" />
                )}
                <span className="whitespace-nowrap">{isExporting ? "…" : "Export"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="flex-[2] sm:flex-none px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-slate-950 stroke-[3] shrink-0" />
                <span className="whitespace-nowrap">Issue ID</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Stat KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Total Issued */}
          <div
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-2.5 bg-white rounded-lg border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
              statusFilter === "all"
                ? "border-[#03254c] ring-2 ring-[#03254c]/15"
                : "border-gray-100 hover:border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">
                Total Issued
              </span>
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#03254c] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-0.5 tabular-nums">
              {(stats.total ?? 0).toLocaleString()}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-gray-500 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
              Official Registry
            </div>
          </div>

          {/* Active Valid */}
          <div
            onClick={() => {
              setStatusFilter("active");
              setPage(1);
            }}
            className={`p-2.5 bg-white rounded-lg border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
              statusFilter === "active"
                ? "border-emerald-600 ring-2 ring-emerald-600/15"
                : "border-gray-100 hover:border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">
                Active Valid
              </span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-lg font-black text-emerald-600 mt-0.5 tabular-nums">
              {(stats.active ?? 0).toLocaleString()}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-700 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              {(stats.total ?? 0) > 0
                ? `${Math.round(((stats.active ?? 0) / stats.total) * 100)}% active`
                : "100% active"}
            </div>
          </div>

          {/* Revoked / Lost */}
          <div
            onClick={() => {
              setStatusFilter("revoked");
              setPage(1);
            }}
            className={`p-2.5 bg-white rounded-lg border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
              statusFilter === "revoked"
                ? "border-rose-600 ring-2 ring-rose-600/15"
                : "border-gray-100 hover:border-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">
                Revoked / Lost
              </span>
              <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Ban className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-lg font-black text-rose-600 mt-0.5 tabular-nums">
              {(stats.revoked ?? 0).toLocaleString()}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-rose-600 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
              Voided Cards
            </div>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm space-y-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, EC number, street..."
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50/80 border border-gray-200 rounded-md text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#03254c] focus:bg-white transition-all"
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
            <div className="flex items-center gap-1.5">
              {/* Purok Selector */}
              <div className="flex-1 lg:w-40">
                <select
                  value={purokFilter}
                  onChange={(e) => {
                    setPurokFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-gray-50/80 border border-gray-200 rounded-md text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#03254c] focus:bg-white cursor-pointer"
                >
                  {PUROK_LIST.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200 text-[10px] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#03254c] shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-900 font-bold"
                  }`}
                  title="Digital PVC Card Grid View"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-[#03254c] shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-900 font-bold"
                  }`}
                  title="Official Ledger Table View"
                >
                  <List className="w-3 h-3" />
                  <span className="hidden sm:inline">Ledger</span>
                </button>
              </div>

              {/* + Issue ID Button (Desktop/Tablet) */}
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="hidden sm:flex px-2.5 py-1.5 bg-[#03254c] hover:bg-[#021b37] text-white text-[11px] font-bold rounded-md shadow-sm transition-all items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Issue ID</span>
              </button>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 flex-wrap gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none w-full sm:w-auto">
              {[
                { id: "all", label: "All Records", count: stats.total ?? 0 },
                { id: "household", label: "Household Head", count: stats.householdHead || 0 },
                { id: "family", label: "Family Member", count: stats.familyMember || 0 },
                { id: "active", label: "Active", count: stats.active ?? 0 },
                { id: "revoked", label: "Revoked", count: stats.revoked ?? 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[#03254c] text-white shadow-xs"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1 py-px rounded text-[9px] tabular-nums ${
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

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none w-full sm:w-auto sm:border-l border-gray-100 sm:pl-2">
              {[
                { id: "", label: "All Print Status", count: stats.total ?? 0 },
                { id: "printed", label: "Printed", count: stats.printed || 0 },
                { id: "not_printed", label: "Not Printed", count: stats.notPrinted || 0 },
              ].map((tab) => (
                <button
                  key={`print-${tab.id}`}
                  type="button"
                  onClick={() => {
                    setPrintedFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    printedFilter === tab.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1 py-px rounded text-[9px] tabular-nums ${
                      printedFilter === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[10px] font-semibold text-gray-400 w-full sm:w-auto text-right tabular-nums">
              {filteredIDs.length} / {totalCount.toLocaleString()}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {filteredIDs.map((card) => (
              <div
                key={card.id}
                onClick={() => setViewCardModal(card)}
                className="group bg-white rounded-lg border border-gray-200 hover:border-[#03254c]/25 hover:bg-slate-50/80 transition-colors cursor-pointer min-w-0 p-2 flex flex-col"
              >
                <div className="flex items-baseline justify-between gap-2 min-w-0">
                  <p className="text-[10px] font-mono font-semibold text-[#03254c] truncate min-w-0">
                    {card.id_number}
                  </p>
                  {getGridCardAttention(card)}
                </div>

                <h4 className="mt-0.5 text-[11px] font-bold text-gray-900 group-hover:text-[#03254c] uppercase truncate leading-snug">
                  {card.full_name}
                </h4>

                <p className="mt-0.5 text-[10px] text-gray-500 line-clamp-2 leading-snug">
                  {card.address}
                </p>

                {card.issue_date && (
                  <p className="mt-1 text-[9px] text-gray-400 tabular-nums">
                    Issued {card.issue_date}
                  </p>
                )}

                <div
                  className="mt-1.5 flex items-center justify-end gap-0.5 text-gray-300 group-hover:text-gray-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCard(card);
                      setShowPrintModal(true);
                    }}
                    className="p-1 rounded hover:bg-blue-50 hover:text-[#03254c] cursor-pointer"
                    title="Print PVC card"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  {card.status === "active" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevoke(card);
                      }}
                      className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      title="Revoke"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdToDelete(card);
                    }}
                    className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW: Official Government Ledger */
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wide font-bold text-[9px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 whitespace-nowrap">EC No.</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Name</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Address</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Issued</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Status</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Print</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-700">
                  {filteredIDs.map((card) => (
                    <tr
                      key={card.id}
                      onClick={() => setViewCardModal(card)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-1.5 px-2.5">
                        <span className="font-mono font-bold text-[#03254c] bg-slate-100 group-hover:bg-blue-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 text-[10px] border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{card.id_number}</span>
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 max-w-[140px]">
                        <div className="font-bold text-slate-900 group-hover:text-[#03254c] uppercase truncate text-[10px]">
                          {card.full_name}
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium uppercase truncate block">
                          {card.gender || "—"} • {card.birth_date || card.date_of_birth || card.birthday || card.resident?.date_of_birth || "—"}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-600 max-w-[180px] truncate text-[10px]">
                        {card.address}
                      </td>
                      <td className="py-1.5 px-2.5 text-[10px] text-slate-600 tabular-nums">
                        {card.issue_date || "—"}
                      </td>
                      <td className="py-1.5 px-2.5">
                        {getStatusBadge(card.status)}
                      </td>
                      <td className="py-1.5 px-2.5">
                        {card.is_printed ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePrintStatus(card);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors shadow-2xs"
                            title="Click to toggle print status"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PRINTED</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePrintStatus(card);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                            title="Click to toggle print status"
                          >
                            <Printer className="w-3 h-3 text-amber-600" />
                            <span>NOT PRINTED</span>
                          </button>
                        )}
                      </td>
                      <td
                        className="py-1.5 px-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewCardModal(card);
                            }}
                            className="px-1.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded transition-all inline-flex items-center gap-1 font-semibold cursor-pointer text-[10px]"
                            title="View"
                          >
                            <ShieldCheck className="w-3 h-3 text-[#03254c]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCard(card);
                              setShowPrintModal(true);
                            }}
                            className="px-1.5 py-1 bg-[#03254c] hover:bg-[#021b37] text-white rounded transition-all inline-flex items-center gap-1 font-semibold cursor-pointer text-[10px]"
                            title="Print"
                          >
                            <Printer className="w-3 h-3 text-blue-200" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIdToDelete(card);
                            }}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          <div className="flex justify-center pt-2">
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
          onRevoke={handleRevoke}
          onUpdate={(updatedCard) => {
            setViewCardModal(updatedCard);
            fetchIDs();
          }}
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
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

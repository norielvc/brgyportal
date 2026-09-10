import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  Printer,
  Eye,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Shield,
  LayoutGrid,
  List,
  Sparkles,
  Download,
  Calendar,
  User,
  MapPin,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "@/components/UI/BarangayIDCard";
import IssueIDModal from "@/components/Modals/IssueIDModal";
import PrintIDModal from "@/components/Modals/PrintIDModal";
import DeleteConfirmModal from "@/components/Modals/DeleteConfirmModal";
import Pagination from "@/components/UI/Pagination";

export default function IDManagement() {
  const router = useRouter();
  const [ids, setIds] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0, expiringSoon: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
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
          setStats(json.stats || { total: 0, active: 0, expired: 0, revoked: 0, expiringSoon: 0 });
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
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Renew
  const handleRenew = async (card) => {
    if (!confirm(`Renew Barangay ID for ${card.full_name} for another 1 year?`)) return;
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
        toast.success(json.message || "ID renewed!");
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
    const reason = prompt(`Reason for revoking Barangay ID of ${card.full_name}:`, "Card lost / Resident relocated");
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
          <Ban className="w-3 h-3" /> Revoked
        </span>
      );
    }
    if (status === "expired" || isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    );
  };

  return (
    <Layout
      title="Barangay ID Management"
      subtitle="OFFICIAL CITIZEN IDENTIFICATION REGISTRY & PVC CARD ISSUANCE"
    >
      <div className="space-y-6">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Total IDs Issued
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#03254c] flex items-center justify-center font-black">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Active Valid IDs
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {stats.active.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Expiring Soon (30d)
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {stats.expiringSoon.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Revoked / Lost
              </p>
              <h3 className="text-2xl font-black text-red-600 mt-1">
                {stats.revoked.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID number (e.g. BID-IBA), or purok..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white transition-all"
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === "grid" ? "bg-white text-[#03254c] shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === "table" ? "bg-white text-[#03254c] shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Table List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* + Issue ID Button */}
              <button
                onClick={() => setShowIssueModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#03254c] to-blue-700 hover:from-[#021b37] hover:to-blue-800 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Barangay ID</span>
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All IDs" },
              { id: "active", label: "Active" },
              { id: "expired", label: "Expired" },
              { id: "revoked", label: "Revoked" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#03254c] text-white shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-100">
            <div className="animate-spin w-8 h-8 border-3 border-gray-200 border-t-[#03254c] rounded-full mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Loading Barangay ID records...
            </p>
          </div>
        ) : ids.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-100">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-black text-gray-800">No Barangay IDs Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {search
                ? `No IDs match "${search}". Try searching with a different name or number.`
                : "No Barangay IDs have been issued yet. Click 'Issue Barangay ID' to create official ID cards for registered residents."}
            </p>
            <button
              onClick={() => setShowIssueModal(true)}
              className="mt-5 px-5 py-2.5 bg-[#03254c] text-white text-xs font-black rounded-xl hover:bg-blue-900 transition-all shadow"
            >
              + Issue First Barangay ID
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ids.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* ID Card Front Mini Preview */}
                <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-center overflow-hidden">
                  <BarangayIDCard
                    idData={card}
                    side="front"
                    scale={0.88}
                  />
                </div>

                {/* Card Meta & Actions */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-[#03254c] bg-blue-50 px-2 py-0.5 rounded-md">
                        {card.id_number}
                      </span>
                      {getStatusBadge(card.status, card.expiry_date)}
                    </div>
                    <h4 className="text-sm font-black text-gray-900 uppercase truncate">
                      {card.full_name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {card.purok || card.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Issued</span>
                      <span className="font-semibold">{card.issue_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Valid Until</span>
                      <span className="font-semibold">{card.expiry_date}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedCard(card);
                        setShowPrintModal(true);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#03254c] text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      Print Card
                    </button>

                    {card.status === "active" ? (
                      <button
                        onClick={() => handleRenew(card)}
                        className="p-2 hover:bg-gray-100 text-gray-600 hover:text-emerald-700 rounded-xl transition-colors"
                        title="Renew ID (Extend 1 Year)"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    ) : null}

                    {card.status === "active" ? (
                      <button
                        onClick={() => handleRevoke(card)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                        title="Revoke / Report Lost"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    ) : null}

                    <button
                      onClick={() => setIdToDelete(card)}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-black">
                  <tr>
                    <th className="py-3.5 px-4">Barangay ID No</th>
                    <th className="py-3.5 px-4">Resident Name</th>
                    <th className="py-3.5 px-4">Purok / Address</th>
                    <th className="py-3.5 px-4">Blood Type</th>
                    <th className="py-3.5 px-4">Valid Until</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ids.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#03254c]">
                        {card.id_number}
                      </td>
                      <td className="py-3.5 px-4 font-black text-gray-900 uppercase">
                        {card.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 truncate max-w-xs">
                        {card.purok || card.address}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-red-600">
                        {card.blood_type || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-semibold">
                        {card.expiry_date}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(card.status, card.expiry_date)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Print ID"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRenew(card)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          title="Renew ID"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIdToDelete(card)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="flex justify-center pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Issue ID Modal */}
      <IssueIDModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onSuccess={() => fetchIDs()}
      />

      {/* Print ID Modal */}
      <PrintIDModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedCard(null);
        }}
        idData={selectedCard}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(idToDelete)}
        onClose={() => setIdToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Barangay ID Record"
        message={`Are you sure you want to delete the Barangay ID record for ${idToDelete?.full_name}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </Layout>
  );
}

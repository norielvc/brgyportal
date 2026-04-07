import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuthToken } from "@/lib/auth";
import {
  Search,
  MapPin,
  User,
  Calendar,
  Phone,
  Filter,
  ArrowUpDown,
  Users as UsersIcon,
  Briefcase,
  Heart,
  Mail,
  Home,
  Shield,
  Plus,
  Trash2,
  Edit,
  Save,
  Skull,
  Activity,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import Pagination from "@/components/UI/Pagination";
import Modal from "@/components/UI/Modal";
import { getUserData } from "@/lib/auth";
import { debounce } from "@/lib/utils";

export default function Residents() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = "/api";

  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(30);

  // Modal state
  const [selectedResident, setSelectedResident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    suffix: "",
    age: "",
    gender: "MALE",
    civil_status: "SINGLE",
    date_of_birth: "",
    place_of_birth: "",
    residential_address: "",
    contact_number: "",
    pending_case: false,
    case_record_history: "",
    is_deceased: false,
    date_of_death: "",
    cause_of_death: "",
    covid_related: false,
    second_name: "",
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUserData();
    setCurrentUser(user);
  }, [router]);

  useEffect(() => {
    if (mounted && currentUser) {
      fetchResidents();
    }
  }, [mounted, currentUser, currentPage, searchTerm, limit]);

  const handleOpenAddModal = () => {
    setFormData({
      last_name: "",
      first_name: "",
      middle_name: "",
      suffix: "",
      age: "",
      gender: "MALE",
      civil_status: "SINGLE",
      date_of_birth: "",
      place_of_birth: "",
      residential_address: "",
      contact_number: "",
      pending_case: false,
      case_record_history: "",
      is_deceased: false,
      date_of_death: "",
      cause_of_death: "",
      covid_related: false,
      second_name: "",
      guardian_name: "",
      guardian_relationship: "",
    });
    setSelectedResident(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setFormData({ ...selectedResident });
    setIsModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean up data for database compatibility
      const cleanedData = { ...formData };

      // Convert empty date strings to null to avoid timestamp syntax errors
      if (cleanedData.date_of_birth === "") cleanedData.date_of_birth = null;
      if (cleanedData.date_of_death === "") cleanedData.date_of_death = null;

      // Ensure numeric fields are correctly typed
      if (cleanedData.age === "") {
        cleanedData.age = null;
      } else {
        cleanedData.age = parseInt(cleanedData.age);
      }

      const method = selectedResident ? "PUT" : "POST";
      const url = selectedResident
        ? `${API_URL}/residents/${selectedResident.id}`
        : `${API_URL}/residents`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          selectedResident ? "Resident updated!" : "Resident added!",
        );
        setIsFormModalOpen(false);
        fetchResidents();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResident = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/residents/${selectedResident.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Resident deleted");
        setIsDeleteConfirmOpen(false);
        setIsModalOpen(false);
        fetchResidents();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-xl h-10 w-10 border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-100"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            Loading System...
          </p>
        </div>
      </div>
    );
  }

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/residents/search?name=${encodeURIComponent(searchTerm || "")}&page=${currentPage}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );
      const data = await response.json();

      if (data.success) {
        setResidents(data.residents);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
        if (data.residents.length === 0) {
          toast.error(
            `No residents found for tenant: ${currentUser?.tenant_id}`,
          );
        }
      } else {
        toast.error(data.message || "Failed to fetch residents");
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("API Connection Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  return (
    <div className="p-6 space-y-6">
      {/* Search & Actions Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-gray-100">
        <div className="relative w-full md:w-1/3 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH OFFICIAL RECORDS..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 uppercase text-xs tracking-tight placeholder:font-black placeholder:text-gray-300 shadow-inner"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
              <UsersIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                Total Population
              </p>
              <p className="text-[15px] font-black text-gray-800 tracking-tighter leading-none">
                {totalItems || 0}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Resident
          </button>
        </div>
      </div>

      {/* Residents Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-gray-100 rounded-2xl h-48"
            ></div>
          ))}
        </div>
      ) : residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mb-4 opacity-50" />
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
            No Records Found
          </h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Try adjusting your search filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {residents.map((resident) => (
            <div
              key={resident.id}
              onClick={() => {
                setSelectedResident(resident);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group cursor-pointer relative overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1 pt-6 bg-gradient-to-br from-white via-white to-gray-50/50 group-hover:to-blue-50/30 transition-all duration-500">
                <div className="flex justify-between items-start mb-5">
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:border-transparent rounded-2xl flex items-center justify-center text-indigo-600 group-hover:text-white text-2xl font-black transition-all duration-300 shadow-sm group-hover:shadow-blue-500/25 group-hover:-translate-y-1">
                    {resident.last_name?.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase border shadow-sm ${resident.is_deceased ? "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200/50" : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50"}`}
                    >
                      {resident.is_deceased ? "DECEASED" : "ACTIVE"}
                    </span>
                    <p className="text-[10px] font-mono font-bold text-gray-400/80 tracking-tighter mt-1.5 group-hover:text-blue-400 transition-colors">
                      #RID-{String(resident.id).padStart(6, "0")}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pb-5">
                  <h3 className="text-[19px] font-black text-gray-900 group-hover:text-blue-700 uppercase tracking-tight leading-none transition-colors truncate drop-shadow-sm">
                    {resident.last_name}, {resident.first_name}{" "}
                    {resident.middle_name
                      ? resident.middle_name.charAt(0) + "."
                      : ""}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    {resident.gender || "UNKNOWN"} • {resident.age || "N/A"} Y/O
                    • {resident.civil_status || "SINGLE"}
                  </p>
                  {resident.second_name && (
                    <div className="pt-1">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded inline-block mt-0.5 border border-indigo-100 shadow-sm">
                        AKA: {resident.second_name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50/50">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-tight leading-relaxed line-clamp-2">
                      {resident.residential_address}
                    </p>
                  </div>
                  {resident.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <p className="text-[11px] font-mono font-black text-gray-500 tracking-tighter">
                        {resident.contact_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {resident.pending_case && (
                <div className="bg-rose-600 py-1.5 px-4 flex items-center justify-between text-white border-t border-rose-700">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-rose-200" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                      PENDING LEGAL CASE RECORDED
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resident Official Profile"
        size="xl"
      >
        {selectedResident && (
          <div className="space-y-5">
            {/* Profile Header */}
            <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-white text-3xl font-black shadow-lg relative z-10 shrink-0">
                {selectedResident.last_name?.charAt(0)}
              </div>
              <div className="space-y-1 relative z-10 flex-1">
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">
                  {selectedResident.last_name}, {selectedResident.first_name}{" "}
                  {selectedResident.middle_name} {selectedResident.suffix}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-200" /> OFFICIAL
                    DATABASE RECORD
                  </span>
                  {selectedResident.is_deceased ? (
                    <span className="bg-rose-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-rose-900/20">
                      <Skull className="w-3.5 h-3.5" /> DECEASED RECORD
                    </span>
                  ) : (
                    <span className="bg-emerald-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                      <Activity className="w-3.5 h-3.5" /> ACTIVE RESIDENT
                    </span>
                  )}
                </div>
              </div>
              {selectedResident.second_name && (
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right z-10">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5 whitespace-nowrap">
                    Also Known As
                  </p>
                  <p className="text-[14px] font-black text-white uppercase tracking-tight truncate">
                    {selectedResident.second_name}
                  </p>
                </div>
              )}
              {/* Decorative background icons */}
              <UsersIcon className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 -rotate-12" />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              <div className="space-y-3">
                <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Personal Metrics
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Gender & Maturity
                      </p>
                      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
                        {selectedResident.gender} • {selectedResident.age} YEARS
                        OLD
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Social Status
                      </p>
                      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
                        {selectedResident.civil_status || "SINGLE"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Birth Information
                      </p>
                      <p className="text-[14px] font-black text-gray-800 font-mono tracking-tighter">
                        {selectedResident.date_of_birth || "NOT RECORDED"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    Location Profile
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Residential Address
                      </p>
                      <p className="text-[13px] font-black text-gray-800 uppercase leading-relaxed font-medium">
                        {selectedResident.residential_address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Place of Birth
                      </p>
                      <p className="text-[13px] font-black text-gray-800 uppercase leading-relaxed font-medium">
                        {selectedResident.place_of_birth || "NOT SPECIFIED"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className={`p-5 border rounded-2xl h-full flex flex-col ${selectedResident.is_deceased ? "bg-rose-50 border-rose-100" : "bg-white border-gray-100 shadow-sm"}`}
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    Contact Channels
                  </p>

                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">
                          Primary Phone
                        </p>
                        <p className="text-[14px] font-black text-gray-800 font-mono tracking-tighter">
                          {selectedResident.contact_number || "NONE"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-40 grayscale">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">
                          Email Sync
                        </p>
                        <p className="text-[12px] font-bold text-gray-500 uppercase italic">
                          Not Connected
                        </p>
                      </div>
                    </div>
                  </div>

                  {!selectedResident.is_deceased && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="bg-emerald-100 p-1.5 rounded-lg">
                        <Activity className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                        Live Status Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guardian Information Section */}
              <div className="space-y-3">
                <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Guardian Information
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Guardian Name
                      </p>
                      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
                        {selectedResident.guardian_name || "NOT RECORDED"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Relationship
                      </p>
                      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
                        {selectedResident.guardian_relationship ||
                          "NOT RECORDED"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Records Section */}
            <div
              className={`mt-6 p-5 rounded-2xl border-2 shadow-xl ${selectedResident.pending_case ? "bg-rose-50/50 border-rose-200" : "bg-white border-gray-100"}`}
            >
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-3">
                <div
                  className={`p-1.5 rounded-lg border ${selectedResident.pending_case ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-gray-100 border-gray-200 text-gray-400"}`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-[12px] font-black uppercase tracking-[0.2em] leading-none ${selectedResident.pending_case ? "text-rose-900" : "text-gray-900"}`}
                  >
                    Official Clearance Status
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">
                    Verification against Barangay Law Records
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Electronic Tag
                  </p>
                  <div
                    className={`inline-flex items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      selectedResident.pending_case
                        ? "bg-rose-600 text-white border-rose-500 shadow-rose-200 animate-pulse"
                        : "bg-emerald-600 text-white border-emerald-500 shadow-emerald-200"
                    }`}
                  >
                    {selectedResident.pending_case
                      ? "HOLD / PENDING CASE"
                      : "CLEARED / ACTIVE"}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Case History & Administrative Remarks
                  </p>
                  <div
                    className={`p-4 rounded-xl border-2 text-[12px] font-extrabold leading-relaxed min-h-[80px] shadow-inner ${
                      selectedResident.pending_case
                        ? "bg-white border-rose-100 text-rose-900 italic"
                        : "bg-gray-50 border-gray-100 text-gray-400 border-dashed"
                    }`}
                  >
                    {selectedResident.case_record_history ||
                      "NO PREVIOUS LEGAL HISTORY OR PENDING CASES REPORTED FOR THIS RESIDENT RECORD."}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-5 flex justify-between items-center border-t border-gray-100">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-5 py-3 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Purge Record
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleOpenEditModal}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          selectedResident ? "Update Resident Record" : "Register New Resident"
        }
        size="xl"
      >
        <form onSubmit={handleSaveResident} className="space-y-6">
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Identity Details
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="label">First Name</label>
                <input
                  type="text"
                  required
                  className="input uppercase font-bold"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="label">Middle Name</label>
                <input
                  type="text"
                  className="input uppercase font-bold"
                  value={formData.middle_name}
                  onChange={(e) =>
                    setFormData({ ...formData, middle_name: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="label">Last Name</label>
                <input
                  type="text"
                  required
                  className="input uppercase font-bold"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="label">Suffix</label>
                <input
                  type="text"
                  className="input uppercase font-bold"
                  value={formData.suffix}
                  onChange={(e) =>
                    setFormData({ ...formData, suffix: e.target.value })
                  }
                  placeholder="JR/SR"
                />
              </div>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4 shadow-inner">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-blue-500" />
                Alternate Identity (Also Known As)
              </p>
              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <label className="label">Second Name / AKA</label>
                  <input
                    type="text"
                    className="input uppercase font-bold text-blue-600 bg-white"
                    value={formData.second_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, second_name: e.target.value })
                    }
                    placeholder="E.G. 'BONG' OR NICKNAME"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4 shadow-inner">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-500" />
                Guardian Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="label">Guardian Name</label>
                  <input
                    type="text"
                    className="input uppercase font-bold bg-white"
                    value={formData.guardian_name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardian_name: e.target.value,
                      })
                    }
                    placeholder="FULL NAME OF GUARDIAN"
                  />
                </div>
                <div className="col-span-1">
                  <label className="label">Relationship</label>
                  <input
                    type="text"
                    className="input uppercase font-bold bg-white"
                    value={formData.guardian_relationship || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardian_relationship: e.target.value,
                      })
                    }
                    placeholder="E.G. PARENT, SIBLING"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Personal Info
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Age</label>
                    <input
                      type="number"
                      required
                      className="input"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <select
                      className="input font-bold"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="label">Civil Status</label>
                    <select
                      className="input font-bold"
                      value={formData.civil_status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          civil_status: e.target.value,
                        })
                      }
                    >
                      <option value="SINGLE">SINGLE</option>
                      <option value="MARRIED">MARRIED</option>
                      <option value="WIDOWED">WIDOWED</option>
                      <option value="SEPARATED">SEPARATED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Birth & Contact
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Birth Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Contact No.</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.contact_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_number: e.target.value,
                        })
                      }
                      placeholder="09..."
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Birth Place</label>
                  <input
                    type="text"
                    className="input uppercase"
                    value={formData.place_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        place_of_birth: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pending Case Toggle */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Legal Status
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.pending_case}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pending_case: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  <span className="ml-3 text-xs font-bold text-red-700 uppercase">
                    With Case
                  </span>
                </label>
              </div>
              <textarea
                className="input min-h-[80px] resize-none uppercase p-4 text-xs"
                placeholder="Enter case records..."
                value={formData.case_record_history}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    case_record_history: e.target.value,
                  })
                }
              />
            </div>

            {/* Deceased Toggle */}
            <div
              className={`p-6 rounded-2xl border transition-all space-y-4 ${formData.is_deceased ? "bg-[#FFE6E6] border-red-200 shadow-sm" : "bg-gray-50 border-gray-100"}`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${formData.is_deceased ? "text-red-500" : "text-gray-500"}`}
                >
                  Deceased Status
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_deceased}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_deceased: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                  <span
                    className={`ml-3 text-xs font-bold uppercase ${formData.is_deceased ? "text-gray-900" : "text-gray-700"}`}
                  >
                    Mark as Deceased
                  </span>
                </label>
              </div>
              {formData.is_deceased && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-red-500 uppercase block mb-1">
                        Date of Death
                      </label>
                      <input
                        type="date"
                        className="w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.date_of_death}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_of_death: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-red-200 bg-white text-red-600 focus:ring-red-500"
                          checked={formData.covid_related}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              covid_related: e.target.checked,
                            })
                          }
                        />
                        <span className="text-[10px] font-black text-red-600 uppercase group-hover:text-red-500 transition-colors">
                          COVID-19 Related
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-red-500 uppercase block mb-1">
                      Cause of Death
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 uppercase"
                      placeholder="Enter cause of death..."
                      value={formData.cause_of_death}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cause_of_death: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
              Location Details
            </p>
            <label className="label">Full Residential Address</label>
            <textarea
              required
              className="input uppercase h-24 pt-3"
              value={formData.residential_address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  residential_address: e.target.value,
                })
              }
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
            {selectedResident && (
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setIsModalOpen(true);
                }}
                className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {selectedResident ? "COMMIT UPDATES" : "FINALIZE REGISTRATION"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Resident"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl flex gap-3 items-start">
            <Trash2 className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-900">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-red-700 mt-1">
                This will permanently delete{" "}
                <strong>
                  {selectedResident?.first_name} {selectedResident?.last_name}
                </strong>{" "}
                from the database. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              No, Keep Resident
            </button>
            <button
              onClick={handleDeleteResident}
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-100"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              Yes, Delete Forever
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-10 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}

Residents.getLayout = (page) => (
  <Layout
    title="Resident Master Database"
    subtitle="BRGYDESK OFFICIAL RECORDS & CENSUS"
  >
    {page}
  </Layout>
);

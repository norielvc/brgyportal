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
  FileText,
  ChevronDown,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "@/components/Layout/Layout";
import { LoadingCard } from "@/components/UI/LoadingSpinner";
import Pagination from "@/components/UI/Pagination";
import Modal from "@/components/UI/Modal";
import { getUserData } from "@/lib/auth";
import { debounce } from "@/lib/utils";
import { generateFullAddress, PUROK_OPTIONS } from "@/lib/addressHelper";

export default function Residents() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const API_URL = "/api";

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(30);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    civil_status: "",
    purok: "",
    is_deceased: "",
    pending_case: "",
    sort: "newest",
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Tenant-specific address fields
  const [tenantAddressDefaults, setTenantAddressDefaults] = useState({
    barangay: '',
    municipality: '',
    province: 'Province of Bulacan',
  });

  // Tenant-specific purok options
  const [purokOptions, setPurokOptions] = useState(PUROK_OPTIONS);

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
    house_number: "",
    purok: "",
    barangay: "",
    municipality: "",
    province: "",
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
    const count = Object.entries(filters).filter(([k, v]) => k !== "sort" && v !== "").length;
    setActiveFilterCount(count);
  }, [filters]);

  useEffect(() => {
    setMounted(true);
    const user = getUserData();
    setCurrentUser(user);
  }, [router]);

  // Fetch tenant address defaults when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchTenantAddressDefaults();
    }
  }, [currentUser]);

  const fetchTenantAddressDefaults = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.settings) {
        const headerInfo = data.settings.certificate_settings?.headerInfo || {};
        setTenantAddressDefaults({
          barangay: headerInfo.barangayName || '',
          municipality: headerInfo.municipality || '',
          province: headerInfo.province || 'Province of Bulacan',
        });

        // Set tenant-specific purok options
        if (currentUser?.tenant_id === 'demo') {
          // Demo tenant: only Purok 1-5
          setPurokOptions([
            { value: 'Purok 1', label: 'Purok 1' },
            { value: 'Purok 2', label: 'Purok 2' },
            { value: 'Purok 3', label: 'Purok 3' },
            { value: 'Purok 4', label: 'Purok 4' },
            { value: 'Purok 5', label: 'Purok 5' },
          ]);
        } else {
          // Other tenants: use default options
          setPurokOptions(PUROK_OPTIONS);
        }
      }
    } catch (error) {
      console.error('Error fetching tenant address defaults:', error);
    }
  };

  useEffect(() => {
    if (mounted && currentUser) {
      fetchResidents();
    }
  }, [mounted, currentUser, currentPage, searchTerm, limit, filters]);

  const handleOpenAddModal = () => {
    // Determine purok options based on tenant
    const tenantPurokOptions = currentUser?.tenant_id === 'demo' 
      ? [
          { value: 'Purok 1', label: 'Purok 1' },
          { value: 'Purok 2', label: 'Purok 2' },
          { value: 'Purok 3', label: 'Purok 3' },
          { value: 'Purok 4', label: 'Purok 4' },
          { value: 'Purok 5', label: 'Purok 5' },
        ]
      : PUROK_OPTIONS;
    
    setPurokOptions(tenantPurokOptions);

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
      house_number: "",
      purok: "",
      barangay: tenantAddressDefaults.barangay,
      municipality: tenantAddressDefaults.municipality,
      province: tenantAddressDefaults.province,
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

      // Generate full address for backward compatibility
      cleanedData.residential_address = generateFullAddress({
        house_number: cleanedData.house_number,
        purok: cleanedData.purok,
        barangay: cleanedData.barangay,
        municipality: cleanedData.municipality,
        province: cleanedData.province,
      });

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
          <div className="animate-spin rounded-lg h-8 w-8 border-4 border-[#03254c] border-t-transparent"></div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        name: searchTerm || "",
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.civil_status) params.set("civil_status", filters.civil_status);
      if (filters.purok) params.set("purok", filters.purok);
      if (filters.is_deceased) params.set("is_deceased", filters.is_deceased);
      if (filters.pending_case) params.set("pending_case", filters.pending_case);
      if (filters.sort) params.set("sort", filters.sort);

      const response = await fetch(
        `${API_URL}/residents/search?${params.toString()}`,
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ gender: "", civil_status: "", purok: "", is_deceased: "", pending_case: "", sort: "newest" });
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search residents..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors border ${showFilters || activeFilterCount > 0 ? "bg-[#03254c] text-white border-[#03254c]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-[#03254c] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <UsersIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">{totalItems || 0}</span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#03254c] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <p className="text-sm font-bold text-gray-700">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Civil Status</label>
              <select
                value={filters.civil_status}
                onChange={(e) => handleFilterChange("civil_status", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All statuses</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="WIDOWED">Widowed</option>
                <option value="SEPARATED">Separated</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Purok</label>
              <select
                value={filters.purok}
                onChange={(e) => handleFilterChange("purok", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All puroks</option>
                {purokOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Vital Status</label>
              <select
                value={filters.is_deceased}
                onChange={(e) => handleFilterChange("is_deceased", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All residents</option>
                <option value="false">Active only</option>
                <option value="true">Deceased only</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Legal Status</label>
              <select
                value={filters.pending_case}
                onChange={(e) => handleFilterChange("pending_case", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="">All records</option>
                <option value="false">No pending case</option>
                <option value="true">With pending case</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#03254c] focus:ring-2 focus:ring-[#03254c]/10 outline-none transition-all"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.gender && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03254c]/10 text-[#03254c] rounded-full text-xs font-semibold">
              {filters.gender === "MALE" ? "Male" : "Female"}
              <button onClick={() => handleFilterChange("gender", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.civil_status && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03254c]/10 text-[#03254c] rounded-full text-xs font-semibold capitalize">
              {filters.civil_status.toLowerCase()}
              <button onClick={() => handleFilterChange("civil_status", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.purok && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03254c]/10 text-[#03254c] rounded-full text-xs font-semibold">
              {filters.purok}
              <button onClick={() => handleFilterChange("purok", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.is_deceased && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03254c]/10 text-[#03254c] rounded-full text-xs font-semibold">
              {filters.is_deceased === "true" ? "Deceased" : "Active"}
              <button onClick={() => handleFilterChange("is_deceased", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.pending_case && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03254c]/10 text-[#03254c] rounded-full text-xs font-semibold">
              {filters.pending_case === "true" ? "With case" : "No case"}
              <button onClick={() => handleFilterChange("pending_case", "")}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Residents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-xl h-40" />
          ))}
        </div>
      ) : residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <UsersIcon className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No residents found</h3>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map((resident) => (
            <div
              key={resident.id}
              onClick={() => {
                setSelectedResident(resident);
                setIsModalOpen(true);
              }}
              className="bg-white rounded-xl border border-gray-200 hover:border-[#03254c]/30 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 bg-[#03254c]/10 rounded-lg flex items-center justify-center text-[#03254c] text-base font-bold shrink-0">
                    {resident.last_name?.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${resident.is_deceased ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {resident.is_deceased ? (
                        <><Skull className="w-3 h-3 mr-1" /> Deceased</>
                      ) : (
                        <><Activity className="w-3 h-3 mr-1" /> Active</>
                      )}
                    </span>
                    {resident.pending_case && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600 text-white">
                        <Shield className="w-3 h-3 mr-1" /> Case
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate mb-1">
                  {resident.last_name}, {resident.first_name}{" "}
                  {resident.middle_name ? resident.middle_name.charAt(0) + "." : ""}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {resident.gender || "Unknown"} • {resident.age || "N/A"} y/o • {resident.civil_status || "Single"}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-1">{resident.residential_address}</p>
                  </div>
                  {resident.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-600">{resident.contact_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resident Profile"
        size="lg"
      >
        {selectedResident && (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-[#03254c] rounded-xl text-white">
              <div className="h-12 w-12 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 text-lg font-bold shrink-0">
                {selectedResident.last_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate">
                  {selectedResident.last_name}, {selectedResident.first_name}{" "}
                  {selectedResident.middle_name} {selectedResident.suffix}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  {selectedResident.is_deceased ? (
                    <span className="bg-rose-500/80 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5">
                      <Skull className="w-3 h-3" /> Deceased
                    </span>
                  ) : (
                    <span className="bg-white/15 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid — 2×2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="p-4 border border-gray-100 rounded-xl bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-50 pb-2">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Personal Information
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Gender & Age
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedResident.gender} • {selectedResident.age} years old
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Civil Status
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedResident.civil_status || "Single"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Date of Birth
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResident.date_of_birth || "Not recorded"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="p-4 border border-gray-100 rounded-xl bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-50 pb-2">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  Location
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Residential Address
                    </p>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {selectedResident.residential_address ||
                        generateFullAddress({
                          house_number: selectedResident.house_number,
                          purok: selectedResident.purok,
                          barangay: selectedResident.barangay,
                          municipality: selectedResident.municipality,
                          province: selectedResident.province,
                        }) ||
                        "Not recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Place of Birth
                    </p>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {selectedResident.place_of_birth || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact & Guardian */}
              <div className="p-4 border border-gray-100 rounded-xl bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-50 pb-2">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  Contact & Guardian
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResident.contact_number || "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Guardian
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedResident.guardian_name || "Not recorded"}
                      {selectedResident.guardian_relationship && ` (${selectedResident.guardian_relationship})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clearance Status */}
              <div className={`p-4 border rounded-xl ${selectedResident.pending_case ? "bg-rose-50 border-rose-200" : "bg-white border-gray-100"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 border-b pb-2 ${selectedResident.pending_case ? "text-rose-400 border-rose-100" : "text-gray-400 border-gray-50"}`}>
                  <Shield className={`w-3.5 h-3.5 ${selectedResident.pending_case ? "text-rose-500" : "text-emerald-500"}`} />
                  Clearance Status
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Status
                    </p>
                    <div
                      className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${
                        selectedResident.pending_case
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {selectedResident.pending_case
                        ? "HOLD / PENDING CASE"
                        : "CLEARED / ACTIVE"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Case History
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedResident.case_record_history ||
                        "No previous legal history or pending cases reported."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex justify-between items-center border-t border-gray-100">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-4 py-2.5 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleOpenEditModal}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
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
        size="lg"
      >
        <form onSubmit={handleSaveResident} className="space-y-4">
          {/* Identity */}
          <div className="p-4 border border-gray-100 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Identity
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
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
              <div>
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
              <div>
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
              <div>
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
          </div>

          {/* Personal & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                Personal
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Birth Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date_of_birth}
                    onChange={(e) => {
                      const birthDate = e.target.value;
                      setFormData({
                        ...formData,
                        date_of_birth: birthDate,
                        age: birthDate ? calculateAge(birthDate) : '',
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="label">
                    Age <span className="text-gray-400 text-[9px]">(auto)</span>
                  </label>
                  <input
                    type="number"
                    readOnly
                    className="input bg-gray-100 cursor-not-allowed"
                    value={formData.age}
                    placeholder="Auto"
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

            <div className="p-4 border border-gray-100 rounded-xl space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
                <Phone className="w-3.5 h-3.5 text-orange-500" />
                Contact & Guardian
              </p>
              <div className="space-y-3">
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Guardian Name</label>
                    <input
                      type="text"
                      className="input uppercase font-bold"
                      value={formData.guardian_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian_name: e.target.value,
                        })
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <input
                      type="text"
                      className="input uppercase font-bold"
                      value={formData.guardian_relationship || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian_relationship: e.target.value,
                        })
                      }
                      placeholder="Parent, sibling"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 border rounded-xl space-y-3 ${formData.pending_case ? "bg-rose-50 border-rose-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
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
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  <span className="ml-2.5 text-xs font-bold text-rose-700 uppercase">
                    With Case
                  </span>
                </label>
              </div>
              <textarea
                className="input min-h-[60px] resize-none uppercase text-xs"
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

            <div className={`p-4 border rounded-xl space-y-3 ${formData.is_deceased ? "bg-rose-50 border-rose-200" : "border-gray-100"}`}>
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Skull className="w-3.5 h-3.5 text-gray-400" />
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
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                  <span className="ml-2.5 text-xs font-bold uppercase text-gray-700">
                    Mark
                  </span>
                </label>
              </div>
              {formData.is_deceased && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date of Death</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.date_of_death}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_of_death: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                          checked={formData.covid_related}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              covid_related: e.target.checked,
                            })
                          }
                        />
                        <span className="text-[10px] font-bold text-gray-600 uppercase">
                          COVID-19
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="label">Cause of Death</label>
                    <input
                      type="text"
                      className="input uppercase"
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

          {/* Address */}
          <div className="p-4 border border-gray-100 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
              <Home className="w-3.5 h-3.5 text-purple-500" />
              Residential Address
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">House Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2706, 123-A"
                  className="input uppercase font-bold"
                  value={formData.house_number}
                  onChange={(e) =>
                    setFormData({ ...formData, house_number: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Purok / Sitio <span className="text-red-500">*</span></label>
                <select
                  required
                  className="input uppercase font-bold"
                  value={formData.purok}
                  onChange={(e) =>
                    setFormData({ ...formData, purok: e.target.value })
                  }
                >
                  <option value="">-- Select --</option>
                  {purokOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Barangay <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.barangay}
                />
              </div>
              <div>
                <label className="label">Municipality <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.municipality}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Province <span className="text-gray-400 text-[9px]">(auto)</span></label>
                <input
                  type="text"
                  readOnly
                  className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
                  value={formData.province}
                />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Full Address Preview
              </p>
              <p className="text-sm font-semibold text-gray-800 uppercase">
                {generateFullAddress(formData) || 'Enter house number and purok to see preview'}
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsFormModalOpen(false);
                if (selectedResident) {
                  setIsModalOpen(true);
                }
              }}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#03254c] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {selectedResident ? "Save Changes" : "Register"}
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
        <div className="pt-6 border-t border-gray-100">
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
    title="Residents"
    subtitle="Resident Records & Census"
  >
    {page}
  </Layout>
);

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Shield,
  Eye,
  MapPin,
  ArrowRight,
  Edit3,
  User,
  Calendar,
  Phone,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "../UI/BarangayIDCard";
import useScrollLock from "@/lib/useScrollLock";

export default function IssueIDModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedResident = null,
  tenantConfig = {},
}) {
  useScrollLock(isOpen);

  const [searchQuery, setSearchQuery] = useState("");
  const [residentResults, setResidentResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [defaultNextEcNo, setDefaultNextEcNo] = useState("");

  // Editable Form Fields
  const [formData, setFormData] = useState({
    ec_card_no: "",
    full_name: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    purok: "PUROK 1",
    address: "",
    gender: "MALE",
    birth_date: "",
    civil_status: "SINGLE",
    contact_number: "",
    validity_years: 1,
    remarks: "Official EC Card issued",
  });

  const [previewSide, setPreviewSide] = useState("front"); // 'front' | 'back' | 'both'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch next EC number on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchNextEcNo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/barangay-id?limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.next_ec_number) {
            setDefaultNextEcNo(json.next_ec_number);
          }
        }
      } catch (e) {
        console.error("Failed to fetch next EC number:", e);
      }
    };
    fetchNextEcNo();
  }, [isOpen]);

  // If preselected resident is passed, auto select
  useEffect(() => {
    if (preselectedResident && isOpen) {
      handleSelectResident(preselectedResident);
    }
  }, [preselectedResident, isOpen]);

  // Search residents debounced or load initial list
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        const queryParam = searchQuery.trim()
          ? `query=${encodeURIComponent(searchQuery.trim())}`
          : "limit=15";
        const res = await fetch(`/api/residents/search?${queryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setResidentResults(json.data || json.residents || []);
        }
      } catch (err) {
        console.error("Search residents error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Generate dynamic preview ID number for resident
  const generatePreviewNumber = (res) => {
    if (!res) return defaultNextEcNo || "H00001-F00001";
    if (res.id_number) return res.id_number;
    let hash = 0;
    const str = String(res.id || res.last_name || "");
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 99999;
    }
    const num = (Math.abs(hash) % 90000) + 10000;
    return `H${String(num).padStart(5, "0")}-F00001`;
  };

  const handleSelectResident = (res) => {
    setSelectedResident(res);

    const resolvedBirthDate =
      res.date_of_birth ||
      res.birth_date ||
      res.birthday ||
      res.dob ||
      "";

    let formattedBirthDate = "";
    if (resolvedBirthDate) {
      try {
        formattedBirthDate = new Date(resolvedBirthDate).toISOString().split("T")[0];
      } catch {
        formattedBirthDate = String(resolvedBirthDate).substring(0, 10);
      }
    }

    const fullName = [res.first_name, res.middle_name, res.last_name, res.suffix]
      .filter(Boolean)
      .join(" ");

    const fullAddress = [
      res.house_number,
      res.purok,
      res.barangay,
      res.municipality,
      res.province,
    ]
      .filter(Boolean)
      .join(", ") || (res.address || "BARANGAY IBA O' ESTE, CALUMPIT, BULACAN");

    const ecNo = res.id_number || defaultNextEcNo || generatePreviewNumber(res);

    setFormData({
      ec_card_no: ecNo,
      full_name: fullName || `${res.last_name || ""}, ${res.first_name || ""}`,
      first_name: res.first_name || "",
      middle_name: res.middle_name || "",
      last_name: res.last_name || "",
      suffix: res.suffix || "",
      purok: res.purok || "PUROK 1",
      address: fullAddress,
      gender: res.gender || "MALE",
      birth_date: formattedBirthDate,
      civil_status: res.civil_status || "SINGLE",
      contact_number: res.contact_number || res.phone_number || "",
      validity_years: 1,
      remarks: "Official EC Card issued",
    });
  };

  const handleSubmit = async () => {
    if (!selectedResident) {
      toast.error("Please select a registered resident from the census first.");
      return;
    }

    if (!formData.ec_card_no?.trim()) {
      toast.error("Please provide a valid EC Card Number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        resident_id: selectedResident.id,
        id_number: formData.ec_card_no.trim().toUpperCase(),
        full_name: formData.full_name?.trim(),
        first_name: formData.first_name?.trim(),
        middle_name: formData.middle_name?.trim(),
        last_name: formData.last_name?.trim(),
        suffix: formData.suffix?.trim(),
        purok: formData.purok?.trim(),
        address: formData.address?.trim(),
        gender: formData.gender,
        birth_date: formData.birth_date || null,
        civil_status: formData.civil_status,
        contact_number: formData.contact_number?.trim(),
        validity_years: formData.validity_years,
        remarks: formData.remarks?.trim(),
      };

      const res = await fetch("/api/barangay-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to issue Barangay ID");
      }

      toast.success(json.message || "Official EC Card successfully issued! 🎉");
      if (onSuccess) onSuccess(json.data);
      handleClose();
    } catch (error) {
      console.error("Issue ID error:", error);
      toast.error(error.message || "Failed to create Barangay ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedResident(null);
    setSearchQuery("");
    setResidentResults([]);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Build live preview data with dynamic fallback
  const previewIDData = {
    id_number: formData.ec_card_no || generatePreviewNumber(selectedResident),
    first_name: formData.first_name || selectedResident?.first_name || "ALEXANDER",
    middle_name: formData.middle_name || selectedResident?.middle_name || "C.",
    last_name: formData.last_name || selectedResident?.last_name || "MANIO",
    suffix: formData.suffix || selectedResident?.suffix || "",
    purok: formData.purok || selectedResident?.purok || "PUROK 2",
    barangay: selectedResident?.barangay || "BARANGAY IBA O' ESTE",
    full_name: formData.full_name || (selectedResident
      ? [
          formData.first_name || selectedResident.first_name,
          formData.middle_name || selectedResident.middle_name,
          formData.last_name || selectedResident.last_name,
          formData.suffix || selectedResident.suffix,
        ]
          .filter(Boolean)
          .join(" ")
      : "ALEXANDER C. MANIO"),
    address: formData.address || (selectedResident
      ? [
          selectedResident.house_number,
          formData.purok || selectedResident.purok,
          selectedResident.barangay,
          selectedResident.municipality,
        ]
          .filter(Boolean)
          .join(", ")
      : "PUROK 2, IBA O' ESTE, CALUMPIT, BULACAN"),
    birth_date: formData.birth_date || selectedResident?.date_of_birth || "1995-01-01",
    gender: formData.gender || selectedResident?.gender || "MALE",
    civil_status: formData.civil_status || selectedResident?.civil_status || "SINGLE",
    contact_number: formData.contact_number,
    expiry_date: new Date(
      Date.now() + (formData.validity_years || 1) * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal Dialog Content Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-id-modal-title"
        className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#03254c] via-[#043b78] to-[#0a529e] p-4 sm:p-6 text-white flex items-center justify-between relative flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg flex-shrink-0">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Master Census Connected
              </div>
              <h3 id="issue-id-modal-title" className="text-base sm:text-xl font-black tracking-tight text-white">
                Issue Official Barangay EC Card
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Close modal"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer z-20 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-slate-50/50">
          {/* Left Column: Selection & Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* If no resident selected, show search input and list */}
            {!selectedResident ? (
              <>
                {/* Census Verification Notice */}
                <div className="p-3.5 sm:p-4 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 leading-relaxed">
                    <strong>Select Resident:</strong> Search for a registered citizen from
                    the master census. You will be able to customize their EC Card No. and details before issuance.
                  </div>
                </div>

                {/* Resident Search Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                    Search Registered Citizen:
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type citizen name (e.g. Cruz, Alexander, Angelica)..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#03254c] transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Resident Search Results */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {isSearching && (
                    <div className="p-6 text-center text-xs font-bold text-gray-500">
                      Searching Master Census...
                    </div>
                  )}

                  {!isSearching && residentResults.length === 0 && searchQuery && (
                    <div className="p-6 text-center text-xs text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                      No registered residents found matching "{searchQuery}". Please
                      register the resident in the census first.
                    </div>
                  )}

                  {residentResults.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => handleSelectResident(res)}
                      className="p-3.5 bg-white hover:bg-blue-50/80 border border-gray-200 hover:border-blue-400 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#03254c] group-hover:text-white flex items-center justify-center font-black text-sm text-gray-600 transition-colors">
                          {res.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 uppercase">
                            {res.last_name}, {res.first_name}{" "}
                            {res.middle_name || ""} {res.suffix || ""}
                          </p>
                          <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {res.purok || "Purok N/A"} • {res.gender || "MALE"} •{" "}
                            {res.civil_status || "SINGLE"}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#03254c] group-hover:bg-[#03254c] group-hover:text-white text-xs font-black transition-all flex items-center gap-1">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* If resident selected, show detailed editable configuration card */
              <div className="space-y-4">
                {/* Selected Resident Top Bar */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {selectedResident.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Census Verified
                        </span>
                        <span className="text-xs font-black text-gray-900 uppercase">
                          {selectedResident.last_name}, {selectedResident.first_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold">
                        Master Census ID: #{selectedResident.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedResident(null)}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 underline cursor-pointer px-2 py-1"
                  >
                    Change Resident
                  </button>
                </div>

                {/* Editable Profile & Card Form */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#03254c]" />
                      <h4 className="text-xs font-black text-[#03254c] uppercase tracking-wider">
                        EC Card Serial & Resident Details
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Live Preview Sync
                    </span>
                  </div>

                  {/* 1. EC Card Serial Number (Editable) */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-600" />
                      EC Card No. (Card Serial)
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.ec_card_no}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ec_card_no: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g. H00001-F00001"
                        className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl font-mono font-black text-sm text-[#03254c] focus:outline-none focus:ring-2 focus:ring-[#03254c] uppercase transition-all shadow-inner"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1">
                      Official card identifier encoded into the anti-tamper QR code.
                    </p>
                  </div>

                  {/* 2. Full Name */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#03254c]" />
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData({ ...formData, full_name: val });
                      }}
                      placeholder="e.g. ANGELICA PANGANIBAN REYES"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white transition-all"
                    />
                  </div>

                  {/* 3. Gender & Civil Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                        Gender / Sex
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      >
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                        Civil Status
                      </label>
                      <select
                        value={formData.civil_status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            civil_status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      >
                        <option value="SINGLE">SINGLE</option>
                        <option value="MARRIED">MARRIED</option>
                        <option value="WIDOWED">WIDOWED</option>
                        <option value="LEGALLY SEPARATED">LEGALLY SEPARATED</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Date of Birth & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) =>
                          setFormData({ ...formData, birth_date: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={formData.contact_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_number: e.target.value,
                          })
                        }
                        placeholder="e.g. 09123456789"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* 5. Purok & Residential Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                        Purok / Zone
                      </label>
                      <input
                        type="text"
                        value={formData.purok}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purok: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g. PUROK 1"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g. PUROK 1, IBA O' ESTE, CALUMPIT, BULACAN"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* 6. Validity Period */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                      Card Validity Period
                    </label>
                    <select
                      value={formData.validity_years}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validity_years: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#03254c] cursor-pointer"
                    >
                      <option value={1}>1 Year Validity (Standard)</option>
                      <option value={2}>2 Years Validity</option>
                      <option value={3}>3 Years Validity</option>
                    </select>
                  </div>

                  {/* Submit Action */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full mt-3 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting ? "Generating Official Card..." : "Issue Official EC Card"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Card Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-100 rounded-3xl p-4 border border-slate-200 flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Card Preview
              </span>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewSide("front")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    previewSide === "front"
                      ? "bg-[#03254c] text-white"
                      : "text-gray-600"
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide("back")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    previewSide === "back"
                      ? "bg-[#03254c] text-white"
                      : "text-gray-600"
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide("both")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    previewSide === "both"
                      ? "bg-[#03254c] text-white"
                      : "text-gray-600"
                  }`}
                >
                  Dual
                </button>
              </div>
            </div>

            {/* Render Live ID Card */}
            <div className="my-auto py-2 overflow-hidden max-w-full flex items-center justify-center">
              <BarangayIDCard
                idData={previewIDData}
                tenantConfig={tenantConfig}
                side={previewSide}
                scale={previewSide === "both" ? 0.65 : 0.82}
              />
            </div>

            <p className="text-[10px] text-slate-400 font-semibold mt-2">
              Official CR80 PVC format (85.6mm × 53.98mm) ready for high-resolution card printers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



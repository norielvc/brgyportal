import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Phone,
  Shield,
  Eye,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "../UI/BarangayIDCard";

export default function IssueIDModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedResident = null,
  tenantConfig = {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [residentResults, setResidentResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  // Form Fields (simplified: validity, blood type, remarks)
  const [formData, setFormData] = useState({
    blood_type: "O+",
    contact_number: "",
    validity_years: 1,
    remarks: "Official EC Card issued",
  });

  const [previewSide, setPreviewSide] = useState("front"); // 'front' | 'back' | 'both'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If preselected resident is passed from residents.js, auto select
  useEffect(() => {
    if (preselectedResident) {
      handleSelectResident(preselectedResident);
    }
  }, [preselectedResident]);

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

  const handleSelectResident = (res) => {
    setSelectedResident(res);
    setFormData((prev) => ({
      ...prev,
      blood_type: res.blood_type || "O+",
      contact_number: res.contact_number || res.phone_number || "",
    }));
  };

  const handleSubmit = async () => {
    if (!selectedResident) {
      toast.error("Please select a registered resident from the census first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        resident_id: selectedResident.id,
        blood_type: formData.blood_type,
        contact_number: formData.contact_number,
        validity_years: formData.validity_years,
        remarks: formData.remarks,
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
    onClose();
  };

  if (!isOpen) return null;

  // Build live preview data
  const previewIDData = {
    id_number: selectedResident?.id_number || "H00001-F00001",
    first_name: selectedResident?.first_name || "ALEXANDER",
    middle_name: selectedResident?.middle_name || "C.",
    last_name: selectedResident?.last_name || "MANIO",
    suffix: selectedResident?.suffix || "",
    purok: selectedResident?.purok || "PUROK 2",
    barangay: selectedResident?.barangay || "BARANGAY IBA O' ESTE",
    full_name: selectedResident
      ? [
          selectedResident.first_name,
          selectedResident.middle_name,
          selectedResident.last_name,
          selectedResident.suffix,
        ]
          .filter(Boolean)
          .join(" ")
      : "ALEXANDER C. MANIO",
    address: selectedResident
      ? [
          selectedResident.house_number,
          selectedResident.purok,
          selectedResident.barangay,
          selectedResident.municipality,
        ]
          .filter(Boolean)
          .join(", ")
      : "PUROK 2, IBA O' ESTE, CALUMPIT, BULACAN",
    birth_date: selectedResident?.birth_date || "1995-01-01",
    gender: selectedResident?.gender || "MALE",
    civil_status: selectedResident?.civil_status || "SINGLE",
    blood_type: formData.blood_type,
    contact_number: formData.contact_number,
    expiry_date: new Date(
      Date.now() + (formData.validity_years || 1) * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#03254c] via-[#043b78] to-[#0a529e] p-5 sm:p-6 text-white flex items-center justify-between relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Master Census Connected
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Issue Official Barangay EC Card
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Selection & Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Census Verification Notice */}
            <div className="p-4 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong>Instant Issuance:</strong> Select a verified citizen from
                the master census to immediately generate their official EC Card
                with encrypted anti-tamper QR code.
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
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Selected Resident Card */}
            {selectedResident ? (
              <div className="p-4 bg-emerald-50/90 border-2 border-emerald-500 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                      {selectedResident.first_name?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Selected Resident
                      </span>
                      <h4 className="text-base font-black text-gray-900 uppercase">
                        {selectedResident.last_name}, {selectedResident.first_name}{" "}
                        {selectedResident.middle_name || ""}{" "}
                        {selectedResident.suffix || ""}
                      </h4>
                      <p className="text-xs text-gray-600 font-semibold">
                        {selectedResident.purok || "Purok 2"} •{" "}
                        {selectedResident.gender || "RESIDENT"} •{" "}
                        {selectedResident.age ? `${selectedResident.age} y/o` : "Active"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedResident(null)}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 underline"
                  >
                    Change
                  </button>
                </div>

                {/* Additional Card Options */}
                <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                      Card Validity
                    </label>
                    <select
                      value={formData.validity_years}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validity_years: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-800"
                    >
                      <option value={1}>1 Year Validity (Standard)</option>
                      <option value={2}>2 Years Validity</option>
                      <option value={3}>3 Years Validity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                      Blood Type
                    </label>
                    <select
                      value={formData.blood_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          blood_type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-800"
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "N/A"].map(
                        (t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Generating Official Card..." : "Issue Official EC Card"}
                  </span>
                </button>
              </div>
            ) : null}

            {/* Resident Autocomplete / Census List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isSearching && (
                <div className="p-6 text-center text-xs font-bold text-gray-500">
                  Searching Master Census...
                </div>
              )}

              {!isSearching && residentResults.length === 0 && searchQuery && (
                <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                  No registered residents found matching "{searchQuery}". Please
                  register the resident in the census first.
                </div>
              )}

              {residentResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => handleSelectResident(res)}
                  className={`p-3.5 bg-white hover:bg-blue-50/80 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm ${
                    selectedResident?.id === res.id
                      ? "border-[#03254c] ring-2 ring-[#03254c]/20 bg-blue-50/50"
                      : "border-gray-200 hover:border-blue-400"
                  }`}
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
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

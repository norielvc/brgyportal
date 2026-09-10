import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  User,
  CreditCard,
  Camera,
  Upload,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Phone,
  Shield,
  RotateCcw,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import BarangayIDCard from "../UI/BarangayIDCard";
import SignatureInput from "../UI/SignatureInput";

export default function IssueIDModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedResident = null,
  tenantConfig = {},
}) {
  const [step, setStep] = useState(1); // 1: Select Resident, 2: Photo & Signature, 3: Details & Preview
  const [searchQuery, setSearchQuery] = useState("");
  const [residentResults, setResidentResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    blood_type: "O+",
    precinct_no: "",
    tin_no: "",
    sss_no: "",
    philhealth_no: "",
    contact_number: "",
    emergency_contact_name: "",
    emergency_contact_relation: "SPOUSE",
    emergency_contact_number: "",
    emergency_contact_address: "",
    photo_url: null,
    cardholder_signature_url: null,
    validity_years: 1,
    remarks: "Officially registered resident",
  });

  const [previewSide, setPreviewSide] = useState("front"); // 'front' | 'back' | 'both'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // If preselected resident is passed from residents.js, auto select and move to step 2
  useEffect(() => {
    if (preselectedResident) {
      handleSelectResident(preselectedResident);
    }
  }, [preselectedResident]);

  // Search residents debounced
  useEffect(() => {
    if (!isOpen || selectedResident) return;
    if (!searchQuery.trim()) {
      setResidentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/residents/search?query=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setResidentResults(json.data || []);
        }
      } catch (err) {
        console.error("Search residents error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, selectedResident]);

  const handleSelectResident = (res) => {
    setSelectedResident(res);
    const fullName = [res.first_name, res.middle_name, res.last_name, res.suffix].filter(Boolean).join(" ");
    
    setFormData((prev) => ({
      ...prev,
      blood_type: res.blood_type || "O+",
      precinct_no: res.precinct_no || "",
      contact_number: res.contact_number || res.phone_number || "",
      emergency_contact_name: res.emergency_contact_name || "",
      emergency_contact_relation: res.emergency_contact_relationship || "SPOUSE",
      emergency_contact_number: res.emergency_contact_phone || "",
      photo_url: res.photo_url || null,
    }));
    setStep(2);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData((prev) => ({ ...prev, photo_url: uploadEvent.target.result }));
      toast.success("2x2 photo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedResident) {
      toast.error("Please select a registered resident first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        resident_id: selectedResident.id,
        ...formData,
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

      toast.success(json.message || "Barangay ID successfully issued! 🎉");
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
    setStep(1);
    setSelectedResident(null);
    setSearchQuery("");
    setResidentResults([]);
    onClose();
  };

  if (!isOpen) return null;

  // Build live preview data
  const previewIDData = {
    id_number: "BID-PREVIEW-2026",
    full_name: selectedResident
      ? [selectedResident.first_name, selectedResident.middle_name, selectedResident.last_name, selectedResident.suffix].filter(Boolean).join(" ")
      : "RESIDENT FULL NAME",
    address: selectedResident
      ? [selectedResident.house_number, selectedResident.purok, selectedResident.barangay, selectedResident.municipality].filter(Boolean).join(", ")
      : "BARANGAY JURISDICTION",
    birth_date: selectedResident?.birth_date || "1995-01-01",
    gender: selectedResident?.gender || "MALE",
    civil_status: selectedResident?.civil_status || "SINGLE",
    blood_type: formData.blood_type,
    contact_number: formData.contact_number,
    emergency_contact_name: formData.emergency_contact_name,
    emergency_contact_relation: formData.emergency_contact_relation,
    emergency_contact_number: formData.emergency_contact_number,
    photo_url: formData.photo_url,
    cardholder_signature_url: formData.cardholder_signature_url,
    expiry_date: new Date(Date.now() + (formData.validity_years || 1) * 365 * 24 * 60 * 60 * 1000)
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
                Census Verified
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Issue Official Barangay ID Card
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
          {/* Left Column: Form Steps (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                  step === 1 ? "text-[#03254c]" : "text-gray-400"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 1 ? "bg-[#03254c] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  1
                </span>
                Resident Lookup
              </button>

              <div className="w-8 h-0.5 bg-gray-200" />

              <button
                type="button"
                onClick={() => selectedResident && setStep(2)}
                disabled={!selectedResident}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                  step === 2 ? "text-[#03254c]" : "text-gray-400"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 2 ? "bg-[#03254c] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  2
                </span>
                Photo & Sign
              </button>

              <div className="w-8 h-0.5 bg-gray-200" />

              <button
                type="button"
                onClick={() => selectedResident && setStep(3)}
                disabled={!selectedResident}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                  step === 3 ? "text-[#03254c]" : "text-gray-400"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 3 ? "bg-[#03254c] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  3
                </span>
                Details
              </button>
            </div>

            {/* STEP 1: RESIDENT SEARCH & SELECTION */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong>Census Rule:</strong> Only residents officially registered in the Master Census database can be issued a Barangay ID.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                    Search Registered Resident:
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type resident name (e.g. Reyes, Angelica)..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#03254c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Selected Resident Card */}
                {selectedResident && (
                  <div className="p-4 bg-blue-50/80 border-2 border-blue-500 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                        {selectedResident.first_name?.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Selected Resident
                        </span>
                        <h4 className="text-base font-black text-gray-900">
                          {selectedResident.last_name}, {selectedResident.first_name} {selectedResident.middle_name || ""} {selectedResident.suffix || ""}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {selectedResident.purok || "Purok N/A"} • {selectedResident.gender} • {selectedResident.age ? `${selectedResident.age} y/o` : "Age N/A"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-[#03254c] text-white text-xs font-black rounded-xl hover:bg-blue-900 transition-all shadow"
                    >
                      Next Step ➔
                    </button>
                  </div>
                )}

                {/* Search Results List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {isSearching && (
                    <div className="p-6 text-center text-xs text-gray-500">
                      Searching Master Census...
                    </div>
                  )}

                  {!isSearching && residentResults.length === 0 && searchQuery && (
                    <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                      No registered residents found matching "{searchQuery}". Please register the resident in the census first.
                    </div>
                  )}

                  {residentResults.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => handleSelectResident(res)}
                      className="p-3 bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-sm text-gray-600 transition-colors">
                          {res.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">
                            {res.last_name}, {res.first_name} {res.middle_name || ""} {res.suffix || ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {res.purok || "Purok N/A"} • {res.gender} • {res.civil_status || "SINGLE"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        Select ➔
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PHOTO & SIGNATURE CAPTURE */}
            {step === 2 && (
              <div className="space-y-5">
                {/* 2x2 Photo Upload */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    1. Resident 2x2 ID Photo:
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                      {formData.photo_url ? (
                        <img src={formData.photo_url} alt="Resident Photo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-50 text-[#03254c] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 flex items-center gap-2 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-blue-600" />
                        Upload 2x2 Photo
                      </button>
                      <p className="text-[10px] text-gray-400">
                        PNG or JPG with light background recommended. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cardholder Signature */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    2. Cardholder Digital Signature:
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                    <SignatureInput
                      value={formData.cardholder_signature_url}
                      onChange={(sigUrl) => setFormData((prev) => ({ ...prev, cardholder_signature_url: sigUrl }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    ⬅ Back to Resident
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2 bg-[#03254c] text-white text-xs font-black rounded-xl hover:bg-blue-900 transition-all"
                  >
                    Next: Card Details ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CARD DETAILS & VALIDITY */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Blood Type
                    </label>
                    <select
                      value={formData.blood_type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, blood_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "N/A"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Card Validity
                    </label>
                    <select
                      value={formData.validity_years}
                      onChange={(e) => setFormData((prev) => ({ ...prev, validity_years: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      <option value="1">1 Year Validity (Standard)</option>
                      <option value="2">2 Years Validity</option>
                      <option value="3">3 Years Validity</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="e.g. 09171234567"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Precinct / Voter No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.precinct_no}
                      onChange={(e) => setFormData((prev) => ({ ...prev, precinct_no: e.target.value }))}
                      placeholder="e.g. 0042-A"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                    Emergency Contact Information
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_relation: e.target.value }))}
                        placeholder="e.g. Spouse / Parent / Sibling"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Emergency Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_number: e.target.value }))}
                      placeholder="e.g. 09189876543"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    ⬅ Back to Photo
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? "Generating ID Card..." : "Issue Official ID Card"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Card Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between items-center text-center">
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
                    previewSide === "front" ? "bg-[#03254c] text-white" : "text-gray-600"
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide("back")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    previewSide === "back" ? "bg-[#03254c] text-white" : "text-gray-600"
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide("both")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    previewSide === "both" ? "bg-[#03254c] text-white" : "text-gray-600"
                  }`}
                >
                  Dual
                </button>
              </div>
            </div>

            {/* Render Live ID Card */}
            <div className="my-auto py-2 overflow-x-auto max-w-full flex items-center justify-center">
              <BarangayIDCard
                idData={previewIDData}
                tenantConfig={tenantConfig}
                side={previewSide}
                scale={previewSide === "both" ? 0.75 : 0.88}
              />
            </div>

            <p className="text-[10px] text-slate-400 font-semibold mt-2">
              Standard CR80 PVC format (85.6mm × 53.98mm) ready for high-resolution card printers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

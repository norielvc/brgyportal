import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  AlertCircle,
  CheckCircle,
  Info,
  Send,
  Clock,
  Eye,
  Briefcase,
  User,
  MapPin,
  Store,
  Search,
  Phone,
  Mail,
} from "lucide-react";
import ResidentSearchModal from "../Modals/ResidentSearchModal";

// Memoized Notification component
const Notification = React.memo(({ type, title, message, onClose }) => {
  const styles = {
    success: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-green-200",
      icon: "bg-green-100 text-green-600",
      title: "text-green-800",
      message: "text-green-700",
    },
    error: {
      bg: "bg-gradient-to-r from-red-50 to-rose-50",
      border: "border-red-200",
      icon: "bg-red-100 text-red-600",
      title: "text-red-800",
      message: "text-red-700",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
      border: "border-blue-200",
      icon: "bg-blue-100 text-blue-600",
      title: "text-blue-800",
      message: "text-blue-700",
    },
  };
  const s = styles[type] || styles.info;
  const Icon =
    type === "success" ? CheckCircle : type === "error" ? AlertCircle : Info;
  return (
    <div
      className={`${s.bg} ${s.border} border rounded-xl p-4 shadow-sm animate-fade-in`}
    >
      <div className="flex items-start gap-3">
        <div className={`${s.icon} p-2 rounded-lg flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${s.title} font-semibold text-sm`}>{title}</h4>
          <p className={`${s.message} text-sm mt-0.5`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});
Notification.displayName = "Notification";

export default function BusinessPermitModal({
  isOpen,
  onClose,
  isDemo = false,
  tenantConfig = {},
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  const [formData, setFormData] = useState({
    applicationDate: "",
    applicationNo: "",
    ownerFullName: "",
    ownerAddress: "",
    residentId: null,
    age: 0,
    businessName: "",
    natureOfBusiness: "",
    businessAddress: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    sex: "",
    civilStatus: "",
    dateOfBirth: "",
    placeOfBirth: "",
    clearanceType: "new",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);

  const handleResidentSelect = (resident) => {
    setFormData((prev) => ({
      ...prev,
      ownerFullName: resident.full_name || "",
      ownerAddress: resident.residential_address || "",
      contactPerson: resident.full_name || "",
      contactNumber: resident.contact_number || "",
      email: resident.email || resident.email_address || "",
      residentId: resident.id,
      age: resident.age || 0,
      sex: resident.gender || "",
      civilStatus: resident.civil_status || "",
      dateOfBirth: resident.date_of_birth || "",
      placeOfBirth: resident.place_of_birth || "",
    }));
    setIsResidentModalOpen(false);
    setErrors((prev) => ({ ...prev, ownerFullName: false }));
    setNotification({
      type: "success",
      title: "Profile Found",
      message: `${resident.full_name}'s details have been auto-filled.`,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setFormData((prev) => ({
      ...prev,
      applicationDate: `${yyyy}-${mm}-${dd}`,
      applicationNo: "",
    }));
  }, [isOpen]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = () => {
    const required = [
      "ownerFullName",
      "ownerAddress",
      "businessName",
      "natureOfBusiness",
      "businessAddress",
      "contactNumber",
    ];
    const newErrors = {};
    required.forEach((field) => {
      if (!formData[field]) newErrors[field] = true;
    });

    if (!formData.residentId) {
      setNotification({
        type: "error",
        title: "Resident Required",
        message:
          "Please search and select the business owner from the Resident Directory.",
      });
      return false;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields correctly.",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmationPopup(true);
  };

  const handleProceedSubmission = async () => {
    setIsSubmitting(true);
    try {
      // POINTED TO NEXT.JS RESILIENCE API
      const timestamp = Date.now().toString().slice(-6);
      const refNum = `BP-${new Date().getFullYear()}-${timestamp}`;

      const response = await fetch("/api/portal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id":
            tenantConfig?.tenant_id || (isDemo ? "demo" : "ibaoeste"),
        },
        body: JSON.stringify({
          type: "business_permit",
          formData: {
            ...formData,
            fullName: formData.ownerFullName, // Map for backend
            address: formData.ownerAddress,
            referenceNumber: refNum,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmittedReferenceNumber(data.referenceNumber);
        setReferenceNumber(data.referenceNumber);
        setShowConfirmationPopup(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(data.message || "Failed to submit application.");
      }
    } catch (error) {
      setShowConfirmationPopup(false);
      setNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      applicationDate: "",
      applicationNo: "",
      ownerFullName: "",
      ownerAddress: "",
      residentId: null,
      age: 0,
      businessName: "",
      natureOfBusiness: "",
      businessAddress: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
      sex: "",
      civilStatus: "",
      dateOfBirth: "",
      placeOfBirth: "",
      clearanceType: "new",
    });
    setNotification(null);
    setReferenceNumber("");
    setSubmittedReferenceNumber("");
    setErrors({});
  };

  if (!isOpen) return null;

  const demoTheme = isDemo ? (
    <style>{`
      /* Demo tenant: dark/gold theme override for all form modals */
      .brgy-modal-wrap [class*="from-[#112e1f]"],
      .brgy-modal-wrap [class*="from-[#112117]"] {
        --tw-gradient-from: #111111 !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent) !important;
      }
      .brgy-modal-wrap [class*="via-[#2d5a3d]"] {
        --tw-gradient-stops: var(--tw-gradient-from), #222222, var(--tw-gradient-to, transparent) !important;
      }
      .brgy-modal-wrap [class*="to-[#112117]"],
      .brgy-modal-wrap [class*="to-[#1a3d29]"],
      .brgy-modal-wrap [class*="to-[#2d5a3d]"] {
        --tw-gradient-to: #1a1a1a !important;
      }
      /* Header gradient override */
      .brgy-modal-wrap .bg-gradient-to-r[class*="from-[#112e1f]"] {
        background-image: linear-gradient(to right, #111111, #222222, #111111) !important;
      }
      /* Step header pill (green lime -> gold) */
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        --tw-gradient-from: #c9a84c !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent) !important;
      }
      .brgy-modal-wrap [class*="to-[#b4d339]"],
      .brgy-modal-wrap [class*="to-[#7cb342]"],
      .brgy-modal-wrap [class*="to-[#689f38]"] {
        --tw-gradient-to: #a07830 !important;
      }
      .brgy-modal-wrap [class*="from-[#8cc63f]"],
      .brgy-modal-wrap [class*="from-[#7cb342]"] {
        background-image: linear-gradient(to right, #c9a84c, #a07830) !important;
      }
      /* Solid bg overrides */
      .brgy-modal-wrap [class*="bg-[#8cc63f]"],
      .brgy-modal-wrap [class*="bg-[#7cb342]"],
      .brgy-modal-wrap [class*="bg-[#2d5a3d]"],
      .brgy-modal-wrap [class*="bg-[#112e1f]"] { background-color: #1a1a1a !important; }
      /* Text color overrides */
      .brgy-modal-wrap [class*="text-[#2d5a3d]"],
      .brgy-modal-wrap [class*="text-[#112e1f]"],
      .brgy-modal-wrap [class*="text-[#8cc63f]"] { color: #c9a84c !important; }
      /* Border overrides */
      .brgy-modal-wrap [class*="border-[#2d5a3d]"] { border-color: #c9a84c !important; }
      /* Hover overrides */
      .brgy-modal-wrap [class*="hover:bg-[#2d5a3d]"]:hover,
      .brgy-modal-wrap [class*="hover:from-[#7cb342]"]:hover { background-color: #a07830 !important; }
      /* Tailwind green/emerald -> gold/dark */
      .brgy-modal-wrap [class*="text-green-"]:not([class*="text-green-50"]):not([class*="text-green-100"]) { color: #c9a84c !important; }
      .brgy-modal-wrap [class*="text-emerald-"]:not([class*="text-emerald-50"]):not([class*="text-emerald-100"]) { color: #c9a84c !important; }
      .brgy-modal-wrap [class*="bg-green-"]:not([class*="bg-green-50"]):not([class*="bg-green-100"]) { background-color: #1a1a1a !important; }
      .brgy-modal-wrap [class*="bg-emerald-"]:not([class*="bg-emerald-50"]):not([class*="bg-emerald-100"]) { background-color: #1a1a1a !important; }
      .brgy-modal-wrap [class*="border-green-"] { border-color: #c9a84c !important; }
      .brgy-modal-wrap [class*="border-emerald-"] { border-color: #c9a84c !important; }
      .brgy-modal-wrap [class*="hover:bg-green-"]:hover,
      .brgy-modal-wrap [class*="hover:bg-emerald-"]:hover { background-color: #a07830 !important; }
      .brgy-modal-wrap [class*="focus:ring-green-"],
      .brgy-modal-wrap [class*="focus:ring-emerald-"],
      .brgy-modal-wrap [class*="focus:border-green-"],
      .brgy-modal-wrap [class*="focus:border-emerald-"] { --tw-ring-color: #c9a84c !important; border-color: #c9a84c !important; }
    `}</style>
  ) : null;

  const inputClass = (field) =>
    `w-full px-4 py-2.5 bg-white border-2 ${errors[field] ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`;

  const selectClass = (field) =>
    `w-full px-4 py-2.5 bg-white border-2 ${errors[field] ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-lg focus:border-emerald-500 transition-all outline-none font-bold text-gray-800 shadow-sm cursor-pointer`;

  return (
    <>
      {demoTheme}
      <div className="brgy-modal-wrap">
        {!showConfirmationPopup && !showSuccessModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={onClose}
              />

              <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in"
                style={{
                  minHeight: "800px",
                  height: "90vh",
                  maxHeight: "95vh" /* BUST-CACHE-800 */,
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl">
                      <Building2 className="w-5 h-5 text-white shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                        Business Clearance / Clearance ng Negosyo
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                        <p className="text-white text-sm font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 rounded-md shadow-md">
                          {referenceNumber || "Commercial Permit Portal"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group relative z-20"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {notification && (
                  <div className="px-4 pt-2">
                    <Notification
                      type={notification.type}
                      title={notification.title}
                      message={notification.message}
                      onClose={() => setNotification(null)}
                    />
                  </div>
                )}

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Registration Notice */}
                    <div className="bg-gradient-to-r from-[#112e1f]/90 to-[#1a3d29]/80 border border-white/10 rounded-lg p-3 shadow-md relative overflow-hidden flex-shrink-0">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none"></div>
                      <div className="flex items-start gap-2 relative z-10">
                        <div className="bg-white/10 border border-white/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                          <Info className="w-3 h-3 text-emerald-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                            <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-sm">
                              Registration Notice
                              <span class="hidden sm:inline"> / Paunawa</span>
                            </h4>
                          </div>
                          <p className="text-white/80 text-sm font-medium leading-relaxed mb-0.5">
                            If no record is found in the resident directory,
                            please visit the Barangay Hall and coordinate with
                            the staff to register.
                          </p>
                          <p className="text-white/50 text-sm font-medium leading-relaxed italic">
                            <span class="hidden sm:block">
                              Kung walang rekord sa direktoryo ng residente,
                              mangyaring pumunta sa Barangay Hall upang
                              magparehistro sa ating mga kawani.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Application Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                          1
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            Application Info / Impormasyon ng Aplikasyon
                          </h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">
                            Date and type of clearance being requested
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Date of Application
                          </label>
                          <input
                            type="text"
                            value={
                              formData.applicationDate
                                ? new Date(
                                    formData.applicationDate + "T00:00:00",
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : ""
                            }
                            readOnly
                            className="w-full px-4 py-2.5 bg-white border-2 border-emerald-100 rounded-lg outline-none font-bold text-gray-700 shadow-sm cursor-default"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Application No.
                          </label>
                          <input
                            type="text"
                            value={formData.applicationNo || "NEW APPLICATION"}
                            readOnly
                            className="w-full px-4 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-lg outline-none font-black text-emerald-800 cursor-default tracking-widest shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Clearance Type Toggle */}
                      <div className="pt-2 border-t border-gray-100">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 block text-center">
                          Select Purpose of Application / Layunin ng Paghiling
                        </label>
                        <div className="flex flex-col md:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                clearanceType: "new",
                              }))
                            }
                            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                              formData.clearanceType === "new"
                                ? "bg-[#2d5a3d] border-[#2d5a3d] text-white shadow-lg"
                                : "bg-white border-emerald-100 text-gray-700 hover:border-[#2d5a3d]/30"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${formData.clearanceType === "new" ? "border-white bg-white/20" : "border-emerald-200"}`}
                            >
                              {formData.clearanceType === "new" && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black uppercase tracking-tight">
                                New Business Clearance
                              </p>
                              <p
                                className={`text-sm font-bold uppercase opacity-70 ${formData.clearanceType === "new" ? "text-white" : "text-emerald-700"}`}
                              >
                                Bagong Clearance
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                clearanceType: "renewal",
                              }))
                            }
                            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                              formData.clearanceType === "renewal"
                                ? "bg-[#2d5a3d] border-[#2d5a3d] text-white shadow-lg"
                                : "bg-white border-emerald-100 text-gray-700 hover:border-[#2d5a3d]/30"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${formData.clearanceType === "renewal" ? "border-white bg-white/20" : "border-emerald-200"}`}
                            >
                              {formData.clearanceType === "renewal" && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black uppercase tracking-tight">
                                Renewal of Existing Clearance
                              </p>
                              <p
                                className={`text-sm font-bold uppercase opacity-70 ${formData.clearanceType === "renewal" ? "text-white" : "text-emerald-700"}`}
                              >
                                Pag-renew ng Clearance
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Owner Details */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm">
                          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                            2
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">
                              Owner's Details / Detalye ng May-ari
                            </h3>
                            <p className="text-sm text-white/90 font-medium tracking-wide">
                              Select from resident directory / Pumili mula sa
                              direktoryo
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsResidentModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Access Resident Directory / Mag-access sa Directory ng
                          Residente
                        </button>
                      </div>

                      {/* Owner Name (read-only, click to search) */}
                      <div className="relative group">
                        <label
                          className="text-sm font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1 block"
                          style={{ fontFamily: "Open Sans, sans-serif" }}
                        >
                          Business Owner Full Name / Buong Pangalan ng May-ari{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ownerFullName"
                          value={formData.ownerFullName}
                          readOnly
                          onClick={() => setIsResidentModalOpen(true)}
                          placeholder="TAP HERE TO SELECT FROM RESIDENT / PUMILI MULA SA RESIDENTE DIRECTORY..."
                          style={{ fontFamily: "Open Sans, sans-serif" }}
                          className={`w-full px-4 py-3 bg-white border-2 ${errors.ownerFullName ? "border-red-500 bg-red-50" : formData.ownerFullName ? "border-emerald-200 ring-2 ring-emerald-50 text-emerald-900" : "border-gray-100 text-gray-400 italic"} rounded-lg transition-all duration-300 font-bold text-base cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`}
                        />
                      </div>

                      {formData.ownerFullName && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-center gap-2 text-emerald-700 shadow-inner">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <span className="text-sm font-bold uppercase tracking-wide italic">
                            Personal Data Protected Under Data Privacy Act
                          </span>
                        </div>
                      )}

                      {/* Owner Address */}
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Owner Complete Address
                          / Kumpletong Tirahan{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ownerAddress"
                          value={formData.ownerAddress}
                          onChange={handleInputChange}
                          placeholder="Auto-filled or type manually..."
                          className={inputClass("ownerAddress")}
                        />
                      </div>
                    </div>

                    {/* Section 3: Business Details */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                          3
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            Business Details / Detalye ng Negosyo
                          </h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">
                            Information about the business establishment
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                            <Store className="w-3 h-3" /> Business Name /
                            Pangalan ng Negosyo{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            placeholder="e.g. Juan's Sari-Sari Store"
                            className={inputClass("businessName")}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Nature of Business
                            / Uri ng Negosyo{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="natureOfBusiness"
                            value={formData.natureOfBusiness}
                            onChange={handleInputChange}
                            className={selectClass("natureOfBusiness")}
                          >
                            <option value="">
                              -- Select Nature of Business --
                            </option>
                            {[
                              "Retail / Tingian",
                              "Food & Beverage / Pagkain at Inumin",
                              "Service / Serbisyo",
                              "Manufacturing / Pagawaan",
                              "Wholesale / Pakyawan",
                              "Trading / Pangangalakal",
                              "Online / Online Business",
                              "Contracting / Kontratista",
                              "Repair Shop / Tindahan ng Pagaayos",
                              "Salon / Beauty Shop / Parlor",
                              "Carinderia / Eatery / Kainan",
                              "Buy & Sell / Pagbili at Pagbenta",
                              "Other / Iba pa",
                            ].map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Business Address /
                          Address ng Negosyo{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="businessAddress"
                          value={formData.businessAddress}
                          onChange={handleInputChange}
                          placeholder="Purok / Street / Barangay where business is located..."
                          className={inputClass("businessAddress")}
                        />
                      </div>
                    </div>

                    {/* Section 4: Contact Information */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                          4
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            Notification & Contact / Notipikasyon at Kontak
                          </h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">
                            Where to receive updates about your application
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">
                            Email Address (Optional)
                            <span class="hidden sm:inline">
                              {" "}
                              / Email (Opsyonal)
                            </span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100">
                              <Mail className="w-4 h-4 text-[#2d5a3d]/50" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="username@example.com"
                              className={`w-full pl-12 pr-4 py-2.5 bg-white border-2 ${errors.email ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-normal text-gray-800 shadow-sm`}
                            />
                          </div>
                          <p className="text-sm text-gray-400 font-bold italic ml-2">
                            Notifications will be sent here
                            <span class="hidden sm:inline">
                              {" "}
                              / Dito ipapadala ang mga abiso
                            </span>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">
                            Contact Number
                            <span class="hidden sm:inline">
                              {" "}
                              / Numero ng Telepono
                            </span>{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100">
                              <Phone className="w-4 h-4 text-[#2d5a3d]/50" />
                            </div>
                            <input
                              type="tel"
                              name="contactNumber"
                              value={formData.contactNumber}
                              onChange={handleInputChange}
                              placeholder="09XX XXX XXXX"
                              className={`w-full pl-12 pr-4 py-2.5 bg-white border-2 ${errors.contactNumber ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print flex-shrink-0">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wide hidden sm:block">
                    Please verify all data for commercial accuracy / Pakisuri
                    ang lahat ng datos para sa katumpakan
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-gray-200 text-gray-500 hover:bg-white hover:text-[#112e1f] hover:border-[#112e1f]/20 rounded-lg font-bold uppercase tracking-wide text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all group"
                    >
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Submit Business Filing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Popup */}
        {showConfirmationPopup && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
                onClick={() => setShowConfirmationPopup(false)}
              />
              <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in"
                style={{
                  minHeight: "800px",
                  height: "90vh",
                  maxHeight: "95vh" /* BUST-CACHE-800 */,
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl">
                      <Building2 className="w-5 h-5 text-white shadow-sm" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md uppercase">
                      Review Application / Suriin ang Aplikasyon
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50/80">
                  <div className="max-w-2xl mx-auto space-y-3">
                    {Object.entries(formData).map(([key, value]) => {
                      const excludedKeys = [
                        "residentId",
                        "age",
                        "sex",
                        "civilStatus",
                        "dateOfBirth",
                        "placeOfBirth",
                        "applicationDate",
                        "applicationNo",
                        "contactPerson",
                      ];
                      if (!value || excludedKeys.includes(key)) return null;
                      const labelMap = {
                        ownerFullName: "Owner Full Name",
                        ownerAddress: "Owner Address",
                        businessName: "Business Name",
                        natureOfBusiness: "Nature of Business",
                        businessAddress: "Business Address",
                        contactNumber: "Contact Number",
                        email: "Email Address",
                        clearanceType: "Clearance Type",
                      };
                      const formattedKey =
                        labelMap[key] ||
                        key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase());
                      return (
                        <div
                          key={key}
                          className="flex flex-col md:flex-row md:items-center justify-between px-4 py-2.5 bg-white shadow-sm border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                            {formattedKey}
                          </span>
                          <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : value.toString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t bg-gray-50/80 backdrop-blur-[2px] px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print">
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-lg font-bold flex items-center justify-center gap-2 outline-none"
                  >
                    <Eye className="w-4 h-4" /> Go Back & Edit / Bumalik sa
                    Pag-edit
                  </button>
                  <button
                    onClick={handleProceedSubmission}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all"
                  >
                    {isSubmitting ? "Processing..." : "Confirm & Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
              <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-6 py-6 text-center relative">
                  <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                    <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    Filing Complete! / Tapos na ang Pag-file!
                  </h2>
                </div>
                <div className="p-4 text-center">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      REFERENCE NO:
                    </p>
                    <p className="text-xl font-bold text-green-900 font-mono tracking-wider">
                      {submittedReferenceNumber}
                    </p>
                  </div>
                  <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-lg p-4 relative overflow-hidden text-left mb-4">
                    <div className="flex items-center gap-2 text-[#112e1f] mb-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      <h4 className="text-sm font-bold uppercase tracking-wide">
                        Next Procedures / Susunod na Pamamaraan
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold leading-relaxed">
                          Processing typically takes 3-5 business days for
                          commercial background verification.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold leading-relaxed">
                          We will coordinate via{" "}
                          <strong>SMS at {formData.contactNumber}</strong> once
                          your permit is ready for collection.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      resetForm();
                      onClose();
                    }}
                    className="w-full bg-[#112e1f] text-white py-3 rounded-lg font-bold uppercase transition-all shadow-lg active:scale-95"
                  >
                    Return to Dashboard / Bumalik sa Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isResidentModalOpen && (
          <ResidentSearchModal
            isOpen={isResidentModalOpen}
            onClose={() => setIsResidentModalOpen(false)}
            onSelect={handleResidentSelect}
          />
        )}

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          input::placeholder,
          textarea::placeholder,
          select::placeholder {
            font-family: "Open Sans", sans-serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
          input::-webkit-input-placeholder,
          textarea::-webkit-input-placeholder {
            font-family: "Open Sans", sans-serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
          input::-moz-placeholder,
          textarea::-moz-placeholder {
            font-family: "Open Sans", sans-serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
          input:-ms-input-placeholder,
          textarea:-ms-input-placeholder {
            font-family: "Open Sans", sans-serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
        `}</style>
      </div>
    </>
  );
}

import { useState, useEffect } from "react";
import {
  X,
  GraduationCap,
  User,
  MapPin,
  Phone,
  Award,
  FileText,
  AlertCircle,
  CheckCircle,
  Pen,
  Search,
  Info,
  Clock,
  Send,
  Eye,
} from "lucide-react";
import SignatureInput from "../UI/SignatureInput";
import ResidentSearchModal from "../Modals/ResidentSearchModal";

export default function EducationalAssistanceModal({
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
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    gender: "",
    civilStatus: "",
    purok: "",
    houseNumber: "",
    phaseNumber: "",
    blockNumber: "",
    lotNumber: "",
    cellphoneNumber: "",
    yearGrade: "",
    schoolToAttend: "",
    schoolAttending: "",
    academicAwards: "",
    gwa: "",
    email: "",
    residentId: null,
  });

  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const handleResidentSelect = (resident) => {
    setFormData((prev) => ({
      ...prev,
      firstName: resident.first_name || "",
      middleName: resident.middle_name || "",
      lastName: resident.last_name || "",
      age: resident.age || "",
      gender: resident.gender
        ? resident.gender.charAt(0).toUpperCase() +
          resident.gender.slice(1).toLowerCase()
        : "",
      civilStatus: resident.civil_status
        ? resident.civil_status.charAt(0).toUpperCase() +
          resident.civil_status.slice(1).toLowerCase()
        : "",
      cellphoneNumber: resident.contact_number || prev.cellphoneNumber,
      email: resident.email || prev.email,
      residentId: resident.id,
    }));
    setIsResidentModalOpen(false);
    setErrors((prev) => ({ ...prev, firstName: false }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "purok",
      "cellphoneNumber",
      "yearGrade",
      "schoolToAttend",
      "schoolAttending",
      "gwa",
    ];
    const newErrors = {};

    required.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }

    if (formData.purok === "NV9") {
      if (!formData.phaseNumber) newErrors.phaseNumber = true;
      if (!formData.blockNumber) newErrors.blockNumber = true;
      if (!formData.lotNumber) newErrors.lotNumber = true;
    } else if (formData.purok) {
      if (!formData.houseNumber) newErrors.houseNumber = true;
    }

    if (!signature) {
      newErrors.signature = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitStatus("error");
      return false;
    }
    return true;
  };

  const generateFullAddress = () => {
    const { purok, houseNumber, phaseNumber, blockNumber, lotNumber } =
      formData;
    let address = "";

    if (purok === "NV9") {
      address = `Phase ${phaseNumber}, Block ${blockNumber}, Lot ${lotNumber}, NV9`;
    } else {
      address = `House #${houseNumber}, ${purok}`;
    }

    return `${address}, Iba O' Este, Calumpit, Bulacan`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const timestamp = Date.now().toString().slice(-6);
      const refNum = `EA-${new Date().getFullYear()}-${timestamp}`;

      const response = await fetch("/api/portal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id":
            tenantConfig?.tenant_id || (isDemo ? "demo" : "ibaoeste"),
        },
        body: JSON.stringify({
          type: "educational_assistance",
          formData: {
            ...formData,
            fullName:
              `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
            address: generateFullAddress(),
            referenceNumber: refNum,
            details: {
              gwa: formData.gwa ? parseFloat(formData.gwa) : null,
              schoolToAttend: formData.schoolToAttend,
              schoolAttending: formData.schoolAttending,
              yearGrade: formData.yearGrade,
              academicAwards: formData.academicAwards,
              signature: signature,
            },
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReferenceNumber(result.referenceNumber);
        setShowSuccessModal(true);
      } else {
        setSubmitStatus("error");
        console.error("Submission error:", result.message);
      }
    } catch (error) {
      setSubmitStatus("error");
      console.error("Network error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      age: "",
      gender: "",
      civilStatus: "",
      purok: "",
      houseNumber: "",
      phaseNumber: "",
      blockNumber: "",
      lotNumber: "",
      cellphoneNumber: "",
      email: "",
      yearGrade: "",
      schoolToAttend: "",
      schoolAttending: "",
      academicAwards: "",
      gwa: "",
      residentId: null,
    });
    setSignature(null);
    setSubmitStatus(null);
    setReferenceNumber("");
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

  return (
    <>
      {demoTheme}
      <div className="brgy-modal-wrap">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-hidden">
          <div
            className="relative bg-white md:rounded-3xl shadow-2xl w-full max-w-[1400px] h-full md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden animate-fade-in no-scrollbar"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            {/* Premium Nature Header */}
            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-4 md:px-8 md:py-8 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

              <div className="flex items-center gap-3 md:gap-5 relative z-10">
                <div className="bg-white/10 backdrop-blur-lg p-2 md:p-3.5 rounded-xl md:rounded-2xl border border-white/20 shadow-xl">
                  <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-white leading-none tracking-tight">
                    Educational Assistance
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <p className="text-white text-sm md:text-sm font-black uppercase tracking-widest px-4 py-1.5 bg-red-600 rounded-l-full rounded-tr-md rounded-br-md shadow-md mt-2 block">
                      Scholarship Filing Portal
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white p-2 md:p-2.5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all duration-300 group"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Optimized Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Status/Notice Section */}
              <div className="p-4 md:p-8 space-y-6">
                <div className="bg-amber-50 border-l-[6px] border-amber-500 rounded-r-2xl p-5 shadow-sm relative overflow-hidden mb-6 flex-shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-full shadow-md mt-1 shrink-0">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-2.5 flex-1">
                      <div>
                        <h4 className="font-extrabold text-amber-900 uppercase tracking-widest text-sm flex items-center gap-2 mb-1">
                          Registration Notice
                          <span class="hidden sm:inline"> / Paunawa</span>
                        </h4>
                        <p className="text-amber-800 text-sm font-bold leading-relaxed mb-1">
                          If no record is found in the resident directory,
                          please visit the Barangay Hall and coordinate with the
                          staff to register.
                        </p>
                        <p className="text-amber-800/80 text-sm font-bold leading-relaxed">
                          <span class="hidden sm:block">
                            Kung walang rekord sa direktoryo ng residente,
                            mangyaring pumunta sa Barangay Hall upang
                            magparehistro sa ating mga kawani.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {submitStatus === "error" && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4 animate-shake">
                    <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wide">
                        Filing Error Occurred
                      </h4>
                      <p className="text-rose-700 text-sm text-balance">
                        Pakisuri ang mga patlang na may pulang border o ang
                        iyong lagda or punan ang lahat ng kinakailangang
                        impormasyon.
                      </p>
                    </div>
                  </div>
                )}

                <form className="space-y-12">
                  {/* Step 1: Personal Profile */}
                  <div className="space-y-4 md:space-y-6 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                          1
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                            Personal Profile
                          </h3>
                          <p className="text-sm text-white/90 font-bold uppercase tracking-widest">
                            Verified Community Identity
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsResidentModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-2xl text-sm font-black transition-all duration-300 shadow-sm hover:shadow-emerald-900/10 group"
                      >
                        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Search Resident Database
                        <span class="hidden sm:inline">
                          {" "}
                          / Maghanap sa Database ng Residente
                        </span>
                      </button>
                    </div>

                    <div className="relative group">
                      <div
                        className={`absolute inset-0 bg-emerald-500/5 rounded-3xl blur-2xl opacity-0 ${formData.firstName ? "opacity-100" : ""} transition-opacity duration-500`}
                      ></div>
                      <div className="relative space-y-4">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-[0.2em] ml-1 block opacity-60">
                          Applicant Full Name
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              readOnly
                              placeholder="TAP TO SEARCH..."
                              onClick={() => setIsResidentModalOpen(true)}
                              className={`w-full px-4 py-3 md:px-6 md:py-4.5 bg-white border-2 ${errors.firstName ? "border-red-500 bg-red-50" : formData.firstName ? "border-emerald-200 ring-2 ring-emerald-50 text-emerald-900" : "border-gray-100 text-gray-400 italic"} rounded-2xl transition-all duration-300 font-black text-base md:text-lg cursor-pointer hover:border-emerald-300 shadow-sm text-center`}
                            />
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest text-center block">
                              First Name / Pangalan
                            </span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={formData.middleName}
                              readOnly
                              disabled
                              className="w-full px-4 py-3 md:px-6 md:py-4.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold text-center italic"
                            />
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest text-center block">
                              Middle Name
                            </span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={formData.lastName}
                              readOnly
                              disabled
                              className="w-full px-4 py-3 md:px-6 md:py-4.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold text-center italic"
                            />
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest text-center block">
                              Last Name / Apelyido
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Contact & Identification */}
                  <div className="space-y-4 md:space-y-6 animate-fade-in-up [animation-delay:0.1s]">
                    <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                          Notification & Residency
                        </h3>
                        <p className="text-sm text-white/90 font-bold uppercase tracking-widest">
                          Where to receive your updates
                          <span class="hidden sm:inline">
                            {" "}
                            / Kung saan matatanggap ang mga update
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 relative group">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Email Address (Optional)
                          <span class="hidden sm:inline">
                            {" "}
                            / Email (Opsyonal)
                          </span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none border-r pr-3 border-gray-100">
                            <Pen className="w-4 h-4 text-emerald-600/50" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="username@example.com"
                            className={`w-full pl-14 pr-6 py-4 bg-white border-2 ${errors.email ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-2xl focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-normal text-emerald-900 shadow-sm`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 relative group">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          SMS Alert Receiver{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none border-r pr-3 border-gray-100">
                            <Phone className="w-4 h-4 text-emerald-600/50" />
                          </div>
                          <input
                            type="tel"
                            name="cellphoneNumber"
                            value={formData.cellphoneNumber}
                            onChange={handleInputChange}
                            placeholder="09XX XXX XXXX"
                            className={`w-full pl-14 pr-6 py-4 bg-white border-2 ${errors.cellphoneNumber ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-2xl focus:border-emerald-500 outline-none font-black text-emerald-900 shadow-sm`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Purok / Area Unit{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="purok"
                          value={formData.purok}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.purok ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none font-black text-emerald-900 appearance-none cursor-pointer`}
                        >
                          <option value="">
                            SELECT AREA... / PUMILI NG PUROK...
                          </option>
                          {[
                            "Purok 1",
                            "Purok 2",
                            "Purok 3",
                            "Purok 4",
                            "Purok 5",
                            "Purok 6",
                            "NV9",
                          ].map((p) => (
                            <option key={p} value={p}>
                              {p.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Identification Number / Numero ng Pagkakakilanlan{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        {formData.purok === "NV9" ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                name="phaseNumber"
                                value={formData.phaseNumber}
                                onChange={handleInputChange}
                                placeholder="PH"
                                className={`w-full px-4 py-4 bg-white border-2 ${errors.phaseNumber ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-xl focus:border-[#2d5a3d] outline-none text-center font-black`}
                              />
                              <span className="text-sm text-gray-400 font-black uppercase text-center block">
                                Phase / Bahagi
                              </span>
                            </div>
                            <div className="space-y-1">
                              <input
                                type="text"
                                name="blockNumber"
                                value={formData.blockNumber}
                                onChange={handleInputChange}
                                placeholder="BLK"
                                className={`w-full px-4 py-4 bg-white border-2 ${errors.blockNumber ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-xl focus:border-[#2d5a3d] outline-none text-center font-black`}
                              />
                              <span className="text-sm text-gray-400 font-black uppercase text-center block">
                                Block / Bloke
                              </span>
                            </div>
                            <div className="space-y-1">
                              <input
                                type="text"
                                name="lotNumber"
                                value={formData.lotNumber}
                                onChange={handleInputChange}
                                placeholder="LOT"
                                className={`w-full px-4 py-4 bg-white border-2 ${errors.lotNumber ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-xl focus:border-[#2d5a3d] outline-none text-center font-black`}
                              />
                              <span className="text-sm text-gray-400 font-black uppercase text-center block">
                                Lot / Lote
                              </span>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            name="houseNumber"
                            value={formData.houseNumber}
                            onChange={handleInputChange}
                            placeholder="ENTER HOUSE NUMBER... / ILAGAY ANG NUMERO NG BAHAY..."
                            className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.houseNumber ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none font-black text-emerald-900 uppercase`}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Academic Information */}
                  <div className="space-y-4 md:space-y-6 animate-fade-in-up [animation-delay:0.2s]">
                    <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                          Academic Profile / Akademikong Profile
                        </h3>
                        <p className="text-sm text-white/90 font-bold uppercase tracking-widest">
                          Educational Status & performance / Katayuan sa
                          Edukasyon
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Level / Grade (A.Y. 2024-2025) / Taon o Antas{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="yearGrade"
                          value={formData.yearGrade}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.yearGrade ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none font-black text-emerald-900 cursor-pointer`}
                        >
                          <option value="">
                            SELECT LEVEL... / PUMILI NG ANTAS...
                          </option>
                          {[
                            "Grade 7 / Baitang 7",
                            "Grade 8 / Baitang 8",
                            "Grade 9 / Baitang 9",
                            "Grade 10 / Baitang 10",
                            "Grade 11 / Baitang 11",
                            "Grade 12 / Baitang 12",
                            "1st Year College / Unang Taon Kolehiyo",
                            "2nd Year College / Ikalawang Taon Kolehiyo",
                            "3rd Year College / Ikatlong Taon Kolehiyo",
                            "4th Year College / Ika-4 na Taon Kolehiyo",
                            "5th Year College / Ika-5 Taon Kolehiyo",
                          ].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          General Weighted Average / Pangkalahatang Average{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="gwa"
                            value={formData.gwa}
                            onChange={handleInputChange}
                            step="0.01"
                            placeholder="ENTER GWA (E.G. 1.25)... / ILAGAY ANG GWA (HAL. 1.25)..."
                            className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.gwa ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none`}
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-black">
                            NUMERIC
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Target Institution{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="schoolToAttend"
                          value={formData.schoolToAttend}
                          onChange={handleInputChange}
                          placeholder="PAARALANG PAPASUKAN..."
                          className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.schoolToAttend ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase`}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                          Current Institution
                        </label>
                        <input
                          type="text"
                          name="schoolAttending"
                          value={formData.schoolAttending}
                          onChange={handleInputChange}
                          placeholder="PAARALANG PINAPASUKAN (OPTIONAL)..."
                          className="w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                        Honorary Awards Received
                      </label>
                      <textarea
                        name="academicAwards"
                        value={formData.academicAwards}
                        onChange={handleInputChange}
                        placeholder="E.G. DEAN'S LISTER, WITH HIGH HONORS, ETC..."
                        rows={2}
                        className="w-full px-4 py-3 md:px-6 md:py-5 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-extrabold text-[#112e1f] outline-none uppercase placeholder:text-gray-300 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Step 4: Digital Verification */}
                  <div className="space-y-4 md:space-y-6 animate-fade-in-up [animation-delay:0.3s]">
                    <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                          Identity Validation
                        </h3>
                        <p className="text-sm text-white/90 font-bold uppercase tracking-widest">
                          Digital Signature & Contact
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block">
                            SMS Alert Receiver{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              name="cellphoneNumber"
                              value={formData.cellphoneNumber}
                              onChange={handleInputChange}
                              placeholder="09XX XXX XXXX"
                              className={`w-full px-4 py-3 md:px-6 md:py-4 bg-white border-2 ${errors.cellphoneNumber ? "border-red-500 bg-red-50" : "border-emerald-100"} rounded-2xl focus:border-emerald-500 outline-none font-black text-emerald-900 shadow-sm`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                          </div>
                          <p className="text-sm text-emerald-700/60 font-bold italic leading-tight">
                            We will send a status update for your scholarship
                            eligibility via SMS.
                          </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
                          <div className="flex items-center gap-2 text-amber-800 mb-1">
                            <Pen className="w-4 h-4" />
                            <h4 className="text-sm font-black uppercase tracking-widest">
                              Legal Declaration
                            </h4>
                          </div>
                          <p className="text-sm text-amber-800/80 leading-relaxed font-bold">
                            Sa pagpipirma, pinapatunayan ko na ang lahat ng
                            datos ay totoo at tama. Ito ay may katumbas na legal
                            na pananagutan.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-emerald-800 uppercase tracking-widest ml-1 block text-center">
                          Digital Thumbmark / Signature{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div
                          className={`bg-white border-2 ${errors.signature ? "border-red-500 bg-red-50" : "border-gray-100"} rounded-3xl p-4 shadow-inner ring-4 ring-gray-50 transition-all hover:ring-emerald-50 focus-within:ring-emerald-50`}
                        >
                          <SignatureInput
                            onSignatureChange={(sig) => {
                              setSignature(sig);
                              if (errors.signature) {
                                setErrors((prev) => ({
                                  ...prev,
                                  signature: false,
                                }));
                              }
                            }}
                            label="Applicant's Digital Signature"
                            required={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row gap-4 justify-between items-center no-print pb-6 md:pb-6 flex-shrink-0 safe-pb">
              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] hidden sm:block">
                Verify information before final filing / Suriin ang impormasyon
                bago ang pinal na pagpapasa
              </p>

              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-8 py-4 border-2 border-gray-200 text-gray-500 hover:bg-white hover:text-[#112e1f] hover:border-[#112e1f]/20 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-12 py-4 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl hover:shadow-emerald-900/40 transform hover:-translate-y-1 transition-all duration-500 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Filing Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      SUBMIT SCHOLARSHIP FILING
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Modal Overlay */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#0a1b12]/90 backdrop-blur-xl animate-fade-in" />

              <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-white/20">
                {/* Success Header */}
                <div className="bg-gradient-to-br from-[#112e1f] to-[#214431] px-10 py-12 text-center relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                  <div className="w-24 h-24 bg-emerald-500/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-2xl animate-bounce-subtle">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
                    Filing Successful!
                  </h2>
                  <p className="text-emerald-300/60 text-sm font-black uppercase tracking-[0.2em]">
                    Application Queued For Review
                  </p>
                </div>

                {/* Success Details */}
                <div className="p-8 text-center space-y-4 md:space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-8 shadow-inner relative group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <p className="text-sm font-black text-emerald-800 uppercase tracking-[0.3em] mb-4 opacity-50">
                      Reference ID
                    </p>
                    <p className="text-4xl font-black text-[#112e1f] font-mono tracking-tighter scale-110">
                      {referenceNumber}
                    </p>
                  </div>

                  <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-2xl p-6 relative overflow-hidden text-left">
                    <div className="flex items-center gap-3 text-[#112e1f] mb-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      <h4 className="text-sm font-black uppercase tracking-[0.1em]">
                        Next Procedures
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                          <Clock className="w-4 h-4 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold leading-relaxed">
                          System-wide verification of your GWA and Residence
                          status will commence immediately.
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                          <Phone className="w-4 h-4 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold leading-relaxed">
                          Our staff will coordinate via <strong>SMS</strong> to
                          confirm if you meet the scholarship criteria.
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
                    className="w-full bg-[#112e1f] hover:bg-[#112117] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl hover:shadow-emerald-900/30 transform active:scale-95 group"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          <ResidentSearchModal
            isOpen={isResidentModalOpen}
            onClose={() => setIsResidentModalOpen(false)}
            onSelect={handleResidentSelect}
          />

          <style jsx>{`
            .animate-fade-in {
              animation: fadeIn 0.4s ease-out forwards;
            }
            .animate-fade-in-up {
              opacity: 0;
              animation: fadeInUp 0.5s ease-out 0.2s forwards;
            }
            .animate-scale-in {
              animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-bounce-subtle {
              animation: bounceSubtle 3s infinite;
            }
            .animate-shake {
              animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            }

            /* Open Sans Italic Placeholders */
            input::placeholder,
            textarea::placeholder,
            select::placeholder {
              font-family: "Open Sans", sans-serif !important;
              font-style: italic !important;
              font-weight: 400 !important;
            }

            input::-webkit-input-placeholder,
            textarea::-webkit-input-placeholder,
            select::-webkit-input-placeholder {
              font-family: "Open Sans", sans-serif !important;
              font-style: italic !important;
              font-weight: 400 !important;
            }

            input::-moz-placeholder,
            textarea::-moz-placeholder,
            select::-moz-placeholder {
              font-family: "Open Sans", sans-serif !important;
              font-style: italic !important;
              font-weight: 400 !important;
            }

            input:-ms-input-placeholder,
            textarea:-ms-input-placeholder,
            select:-ms-input-placeholder {
              font-family: "Open Sans", sans-serif !important;
              font-style: italic !important;
              font-weight: 400 !important;
            }

            input:-moz-placeholder,
            textarea:-moz-placeholder,
            select:-moz-placeholder {
              font-family: "Open Sans", sans-serif !important;
              font-style: italic !important;
              font-weight: 400 !important;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes bounceSubtle {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-10px);
              }
            }
            @keyframes shake {
              10%,
              90% {
                transform: translate3d(-1px, 0, 0);
              }
              20%,
              80% {
                transform: translate3d(2px, 0, 0);
              }
              30%,
              50%,
              70% {
                transform: translate3d(-4px, 0, 0);
              }
              40%,
              60% {
                transform: translate3d(4px, 0, 0);
              }
            }

            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #112e1f20;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #112e1f40;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

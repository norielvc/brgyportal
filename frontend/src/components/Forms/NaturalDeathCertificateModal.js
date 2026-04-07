import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Eye,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Clock,
  Phone,
  Mail,
  Flower2,
} from "lucide-react";
import ResidentSearchModal from "../Modals/ResidentSearchModal";

// Default officials data (fallback)
const defaultOfficials = {
  chairman: "ALEXANDER C. MANIO",
  secretary: "ROYCE ANN C. GALVEZ",
  contactInfo: {
    address: "Purok 2 (Sitio Banawe) Barangay Iba O' Este, Calumpit, Bulacan",
    telephone: "0967 631 9168",
    email: "anneseriousme@gmail.com",
  },
  headerInfo: {
    country: "Republic of the Philippines",
    province: "Province of Bulacan",
    municipality: "Municipality of Calumpit",
    barangayName: "BARANGAY IBA O' ESTE",
    officeName: "Office of the Punong Barangay",
  },
  logos: {
    leftLogo: "/iba-o-este.png",
    rightLogo: "/calumpit.png",
    logoSize: 115,
  },
};

const PURPOSE_LIST_1 = [
  "PERSONAL LOAN - GM SYNERGY MICROFINANCE INC. (CITY OF MALOLOS, BULACAN)",
  "TESDA / SCHOOLING REQUIREMENT",
  "NATIONAL BUREAU OF INVESTIGATION (NBI) REQUIREMENT",
  "TAXPAYER IDENTIFICATION NUMBER (TIN) REQUIREMENT",
  "SOCIAL SECURITY SYSTEM (SSS) REQUIREMENT",
  "PAG-IBIG REQUIREMENT",
  "PHILHEALTH REQUIREMENT",
  "*TAXPAYER IDENTIFICATION NUMBERS (TIN) REQUIREMENT",
  "PERSONAL LOAN - BPI BANKO (CALUMPIT, BULACAN BRANCH)",
  "PERSONAL LOAN* - MERZON & SON FINANCING CORPORATION",
  "POSTAL ID REQUIREMENT - WORK / JOB APPLICATION",
  "CONVERGE INTERNET CONNECTION REQUIREMNET",
  "APPLICATION FOR PERSON WITH DISABILITIES (PWD)*",
  "APPLICATION FOR SENIOR CITIZEN'S ID*",
  "APPLICATION FOR WATER SERVICE CONNECTION (CAWADI)",
  "APPLICATION FOR ELECTRICAL SERVICE CONNECTION (MERALCO)",
  "SCHOLARSHIP ASSISTANCE - LCDFI*",
  "APPLICATION FOR ELECTRICAL SERVICE CONNECTION (MERALCO)*",
  "APPLICATION FOR SENIOR CITIZEN'S ID (OSCA)*",
  "TESDA* - NATIONAL CERTIFICATE II (NCII) APPLICATION REQUIREMENT",
  "SCHOLARSHIP ASSISTANCE* - LA CONSOLACION UNIVERSITY PHILPPINES (LCUP)",
  "PERSONAL LOAN* - LIFEBANK MICROFINANCE FOUNDATION INC.",
  "PERSONAL LOAN - ASA PHILIPPINES FOUNDATION MICRO FINANCE (CAL., BUL)",
  "PERSONAL LOAN - BPI BANKO (CALUMPIT, BULACAN BRANCH)",
  "PERSONAL LOAN - CASHLINE LENDING CORP. (PULILAN, BULACAN)",
  "PERSONAL LOAN - FAST AND EASY LENDING CORP. (CITY OF MAL., BUL.)",
  "PERSONAL LOAN - GM SYNERGY MICROFINANCE INC. (PULILAN, BULACAN)",
  "PERSONAL LOAN - KASAGANA (MALOLOS, BULACAN)",
  "PERSONAL LOAN - KASAGANA LENDING (CITY OF MALOLOS, BUL.)",
  "PERSONAL LOAN - LIBERTY LENDING (APALIT, PAMPANGA)",
  "PERSONAL LOAN - LIGHT MICRO FINANCE (MALOLOS, BULACAN)",
  "PERSONAL LOAN - PAG-ASA LENDING (CITY OF MALOLOS, BUL.)",
  "PERSONAL LOAN - SKY GO (CALUMPIT, BULACAN)",
  "PERSONAL LOAN - SUPERBIKES CENTER (CALUMPIT, BULACAN)",
  "PERSONAL LOAN - TALETE MICRO FINANCE (LONGOS, CITY OF MAL., BUL.)",
  "PERSONAL LOAN - WHEELTEK (CITY OF MALOLOS, BULACAN BRANCH)",
  "PERSONAL LOAN* - MITSUKOSHI MOTORS PHILIPPINES INC.",
  "PERSONAL LOAN - DSE LENDING INC. (CALUMPIT, BULACAN)",
  "PERSONAL LOAN - 7R FINANCE CO. (MALOLOS, BULACAN)",
  "PERSONAL LOAN - C4 STAR KAAGAPAY (MALOLOS, BULACAN)",
  "CANIOGAN COOPERATIVE MEMBERSHIP REQUIREMENT",
  "PERSONAL LOAN - NWOW EBIKE (CALUMPIT, BULACAN) CO-MAKER",
  "PERSONAL LOAN* - L5 AND SONS FINANCING CORPORATION",
  "PERSONAL LOAN - 3R LENDING (APALIT, PAMPANGA)",
  "PERSONAL LOAN - BISIKLETA STA. RITA (CALUMPIT, BULACAN)",
  "PERSONAL LOAN - FASTER LENDING (CITY OF MALOLOS, BULACAN)",
  "PERSONAL LOAN* - JEMS MERCADO AND SONS LENDING CORP.",
  "PERSONAL LOAN - L5 MICROFINANCE (CITY OF MALOLOS, BUL.)",
  "APPLICATION FOR INTERNET SERVICE CONNECTION",
  "FOR NATASHA REQUIREMENT",
  "ON THE JOB TRAINING (OJT) REQUIREMENT",
  "POLICE CLEARANCE REQUIREMENT - FOR RENEWAL OF LTOP*",
  "PERSONAL LOAN - BPI BANKO (APALIT, PAMPANGA)",
  "PERSONAL LOAN - AJ MICROFINANCE (CITY OF MALOLOS, BULACAN)",
  "MERALCO - TRANSFER OF METER",
  "PERSONAL LOAN - GABAY ALAY (MALOLOS, BULACAN)",
  "PERSONAL LOAN - E1 LENDING (PULILAN, BULACAN)",
  "BANK TRANSACTION - OPEN ACCOUNT",
  "APPLICATION FOR BUILDING PERMIT REQUIREMENT",
  "POLICE CLEARANCE REQUIREMENT - WORK / JOB APPLICATION",
  "FOR SCHOOL ADMISSION REQUIREMENT",
].sort((a, b) => a.localeCompare(b));

const PURPOSE_LIST_2 = [
  "CALUMPIT BRANCH",
  "BUREAU OF INTERNAL REVENUE (TIKTOK CONTENT CREATOR)",
  "PULILAN, BULACAN BRANCH",
  "APPLYING FOR INTERNET INSTALLATION REQUIREMENT",
  "MEDICAL CERTIFICATE ATTACHED",
  "OFFICE OF SENIOR CITIZENS AFFAIRS (OSCA)",
  "LANDBANK COUNTRYSIDE DEVELOPMENT FOUNDATION, INC.",
  "OFFICE OF THE SENIOR CITIZENS AFFAIR (OSCA)",
  "SOLAR NET METERING",
  "OFFICE OF THE SENIOR CITIZEN'S AFFAIR",
  "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY",
  "CITY OF MALOLOS, BULACAN",
  "IKABUHI",
  "DAKILA MALOLOS, BULACAN BRANCH",
  "CALUMPIT, BULACAN",
  "LICENSE TO OWN AND POSSESS FIREARMS",
].sort((a, b) => a.localeCompare(b));

const PURPOSE_LIST_3 = [
  "Medical Bill",
  "Medical abstract",
  "MEDICAL prescription",
].sort((a, b) => a.localeCompare(b));

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

const SearchableDropdown = ({
  items,
  onSelect,
  placeholder,
  label,
  colorClass,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter(
    (p) => !search || p.toUpperCase().includes(search.toUpperCase()),
  );

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <p
        className={`text-sm font-bold ${colorClass.label} uppercase tracking-widest ml-1`}
      >
        {label}
      </p>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm p-2 bg-white border border-gray-200 rounded-lg font-bold ${colorClass.text} flex items-center justify-between shadow-sm hover:bg-gray-50 transition-all uppercase outline-none focus:ring-2 focus:ring-emerald-500/20`}
      >
        <span className="truncate">{placeholder}</span>
        <Search
          className={`w-3 h-3 ml-2 ${colorClass.icon} ${isOpen ? "rotate-180" : ""} transition-transform`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-fade-in flex flex-col min-w-[200px]">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${colorClass.icon} pointer-events-none`}
              />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full pl-8 pr-3 py-1.5 text-sm ${colorClass.bg} border border-gray-100 rounded-md outline-none focus:ring-2 ${colorClass.ring} ${colorClass.text} placeholder-gray-400 font-medium`}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[200px] no-scrollbar py-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-bold ${colorClass.text} hover:${colorClass.bg} transition-colors uppercase border-b border-gray-50 last:border-0`}
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function NaturalDeathCertificateModal({
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

  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [currentDate, setCurrentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState("");
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Deceased info
    deceasedFullName: "",
    deceasedAge: "",
    deceasedGender: "",
    deceasedCivilStatus: "",
    deceasedAddress: "",
    deceasedDateOfBirth: "",
    deceasedPlaceOfBirth: "",
    dateOfDeath: "",
    placeOfDeath: "",
    causeOfDeath: "",
    // Requester info
    requesterFullName: "",
    relationship: "",
    contactNumber: "",
    email: "",
    purpose: "",
    residentId: null,
  });

  const handleResidentSelect = (resident) => {
    setFormData((prev) => ({
      ...prev,
      deceasedFullName: resident.full_name,
      deceasedAge: resident.age || "",
      deceasedGender: resident.gender || "",
      deceasedCivilStatus: resident.civil_status || "",
      deceasedAddress: resident.residential_address || "",
      deceasedDateOfBirth: resident.date_of_birth
        ? new Date(resident.date_of_birth).toISOString().split("T")[0]
        : "",
      deceasedPlaceOfBirth: resident.place_of_birth || "",
      residentId: resident.id,
    }));
    setIsResidentModalOpen(false);
    setNotification({
      type: "success",
      title: "Profile Found",
      message: `${resident.full_name}'s details have been auto-filled.`,
    });
    setErrors((prev) => ({ ...prev, deceasedFullName: false }));
  };

  const handlePurposeSelect = (e) => {
    const selectedValue = e.target.value;
    if (!selectedValue) return;

    setFormData((prev) => {
      const currentPurpose = prev.purpose || "";
      // If the purpose already contains this exact value, don't add it again
      if (currentPurpose.includes(selectedValue)) return prev;

      const newPurpose = currentPurpose
        ? `${currentPurpose}\n${selectedValue}`
        : selectedValue;

      return { ...prev, purpose: newPurpose };
    });

    // Reset the dropdown after selection
    e.target.value = "";
  };

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
      setReferenceNumber("");
    }
  }, [isOpen]);

  useEffect(() => {
    const savedOfficials = localStorage.getItem("barangayOfficials");
    if (savedOfficials) {
      const parsed = JSON.parse(savedOfficials);
      setOfficials({
        ...defaultOfficials,
        ...parsed,
        contactInfo: { ...defaultOfficials.contactInfo, ...parsed.contactInfo },
        headerInfo: { ...defaultOfficials.headerInfo, ...parsed.headerInfo },
        logos: { ...defaultOfficials.logos, ...parsed.logos },
      });
    }
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
      "deceasedFullName",
      "dateOfDeath",
      "placeOfDeath",
      "causeOfDeath",
      "requesterFullName",
      "relationship",
      "contactNumber",
    ];
    const newErrors = {};
    required.forEach((field) => {
      if (!formData[field]) newErrors[field] = true;
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
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
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmationPopup(true);
  };

  const handleProceedSubmission = async () => {
    setIsSubmitting(true);
    try {
      // POINTED TO NEXT.JS RESILIENCE API
      const timestamp = Date.now().toString().slice(-6);
      const refNum = `ND-${new Date().getFullYear()}-${timestamp}`;

      const response = await fetch("/api/portal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id":
            tenantConfig?.tenant_id || (isDemo ? "demo" : "ibaoeste"),
        },
        body: JSON.stringify({
          type: "natural_death",
          formData: {
            ...formData,
            fullName: formData.deceasedFullName, // Map for backend compatibility
            address: formData.deceasedAddress,
            referenceNumber: refNum,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmittedReferenceNumber(result.referenceNumber);
        setReferenceNumber(result.referenceNumber);
        setShowConfirmationPopup(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (error) {
      setShowConfirmationPopup(false);
      setNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Could not submit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      deceasedFullName: "",
      deceasedAge: "",
      deceasedGender: "",
      deceasedCivilStatus: "",
      deceasedAddress: "",
      deceasedDateOfBirth: "",
      deceasedPlaceOfBirth: "",
      dateOfDeath: "",
      placeOfDeath: "",
      causeOfDeath: "",
      requesterFullName: "",
      relationship: "",
      contactNumber: "",
      email: "",
      purpose: "",
      residentId: null,
    });
    setShowPreview(false);
    setShowConfirmationPopup(false);
    setShowSuccessModal(false);
    setNotification(null);
    setReferenceNumber("");
    setSubmittedReferenceNumber("");
    setErrors({});
  };

  const [showPreview, setShowPreview] = useState(false);

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

  const SectionHeader = ({ num, title, subtitle }) => (
    <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
      <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
        {num}
      </div>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-white/90 font-medium tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

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
                      <Flower2 className="w-5 h-5 text-white shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                        Natural Death Certificate / Katunayan ng Likas na
                        Kamatayan
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                        <p className="text-white text-sm font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 rounded-md shadow-md">
                          {referenceNumber || "New Natural Death Request"}
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

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Notice */}
                    <div className="bg-gradient-to-r from-[#112e1f]/90 to-[#1a3d29]/80 border border-white/10 rounded-lg p-3 shadow-md relative overflow-hidden flex-shrink-0">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
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
                            Kung walang rekord sa direktoryo ng residente,
                            mangyaring pumunta sa Barangay Hall upang
                            magparehistro.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Deceased Information */}
                    <div className="space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <SectionHeader
                          num="1"
                          title="Deceased Information / Impormasyon ng Yumaong"
                          subtitle="Details of the person who passed away"
                        />
                        <button
                          type="button"
                          onClick={() => setIsResidentModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group"
                        >
                          <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Access Resident Directory / Mag-access sa Directory
                        </button>
                      </div>

                      <div className="relative group">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1 block">
                          Full Name of Deceased / Buong Pangalan ng Yumaong{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="deceasedFullName"
                          value={formData.deceasedFullName}
                          readOnly
                          onClick={() => setIsResidentModalOpen(true)}
                          placeholder="TAP HERE TO SELECT FROM RESIDENT DIRECTORY..."
                          className={`w-full px-4 py-3 bg-white border-2 ${errors.deceasedFullName ? "border-red-500 bg-red-50" : formData.deceasedFullName ? "border-emerald-200 ring-2 ring-emerald-50 text-emerald-900" : "border-gray-100 text-gray-400 italic"} rounded-lg transition-all duration-300 font-bold text-base cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            Date of Death / Petsa ng Kamatayan{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="dateOfDeath"
                            value={formData.dateOfDeath}
                            onChange={handleInputChange}
                            className={inputClass("dateOfDeath")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            Place of Death / Lugar ng Kamatayan{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="placeOfDeath"
                            value={formData.placeOfDeath}
                            onChange={handleInputChange}
                            placeholder="e.g. Barangay Health Center"
                            className={inputClass("placeOfDeath")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            Cause of Death / Dahilan ng Kamatayan{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="causeOfDeath"
                            value={formData.causeOfDeath}
                            onChange={handleInputChange}
                            placeholder="e.g. Natural causes / old age"
                            className={inputClass("causeOfDeath")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Requester Information */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <SectionHeader
                        num="2"
                        title="Requester Information / Impormasyon ng Humihiling"
                        subtitle="The person requesting the certificate"
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            Full Name of Requester / Pangalan ng Humihiling{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="requesterFullName"
                            value={formData.requesterFullName}
                            onChange={handleInputChange}
                            placeholder="Full name of the requester"
                            className={inputClass("requesterFullName")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            Relationship to Deceased / Relasyon sa Yumaong{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="relationship"
                            value={formData.relationship}
                            onChange={handleInputChange}
                            className={inputClass("relationship")}
                          >
                            <option value="">-- Select Relationship --</option>
                            <option value="Spouse">Spouse / Asawa</option>
                            <option value="Child">Child / Anak</option>
                            <option value="Parent">Parent / Magulang</option>
                            <option value="Sibling">Sibling / Kapatid</option>
                            <option value="Grandchild">Grandchild / Apo</option>
                            <option value="Relative">
                              Other Relative / Kamag-anak
                            </option>
                            <option value="Authorized Representative">
                              Authorized Representative
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Contact Details */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <SectionHeader
                        num="3"
                        title="Contact Details / Detalye ng Contact"
                        subtitle="Notification details / Detalye ng notification"
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email Address
                              (Optional)
                            </div>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="username@example.com"
                            className={inputClass("email")}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Contact Number
                              <span class="hidden sm:inline">
                                {" "}
                                / Numero ng Telepono
                              </span>{" "}
                              <span className="text-red-500">*</span>
                            </div>
                          </label>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleInputChange}
                            placeholder="09XX XXX XXXX"
                            className={inputClass("contactNumber")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Application Intent */}
                    <div className="pt-4 border-t border-gray-100">
                      <SectionHeader
                        num="4"
                        title="Application Intent / Layunin ng Aplikasyon"
                        subtitle="Purpose of your request / Dahilan ng inyong pagkuha"
                      />
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                            <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1">
                              Request Purpose / Dahilan ng Pagkuha{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <SearchableDropdown
                                label="Quick Select 1"
                                placeholder="-- PERSONAL LOAN & GOV'T --"
                                items={PURPOSE_LIST_1}
                                onSelect={(val) =>
                                  handlePurposeSelect({
                                    target: { value: val },
                                  })
                                }
                                colorClass={{
                                  label: "text-blue-400",
                                  text: "text-blue-600",
                                  icon: "text-blue-300",
                                  bg: "bg-blue-50",
                                  ring: "ring-blue-300",
                                }}
                              />
                              <SearchableDropdown
                                label="Quick Select 2"
                                placeholder="-- BRANCH & LOCAL --"
                                items={PURPOSE_LIST_2}
                                onSelect={(val) =>
                                  handlePurposeSelect({
                                    target: { value: val },
                                  })
                                }
                                colorClass={{
                                  label: "text-indigo-400",
                                  text: "text-indigo-600",
                                  icon: "text-indigo-300",
                                  bg: "bg-indigo-50",
                                  ring: "ring-indigo-300",
                                }}
                              />
                              <SearchableDropdown
                                label="Quick Select 3"
                                placeholder="-- MEDICAL NEEDS --"
                                items={PURPOSE_LIST_3}
                                onSelect={(val) =>
                                  handlePurposeSelect({
                                    target: { value: val },
                                  })
                                }
                                colorClass={{
                                  label: "text-emerald-500",
                                  text: "text-emerald-600",
                                  icon: "text-emerald-300",
                                  bg: "bg-emerald-50",
                                  ring: "ring-emerald-300",
                                }}
                              />
                            </div>
                          </div>
                          <textarea
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="e.g. For death benefits application, legal requirements..."
                            className={`w-full px-4 py-3 bg-white border-2 ${errors.purpose ? "border-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-emerald-100"} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-900 uppercase text-[14px] shadow-sm resize-none min-h-[120px]`}
                          />
                          <p className="text-sm text-gray-400 font-bold mt-1 italic ml-1">
                            You can select from the dropdowns above or type
                            manually / Maaaring pumili sa listahan o mag-type
                            nang manu-mano
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wide hidden sm:block">
                    Please check all entries before final submission / Pakisuri
                    ang lahat bago i-submit
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all group"
                    >
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Submit Application
                      <span class="hidden sm:inline">
                        {" "}
                        / Ipadala ang Aplikasyon
                      </span>
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
                <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg border border-white/30">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white uppercase">
                      Review Application / Suriin ang Aplikasyon
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50/80">
                  <div className="max-w-2xl mx-auto space-y-3">
                    {Object.entries(formData).map(([key, value]) => {
                      const excludedKeys = [
                        "residentId",
                        "deceasedAge",
                        "deceasedGender",
                        "deceasedCivilStatus",
                        "deceasedDateOfBirth",
                        "deceasedPlaceOfBirth",
                        "deceasedAddress",
                      ];
                      if (!value || excludedKeys.includes(key)) return null;
                      const formattedKey = key
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
                <div className="border-t bg-gray-50/80 px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center">
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-lg font-bold flex items-center gap-2 outline-none"
                  >
                    <Eye className="w-4 h-4" /> Go Back & Edit / Bumalik sa
                    Pag-edit
                  </button>
                  <button
                    onClick={handleProceedSubmission}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold flex items-center gap-2 shadow-xl transform hover:-translate-y-0.5 transition-all"
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
                <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-6 py-6 text-center">
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
                  <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-lg p-4 text-left mb-4">
                    <div className="flex items-center gap-2 text-[#112e1f] mb-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
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
                          Processing typically takes 1-3 business days. Your
                          application is now in queue for chairman approval.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-700" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold leading-relaxed">
                          We will coordinate via{" "}
                          <strong>SMS at {formData.contactNumber}</strong> to
                          confirm your pickup schedule at the Barangay Hall.
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
          textarea::placeholder {
            font-family: "Open Sans", sans-serif !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
        `}</style>
      </div>
    </>
  );
}

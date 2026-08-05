import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  FileText,
  Eye,
  Send,
  Printer,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Search,
  Clock,
  Phone,
  Mail,
  ShieldAlert,
  XCircle,
  User,
  ChevronRight,
  Heart,
  Home,
} from "lucide-react";
import ResidentSearchModal from "../Modals/ResidentSearchModal";
import LanguageGate from "./LanguageGate";
import { getStrings } from "../../lib/certLang";

const defaultOfficials = {
  chairman: "ALEXANDER C. MANIO",
  secretary: "ROYCE ANN C. GALVEZ",
  treasurer: "MA. LUZ S. REYES",
  skChairman: "JOHN RUZZEL C. SANTOS",
  councilors: [
    "JOELITO C. MANIO",
    "ENGELBERT M. INDUCTIVO",
    "NORMANDO T. SANTOS",
    "JOPHET M. TURLA",
    "JOHN BRYAN C. CRUZ",
    "ARNEL D. BERNARDINO",
    "LORENA G. LOPEZ",
  ],
  administrator: "ROBERT D. SANTOS",
  assistantSecretary: "PERLITA C. DE JESUS",
  assistantAdministrator: "KHINZ JANZL V. BARROGA",
  recordKeeper: "EMIL D. ROBLES",
  clerk: "CIELITO B. DE LEON",
  contactInfo: {
    address: "Purok 2 (Sitio Banawe) Barangay Iba O' Este, Calumpit, Bulacan",
    contactPerson: "Sec. Royce Ann C. Galvez",
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
    captainImage: "/images/brgycaptain.png",
  },
  headerStyle: {
    bgColor: "#ffffff",
    borderColor: "#1e40af",
    fontFamily: "default",
  },
  countryStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  provinceStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  municipalityStyle: {
    color: "#4b5563",
    size: 12,
    fontWeight: "normal",
    fontFamily: "default",
  },
  barangayNameStyle: {
    color: "#1e40af",
    size: 20,
    fontWeight: "bold",
    fontFamily: "default",
  },
  officeNameStyle: {
    color: "#6b7280",
    size: 11,
    fontWeight: "normal",
    fontFamily: "default",
  },
  sidebarStyle: {
    bgColor: "#1e40af",
    gradientEnd: "#1e3a8a",
    textColor: "#ffffff",
    labelColor: "#fde047",
    titleSize: 14,
    textSize: 11,
    fontFamily: "default",
  },
  bodyStyle: {
    bgColor: "#ffffff",
    textColor: "#1f2937",
    titleColor: "#1e3a8a",
    titleSize: 24,
    textSize: 14,
    fontFamily: "default",
  },
  footerStyle: {
    bgColor: "#f9fafb",
    textColor: "#374151",
    borderColor: "#d1d5db",
    textSize: 9,
    fontFamily: "default",
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
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <p className={`text-xs font-semibold ${colorClass.label}`}>
        {label}
      </p>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-medium ${colorClass.text} flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-gray-200`}
      >
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3.5 h-3.5 shrink-0 ${colorClass.icon}`} />
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
                  className={`w-full text-left px-4 py-2.5 text-sm ${colorClass.text} hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0`}
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

export default function BarangayClearanceModal({
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

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState("");
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const certificateRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const accentColor = tenantConfig.primaryColor || '#059669';
  const [lang, setLang] = useState(null);
  const t = getStrings(lang || 'en');

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    sex: "",
    civilStatus: "",
    address: "",
    contactNumber: "",
    email: "",
    dateOfBirth: "",
    placeOfBirth: "",
    purpose: "",
    residentId: null,
    pending_case: false,
    case_record_history: "",
  });

  const handleResidentSelect = (resident) => {
    if (!resident) {
      console.error("No resident data provided to selection handler");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      fullName: resident.full_name || "",
      age: resident.age || "",
      sex: resident.gender || "",
      civilStatus: resident.civil_status || "",
      address: resident.residential_address || "",
      dateOfBirth: resident.date_of_birth
        ? new Date(resident.date_of_birth).toISOString().split("T")[0]
        : "",
      placeOfBirth: resident.place_of_birth || "",
      contactNumber: resident.contact_number || prev.contactNumber,
      email: resident.email || prev.email,
      residentId: resident.id,
      pending_case: resident.pending_case || false,
      case_record_history: resident.case_record_history || "",
    }));
    setIsResidentModalOpen(false);

    if (resident.pending_case) {
      setNotification({
        type: "error",
        title: "RESTRICTED PROFILE",
        message: `NOTICE: ${resident.full_name} has a pending case record. Barangay Clearance issuance is restricted.`,
      });
    } else {
      setNotification({
        type: "success",
        title: "Profile Found",
        message: `${resident.full_name}'s details have been auto-filled.`,
      });
      setErrors((prev) => ({ ...prev, fullName: false }));
    }
  };

  useEffect(() => {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    setCurrentDate(now.toLocaleDateString("en-US", options));
  }, [isOpen]);

  useEffect(() => {
    const savedOfficials = localStorage.getItem("barangayOfficials");
    if (savedOfficials) {
      const parsed = JSON.parse(savedOfficials);
      setOfficials({ ...defaultOfficials, ...parsed });
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

  const handlePurposeSelect = (e) => {
    const selectedValue = e?.target
      ? e.target.value
      : typeof e === "string"
        ? e
        : "";
    if (!selectedValue) return;
    setFormData((prev) => {
      const current = prev.purpose || "";
      if (current.includes(selectedValue)) return prev;
      return {
        ...prev,
        purpose: current ? `${current}\n${selectedValue}` : selectedValue,
      };
    });
    if (errors.purpose) setErrors((prev) => ({ ...prev, purpose: false }));
  };

  const validateForm = () => {
    if (formData.pending_case) return false;
    const required = ["fullName", "contactNumber", "purpose"];
    const newErrors = {};
    required.forEach((f) => {
      if (!formData[f]) newErrors[f] = true;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const response = await fetch("/api/portal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantConfig.tenant_id || "ibaoeste",
        },
        body: JSON.stringify({
          type: "barangay_clearance",
          formData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmittedReferenceNumber(result.referenceNumber);
        setShowConfirmationPopup(false);
        setShowSuccessModal(true);
      } else if (result.code === 'DUPLICATE_REQUEST' || result.code === 'RATE_LIMITED' || result.code === 'COOLDOWN_ACTIVE') {
        setShowConfirmationPopup(false);
        setNotification({ type: 'error', title: result.code === 'DUPLICATE_REQUEST' ? 'Existing Request Found' : 'Request Blocked', message: result.message });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      age: "",
      sex: "",
      civilStatus: "",
      address: "",
      contactNumber: "",
      email: "",
      dateOfBirth: "",
      placeOfBirth: "",
      purpose: "",
      residentId: null,
    });
    setCurrentStep(1);
    setShowConfirmationPopup(false);
    setShowSuccessModal(false);
    setConsentChecked(false);
    setConsentExpanded(false);
    setShowPrivacyModal(false);
  };

  if (!isOpen) return null;

  const demoTheme = isDemo ? (
    <style>{`
      .brgy-modal-wrap { --primary: #000; --accent: #c9a84c; }
      .brgy-modal-wrap .bg-gradient-to-r { background-image: linear-gradient(to right, #111, #222, #111) !important; }
    `}</style>
  ) : null;

  return (
    <>
      {demoTheme}
      <div className="brgy-modal-wrap">
        {!showConfirmationPopup && !showSuccessModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={onClose}
              />
              <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fade-in"
                style={{
                  maxHeight: "92vh",
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 flex items-start justify-between shrink-0" style={{ backgroundColor: accentColor }}>
                  <div className="flex items-center gap-3.5">
                    <div className="bg-white/15 p-2.5 rounded-xl border border-white/25 shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">
                        {tenantConfig.shortName || "Barangay"} &middot; {t.officialForm}
                      </p>
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                        Barangay Clearance
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {notification && (
                  <div className="px-8 pt-4">
                    <Notification
                      type={notification.type}
                      title={notification.title}
                      message={notification.message}
                      onClose={() => setNotification(null)}
                    />
                  </div>
                )}

                {/* Language gate — shown before the wizard begins */}
                {!lang && (
                  <LanguageGate accentColor={accentColor} lang={lang} onSelect={setLang} />
                )}

                {/* Progress */}
                {lang && (
                <div className="px-6 sm:px-8 py-5 bg-gray-50 border-b border-gray-200 shrink-0">
                  <div className="flex items-start">
                    {[
                      { n: 1, label: t.stepIdentity },
                      { n: 2, label: t.stepContact },
                      { n: 3, label: t.stepPurpose },
                    ].map(({ n, label }) => (
                      <React.Fragment key={n}>
                        <div className="flex flex-col items-center gap-2 w-[88px] shrink-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= n ? "text-white" : "bg-white text-gray-400 border-2 border-gray-200"}`}
                            style={currentStep >= n ? { backgroundColor: accentColor } : undefined}
                          >
                            {currentStep > n ? <CheckCircle className="w-5 h-5" /> : n}
                          </div>
                          <span
                            className={`text-[11px] font-semibold text-center leading-tight ${currentStep >= n ? "text-gray-800" : "text-gray-400"}`}
                          >
                            {label}
                          </span>
                        </div>
                        {n < 3 && (
                          <div
                            className="flex-1 h-[3px] rounded-full mt-[18px] bg-gray-200"
                            style={{ backgroundColor: currentStep > n ? accentColor : undefined }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                )}

                {lang && (
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                  <div>
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">
                            {t.identityHeading}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {t.identityHelp}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsResidentModalOpen(true)}
                          className="w-full flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
                          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
                        >
                          <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            <Search className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                              {t.searchDirectory}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t.searchDirectorySub}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
                        </button>

                        {errors.fullName && (
                          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">
                              {t.errNoRecord}
                            </p>
                          </div>
                        )}

                        {formData.fullName && (
                          <div className="border border-gray-200 rounded-xl overflow-hidden animate-in fade-in duration-300">
                            <div
                              className="px-5 py-2.5 flex items-center gap-2"
                              style={{ backgroundColor: `${accentColor}12` }}
                            >
                              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accentColor }}>
                                {t.verifiedApplicant}
                              </p>
                            </div>
                            <div className="p-5 bg-white">
                              <p className="text-lg font-bold text-gray-900 leading-tight">
                                {formData.fullName}
                              </p>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t border-gray-100">
                                <div>
                                  <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">
                                    {t.recordNo}
                                  </dt>
                                  <dd className="text-sm font-semibold text-gray-800">
                                    #{formData.residentId}
                                  </dd>
                                </div>
                                <div className="min-w-0">
                                  <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">
                                    {t.address}
                                  </dt>
                                  <dd className="text-sm font-semibold text-gray-800 truncate">
                                    {formData.address || <span className="text-gray-400 italic font-normal">{t.notRecorded}</span>}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">
                            {t.contactHeading}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t.contactHelp}
                          </p>
                        </div>

                        <div>
                          <label htmlFor="bc-contact" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            {t.mobileLabel} <span className="text-red-600">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              id="bc-contact"
                              type="tel"
                              name="contactNumber"
                              value={formData.contactNumber}
                              onChange={handleInputChange}
                              placeholder="09XX XXX XXXX"
                              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-offset-0 ${errors.contactNumber ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                            />
                          </div>
                          {errors.contactNumber ? (
                            <p className="text-xs text-red-600 mt-1.5">{t.errMobile}</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1.5">{t.mobileHelp}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="bc-email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            {t.emailLabel} <span className="font-normal text-gray-400">{t.optional}</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              id="bc-email"
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="you@example.com"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">
                            {t.purposeHeading}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t.purposeHelp}
                          </p>
                        </div>

                        <div>
                          <label htmlFor="bc-purpose" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            {t.purposeLabel} <span className="text-red-600">*</span>
                          </label>
                          <textarea
                            id="bc-purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder={t.purposePlaceholder}
                            className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors resize-none focus:ring-2 ${errors.purpose ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                          />
                          {errors.purpose && (
                            <p className="text-xs text-red-600 mt-1.5">{t.errPurpose}</p>
                          )}
                        </div>

                        <div className="pt-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-2.5">
                            {t.quickAdd}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <SearchableDropdown
                              label={t.catWork}
                              placeholder={t.select}
                              items={PURPOSE_LIST_1}
                              onSelect={handlePurposeSelect}
                              colorClass={{
                                label: "text-gray-500",
                                text: "text-gray-800",
                                icon: "text-gray-400",
                                bg: "bg-gray-50",
                                ring: "ring-gray-200",
                              }}
                            />
                            <SearchableDropdown
                              label={t.catUtility}
                              placeholder={t.select}
                              items={PURPOSE_LIST_2}
                              onSelect={handlePurposeSelect}
                              colorClass={{
                                label: "text-gray-500",
                                text: "text-gray-800",
                                icon: "text-gray-400",
                                bg: "bg-gray-50",
                                ring: "ring-gray-200",
                              }}
                            />
                            <SearchableDropdown
                              label={t.catMedical}
                              placeholder={t.select}
                              items={PURPOSE_LIST_3}
                              onSelect={handlePurposeSelect}
                              colorClass={{
                                label: "text-gray-500",
                                text: "text-gray-800",
                                icon: "text-gray-400",
                                bg: "bg-gray-50",
                                ring: "ring-gray-200",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Footer Nav */}
                {lang && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 shrink-0">
                  {currentStep > 1 ? (
                    <button
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                    >
                      {t.back}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setLang(null)}
                        className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                      >
                        {t.back}
                      </button>
                      <p className="text-xs text-gray-500">
                        <span className="text-red-600">*</span> {t.requiredFields}
                      </p>
                    </div>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      onClick={() => {
                        if (currentStep === 1 && !formData.fullName) {
                          setErrors({ fullName: true });
                          return;
                        }
                        if (currentStep === 2 && !formData.contactNumber) {
                          setErrors({ contactNumber: true });
                          return;
                        }
                        setCurrentStep((prev) => prev + 1);
                      }}
                      className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      {t.continue} <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Send className="w-4 h-4" /> {t.reviewSubmit}
                    </button>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showConfirmationPopup && (
          <div className="fixed inset-0 z-[60] overflow-hidden">
            <div className="flex items-center justify-center w-full h-full p-4">
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowConfirmationPopup(false)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ maxHeight: "92vh" }}>
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 flex items-center justify-between shrink-0" style={{ backgroundColor: accentColor }}>
                  <div>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">
                      {t.reviewEyebrow}
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {t.reviewTitle}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    aria-label="Close"
                    className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cards */}
                <div className="px-6 sm:px-8 py-6 bg-gray-50 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-4">
                    {t.reviewHelp}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(formData).map(([k, v]) => {
                      const skip = [
                        "residentId",
                        "pending_case",
                        "case_record_history",
                        "age",
                        "sex",
                        "civilStatus",
                        "address",
                        "dateOfBirth",
                        "placeOfBirth",
                      ];
                      if (!v || skip.includes(k)) return null;

                      const iconMap = {
                        fullName: User,
                        contactNumber: Phone,
                        email: Mail,
                        purpose: FileText,
                      };
                      const Icon = iconMap[k] || Info;
                      const labelMap = {
                        fullName: lang === 'tl' ? "Buong Pangalan" : "Full Name",
                        contactNumber: t.mobileLabel,
                        email: t.emailLabel,
                        purpose: t.purposeLabel,
                      };
                      const label = labelMap[k] || k.replace(/([A-Z])/g, " $1");

                      return (
                        <div
                          key={k}
                          className={`flex items-start gap-3.5 p-4 bg-white border border-gray-200 rounded-xl ${k === "purpose" || k === "email" ? "sm:col-span-2" : ""}`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] block mb-1">
                              {label}
                            </span>
                            {k === "purpose" ? (
                              <div className="space-y-1">
                                {v.toString().split(/\n|(?<=\.)(?=\s*[A-Z])|(?<=REQUIREMENT)(?=\s)/g)
                                  .map(s => s.trim()).filter(Boolean)
                                  .map((line, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="text-gray-400 mt-0.5 shrink-0">&bull;</span>
                                      <span className="text-[15px] font-semibold text-gray-900 leading-snug">{line}</span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">
                                {v.toString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showPrivacyModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
                        <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t.privacyTitle}</h3>
                        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                          <p>{t.privacyP1}</p>
                          <p>{t.privacyP2} <strong>{t.privacyAct}</strong>.</p>
                          <p>{t.privacyP3}</p>
                        </div>
                        <button onClick={() => setShowPrivacyModal(false)} className="mt-6 w-full py-3 text-white rounded-lg font-semibold text-sm" style={{ backgroundColor: accentColor }}>{t.close}</button>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex items-start gap-2.5 p-4 bg-white border border-gray-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="brgy-consent"
                      checked={consentChecked}
                      onChange={e => setConsentChecked(e.target.checked)}
                      className="w-4 h-4 shrink-0 cursor-pointer mt-0.5"
                      style={{ accentColor }}
                    />
                    <label htmlFor="brgy-consent" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
                      {t.consentPrefix}{' '}
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setShowPrivacyModal(true); }}
                        className="underline font-semibold hover:opacity-80"
                        style={{ color: accentColor }}
                      >
                        {t.consentLink}
                      </button>{' '}
                      {t.consentSuffix}
                      <span className="text-red-600"> *</span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-white px-6 sm:px-8 py-4 flex justify-between items-center gap-4 shrink-0">
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                  >
                    {t.backToEdit}
                  </button>
                  <button
                    onClick={handleProceedSubmission}
                    disabled={isSubmitting || !consentChecked}
                    className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> {t.submitRequest}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in p-8 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {t.successTitle}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {t.successBody}
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.16em] mb-1.5">
                    {t.referenceNumber}
                  </p>
                  <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: accentColor }}>
                    {submittedReferenceNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {t.saveReference}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    resetForm();
                    onClose();
                  }}
                  className="w-full text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.done}
                </button>
              </div>
            </div>
          </div>
        )}

        {isResidentModalOpen && (
          <ResidentSearchModal
            isOpen={isResidentModalOpen}
            onClose={() => setIsResidentModalOpen(false)}
            onSelect={handleResidentSelect}
            isDemo={isDemo}
            tenantConfig={tenantConfig}
            lang={lang || 'en'}
          />
        )}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          }
        `}</style>
      </div>
    </>
  );
}

const ClearancePreview = React.memo(
  ({ formData, referenceNumber, currentDate, officials, certificateRef }) => {
    return (
      <div
        ref={certificateRef}
        className="bg-white p-20"
        style={{ width: "794px", height: "1123px" }}
      >
        <h1 className="text-4xl font-black text-center uppercase mb-20">
          Barangay Clearance
        </h1>
        <div className="space-y-6 text-xl">
          <p>
            <strong>Name:</strong> {formData.fullName}
          </p>
          <p>
            <strong>Purpose:</strong> {formData.purpose}
          </p>
          <p>
            <strong>Date:</strong> {currentDate}
          </p>
          <p>
            <strong>Ref:</strong> {referenceNumber}
          </p>
        </div>
      </div>
    );
  },
);

ClearancePreview.displayName = "ClearancePreview";

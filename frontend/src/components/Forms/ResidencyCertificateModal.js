import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search, Clock, Phone, Mail, Heart, ChevronRight, Home } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';

const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  councilors: [
    'JOELITO C. MANIO', 'ENGELBERT M. INDUCTIVO', 'NORMANDO T. SANTOS',
    'JOPHET M. TURLA', 'JOHN BRYAN C. CRUZ', 'ARNEL D. BERNARDINO', 'LORENA G. LOPEZ'
  ],
  administrator: 'ROBERT D. SANTOS',
  assistantSecretary: 'PERLITA C. DE JESUS',
  assistantAdministrator: 'KHINZ JANZL V. BARROGA',
  recordKeeper: 'EMIL D. ROBLES',
  clerk: 'CIELITO B. DE LEON',
  contactInfo: {
    address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
    contactPerson: 'Sec. Royce Ann C. Galvez',
    telephone: '0967 631 9168',
    email: 'anneseriousme@gmail.com'
  },
  headerInfo: {
    country: 'Republic of the Philippines',
    province: 'Province of Bulacan',
    municipality: 'Municipality of Calumpit',
    barangayName: 'BARANGAY IBA O\' ESTE',
    officeName: 'Office of the Punong Barangay'
  },
  logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 115, captainImage: '/images/brgycaptain.png' },
  headerStyle: { bgColor: '#ffffff', borderColor: '#1e40af', fontFamily: 'default' },
  countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
  officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
  sidebarStyle: { bgColor: '#1e40af', gradientEnd: '#1e3a8a', textColor: '#ffffff', labelColor: '#fde047', titleSize: 14, textSize: 11, fontFamily: 'default' },
  bodyStyle: { bgColor: '#ffffff', textColor: '#1f2937', titleColor: '#1e3a8a', titleSize: 24, textSize: 14, fontFamily: 'default' },
  footerStyle: { bgColor: '#f9fafb', textColor: '#374151', borderColor: '#d1d5db', textSize: 9, fontFamily: 'default' }
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
  "FOR SCHOOL ADMISSION REQUIREMENT"
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
  "LICENSE TO OWN AND POSSESS FIREARMS"
].sort((a, b) => a.localeCompare(b));

const PURPOSE_LIST_3 = [
  "Medical Bill",
  "Medical abstract",
  "MEDICAL prescription"
].sort((a, b) => a.localeCompare(b));

// Memoized Notification component
const Notification = React.memo(({ type, title, message, onClose }) => {
  const styles = {
    success: { bg: 'bg-gradient-to-r from-green-50 to-emerald-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600', title: 'text-green-800', message: 'text-green-700' },
    error: { bg: 'bg-gradient-to-r from-red-50 to-rose-50', border: 'border-red-200', icon: 'bg-red-100 text-red-600', title: 'text-red-800', message: 'text-red-700' },
    info: { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', title: 'text-blue-800', message: 'text-blue-700' }
  };
  const s = styles[type] || styles.info;
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 shadow-sm animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className={`${s.icon} p-2 rounded-lg flex-shrink-0`}><Icon className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h4 className={`${s.title} font-semibold text-sm`}>{title}</h4>
          <p className={`${s.message} text-sm mt-0.5`}>{message}</p>
        </div>
        {onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
    </div>
  );
});

Notification.displayName = 'Notification';

const SearchableDropdown = ({ items, onSelect, placeholder, label, colorClass, searchPlaceholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter(p => !search || p.toUpperCase().includes(search.toUpperCase()));

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <p className={`text-sm font-bold ${colorClass.label} uppercase tracking-widest ml-1`}>{label}</p>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm p-2 bg-white border border-gray-200 rounded-lg font-bold ${colorClass.text} flex items-center justify-between shadow-sm hover:bg-gray-50 transition-all uppercase outline-none focus:ring-2 focus:ring-emerald-500/20`}
      >
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3 h-3 ml-2 ${colorClass.icon} ${isOpen ? 'rotate-180' : ''} transition-transform`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-fade-in flex flex-col min-w-[200px]">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${colorClass.icon} pointer-events-none`} />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                  onClick={() => { onSelect(item); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2 text-sm font-bold ${colorClass.text} hover:${colorClass.bg} transition-colors uppercase border-b border-gray-50 last:border-0`}
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 italic text-center">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ResidencyCertificateModal({ isOpen, onClose, isDemo = false }) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  const [formCounter, setFormCounter] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const certificateRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', age: '', sex: '', civilStatus: '',
    address: '', contactNumber: '', email: '',
    dateOfBirth: '', placeOfBirth: '',
    purpose: '', residentId: null
  });

  const handleResidentSelect = (resident) => {
    if (!resident) {
      console.error('No resident data provided to selection handler');
      return;
    }
    setFormData(prev => ({
      ...prev,
      fullName: resident.full_name || '',
      age: resident.age || '',
      sex: resident.gender || '',
      civilStatus: resident.civil_status || '',
      address: resident.residential_address || '',
      dateOfBirth: resident.date_of_birth ? new Date(resident.date_of_birth).toISOString().split('T')[0] : '',
      placeOfBirth: resident.place_of_birth || '',
      contactNumber: resident.contact_number || prev.contactNumber,
      email: resident.email || prev.email,
      residentId: resident.id
    }));
    setIsResidentModalOpen(false);
    setNotification({
      type: 'success',
      title: 'Profile Found',
      message: `${resident.full_name}'s details have been auto-filled.`
    });
    setErrors(prev => ({ ...prev, fullName: false }));
  };

  useEffect(() => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, [isOpen]);

  useEffect(() => {
    const savedOfficials = localStorage.getItem('barangayOfficials');
    if (savedOfficials) {
      const parsed = JSON.parse(savedOfficials);
      setOfficials({
        ...defaultOfficials, ...parsed,
        contactInfo: { ...defaultOfficials.contactInfo, ...parsed.contactInfo },
        headerInfo: { ...defaultOfficials.headerInfo, ...parsed.headerInfo },
        logos: { ...defaultOfficials.logos, ...parsed.logos },
        headerStyle: { ...defaultOfficials.headerStyle, ...parsed.headerStyle },
        countryStyle: { ...defaultOfficials.countryStyle, ...parsed.countryStyle },
        provinceStyle: { ...defaultOfficials.provinceStyle, ...parsed.provinceStyle },
        municipalityStyle: { ...defaultOfficials.municipalityStyle, ...parsed.municipalityStyle },
        barangayNameStyle: { ...defaultOfficials.barangayNameStyle, ...parsed.barangayNameStyle },
        officeNameStyle: { ...defaultOfficials.officeNameStyle, ...parsed.officeNameStyle },
        sidebarStyle: { ...defaultOfficials.sidebarStyle, ...parsed.sidebarStyle },
        bodyStyle: { ...defaultOfficials.bodyStyle, ...parsed.bodyStyle },
        footerStyle: { ...defaultOfficials.footerStyle, ...parsed.footerStyle }
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handlePurposeSelect = (e) => {
    const selectedValue = e?.target ? e.target.value : (typeof e === 'string' ? e : '');
    if (!selectedValue) return;

    setFormData(prev => {
      const currentPurpose = prev.purpose || '';
      // If the purpose already contains this exact value, don't add it again
      if (currentPurpose.includes(selectedValue)) return prev;

      const newPurpose = currentPurpose
        ? `${currentPurpose}\n${selectedValue}`
        : selectedValue;

      return { ...prev, purpose: newPurpose };
    });

    // Reset the dropdown after selection
    e.target.value = '';
    if (errors.purpose) {
      setErrors(prev => ({ ...prev, purpose: false }));
    }
  };

  const validateForm = () => {
    setErrors({});
    const required = ['fullName', 'age', 'sex', 'civilStatus', 'dateOfBirth', 'placeOfBirth', 'address', 'purpose', 'contactNumber'];
    const newErrors = {};

    for (const field of required) {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields correctly.'
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
      const response = await fetch('/api/portal/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantConfig.tenant_id || 'ibaoeste'
        },
        body: JSON.stringify({ 
          type: 'barangay_residency',
          formData 
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedReferenceNumber(result.referenceNumber);
        setReferenceNumber(result.referenceNumber);
        setNotification(null);
        setShowConfirmationPopup(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setShowConfirmationPopup(false);
      setNotification({ type: 'error', title: 'Submission Failed', message: error.message || 'Could not submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomizeForm = () => setShowConfirmationPopup(false);

  const resetForm = () => {
    setFormData({ fullName: '', age: '', sex: '', civilStatus: '', address: '', contactNumber: '', email: '', dateOfBirth: '', placeOfBirth: '', purpose: '', residentId: null });
    setShowPreview(false);
    setShowConfirmationPopup(false);
    setShowSuccessModal(false);
    setNotification(null);
    setReferenceNumber('');
    setSubmittedReferenceNumber('');
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
      {(!showConfirmationPopup && !showSuccessModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in no-scrollbar" style={{ minHeight: '800px', height: '90vh', maxHeight: '95vh' /* BUST-CACHE-800 */, fontFamily: "'Open Sans', sans-serif" }}>
              <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl"><FileText className="w-5 h-5 text-white shadow-sm" /></div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md">Barangay Residency / Katunayan ng Paninirahan</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                      <p className="text-white text-sm font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 rounded-md shadow-md">{referenceNumber || 'New Residency Request'}</p>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group relative z-20"><X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" /></button>
              </div>

              {notification && <div className="px-4 pt-2"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

              <div className="flex-1 overflow-y-auto px-2 py-4">
                <form onSubmit={handleSubmit} className="p-4 space-y-6">
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
                            Registration Notice<span class="hidden sm:inline"> / Paunawa</span>
                          </h4>
                        </div>
                        <p className="text-white/80 text-sm font-medium leading-relaxed mb-0.5">
                          If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.
                        </p>
                        <p className="text-white/50 text-sm font-medium leading-relaxed italic">
                          <span class="hidden sm:block">Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">1</div>
                        <div>
                          <h3 className="text-base font-bold text-white">Personal Information<span class="hidden sm:inline"> / Impormasyong Personal</span></h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">Auto-filled via community database / Awtomatikong napupuno sa database</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setIsResidentModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group">
                        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Verify Identity Profile / I-verify ang Profile
                      </button>
                    </div>

                    <div className="relative group">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1 block">Resident Full Name<span class="hidden sm:inline"> / Buong Pangalan ng Residente</span></label>
                      <input type="text" name="fullName" value={formData.fullName} readOnly onClick={() => setIsResidentModalOpen(true)} placeholder="TAP HERE TO SELECT FROM RESIDENT / PUMILI MULA SA RESIDENTE DIRECTORY..." className={`w-full px-4 py-3 bg-white border-2 ${errors.fullName ? 'border-red-500 bg-red-50' : (formData.fullName ? 'border-emerald-200 ring-2 ring-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-lg transition-all duration-300 font-bold text-base cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`} />
                    </div>


                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">2</div>
                        <div>
                          <h3 className="text-base font-bold text-white">Notification & Contact<span class="hidden sm:inline"> / Notipikasyon at Contact</span></h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">Where to receive your updates<span class="hidden sm:inline"> / Kung saan matatanggap ang mga update</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1 relative group">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Email Address (Optional)<span class="hidden sm:inline"> / Email (Opsyonal)</span></label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100">
                              <Mail className="w-4 h-4 text-[#2d5a3d]/50" />
                            </div>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className={`w-full pl-12 pr-4 py-2.5 bg-white border-2 ${errors.email ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-normal text-gray-800 shadow-sm`} />
                          </div>
                          <p className="text-sm text-gray-400 font-bold italic ml-2">Notifications will be sent here<span class="hidden sm:inline"> / Dito ipapadala ang mga abiso</span></p>
                        </div>

                        <div className="space-y-1 relative group">
                          <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Contact Number<span class="hidden sm:inline"> / Numero ng Telepono</span> <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100">
                              <Phone className="w-4 h-4 text-[#2d5a3d]/50" />
                            </div>
                            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={`w-full pl-12 pr-4 py-2.5 bg-white border-2 ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">3</div>
                        <div>
                          <h3 className="text-base font-bold text-white">Application Intent / Layunin ng Aplikasyon</h3>
                          <p className="text-sm text-white/90 font-medium tracking-wide">Purpose of your request / Dahilan ng inyong pagkuha</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                            <label className="text-sm font-bold text-[#2d5a3d] uppercase tracking-wide ml-1">Request Purpose / Dahilan ng Pagkuha <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2">
                              <SearchableDropdown
                                label="Quick Select 1"
                                placeholder="-- PERSONAL LOAN & GOV'T --"
                                items={PURPOSE_LIST_1}
                                onSelect={(val) => handlePurposeSelect({ target: { value: val } })}
                                colorClass={{
                                  label: "text-blue-400",
                                  text: "text-blue-600",
                                  icon: "text-blue-300",
                                  bg: "bg-blue-50",
                                  ring: "ring-blue-300"
                                }}
                              />
                              <SearchableDropdown
                                label="Quick Select 2"
                                placeholder="-- BRANCH & LOCAL --"
                                items={PURPOSE_LIST_2}
                                onSelect={(val) => handlePurposeSelect({ target: { value: val } })}
                                colorClass={{
                                  label: "text-indigo-400",
                                  text: "text-indigo-600",
                                  icon: "text-indigo-300",
                                  bg: "bg-indigo-50",
                                  ring: "ring-indigo-300"
                                }}
                              />
                              <SearchableDropdown
                                label="Quick Select 3"
                                placeholder="-- MEDICAL NEEDS --"
                                items={PURPOSE_LIST_3}
                                onSelect={(val) => handlePurposeSelect({ target: { value: val } })}
                                colorClass={{
                                  label: "text-emerald-500",
                                  text: "text-emerald-600",
                                  icon: "text-emerald-300",
                                  bg: "bg-emerald-50",
                                  ring: "ring-emerald-300"
                                }}
                              />
                            </div>
                          </div>
                          <textarea 
                            name="purpose" 
                            value={formData.purpose} 
                            onChange={handleInputChange} 
                            rows={4} 
                            placeholder="e.g. School Enrollment, ID Application..." 
                            className={`w-full px-4 py-3 bg-white border-2 ${errors.purpose ? 'border-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-900 uppercase text-[14px] shadow-sm resize-none min-h-[120px]`} 
                          />
                          <p className="text-sm text-gray-400 font-bold mt-1 italic ml-1">You can select from the dropdowns above or type manually / Maaaring pumili sa listahan o mag-type nang manu-mano</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide hidden sm:block">Please check all entries before final submission / Pakisuri ang lahat bago i-submit</p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="submit" onClick={handleSubmit} className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all group">
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Submit Application<span class="hidden sm:inline"> / Ipadala ang Aplikasyon</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmationPopup && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setShowConfirmationPopup(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-fade-in" style={{ minHeight: '800px', height: '90vh', maxHeight: '95vh' /* BUST-CACHE-800 */, fontFamily: "'Open Sans', sans-serif" }}>
              <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl"><FileText className="w-5 h-5 text-white shadow-sm" /></div>
                  <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md uppercase">Review Application / Suriin ang Aplikasyon</h2>
                </div>
                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50/80">
                <div className="max-w-2xl mx-auto space-y-3">
                  {Object.entries(formData).map(([key, value]) => {
                    const excludedKeys = ['residentId', 'signature', 'details', 'age', 'sex', 'gender', 'civilStatus', 'address', 'dateOfBirth', 'placeOfBirth', 'businessAddress', 'ownerAddress', 'nationality', 'occupation'];
                    if (!value || excludedKeys.includes(key)) return null;
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex flex-col md:flex-row md:items-center justify-between px-4 py-2.5 bg-white shadow-sm border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">{formattedKey}</span>
                        <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t bg-gray-50/80 backdrop-blur-[2px] px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print">
                <button onClick={handleCustomizeForm} disabled={isSubmitting} className="px-4 py-2.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-lg font-bold flex items-center justify-center gap-2 outline-none"><Eye className="w-4 h-4" />Go Back & Edit / Bumalik sa Pag-edit</button>
                <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-4 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all">
                  {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-70 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-6 py-6 text-center relative">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30"><CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" /></div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Filing Complete! / Tapos na ang Pag-file!</h2>
              </div>
              <div className="p-4 text-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-green-800 mb-1">REFERENCE NO:</p>
                  <p className="text-xl font-bold text-green-900 font-mono tracking-wider">{submittedReferenceNumber}</p>
                </div>
                <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-lg p-4 relative overflow-hidden text-left mb-4">
                  <div className="flex items-center gap-2 text-[#112e1f] mb-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <h4 className="text-sm font-bold uppercase tracking-wide">Next Procedures / Susunod na Pamamaraan</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Clock className="w-3 h-3 text-emerald-700" /></div>
                      <p className="text-sm text-gray-600 font-bold leading-relaxed">Processing typically takes 1-3 business days. Your application is now in the queue for chairman approval.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Phone className="w-3 h-3 text-emerald-700" /></div>
                      <p className="text-sm text-gray-600 font-bold leading-relaxed">We will coordinate via <strong>SMS at {formData.contactNumber}</strong> to confirm your pickup schedule at the Barangay Hall.</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setShowSuccessModal(false); resetForm(); onClose(); }} className="w-full bg-[#112e1f] text-white py-3 rounded-lg font-bold uppercase transition-all shadow-lg active:scale-95">Return to Dashboard / Bumalik sa Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isResidentModalOpen && (
        <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} />
      )}
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        
        /* Open Sans Italic Placeholders */
        input::placeholder, textarea::placeholder {
          font-family: 'Open Sans', sans-serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }
        
        input::-webkit-input-placeholder, textarea::-webkit-input-placeholder {
          font-family: 'Open Sans', sans-serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }
        
        input::-moz-placeholder, textarea::-moz-placeholder {
          font-family: 'Open Sans', sans-serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }
        
        input:-ms-input-placeholder, textarea:-ms-input-placeholder {
          font-family: 'Open Sans', sans-serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }
        
        input:-moz-placeholder, textarea:-moz-placeholder {
          font-family: 'Open Sans', sans-serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }
      `}</style>
      </div>
    </>
  );
}

// Memoized Preview component
const ResidencyPreview = React.memo(({ formData, referenceNumber, currentDate, officials, certificateRef }) => {
  const logos = officials.logos || {};
  const headerStyle = officials.headerStyle || {};
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    const updateScale = () => {
      if (containerRef.current) {
        setScale(Math.min(containerRef.current.offsetWidth / 794, 1));
      }
    };

    const debouncedScale = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 100);
    };

    updateScale();
    window.addEventListener('resize', debouncedScale);
    return () => {
      window.removeEventListener('resize', debouncedScale);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center relative overflow-hidden">
      <div style={{ width: `${794 * scale}px`, height: `${1123 * scale}px`, flexShrink: 0, position: 'relative' }}>
        <div ref={certificateRef} className="bg-white shadow-lg flex flex-col" style={{ width: '794px', height: '1123px', transform: `scale(${scale}) translateZ(0)`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
          <div className="w-full border-b flex justify-center items-center p-8 flex-shrink-0" style={{ backgroundColor: headerStyle.bgColor, borderColor: headerStyle.borderColor }}>
            <div className="flex-shrink-0" style={{ width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px` }}>{logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}</div>
            <div className="text-center px-4">
              <p className="text-[13px]">{officials.headerInfo?.country}</p>
              <p className="text-[13px]">{officials.headerInfo?.province}</p>
              <p className="text-[13px]">{officials.headerInfo?.municipality}</p>
              <p className="text-[18px] font-bold text-blue-800 uppercase leading-tight mt-1">{officials.headerInfo?.barangayName}</p>
              <p className="text-[14px] font-extrabold text-red-700 uppercase mt-2">OFFICE OF THE BARANGAY CHAIRMAN</p>
            </div>
            <div className="flex-shrink-0" style={{ width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px` }}>{logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}</div>
          </div>
          <div className="flex-1 px-16 pt-8 pb-16 flex flex-col relative overflow-hidden">
            {logos.leftLogo && <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none"><img src={logos.leftLogo} className="w-3/4 object-contain" alt="Watermark" /></div>}
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-[24px] font-bold mb-10 px-4 uppercase text-[#004d40]">BARANGAY RESIDENCY CERTIFICATE</h2>
              <div className="w-full space-y-6 text-[15px]">
                <p className="font-bold text-lg mb-6 uppercase">TO WHOM IT MAY CONCERN:</p>
                <p className="mb-6 leading-relaxed">This is to certify that below mentioned person is a bona fide resident of this barangay as detailed below:</p>
                <div className="space-y-1 mb-8">
                  {[
                    ['Name', formData.fullName?.toUpperCase()],
                    ['Age', formData.age],
                    ['Sex', formData.sex?.toUpperCase()],
                    ['Civil Status', formData.civilStatus?.toUpperCase()],
                    ['Residential Address', formData.address?.toUpperCase()],
                    ['Date of Birth', formData.dateOfBirth?.toUpperCase()],
                    ['Place of Birth', formData.placeOfBirth?.toUpperCase()]
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[180px_10px_1fr] items-baseline text-black">
                      <span className="font-normal">{label}</span>
                      <span className="font-normal text-center">:</span>
                      <span className={label === 'Name' ? 'font-bold text-lg underline' : 'font-semibold'}>{value || '_________________'}</span>
                    </div>
                  ))}
                </div>
                <div className="mb-8">
                  <p className="mb-2 italic">Issued upon the request of the above-named person for:</p>
                  <p className="font-bold text-lg pl-8 underline">{formData.purpose?.toUpperCase() || 'NOT SPECIFIED'}</p>
                </div>
                <p className="mb-8">Issued this {currentDate} at Barangay Iba O' Este, Calumpit, Bulacan.</p>
                <div className="mt-0 flex flex-col">
                  <div className="mb-4"><div className="h-8 w-64 border-b border-black"></div><p className="text-sm mt-1">Resident's Signature / Thumb Mark</p></div>
                  <div className="self-start text-left">
                    <p className="font-bold text-[15px] mb-[130px] uppercase">Truly Yours,</p>
                    <p className="text-[20px] font-bold uppercase underline leading-tight text-black">{officials.chairman}</p>
                    <p className="text-sm font-bold mt-1">BARANGAY CHAIRMAN</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Reference Number Section */}
            <div className="w-full text-right mt-auto mb-2 opacity-60">
              <p className="text-sm italic">Ref No: <strong>{referenceNumber}</strong></p>
            </div>

            {/* Footer Divider and info */}
            <div className="w-full border-t border-gray-400 pt-1 text-sm opacity-60">
              <div className="flex flex-col items-start italic">
                <p>Address: {officials.contactInfo?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ResidencyPreview.displayName = 'ResidencyPreview';

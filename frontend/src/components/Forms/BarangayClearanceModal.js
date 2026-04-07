import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search, Clock, Phone, Mail, ShieldAlert, XCircle, User, ChevronRight, Heart, Home } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';


const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  councilors: [
    'JOELITO C. MANIO',
    'ENGELBERT M. INDUCTIVO',
    'NORMANDO T. SANTOS',
    'JOPHET M. TURLA',
    'JOHN BRYAN C. CRUZ',
    'ARNEL D. BERNARDINO',
    'LORENA G. LOPEZ'
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

export default function BarangayClearanceModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {

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

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
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
    dateOfBirth: '', placeOfBirth: '', purpose: '', residentId: null,
    pending_case: false, case_record_history: ''
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
      residentId: resident.id,
      pending_case: resident.pending_case || false,
      case_record_history: resident.case_record_history || ''
    }));
    setIsResidentModalOpen(false);
    
    if (resident.pending_case) {
      setNotification({
        type: 'error',
        title: 'RESTRICTED PROFILE',
        message: `NOTICE: ${resident.full_name} has a pending case record. Barangay Clearance issuance is restricted.`
      });
    } else {
      setNotification({
        type: 'success',
        title: 'Profile Found',
        message: `${resident.full_name}'s details have been auto-filled.`
      });
      setErrors(prev => ({ ...prev, fullName: false }));
    }
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handlePurposeSelect = (e) => {
    const selectedValue = e?.target ? e.target.value : (typeof e === 'string' ? e : '');
    if (!selectedValue) return;
    setFormData(prev => {
      const current = prev.purpose || '';
      if (current.includes(selectedValue)) return prev;
      return { ...prev, purpose: current ? `${current}\n${selectedValue}` : selectedValue };
    });
    if (errors.purpose) setErrors(prev => ({ ...prev, purpose: false }));
  };

  const validateForm = () => {
    if (formData.pending_case) return false;
    const required = ['fullName', 'contactNumber', 'purpose'];
    const newErrors = {};
    required.forEach(f => { if (!formData[f]) newErrors[f] = true; });
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
      const response = await fetch('/api/portal/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantConfig.tenant_id || 'ibaoeste'
        },
        body: JSON.stringify({ 
          type: 'barangay_clearance',
          formData 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSubmittedReferenceNumber(result.referenceNumber);
        setShowConfirmationPopup(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setNotification({ type: 'error', title: 'Submission Failed', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ fullName: '', age: '', sex: '', civilStatus: '', address: '', contactNumber: '', email: '', dateOfBirth: '', placeOfBirth: '', purpose: '', residentId: null });
    setCurrentStep(1);
    setShowConfirmationPopup(false);
    setShowSuccessModal(false);
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
        {(!showConfirmationPopup && !showSuccessModal) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-fade-in no-scrollbar" style={{ height: '85vh', maxHeight: '95vh', fontFamily: "'Open Sans', sans-serif" }}>
                
                {/* Header */}
                <div className="bg-black px-8 py-6 flex items-center justify-between border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/20"><FileText className="w-6 h-6 text-white" /></div>
                    <div>
                       <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Clearance Acquisition</h2>
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{tenantConfig.shortName || 'Barangay'} Official Portal</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group"><X className="w-8 h-8 group-hover:rotate-90 transition-transform" /></button>
                </div>

                {notification && <div className="px-8 pt-4"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

                {/* Progress */}
                <div className="px-8 pt-8 shrink-0">
                  <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {[1, 2, 3].map(s => (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${currentStep >= s ? 'bg-black text-white scale-110' : 'bg-gray-100 text-gray-300'}`}>
                            {currentStep > s ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : s}
                          </div>
                        </div>
                        {s < 3 && <div className={`flex-1 h-1 mx-4 rounded-full ${currentStep > s ? 'bg-black' : 'bg-gray-100'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10">
                  <div className="max-w-3xl mx-auto">
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                        <div 
                          className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center group cursor-pointer hover:bg-black/5 hover:border-black transition-all relative overflow-hidden active:scale-95 shadow-sm hover:shadow-xl" 
                          onClick={() => setIsResidentModalOpen(true)}
                        >
                           <div className="absolute -top-24 -right-24 w-64 h-64 bg-gray-50 rounded-full group-hover:bg-emerald-50/50 transition-colors"></div>
                           
                           <div className="relative z-10 flex flex-col items-center">
                             <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-inner">
                               <Search className="w-6 h-6" />
                             </div>
                             <h3 className="text-xl font-black uppercase tracking-tighter mb-1">Search Directory / Hanapin sa Direktoryo</h3>
                             <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] max-w-[240px] mx-auto leading-relaxed">Find your profile and sync your details instantly. / Hanapin ang iyong profile at i-sync agad ang mga detalye.</p>
                           </div>
                        </div>

                        {formData.fullName && (
                          <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 group relative overflow-hidden border border-white/5">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CheckCircle className="w-24 h-24 text-white" />
                             </div>
                             <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Confirmed Applicant / Kumpirmadong Aplikante</p>
                             <h4 className="text-3xl font-black tracking-tighter mb-6 leading-none uppercase">{formData.fullName}</h4>
                             
                             <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 uppercase font-black">
                                   <p className="text-white/30 text-[8px] tracking-widest mb-0.5">Status</p>
                                   <p className="text-emerald-400 text-xs">Verified Member / Beripikadong Miyembro</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 uppercase font-black">
                                   <p className="text-white/30 text-[8px] tracking-widest mb-0.5">DB ID</p>
                                   <p className="text-xs">#{formData.residentId}</p>
                                </div>
                             </div>
                          </div>
                        )}
                      </div>
                    )}



                    {currentStep === 2 && (
                      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="space-y-6">
                           <div className="group">
                              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-3 block">Cellular Number / Numero ng Cellphone <span className="text-red-500">*</span></label>
                              <div className="relative">
                                 <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-black transition-colors" />
                                 <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={`w-full pl-16 pr-8 py-5 bg-white border-4 ${errors.contactNumber ? 'border-red-500' : 'border-gray-50'} rounded-3xl focus:border-black outline-none font-black text-2xl`} />
                              </div>
                           </div>
                           <div className="group">
                              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-3 block">Email (Optional)</label>
                              <div className="relative">
                                 <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-black transition-colors" />
                                 <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="YOUR@EMAIL.COM" className="w-full pl-16 pr-8 py-5 bg-white border-4 border-gray-50 rounded-3xl focus:border-black outline-none font-black text-2xl" />
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="group">
                           <label className="text-xs font-black uppercase tracking-widest ml-1 mb-4 block">State Your Purpose / Sabihin ang Layunin <span className="text-red-500">*</span></label>
                           <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows={5} placeholder="E.G. EMPLOYMENT, LOAN, ETC..." className={`w-full px-8 py-6 bg-gray-50 border-4 ${errors.purpose ? 'border-red-500' : 'border-gray-50'} rounded-[2rem] focus:border-black focus:bg-white outline-none font-black text-2xl uppercase tracking-tighter resize-none`} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <SearchableDropdown label="Job & Gov't" placeholder="SELECT..." items={PURPOSE_LIST_1} onSelect={handlePurposeSelect} colorClass={{ label: "text-blue-400", text: "text-blue-600", icon: "text-blue-300", bg: "bg-blue-50", ring: "ring-blue-300" }} />
                           <SearchableDropdown label="Utility" placeholder="SELECT..." items={PURPOSE_LIST_2} onSelect={handlePurposeSelect} colorClass={{ label: "text-indigo-400", text: "text-indigo-600", icon: "text-indigo-300", bg: "bg-indigo-50", ring: "ring-indigo-300" }} />
                           <SearchableDropdown label="Medical" placeholder="SELECT..." items={PURPOSE_LIST_3} onSelect={handlePurposeSelect} colorClass={{ label: "text-emerald-500", text: "text-emerald-600", icon: "text-emerald-300", bg: "bg-emerald-50", ring: "ring-emerald-300" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Nav */}
                <div className="border-t bg-white px-8 py-6 flex items-center justify-between shrink-0">
                   {currentStep > 1 ? (
                     <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 hover:text-black transition-all">Previous / Nakaraan</button>
                   ) : <div />}
                   
                   {currentStep < totalSteps ? (
                     <button onClick={() => {
                       if (currentStep === 1 && !formData.fullName) { setErrors({ fullName: true }); return; }
                       if (currentStep === 2 && !formData.contactNumber) { setErrors({ contactNumber: true }); return; }
                       setCurrentStep(prev => prev + 1);
                     }} className="px-12 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center gap-3">Next Step / Susunod <ChevronRight className="w-5 h-5" /></button>
                   ) : (
                     <button onClick={handleSubmit} className="px-12 py-4 bg-[#c9a84c] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#a07830] transition-all flex items-center gap-3"><Send className="w-5 h-5" /> Submit Request / I-submit ang Request</button>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmationPopup && (
          <div className="fixed inset-0 z-[60] overflow-hidden">
            <div className="flex items-center justify-center w-full h-full p-4">
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowConfirmationPopup(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-black px-6 py-4 flex items-center justify-between shrink-0">
                   <div>
                     <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">Confirmation</h2>
                     <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Review your application before submitting</p>
                   </div>
                   <button onClick={() => setShowConfirmationPopup(false)} className="bg-white/10 p-2 rounded-xl text-white/40 hover:text-white hover:bg-red-500/20 transition-all group">
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                   </button>
                </div>

                {/* Cards */}
                <div className="p-5 bg-gray-50">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(formData).map(([k, v]) => {
                        const skip = ['residentId', 'pending_case', 'case_record_history', 'age', 'sex', 'civilStatus', 'address', 'dateOfBirth', 'placeOfBirth'];
                        if (!v || skip.includes(k)) return null;

                        const iconMap = {
                          fullName: User, contactNumber: Phone,
                          email: Mail, purpose: FileText,
                        };
                        const Icon = iconMap[k] || Info;
                        const label = k.replace(/([A-Z])/g, ' $1').toUpperCase();

                        return (
                          <div key={k} className={`flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm ${k === 'purpose' ? 'sm:col-span-2' : ''}`}>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block">{label}</span>
                              <span className="text-sm font-black text-black leading-tight break-words uppercase">{v.toString()}</span>
                            </div>
                          </div>
                        );
                      })}
                   </div>

                   <div className="mt-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-wide">All details validated against the official directory.</p>
                   </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-white px-5 py-4 flex justify-between items-center shrink-0">
                  <button onClick={() => setShowConfirmationPopup(false)} className="px-4 py-2 font-black uppercase tracking-[0.2em] text-[9px] text-gray-400 hover:text-black transition-all">← Back / Edit</button>
                  <button onClick={handleProceedSubmission} className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
                    {isSubmitting ? 'Submitting...' : (<>Confirm Submission <ChevronRight className="w-3.5 h-3.5" /></>)}
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
              <div className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in p-12 text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-emerald-100 shadow-2xl">
                   <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">Request Complete</h2>
                <div className="bg-gray-50 rounded-[2.5rem] p-8 mb-10 border-4 border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tracking ID</p>
                   <p className="text-4xl font-black tracking-tighter">{submittedReferenceNumber}</p>
                </div>
                <button onClick={() => { setShowSuccessModal(false); resetForm(); onClose(); }} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-2xl">Back to Dashboard / Bumalik sa Dashboard</button>
              </div>
            </div>
          </div>
        )}

        {isResidentModalOpen && <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} isDemo={isDemo} />}
        <style jsx>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        `}</style>
      </div>
    </>
  );
}

const ClearancePreview = React.memo(({ formData, referenceNumber, currentDate, officials, certificateRef }) => {
  return (
    <div ref={certificateRef} className="bg-white p-20" style={{ width: '794px', height: '1123px' }}>
      <h1 className="text-4xl font-black text-center uppercase mb-20">Barangay Clearance</h1>
      <div className="space-y-6 text-xl">
        <p><strong>Name:</strong> {formData.fullName}</p>
        <p><strong>Purpose:</strong> {formData.purpose}</p>
        <p><strong>Date:</strong> {currentDate}</p>
        <p><strong>Ref:</strong> {referenceNumber}</p>
      </div>
    </div>
  );
});

ClearancePreview.displayName = 'ClearancePreview';

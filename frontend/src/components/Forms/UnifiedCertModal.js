/**
 * UnifiedCertModal — Shared 3-step certificate request modal
 * Used by: Indigency, Residency, Guardianship, Cohabitation, MedicoLegal, SamePerson, NaturalDeath
 * Step 1: Resident Search
 * Step 2: Contact (phone + email)
 * Step 3: Purpose + optional extra fields
 */
import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Phone, Mail, Send, CheckCircle, ChevronRight, AlertCircle, Info, User, Hash, Calendar, MapPin, Users, Clock, Baby, Fingerprint, Shield, Link, ClipboardList, Home, Building } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';

const PURPOSE_LIST_1 = [
  "PERSONAL LOAN - GM SYNERGY MICROFINANCE INC. (CITY OF MALOLOS, BULACAN)",
  "TESDA / SCHOOLING REQUIREMENT",
  "NATIONAL BUREAU OF INVESTIGATION (NBI) REQUIREMENT",
  "TAXPAYER IDENTIFICATION NUMBER (TIN) REQUIREMENT",
  "SOCIAL SECURITY SYSTEM (SSS) REQUIREMENT",
  "PAG-IBIG REQUIREMENT", "PHILHEALTH REQUIREMENT",
  "APPLICATION FOR PERSON WITH DISABILITIES (PWD)*",
  "APPLICATION FOR SENIOR CITIZEN'S ID*",
  "APPLICATION FOR WATER SERVICE CONNECTION (CAWADI)",
  "APPLICATION FOR ELECTRICAL SERVICE CONNECTION (MERALCO)",
  "SCHOLARSHIP ASSISTANCE - LCDFI*",
  "APPLICATION FOR INTERNET SERVICE CONNECTION",
  "ON THE JOB TRAINING (OJT) REQUIREMENT",
  "POLICE CLEARANCE REQUIREMENT - WORK / JOB APPLICATION",
  "FOR SCHOOL ADMISSION REQUIREMENT",
  "APPLICATION FOR BUILDING PERMIT REQUIREMENT",
  "BANK TRANSACTION - OPEN ACCOUNT",
].sort((a, b) => a.localeCompare(b));

const PURPOSE_LIST_2 = [
  "CALUMPIT BRANCH", "BUREAU OF INTERNAL REVENUE (TIKTOK CONTENT CREATOR)",
  "PULILAN, BULACAN BRANCH", "APPLYING FOR INTERNET INSTALLATION REQUIREMENT",
  "MEDICAL CERTIFICATE ATTACHED", "OFFICE OF SENIOR CITIZENS AFFAIRS (OSCA)",
  "LANDBANK COUNTRYSIDE DEVELOPMENT FOUNDATION, INC.",
  "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY",
  "CITY OF MALOLOS, BULACAN", "CALUMPIT, BULACAN",
  "LICENSE TO OWN AND POSSESS FIREARMS",
].sort((a, b) => a.localeCompare(b));

const PURPOSE_LIST_3 = ["Medical Bill", "Medical abstract", "MEDICAL prescription"].sort((a, b) => a.localeCompare(b));

function SearchableDropdown({ items, onSelect, placeholder, label, colorClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const filtered = items.filter(p => !search || p.toUpperCase().includes(search.toUpperCase()));
  return (
    <div className="relative" ref={ref}>
      <p className={`text-xs font-bold ${colorClass.label} uppercase tracking-widest mb-1`}>{label}</p>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs p-2 bg-white border border-gray-200 rounded-lg font-bold ${colorClass.text} flex items-center justify-between shadow-sm hover:bg-gray-50 uppercase outline-none`}>
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3 h-3 ml-1 ${colorClass.icon}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[100] bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className={`w-full px-3 py-1.5 text-xs border border-gray-100 rounded-md outline-none ${colorClass.text}`} />
          </div>
          <div className="overflow-y-auto max-h-[180px]">
            {filtered.map((item, i) => (
              <button key={i} type="button" onClick={() => { onSelect(item); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-xs font-bold ${colorClass.text} hover:bg-gray-50 uppercase border-b border-gray-50 last:border-0`}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedCertModal({
  isOpen, onClose,
  title,
  certType,
  tenantConfig = {},
  isDemo = false,
  extraStep1 = null,
  extraStep3 = null,
  extraStep4 = null,   // optional 4th step (e.g. address for cohabitation)
  requirePurpose = true,
  step3Label = "State Your Purpose / Sabihin ang Layunin",
  extraFormData = {},
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', residentId: null, age: '', sex: '', civilStatus: '',
    address: '', dateOfBirth: '', placeOfBirth: '',
    contactNumber: '', email: '', purpose: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock scroll and maintain position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => { 
      if (typeof window !== 'undefined') {
        // Get the scroll position before unlocking
        const scrollY = document.body.style.top;
        
        // Restore scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1); setShowConfirmation(false); setShowSuccess(false);
      setErrors({}); setNotification(null);
      setFormData({ fullName: '', residentId: null, age: '', sex: '', civilStatus: '', address: '', dateOfBirth: '', placeOfBirth: '', contactNumber: '', email: '', purpose: '' });
    }
  }, [isOpen]);

  const handleResidentSelect = (resident) => {
    setFormData(prev => ({
      ...prev,
      fullName: resident.full_name || '',
      residentId: resident.id,
      age: resident.age || '',
      sex: resident.gender || resident.sex || '',
      civilStatus: resident.civil_status || '',
      address: resident.residential_address || '',
      dateOfBirth: resident.date_of_birth || '',
      placeOfBirth: resident.place_of_birth || '',
    }));
    setIsResidentModalOpen(false);
    setErrors(prev => ({ ...prev, fullName: false }));
    setNotification({ type: 'success', title: 'Profile Found', message: `${resident.full_name}'s details have been auto-filled.` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handlePurposeSelect = (purpose) => {
    setFormData(prev => ({ ...prev, purpose: prev.purpose ? `${prev.purpose}\n${purpose}` : purpose }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submissionData = { ...formData, ...extraFormData };
      console.log('UnifiedCertModal - Submitting data:', submissionData);
      console.log('UnifiedCertModal - extraFormData:', extraFormData);
      
      const response = await fetch('/api/portal/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantConfig?.tenant_id || (isDemo ? 'demo' : 'ibaoeste'),
        },
        body: JSON.stringify({ type: certType, formData: submissionData }),
      });
      const result = await response.json();
      if (result.success) {
        setReferenceNumber(result.referenceNumber);
        setShowConfirmation(false);
        setShowSuccess(true);
      } else if (result.code === 'DUPLICATE_REQUEST') {
        setShowConfirmation(false);
        setNotification({
          type: 'error',
          title: 'Existing Request Found',
          message: result.message + (result.existingRef ? ` Track it using: ${result.existingRef}` : ''),
        });
      } else if (result.code === 'RATE_LIMITED' || result.code === 'COOLDOWN_ACTIVE') {
        setShowConfirmation(false);
        setNotification({ type: 'error', title: 'Request Blocked', message: result.message });
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (err) {
      setNotification({ type: 'error', title: 'Submission Failed', message: err.message });
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const accentColor = tenantConfig.primaryColor || '#059669';

  // Success Modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Request Submitted!</h3>
          <p className="text-gray-500 text-sm mb-4">Your certificate request has been received and is now being processed.</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Reference Number</p>
            <p className="text-2xl font-black font-mono" style={{ color: accentColor }}>{referenceNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Save this number to track your request status.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 text-white rounded-2xl font-black uppercase tracking-widest text-sm" style={{ backgroundColor: accentColor }}>
            Close / Isara
          </button>
        </div>
      </div>
    );
  }

  // Confirmation Modal
  if (showConfirmation) {
    const skip = ['residentId', 'age', 'sex', 'civilStatus', 'address', 'dateOfBirth', 'placeOfBirth', 'partnerId', 'partnerAge', 'partnerSex', 'partnerDateOfBirth', 'partnerResidentialAddress'];

    // Single color for all icons — professional, consistent
    const iconColor = 'text-gray-500';
    const iconBg = 'bg-gray-100';

    const iconMap = {
      fullName: User,
      contactNumber: Phone,
      email: Mail,
      purpose: ClipboardList,
      partnerFullName: Users,
      yearsLiving: Clock,
      numberOfChildren: Baby,
      aliasName: Fingerprint,
      guardianName: Shield,
      guardianRelationship: Link,
      partnerAge: Hash,
      partnerSex: User,
      partnerDateOfBirth: Calendar,
      houseNo: Home,
      purok: MapPin,
      currentAddress: Building,
      dateOfDeath: Calendar,
      causeOfDeath: AlertCircle,
      requesterName: User,
    };

    const labelMap = {
      fullName: 'Full Name / Buong Pangalan',
      contactNumber: 'Contact Number / Numero',
      email: 'Email',
      purpose: 'Purpose / Layunin',
      partnerFullName: "Partner's Name / Pangalan ng Kasama",
      yearsLiving: 'Years Together / Taon ng Pagsasama',
      numberOfChildren: 'No. of Children / Bilang ng Anak',
      aliasName: 'Second Name / Other Name',
      guardianName: "Guardian's Name",
      guardianRelationship: 'Relationship / Relasyon',
      partnerAge: 'Partner Age',
      partnerSex: 'Partner Sex',
      partnerDateOfBirth: 'Partner Date of Birth',
      houseNo: 'House No. / Numero ng Bahay',
      purok: 'Purok / Sitio',
      currentAddress: 'Current Address / Kasalukuyang Tirahan',
      dateOfDeath: 'Date of Death / Petsa ng Kamatayan',
      causeOfDeath: 'Cause of Death / Sanhi ng Kamatayan',
      requesterName: 'Requester Name / Pangalan ng Humiling',
    };

    // Merge formData + extraFormData for display
    const allData = { ...formData, ...extraFormData };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-black px-10 py-7 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Confirmation</h2>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">Review your application before submitting</p>
            </div>
            <button onClick={() => setShowConfirmation(false)} className="bg-white/10 p-3 rounded-2xl text-white/40 hover:text-white hover:bg-red-500/20 transition-all group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          <div className="p-8 bg-gray-50 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(allData).map(([k, v]) => {
                if (!v || skip.includes(k)) return null;
                const label = labelMap[k] || k.replace(/([A-Z])/g, ' $1').toUpperCase();
                const wideKeys = ['purpose', 'email', 'partnerFullName', 'currentAddress'];
                const IconComponent = iconMap[k] || FileText;
                return (
                  <div key={k} className={`flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm ${wideKeys.includes(k) ? 'sm:col-span-2' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <IconComponent className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] block mb-0.5">{label}</span>
                      {k === 'purpose' ? (
                        <div className="space-y-0.5">
                          {v.toString().split('\n').filter(Boolean).map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-gray-300 mt-1 shrink-0 text-xs">•</span>
                              <span className="text-sm font-bold text-gray-900 leading-snug uppercase">{line}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-900 leading-tight break-all uppercase">{v.toString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400 shrink-0" />
              <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">Please review all details before confirming your submission.</p>
            </div>
          </div>
          <div className="border-t bg-white px-8 py-6 flex justify-between items-center shrink-0">
            <button onClick={() => setShowConfirmation(false)} className="px-6 py-3 font-black uppercase tracking-[0.2em] text-[10px] text-gray-400 hover:text-black transition-all">← Back / Edit</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Confirm Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main 3-step modal
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 no-scrollbar" style={{ height: '92vh', maxHeight: '95vh' }}>

          {/* Header */}
          <div className="bg-black px-8 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{tenantConfig.shortName || 'Barangay'} Official Portal</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Notification */}
          {notification && (
            <div className="px-8 pt-4 shrink-0">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
                <div>
                  <p className={`font-semibold text-sm ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{notification.title}</p>
                  <p className={`text-sm mt-0.5 ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="px-8 pt-5 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {[1, 2, 3, ...(extraStep4 ? [4] : [])].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${currentStep >= s ? 'bg-black text-white scale-110' : 'bg-gray-100 text-gray-300'}`}>
                      {currentStep > s ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : s}
                    </div>
                  </div>
                  {s < (extraStep4 ? 4 : 3) && <div className={`flex-1 h-1 mx-4 rounded-full ${currentStep > s ? 'bg-black' : 'bg-gray-100'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl mx-auto">

              {/* Step 1: Resident Search */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-in slide-in-from-right-8 duration-500">
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center group cursor-pointer hover:bg-black/5 hover:border-black transition-all active:scale-95 shadow-sm hover:shadow-xl"
                    onClick={() => setIsResidentModalOpen(true)}>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-inner">
                        <Search className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tighter mb-1">Search Directory / Hanapin sa Direktoryo</h3>
                      <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] max-w-[240px] mx-auto leading-relaxed">
                        Find your profile and sync your details instantly. / Hanapin ang iyong profile at i-sync agad ang mga detalye.
                      </p>
                    </div>
                  </div>

                  {errors.fullName && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-xs font-bold uppercase">Please select your profile from the directory first.</p>
                    </div>
                  )}

                  {formData.fullName && (
                    <div className="bg-black text-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 group relative overflow-hidden border border-white/5">
                      <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle className="w-16 h-16 text-white" /></div>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Confirmed Applicant / Kumpirmadong Aplikante</p>
                      <h4 className="text-2xl font-black tracking-tighter mb-4 leading-none uppercase">{formData.fullName}</h4>
                      <div className="grid grid-cols-2 gap-2 relative z-10">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 uppercase font-black">
                          <p className="text-white/30 text-[8px] tracking-widest mb-0.5">Status</p>
                          <p className="text-emerald-400 text-xs">Verified Member / Beripikadong Miyembro</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 uppercase font-black">
                          <p className="text-white/30 text-[8px] tracking-widest mb-0.5">DB ID</p>
                          <p className="text-xs">#{formData.residentId}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {extraStep1}
                </div>
              )}

              {/* Step 2: Contact */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  <div className="group">
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
                      Cellular Number / Numero ng Cellphone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
                      <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange}
                        placeholder="09XX XXX XXXX"
                        className={`w-full pl-14 pr-6 py-4 bg-white border-4 ${errors.contactNumber ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black outline-none font-black text-xl text-center`} />
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Email <span className="normal-case font-semibold text-gray-400">(Optional / Opsyonal)</span></label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                        placeholder="YOUR@EMAIL.COM"
                        className="w-full pl-14 pr-6 py-4 bg-white border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl text-center" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Purpose + extra fields */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  {extraStep3}
                  {requirePurpose && (                    <>
                      <div className="group">
                        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-3 block">
                          {step3Label} <span className="text-red-500">*</span>
                        </label>
                        <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows={4}
                          placeholder="E.G. EMPLOYMENT, LOAN, ETC..."
                          className={`w-full px-6 py-4 bg-gray-50 border-4 ${errors.purpose ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black focus:bg-white outline-none font-black text-xl text-center uppercase tracking-tighter resize-none`} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <SearchableDropdown label="Job & Gov't" placeholder="SELECT..." items={PURPOSE_LIST_1} onSelect={handlePurposeSelect}
                          colorClass={{ label: 'text-blue-400', text: 'text-blue-600', icon: 'text-blue-300', bg: 'bg-blue-50', ring: 'ring-blue-300' }} />
                        <SearchableDropdown label="Utility" placeholder="SELECT..." items={PURPOSE_LIST_2} onSelect={handlePurposeSelect}
                          colorClass={{ label: 'text-indigo-400', text: 'text-indigo-600', icon: 'text-indigo-300', bg: 'bg-indigo-50', ring: 'ring-indigo-300' }} />
                        <SearchableDropdown label="Medical" placeholder="SELECT..." items={PURPOSE_LIST_3} onSelect={handlePurposeSelect}
                          colorClass={{ label: 'text-emerald-500', text: 'text-emerald-600', icon: 'text-emerald-300', bg: 'bg-emerald-50', ring: 'ring-emerald-300' }} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Optional extra step (e.g. address for cohabitation) */}
              {extraStep4 && currentStep === 4 && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  {extraStep4}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-white px-8 py-4 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button onClick={() => setCurrentStep(p => p - 1)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 hover:text-black transition-all">
                Previous / Nakaraan
              </button>
            ) : <div />}

            {(() => {
              const totalSteps = extraStep4 ? 4 : 3;
              if (currentStep < totalSteps) {
                return (
                  <button onClick={() => {
                    if (currentStep === 1 && !formData.fullName) { setErrors({ fullName: true }); return; }
                    if (currentStep === 2 && !formData.contactNumber) { setErrors({ contactNumber: true }); return; }
                    setCurrentStep(p => p + 1);
                  }} className="px-12 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center gap-3">
                    Next Step / Susunod <ChevronRight className="w-5 h-5" />
                  </button>
                );
              }
              return (
                <button onClick={() => {
                  if (requirePurpose && !formData.purpose.trim()) { setErrors({ purpose: true }); return; }
                  setShowConfirmation(true);
                }} className="px-12 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 hover:opacity-90 active:scale-95" style={{ backgroundColor: accentColor }}>
                  <Send className="w-5 h-5" /> Submit Request / I-submit ang Request
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {isResidentModalOpen && (
        <ResidentSearchModal
          isOpen={isResidentModalOpen}
          onClose={() => setIsResidentModalOpen(false)}
          onSelect={handleResidentSelect}
          isDemo={isDemo}
          tenantConfig={tenantConfig}
        />
      )}
    </>
  );
}


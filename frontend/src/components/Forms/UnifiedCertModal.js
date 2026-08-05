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
import LanguageGate from './LanguageGate';
import { getStrings } from '../../lib/certLang';

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
      <p className={`text-xs font-semibold ${colorClass.label} mb-1.5`}>{label}</p>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-medium ${colorClass.text} flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors outline-none focus:ring-2 focus:ring-gray-200`}>
        <span className="truncate">{placeholder}</span>
        <Search className={`w-3.5 h-3.5 shrink-0 ${colorClass.icon}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[100] bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className={`w-full px-3 py-1.5 text-xs border border-gray-100 rounded-md outline-none ${colorClass.text}`} />
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            {filtered.length > 0 ? filtered.map((item, i) => (
              <button key={i} type="button" onClick={() => { onSelect(item); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm ${colorClass.text} hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0`}>
                {item}
              </button>
            )) : (
              <div className="px-4 py-3 text-sm text-gray-400 italic text-center">&mdash;</div>
            )}
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
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [lang, setLang] = useState(null);

  const t = getStrings(lang || 'en');

  const [formData, setFormData] = useState({
    fullName: '', residentId: null, age: '', sex: '', civilStatus: '',
    address: '', dateOfBirth: '', placeOfBirth: '',
    contactNumber: '', email: '', purpose: '',
    pickupMethod: 'pickup',
  });
  const [pickupError, setPickupError] = useState('');

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
      setErrors({}); setNotification(null); setConsentChecked(false); setConsentExpanded(false); setShowPrivacyModal(false);
      setLang(null);
      setFormData({ fullName: '', residentId: null, age: '', sex: '', civilStatus: '', address: '', dateOfBirth: '', placeOfBirth: '', contactNumber: '', email: '', purpose: '', pickupMethod: 'pickup' });
      setPickupError('');
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
    setNotification({
      type: 'success',
      title: lang === 'tl' ? 'Nahanap ang Rekord' : 'Record Found',
      message: lang === 'tl'
        ? `Awtomatikong napunan ang mga detalye ni ${resident.full_name}.`
        : `${resident.full_name}'s details have been filled in.`,
    });
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
    if (formData.pickupMethod === 'online' && !formData.email?.trim()) {
      setPickupError(t.pickupEmailRequired);
      return;
    }
    setPickupError('');
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
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${accentColor}18` }}>
            <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t.successTitle}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{t.successBody}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.16em] mb-1.5">{t.referenceNumber}</p>
            <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: accentColor }}>{referenceNumber}</p>
            <p className="text-xs text-gray-500 mt-2">{t.saveReference}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: accentColor }}>
            {t.done}
          </button>
        </div>
      </div>
    );
  }

  // Confirmation Modal
  if (showConfirmation) {
    const skip = ['residentId', 'age', 'sex', 'civilStatus', 'address', 'dateOfBirth', 'placeOfBirth', 'partnerId', 'partnerAge', 'partnerSex', 'partnerDateOfBirth', 'partnerResidentialAddress'];

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
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between shrink-0" style={{ backgroundColor: accentColor }}>
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">{t.reviewEyebrow}</p>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{t.reviewTitle}</h2>
            </div>
            <button onClick={() => setShowConfirmation(false)} aria-label="Close" className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 sm:px-8 py-6 bg-gray-50 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">{t.reviewHelp}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(allData).map(([k, v]) => {
                if (!v || skip.includes(k)) return null;
                const label = labelMap[k] || k.replace(/([A-Z])/g, ' $1').toUpperCase();
                const wideKeys = ['purpose', 'email', 'partnerFullName', 'currentAddress'];
                const IconComponent = iconMap[k] || FileText;
                return (
                  <div key={k} className={`flex items-start gap-3.5 p-4 bg-white border border-gray-200 rounded-xl ${wideKeys.includes(k) ? 'sm:col-span-2' : ''}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] block mb-1">{label}</span>
                      {k === 'purpose' ? (
                        <div className="space-y-1">
                          {v.toString().split('\n').filter(Boolean).map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5 shrink-0">&bull;</span>
                              <span className="text-[15px] font-semibold text-gray-900 leading-snug">{line}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">{v.toString()}</span>
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
            {/* Pickup Method Selection */}
            <div className="mt-5">
              <h4 className="text-sm font-bold text-gray-900 mb-1">{t.pickupHeading}</h4>
              <p className="text-xs text-gray-500 mb-3">{t.pickupHelp}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, pickupMethod: 'pickup' })); setPickupError(''); }}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${formData.pickupMethod === 'pickup' ? '' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  style={formData.pickupMethod === 'pickup' ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
                >
                  <p className="text-sm font-bold" style={formData.pickupMethod === 'pickup' ? { color: accentColor } : { color: '#111827' }}>{t.pickupPickup}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.pickupPickupSub}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, pickupMethod: 'online' })); setPickupError(''); }}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${formData.pickupMethod === 'online' ? '' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  style={formData.pickupMethod === 'online' ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
                >
                  <p className="text-sm font-bold" style={formData.pickupMethod === 'online' ? { color: accentColor } : { color: '#111827' }}>{t.pickupOnline}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.pickupOnlineSub}</p>
                </button>
              </div>
              {pickupError && (
                <p className="text-xs text-red-600 mt-2">{pickupError}</p>
              )}
            </div>

            <div className="mt-5 flex items-start gap-2.5 p-4 bg-white border border-gray-200 rounded-xl">
              <input
                type="checkbox"
                id="unified-consent"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="w-4 h-4 shrink-0 cursor-pointer mt-0.5"
                style={{ accentColor }}
              />
              <label htmlFor="unified-consent" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
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
          <div className="border-t border-gray-200 bg-white px-6 sm:px-8 py-4 flex justify-between items-center gap-4 shrink-0">
            <button onClick={() => setShowConfirmation(false)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">{t.backToEdit}</button>
            <button onClick={handleSubmit} disabled={isSubmitting || !consentChecked} className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: accentColor }}>
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? t.submitting : t.submitRequest}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main 3-step modal
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>

          {/* Header */}
          <div className="px-6 sm:px-8 py-5 flex items-start justify-between shrink-0" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3.5">
              <div className="bg-white/15 p-2.5 rounded-xl border border-white/25 shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">{tenantConfig.shortName || 'Barangay'} &middot; {t.officialForm}</p>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{title}</h2>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notification */}
          {notification && (
            <div className="px-6 sm:px-8 pt-4 shrink-0">
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

          {/* Language gate — shown before the wizard begins */}
          {!lang && (
            <LanguageGate accentColor={accentColor} lang={lang} onSelect={setLang} />
          )}

          {/* Progress Steps */}
          {lang && (
          <div className="px-6 sm:px-8 py-5 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className="flex items-start">
              {[
                { n: 1, label: t.stepIdentity },
                { n: 2, label: t.stepContact },
                { n: 3, label: t.stepPurpose },
                ...(extraStep4 ? [{ n: 4, label: t.stepExtra }] : []),
              ].map(({ n, label }) => (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center gap-2 w-[88px] shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= n ? 'text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`} style={currentStep >= n ? { backgroundColor: accentColor } : undefined}>
                      {currentStep > n ? <CheckCircle className="w-5 h-5" /> : n}
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${currentStep >= n ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {n < (extraStep4 ? 4 : 3) && <div className="flex-1 h-[3px] rounded-full mt-[18px] bg-gray-200" style={{ backgroundColor: currentStep > n ? accentColor : undefined }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          )}

          {/* Step Content */}
          {lang && (
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            <div>

              {/* Step 1: Resident Search */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.identityHeading}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t.identityHelp}</p>
                  </div>

                  <button type="button" onClick={() => setIsResidentModalOpen(true)}
                    className="w-full flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: accentColor }}>
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{t.searchDirectory}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.searchDirectorySub}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
                  </button>

                  {errors.fullName && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{t.errNoRecord}</p>
                    </div>
                  )}

                  {formData.fullName && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden animate-in fade-in duration-300">
                      <div className="px-5 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${accentColor}12` }}>
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accentColor }}>{t.verifiedApplicant}</p>
                      </div>
                      <div className="p-5 bg-white">
                        <p className="text-lg font-bold text-gray-900 leading-tight">{formData.fullName}</p>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.recordNo}</dt>
                            <dd className="text-sm font-semibold text-gray-800">#{formData.residentId}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.address}</dt>
                            <dd className="text-sm font-semibold text-gray-800 truncate">{formData.address || <span className="text-gray-400 italic font-normal">{t.notRecorded}</span>}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {extraStep1}
                </div>
              )}

              {/* Step 2: Contact */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.contactHeading}</h3>
                    <p className="text-sm text-gray-500">{t.contactHelp}</p>
                  </div>
                  <div>
                    <label htmlFor="uc-contact" className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {t.mobileLabel} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input id="uc-contact" type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange}
                        placeholder="09XX XXX XXXX"
                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.contactNumber ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                    </div>
                    {errors.contactNumber ? (
                      <p className="text-xs text-red-600 mt-1.5">{t.errMobile}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1.5">{t.mobileHelp}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="uc-email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {t.emailLabel} <span className="font-normal text-gray-400">{t.optional}</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input id="uc-email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Purpose + extra fields */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {extraStep3}
                  {requirePurpose && (
                    <>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">{t.purposeHeading}</h3>
                        <p className="text-sm text-gray-500">{t.purposeHelp}</p>
                      </div>
                      <div>
                        <label htmlFor="uc-purpose" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          {t.purposeLabel} <span className="text-red-600">*</span>
                        </label>
                        <textarea id="uc-purpose" name="purpose" value={formData.purpose} onChange={handleInputChange} rows={4}
                          placeholder={t.purposePlaceholder}
                          className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors resize-none focus:ring-2 ${errors.purpose ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                        {errors.purpose && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errPurpose}</p>
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-2.5">{t.quickAdd}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <SearchableDropdown label={t.catWork} placeholder={t.select} items={PURPOSE_LIST_1} onSelect={handlePurposeSelect}
                            colorClass={{ label: 'text-gray-500', text: 'text-gray-800', icon: 'text-gray-400', bg: 'bg-gray-50', ring: 'ring-gray-200' }} />
                          <SearchableDropdown label={t.catUtility} placeholder={t.select} items={PURPOSE_LIST_2} onSelect={handlePurposeSelect}
                            colorClass={{ label: 'text-gray-500', text: 'text-gray-800', icon: 'text-gray-400', bg: 'bg-gray-50', ring: 'ring-gray-200' }} />
                          <SearchableDropdown label={t.catMedical} placeholder={t.select} items={PURPOSE_LIST_3} onSelect={handlePurposeSelect}
                            colorClass={{ label: 'text-gray-500', text: 'text-gray-800', icon: 'text-gray-400', bg: 'bg-gray-50', ring: 'ring-gray-200' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Optional extra step (e.g. address for cohabitation) */}
              {extraStep4 && currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {extraStep4}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Footer */}
          {lang && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 shrink-0">
            {currentStep > 1 ? (
              <button onClick={() => setCurrentStep(p => p - 1)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
                {t.back}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => setLang(null)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
                  {t.back}
                </button>
                <p className="text-xs text-gray-500"><span className="text-red-600">*</span> {t.requiredFields}</p>
              </div>
            )}

            {(() => {
              const totalSteps = extraStep4 ? 4 : 3;
              if (currentStep < totalSteps) {
                return (
                  <button onClick={() => {
                    if (currentStep === 1 && !formData.fullName) { setErrors({ fullName: true }); return; }
                    if (currentStep === 2 && !formData.contactNumber) { setErrors({ contactNumber: true }); return; }
                    setCurrentStep(p => p + 1);
                  }} className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2" style={{ backgroundColor: accentColor }}>
                    {t.continue} <ChevronRight className="w-4 h-4" />
                  </button>
                );
              }
              return (
                <button onClick={() => {
                  if (requirePurpose && !formData.purpose.trim()) { setErrors({ purpose: true }); return; }
                  setShowConfirmation(true);
                }} className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2" style={{ backgroundColor: accentColor }}>
                  <Send className="w-4 h-4" /> {t.reviewSubmit}
                </button>
              );
            })()}
          </div>
          )}
        </div>
      </div>

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
    </>
  );
}


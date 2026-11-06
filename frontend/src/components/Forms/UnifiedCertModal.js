/**
 * UnifiedCertModal — Shared 3-step certificate request modal
 * Used by: Indigency, Residency, Guardianship, Cohabitation, MedicoLegal, SamePerson, NaturalDeath
 * Step 1: Resident Search
 * Step 2: Contact (phone + email)
 * Step 3: Purpose + optional extra fields
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Search, Phone, Mail, Send, CheckCircle, ChevronRight, AlertCircle, Info, User, Hash, Calendar, MapPin, Users, Clock, Baby, Fingerprint, Shield, Link, ClipboardList, Home, Building } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import CertSearchableDropdown from './CertSearchableDropdown';
import { getStrings } from '../../lib/certLang';
import LanguageGate from './LanguageGate';
import PickupMethodSelector from './PickupMethodSelector';
import {
  formatResidentPurokForPortal,
  generateFullAddress,
} from '@/lib/addressHelper';
import {
  GUARDIAN_RELATIONSHIP_TO_APPLICANT_OPTIONS,
  labelForGuardianRelationshipToApplicant,
  requiresGuardianForMinor,
} from '@/lib/minorGuardianFields';
import {
  buildGuardianFullName,
  guardianNamePartsComplete,
} from '@/lib/guardianNameParts';
import useScrollLock from '@/lib/useScrollLock';
import useMobileModalViewport, {
  certModalOverlayClass,
  certModalBackdropClass,
  certModalBackdropHeavyClass,
  certModalPanelClass,
  certModalBodyClass,
  certModalScrollClass,
  certModalScrollPurposeClass,
  certModalFooterClass,
  certModalFooterBackClass,
  certModalFooterPrimaryClass,
} from '@/lib/useMobileModalViewport';

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
  const t = getStrings(lang || "tl");

  const [formData, setFormData] = useState({
    fullName: '', residentId: null, age: '', sex: '', civilStatus: '',
    address: '', purok: '', subdivision: '', dateOfBirth: '', placeOfBirth: '',
    contactNumber: '', email: '', purpose: '',
    pickupMethod: 'pickup',
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianLastName: '',
    guardianSuffix: '',
    guardianName: '',
    guardianRelationship: '',
  });
  const [pickupError, setPickupError] = useState('');
  const panelRef = useRef(null);
  const confirmPanelRef = useRef(null);

  useScrollLock(isOpen);
  useMobileModalViewport(
    panelRef,
    isOpen && !showSuccess && !showConfirmation,
  );
  useMobileModalViewport(confirmPanelRef, isOpen && showConfirmation);

  useEffect(() => {
    if (!isOpen) {
      setLang(null);
      setCurrentStep(1); setShowConfirmation(false); setShowSuccess(false);
      setErrors({}); setNotification(null); setConsentChecked(false); setConsentExpanded(false); setShowPrivacyModal(false);
      setFormData({ fullName: '', residentId: null, age: '', sex: '', civilStatus: '', address: '', purok: '', subdivision: '', dateOfBirth: '', placeOfBirth: '', contactNumber: '', email: '', purpose: '', pickupMethod: 'pickup', guardianFirstName: '', guardianMiddleName: '', guardianLastName: '', guardianSuffix: '', guardianName: '', guardianRelationship: '' });
      setPickupError('');
    }
  }, [isOpen]);

  const handleWizardBack = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
      return;
    }
    if (lang) {
      setLang(null);
      setCurrentStep(1);
      setErrors({});
      return;
    }
    onClose();
  };

  const handleResidentSelect = (resident) => {
    setFormData(prev => ({
      ...prev,
      fullName: resident.full_name || '',
      residentId: resident.id,
      age: resident.age || '',
      sex: resident.gender || resident.sex || '',
      civilStatus: resident.civil_status || '',
      address: generateFullAddress(resident) || resident.residential_address || '',
      purok: resident.purok || '',
      subdivision: resident.subdivision || '',
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
    const { name, value: rawValue } = e.target;
    const value =
      name === 'guardianFirstName' ||
      name === 'guardianMiddleName' ||
      name === 'guardianLastName' ||
      name === 'guardianSuffix'
        ? rawValue.toUpperCase()
        : rawValue;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (
        name === 'guardianFirstName' ||
        name === 'guardianMiddleName' ||
        name === 'guardianLastName' ||
        name === 'guardianSuffix'
      ) {
        next.guardianName = buildGuardianFullName(next);
      }
      return next;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    if (
      (name === 'guardianFirstName' ||
        name === 'guardianMiddleName' ||
        name === 'guardianLastName' ||
        name === 'guardianSuffix') &&
      errors.guardianName
    ) {
      setErrors((prev) => ({ ...prev, guardianName: false }));
    }
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
  const needsGuardian = requiresGuardianForMinor(
    certType,
    formData.age,
    formData.dateOfBirth,
  );

  // Success Modal
  if (showSuccess) {
    const handleTrackRedirect = () => {
      if (typeof window !== "undefined") {
        window.__pendingScrollTarget = "track";
      }
      onClose();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("brgydesk:auto-track", { detail: { ref: referenceNumber } })
        );
        const scrollToTrack = () => {
          const trackElem = document.getElementById("track");
          if (trackElem) {
            const navOffset = 80;
            const y = trackElem.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0) - navOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
          } else {
            window.location.href = `/track-status?ref=${encodeURIComponent(referenceNumber)}`;
          }
        };
        scrollToTrack();
        setTimeout(scrollToTrack, 100);
        setTimeout(scrollToTrack, 300);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onTouchMove={(e) => e.preventDefault()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}18` }}>
            <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1.5">{t.successTitle}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.successBody}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-4 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.16em] mb-1">{t.referenceNumber}</p>
            <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: accentColor }}>{referenceNumber}</p>
            <p className="text-xs text-gray-500 mt-1.5">{t.saveReference}</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 mb-5 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-0.5">
                  {lang === "tl" ? "Subaybayan ang Kahilingan" : "Request Tracking"}
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {t.trackInstruction || (lang === "tl"
                    ? "Maaari mong subaybayan ang live na estado at pag-apruba ng iyong kahilingan gamit ang Request Tracking."
                    : "You can monitor the real-time status and approval progress of your request using Request Tracking.")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleTrackRedirect}
              className="w-full py-3.5 px-4 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <Search className="w-4 h-4" />
              <span>{t.trackAction || (lang === "tl" ? "Subaybayan ang Kahilingan Ngayon" : "Track Request Now")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Modal
  if (showConfirmation) {
    const skip = ['residentId', 'age', 'sex', 'civilStatus', 'address', 'dateOfBirth', 'placeOfBirth', 'partnerId', 'partnerAge', 'partnerSex', 'partnerDateOfBirth', 'partnerResidentialAddress', 'purok', 'subdivision', 'guardianFirstName', 'guardianMiddleName', 'guardianLastName', 'guardianSuffix'];

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
      pickupMethod: t.pickupMethodLabel,
      partnerFullName: "Partner's Name / Pangalan ng Kasama",
      yearsLiving: 'Years Together / Taon ng Pagsasama',
      numberOfChildren: 'No. of Children / Bilang ng Anak',
      aliasName: 'Second Name / Other Name',
      guardianName: `${t.guardianNameLabel} / Pangalan ng magulang o tagapag-alaga`,
      guardianRelationship: `${t.guardianRelationshipLabel} / Ugnayan`,
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
      <div className={certModalOverlayClass} onTouchMove={(e) => e.preventDefault()}>
        <div className={certModalBackdropHeavyClass} onClick={() => setShowConfirmation(false)} aria-hidden />
        <div ref={confirmPanelRef} className={certModalPanelClass}>
          <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between shrink-0" style={{ backgroundColor: accentColor }}>
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">{t.reviewEyebrow}</p>
              <h2 className="text-base sm:text-xl font-bold text-white leading-tight">{t.reviewTitle}</h2>
            </div>
            <button onClick={() => setShowConfirmation(false)} aria-label="Close" className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 overflow-y-auto overscroll-contain">
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
                      ) : k === 'pickupMethod' ? (
                        <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">
                          {v === 'online' ? t.pickupOnline : t.pickupPickup}
                        </span>
                      ) : k === 'guardianRelationship' ? (
                        <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">
                          {labelForGuardianRelationshipToApplicant(v, lang)}
                        </span>
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
          <div className="border-t border-gray-200 bg-white px-4 sm:px-8 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2.5 sm:gap-4 shrink-0">
            <button onClick={() => setShowConfirmation(false)} className="w-full sm:w-auto justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">{t.backToEdit}</button>
            <button onClick={handleSubmit} disabled={isSubmitting || !consentChecked} className="w-full sm:w-auto justify-center px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: accentColor }}>
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
      <div className={certModalOverlayClass}>
        <div className={certModalBackdropClass} onClick={onClose} onTouchMove={(e) => e.preventDefault()} aria-hidden />
        <div ref={panelRef} className={certModalPanelClass}>

          {/* Header */}
          <div className="px-4 sm:px-8 py-3.5 sm:py-5 flex items-start justify-between shrink-0 max-sm:sticky max-sm:top-0 max-sm:z-30" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="bg-white/15 p-2 sm:p-2.5 rounded-xl border border-white/25 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] mb-0.5 sm:mb-1">{tenantConfig.shortName || 'Barangay'} &middot; {t.officialForm}</p>
                <h2 className="text-base sm:text-xl font-bold text-white leading-tight">{title}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className={`text-white hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors shrink-0 touch-manipulation${!lang ? " max-sm:hidden" : ""}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!lang && (
            <>
              <div className={certModalBodyClass}>
                <div className={`${certModalScrollClass} flex flex-col min-h-0 overflow-y-auto overscroll-contain`}>
                  <LanguageGate accentColor={accentColor} lang={lang} onSelect={setLang} />
                </div>
              </div>
              <div
                className={certModalFooterClass}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button type="button" onClick={onClose} className={certModalFooterBackClass}>
                    {t.close}
                  </button>
                </div>
              </div>
            </>
          )}

          {lang && (
          <div className={certModalBodyClass}>
          {/* Notification */}
          {notification && (
            <div className="px-4 sm:px-8 pt-3 sm:pt-4 shrink-0">
              <div className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
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
          <div className="px-4 sm:px-8 py-2.5 sm:py-5 bg-gray-50 border-b border-gray-200 shrink-0 overflow-x-auto">
            <div className="flex items-start min-w-max sm:min-w-0 justify-between">
              {[
                { n: 1, label: t.stepIdentity },
                { n: 2, label: t.stepContact },
                { n: 3, label: t.stepPurpose },
                ...(extraStep4 ? [{ n: 4, label: t.stepExtra }] : []),
              ].map(({ n, label }) => (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2 w-[76px] sm:w-[88px] shrink-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${currentStep >= n ? 'text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`} style={currentStep >= n ? { backgroundColor: accentColor } : undefined}>
                      {currentStep > n ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : n}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-semibold text-center leading-tight ${currentStep >= n ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {n < (extraStep4 ? 4 : 3) && <div className="flex-1 h-[2px] sm:h-[3px] rounded-full mt-[16px] sm:mt-[18px] min-w-[20px] bg-gray-200" style={{ backgroundColor: currentStep > n ? accentColor : undefined }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className={currentStep === 3 || (extraStep4 && currentStep === 4) ? certModalScrollPurposeClass : certModalScrollClass}>
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
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="text-lg font-bold text-gray-900 leading-tight min-w-0 flex-1">
                            {formData.fullName}
                          </p>
                          <p className="text-sm font-semibold text-gray-700 shrink-0 text-right">
                            {formatResidentPurokForPortal({
                              purok: formData.purok,
                              subdivision: formData.subdivision,
                            }) || (
                              <span className="text-gray-400 italic font-normal text-xs">{t.notRecorded}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {extraStep1}
                </div>
              )}

              {/* Step 2: Contact */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <PickupMethodSelector
                    t={t}
                    accentColor={accentColor}
                    pickupMethod={formData.pickupMethod}
                    onSelect={(method) => {
                      setFormData((prev) => ({ ...prev, pickupMethod: method }));
                      setPickupError('');
                      if (method !== 'online') {
                        setErrors((prev) => ({ ...prev, email: false }));
                      }
                    }}
                    pickupError={pickupError}
                  />
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.contactHeading}</h3>
                    <p className="text-sm text-gray-500">{t.contactHelp}</p>
                    <p className="text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 mt-3 leading-relaxed">
                      {t.readyNotifyReminder}
                    </p>
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
                      {t.emailLabel}{' '}
                      {formData.pickupMethod === 'online' ? (
                        <span className="text-red-600">*</span>
                      ) : (
                        <span className="font-normal text-gray-400">{t.optional}</span>
                      )}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input id="uc-email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                        placeholder="you@example.com"
                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.email ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1.5">{t.pickupEmailRequired}</p>
                    )}
                    {formData.pickupMethod === 'online' && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mt-2 leading-relaxed">
                        {t.pickupEmailReminder}
                      </p>
                    )}
                  </div>

                  {needsGuardian && (
                    <div className="pt-2 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                          <Shield className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                          {t.guardianHeading}
                        </h4>
                        <p className="text-xs text-gray-500">{t.guardianHelp}</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-800">
                          {t.guardianNameLabel} <span className="text-red-600">*</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="uc-guardian-fn" className="block text-xs font-medium text-gray-600 mb-1">
                              {t.guardianFirstNameLabel} <span className="text-red-600">*</span>
                            </label>
                            <input
                              id="uc-guardian-fn"
                              type="text"
                              name="guardianFirstName"
                              value={formData.guardianFirstName}
                              onChange={handleInputChange}
                              autoComplete="given-name"
                              placeholder={t.guardianFirstNamePlaceholder}
                              className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] uppercase text-gray-900 outline-none transition-colors focus:ring-2 ${errors.guardianName ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                            />
                          </div>
                          <div>
                            <label htmlFor="uc-guardian-mn" className="block text-xs font-medium text-gray-600 mb-1">
                              {t.guardianMiddleNameLabel} <span className="text-red-600">*</span>
                            </label>
                            <input
                              id="uc-guardian-mn"
                              type="text"
                              name="guardianMiddleName"
                              value={formData.guardianMiddleName}
                              onChange={handleInputChange}
                              autoComplete="additional-name"
                              placeholder={t.guardianMiddleNamePlaceholder}
                              className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] uppercase text-gray-900 outline-none transition-colors focus:ring-2 ${errors.guardianName ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                            />
                          </div>
                          <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-3">
                            <div>
                              <label htmlFor="uc-guardian-ln" className="block text-xs font-medium text-gray-600 mb-1">
                                {t.guardianLastNameLabel} <span className="text-red-600">*</span>
                              </label>
                              <input
                                id="uc-guardian-ln"
                                type="text"
                                name="guardianLastName"
                                value={formData.guardianLastName}
                                onChange={handleInputChange}
                                autoComplete="family-name"
                                placeholder={t.guardianLastNamePlaceholder}
                                className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] uppercase text-gray-900 outline-none transition-colors focus:ring-2 ${errors.guardianName ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                              />
                            </div>
                            <div>
                              <label htmlFor="uc-guardian-sx" className="block text-xs font-medium text-gray-600 mb-1">
                                {t.guardianSuffixLabel}{' '}
                                <span className="font-normal text-gray-400">{t.guardianSuffixOptional}</span>
                              </label>
                              <input
                                id="uc-guardian-sx"
                                type="text"
                                name="guardianSuffix"
                                value={formData.guardianSuffix}
                                onChange={handleInputChange}
                                placeholder={t.guardianSuffixPlaceholder}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] uppercase text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                        {errors.guardianName && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errGuardianNameParts}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="uc-guardian-rel" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          {t.guardianRelationshipLabel} <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="uc-guardian-rel"
                            name="guardianRelationship"
                            value={formData.guardianRelationship}
                            onChange={handleInputChange}
                            className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.guardianRelationship ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:ring-gray-200"}`}
                          >
                            <option value="">{t.guardianRelationshipSelect}</option>
                            {GUARDIAN_RELATIONSHIP_TO_APPLICANT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {lang === 'en' ? opt.en : opt.tl}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                        {errors.guardianRelationship && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errGuardianRelationship}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Purpose + extra fields */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {typeof extraStep3 === 'function' ? extraStep3(lang, t) : extraStep3}
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
                          <CertSearchableDropdown label={t.catWork} placeholder={t.select} items={PURPOSE_LIST_1} onSelect={handlePurposeSelect}
                            colorClass={{ label: 'text-gray-500', text: 'text-gray-800', icon: 'text-gray-400', bg: 'bg-gray-50', ring: 'ring-gray-200' }} />
                          <CertSearchableDropdown label={t.catUtility} placeholder={t.select} items={PURPOSE_LIST_2} onSelect={handlePurposeSelect}
                            colorClass={{ label: 'text-gray-500', text: 'text-gray-800', icon: 'text-gray-400', bg: 'bg-gray-50', ring: 'ring-gray-200' }} />
                          <CertSearchableDropdown label={t.catMedical} placeholder={t.select} items={PURPOSE_LIST_3} onSelect={handlePurposeSelect}
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
                  {typeof extraStep4 === 'function' ? extraStep4(lang, t) : extraStep4}
                </div>
              )}
            </div>
          </div>
          </div>
          )}

          {/* Footer */}
          {lang && (
          <div
            className={certModalFooterClass}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button type="button" onClick={handleWizardBack} className={certModalFooterBackClass}>
                {t.back}
              </button>
              {currentStep === 1 && (
                <p className="hidden sm:block text-xs text-gray-500 truncate"><span className="text-red-600">*</span> {t.requiredFields}</p>
              )}
            </div>

            {(() => {
              const totalSteps = extraStep4 ? 4 : 3;
              if (currentStep < totalSteps) {
                return (
                  <button type="button" onClick={() => {
                    if (currentStep === 1 && !formData.fullName) { setErrors({ fullName: true }); return; }
                    if (currentStep === 2) {
                      const stepErrors = {};
                      if (!formData.contactNumber) stepErrors.contactNumber = true;
                      if (formData.pickupMethod === 'online' && !formData.email?.trim()) {
                        stepErrors.email = true;
                        setPickupError(t.pickupEmailRequired);
                      } else {
                        setPickupError('');
                      }
                      const g = requiresGuardianForMinor(
                        certType,
                        formData.age,
                        formData.dateOfBirth,
                      );
                      if (g) {
                        if (!guardianNamePartsComplete(formData)) {
                          stepErrors.guardianName = true;
                        }
                        if (!String(formData.guardianRelationship || "").trim()) {
                          stepErrors.guardianRelationship = true;
                        }
                      }
                      if (Object.keys(stepErrors).length) {
                        setErrors(stepErrors);
                        return;
                      }
                    }
                    setCurrentStep(p => p + 1);
                  }} className={certModalFooterPrimaryClass} style={{ backgroundColor: accentColor }}>
                    {t.continue} <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>
                );
              }
              return (
                <button type="button" onClick={() => {
                  if (requirePurpose && !formData.purpose.trim()) { setErrors({ purpose: true }); return; }
                  if (
                    requiresGuardianForMinor(
                      certType,
                      formData.age,
                      formData.dateOfBirth,
                    ) &&
                    (!guardianNamePartsComplete(formData) ||
                      !String(formData.guardianRelationship || "").trim())
                  ) {
                    const e = {};
                    if (!guardianNamePartsComplete(formData)) e.guardianName = true;
                    if (!String(formData.guardianRelationship || "").trim()) e.guardianRelationship = true;
                    setErrors(e);
                    setCurrentStep(2);
                    return;
                  }
                  setShowConfirmation(true);
                }} className={certModalFooterPrimaryClass} style={{ backgroundColor: accentColor }}>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{t.reviewSubmit}</span>
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
          lang={lang || "tl"}
        />
      )}
    </>
  );
}


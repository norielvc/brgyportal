import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Mail, Send, CheckCircle, ChevronRight, AlertCircle, Briefcase, MapPin, Store, Calendar } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { getStrings } from '../../lib/certLang';
import LanguageGate from './LanguageGate';
import {
  formatResidentPurokForPortal,
  generateFullAddress,
  getAutoAddressFields,
  PUROK_OPTIONS,
  isSubdivisionPurok,
  getSubdivisionInfo,
  cleanBarangayName,
  cleanMunicipalityName,
  cleanProvinceName,
} from '@/lib/addressHelper';
import MobileNumberInput, { formatPhMobile, isValidPhMobile, maskPhMobile, phMobileDigits } from './MobileNumberInput';
import useScrollLock from '@/lib/useScrollLock';
import useMobileModalViewport, {
  certModalOverlayClass,
  certModalBackdropClass,
  certModalPanelClass,
  certModalBodyClass,
  certModalScrollClass,
  certModalFooterClass,
  certModalFooterBackClass,
  certModalFooterPrimaryClass,
} from '@/lib/useMobileModalViewport';

const BUSINESS_TYPES = [
  'SARI-SARI STORE', 'CARINDERIA / EATERY', 'BAKERY', 'SALON / BARBERSHOP',
  'REPAIR SHOP', 'INTERNET CAFE', 'PHARMACY / DRUGSTORE', 'HARDWARE STORE',
  'CLOTHING / BOUTIQUE', 'GROCERY STORE', 'WATER REFILLING STATION',
  'LAUNDRY SHOP', 'PRINTING / PHOTOCOPYING', 'RICE DEALER', 'LIVESTOCK / POULTRY',
  'CONSTRUCTION MATERIALS', 'FOOD STALL / KIOSK', 'TRANSPORT / TRICYCLE OPERATOR',
  'LENDING / FINANCING', 'RETAIL', 'OTHER RETAIL BUSINESS', 'OTHER SERVICE BUSINESS',
].sort((a, b) => a.localeCompare(b));

const CLOSURE_REASONS = [
  'Financial Difficulty / Incapability (Bankruptcy)',
  'Low Sales / Non-Viable Operations',
  'Voluntary Cessation / Retirement',
  'Relocation of Business',
  'Change of Ownership / Management',
  'Other',
];

export default function BusinessClosureModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notification, setNotification] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [lang, setLang] = useState(null);
  const [contactMasked, setContactMasked] = useState(false);
  const t = getStrings(lang || 'tl');

  const [formData, setFormData] = useState({
    ownerFullName: '',
    residentId: null,
    age: '',
    sex: '',
    civilStatus: '',
    purok: '',
    subdivision: '',
    ownerAddress: '',
    dateOfBirth: '',
    placeOfBirth: '',
    contactNumber: '',
    email: '',
    businessName: '',
    natureOfBusiness: '',
    businessAddress: '',
    bizPurok: '',
    bizHouseNumber: '',
    bizBlock: '',
    bizLot: '',
    closureDate: new Date().toISOString().split('T')[0],
    closureReasonPreset: 'Financial Difficulty / Incapability (Bankruptcy)',
    closureReasonCustom: '',
    purpose: 'BUSINESS CLOSURE',
    pickupMethod: 'pickup',
  });
  const [pickupError, setPickupError] = useState('');
  const panelRef = useRef(null);
  const confirmPanelRef = useRef(null);

  useScrollLock(isOpen);
  useMobileModalViewport(panelRef, isOpen && !showSuccess && !showConfirmation);
  useMobileModalViewport(confirmPanelRef, isOpen && showConfirmation);

  useEffect(() => {
    if (!isOpen) {
      setLang(null);
      setCurrentStep(1);
      setShowConfirmation(false);
      setShowSuccess(false);
      setErrors({});
      setNotification(null);
      setConsentChecked(false);
      setShowPrivacyModal(false);
      setFormData({
        ownerFullName: '',
        residentId: null,
        age: '',
        sex: '',
        civilStatus: '',
        purok: '',
        subdivision: '',
        ownerAddress: '',
        dateOfBirth: '',
        placeOfBirth: '',
        contactNumber: '',
        email: '',
        businessName: '',
        natureOfBusiness: '',
        businessAddress: '',
        bizPurok: '',
        bizHouseNumber: '',
        bizBlock: '',
        bizLot: '',
        closureDate: new Date().toISOString().split('T')[0],
        closureReasonPreset: 'Financial Difficulty / Incapability (Bankruptcy)',
        closureReasonCustom: '',
        purpose: 'BUSINESS CLOSURE',
        pickupMethod: 'pickup',
      });
      setPickupError('');
      setContactMasked(false);
    }
  }, [isOpen]);

  const effectiveClosureReason =
    formData.closureReasonPreset === 'Other'
      ? formData.closureReasonCustom.trim()
      : formData.closureReasonPreset;

  const autoGeo = getAutoAddressFields(tenantConfig);
  const bizBarangay = cleanBarangayName(autoGeo.barangay) || "IBA O' ESTE";
  const bizMunicipality = cleanMunicipalityName(autoGeo.municipality) || "CALUMPIT";
  const bizProvince = cleanProvinceName(autoGeo.province) || "BULACAN";
  const bizSubInfo = getSubdivisionInfo(formData.bizPurok);
  const bizHouse = isSubdivisionPurok(formData.bizPurok)
    ? [
        formData.bizBlock?.trim() && `BLOCK ${formData.bizBlock.trim()}`,
        formData.bizLot?.trim() && `LOT ${formData.bizLot.trim()}`,
      ]
        .filter(Boolean)
        .join(' ')
    : formData.bizHouseNumber || '';
  const composedBusinessAddress = formData.bizPurok
    ? generateFullAddress({
        house_number: bizHouse,
        purok: bizSubInfo?.parentPurok || formData.bizPurok,
        subdivision: bizSubInfo?.subdivision || null,
        barangay: bizBarangay,
        municipality: bizMunicipality,
        province: bizProvince,
      })
    : '';

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
    setFormData((prev) => ({
      ...prev,
      ownerFullName: resident.full_name || '',
      residentId: resident.id,
      age: resident.age || '',
      sex: resident.gender || resident.sex || '',
      civilStatus: resident.civil_status || '',
      ownerAddress: resident.residential_address || '',
      purok: resident.purok || '',
      subdivision: resident.subdivision || '',
      dateOfBirth: resident.date_of_birth || '',
      placeOfBirth: resident.place_of_birth || '',
      contactNumber: resident.contact_number
        ? formatPhMobile(resident.contact_number)
        : prev.contactNumber,
    }));
    setContactMasked(
      Boolean(resident.contact_number && phMobileDigits(resident.contact_number).length >= 4),
    );
    setIsResidentModalOpen(false);
    setErrors((prev) => ({ ...prev, ownerFullName: false }));
    setNotification({
      type: 'success',
      title: 'Profile Found',
      message: `${resident.full_name}'s details have been auto-filled.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async () => {
    setPickupError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/portal/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantConfig?.tenant_id || (isDemo ? 'demo' : 'ibaoeste'),
        },
        body: JSON.stringify({
          type: 'business_closure',
          formData: {
            ...formData,
            pickupMethod: 'pickup',
            businessAddress: composedBusinessAddress || formData.businessAddress,
            closureReason: effectiveClosureReason,
            fullName: formData.ownerFullName,
            address: formData.ownerAddress,
            contactNumber: phMobileDigits(formData.contactNumber),
          },
        }),
      });
      const result = await response.json();
      if (result.success) {
        setReferenceNumber(result.referenceNumber);
        setShowConfirmation(false);
        setShowSuccess(true);
      } else if (
        result.code === 'DUPLICATE_REQUEST' ||
        result.code === 'RATE_LIMITED' ||
        result.code === 'COOLDOWN_ACTIVE'
      ) {
        setShowConfirmation(false);
        setNotification({
          type: 'error',
          title:
            result.code === 'DUPLICATE_REQUEST'
              ? 'Existing Request Found'
              : 'Request Blocked',
          message: result.message,
        });
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Submission Failed',
        message: err.message,
      });
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentColor = tenantConfig.primaryColor || '#059669';

  if (!isOpen) return null;

  if (showSuccess) {
    const handleTrackRedirect = () => {
      if (typeof window !== 'undefined') {
        window.__pendingScrollTarget = 'track';
      }
      onClose();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('brgydesk:auto-track', { detail: { ref: referenceNumber } }),
        );
        const scrollToTrack = () => {
          const trackElem = document.getElementById('track');
          if (trackElem) {
            const navOffset = 80;
            const y =
              trackElem.getBoundingClientRect().top +
              (window.pageYOffset || window.scrollY || 0) -
              navOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onTouchMove={(e) => e.preventDefault()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1.5">{t.successTitle}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.successBody}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-4 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.16em] mb-1">
              {t.referenceNumber}
            </p>
            <p
              className="text-2xl font-bold font-mono tracking-tight"
              style={{ color: accentColor }}
            >
              {referenceNumber}
            </p>
            <p className="text-xs text-gray-500 mt-1.5">{t.saveReference}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleTrackRedirect}
              className="w-full py-3.5 px-4 text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <Search className="w-4 h-4" />
              <span>
                {t.trackAction ||
                  (lang === 'tl'
                    ? 'Subaybayan ang Kahilingan Ngayon'
                    : 'Track Request Now')}
              </span>
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

  if (showConfirmation) {
    const fields = [
      {
        key: 'owner',
        label: lang === 'tl' ? 'Pangalan ng May-ari' : 'Owner Name',
        value: formData.ownerFullName,
      },
      {
        key: 'contact',
        label: t.mobileLabel,
        value: contactMasked ? maskPhMobile(formData.contactNumber) : formData.contactNumber,
      },
      { key: 'email', label: t.emailLabel, value: formData.email, wide: true },
      { key: 'bizName', label: t.businessNameLabel, value: formData.businessName },
      { key: 'nature', label: t.natureLabel, value: formData.natureOfBusiness },
      { key: 'bizAddress', label: t.businessAddressLabel, value: composedBusinessAddress || formData.businessAddress, wide: true },
      {
        key: 'closureDate',
        label: lang === 'tl' ? 'Petsa ng Pagsasara' : 'Effective Date of Closure',
        value: formData.closureDate,
      },
      {
        key: 'closureReason',
        label: lang === 'tl' ? 'Dahilan ng Pagsasara' : 'Reason for Closure',
        value: effectiveClosureReason,
        wide: true,
      },
    ].filter((f) => f.value);

    return (
      <div
        className={`${certModalOverlayClass} z-[60] bg-black/80 backdrop-blur-md`}
        onTouchMove={(e) => e.preventDefault()}
      >
        <div ref={confirmPanelRef} className={certModalPanelClass}>
          <div
            className="px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">
                {t.reviewEyebrow}
              </p>
              <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
                {t.reviewTitle}
              </h2>
            </div>
            <button
              onClick={() => setShowConfirmation(false)}
              aria-label={t.close}
              className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">{t.reviewHelp}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map(({ key, label, value, wide }) => (
                <div
                  key={key}
                  className={`p-4 bg-white border border-gray-200 rounded-xl ${wide ? 'sm:col-span-2' : ''}`}
                >
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] block mb-1">
                    {label}
                  </span>
                  <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {showPrivacyModal && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t.privacyTitle}</h3>
                  <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                    <p>{t.privacyP1}</p>
                    <p>
                      {t.privacyP2} <strong>{t.privacyAct}</strong>.
                    </p>
                    <p>{t.privacyP3}</p>
                  </div>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="mt-6 w-full py-3 text-white rounded-lg font-semibold text-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-start gap-2.5 p-4 bg-white border border-gray-200 rounded-xl">
              <input
                type="checkbox"
                id="bcl-consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-4 h-4 shrink-0 cursor-pointer mt-0.5"
                style={{ accentColor }}
              />
              <label
                htmlFor="bcl-consent"
                className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed"
              >
                {t.consentPrefix}{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
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
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full sm:w-auto justify-center px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors text-center"
            >
              {t.backToEdit}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !consentChecked}
              className="w-full sm:w-auto justify-center px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? t.submitting : t.submitRequest}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepLabels = [
    t.stepOwner,
    t.stepBusiness,
    lang === 'tl' ? 'Detalye ng Pagsasara' : 'Closure Details',
  ];

  return (
    <>
      <div className={certModalOverlayClass}>
        <div
          className={certModalBackdropClass}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
          aria-hidden
        />
        <div ref={panelRef} className={certModalPanelClass}>
          {/* Header */}
          <div
            className="px-4 sm:px-8 py-3.5 sm:py-5 flex items-start justify-between shrink-0 max-sm:sticky max-sm:top-0 max-sm:z-30"
            style={{ backgroundColor: accentColor }}
          >
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="bg-white/15 p-2 sm:p-2.5 rounded-xl border border-white/25 shrink-0">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] mb-0.5 sm:mb-1">
                  {tenantConfig.shortName || 'Barangay'} &middot; {t.officialForm}
                </p>
                <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
                  {lang === 'tl' ? 'Pagsasara ng Negosyo' : 'Business Closure'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className={`text-white hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors shrink-0 touch-manipulation${!lang ? ' max-sm:hidden' : ''}`}
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
              <div className={certModalFooterClass} onPointerDown={(e) => e.stopPropagation()}>
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
              {notification && (
                <div className="px-4 sm:px-8 pt-3 sm:pt-4 shrink-0">
                  <div
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border ${
                      notification.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {notification.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-semibold text-sm ${
                          notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p
                        className={`text-sm mt-0.5 ${
                          notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotification(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="px-4 sm:px-8 py-3.5 sm:py-5 bg-gray-50 border-b border-gray-200 shrink-0 overflow-x-auto">
                <div className="flex items-start min-w-max sm:min-w-0 justify-between">
                  {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center gap-2 w-[96px] shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                            currentStep >= s
                              ? 'text-white'
                              : 'bg-white text-gray-400 border-2 border-gray-200'
                          }`}
                          style={currentStep >= s ? { backgroundColor: accentColor } : undefined}
                        >
                          {currentStep > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        <span
                          className={`text-[11px] font-semibold text-center leading-tight ${
                            currentStep >= s ? 'text-gray-800' : 'text-gray-400'
                          }`}
                        >
                          {stepLabels[s - 1]}
                        </span>
                      </div>
                      {s < 3 && (
                        <div
                          className="flex-1 h-[3px] rounded-full mt-[18px] bg-gray-200"
                          style={{ backgroundColor: currentStep > s ? accentColor : undefined }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className={certModalScrollClass}>
                <div>
                  {/* Step 1: Owner Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">{t.ownerHeading}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{t.ownerHelp}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsResidentModalOpen(true)}
                        className="w-full flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = accentColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900">{t.searchOwner}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.searchOwnerSub}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
                      </button>

                      {errors.ownerFullName && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{t.errNoOwner}</p>
                        </div>
                      )}

                      {formData.ownerFullName && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden animate-in fade-in duration-300">
                          <div
                            className="px-5 py-2.5 flex items-center gap-2"
                            style={{ backgroundColor: `${accentColor}12` }}
                          >
                            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                            <p
                              className="text-[11px] font-bold uppercase tracking-[0.12em]"
                              style={{ color: accentColor }}
                            >
                              {t.verifiedOwner}
                            </p>
                          </div>
                          <div className="p-5 bg-white">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                              <p className="text-lg font-bold text-gray-900 leading-tight min-w-0 flex-1">
                                {formData.ownerFullName}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 shrink-0 text-right">
                                {formatResidentPurokForPortal({
                                  purok: formData.purok,
                                  subdivision: formData.subdivision,
                                }) || (
                                  <span className="text-gray-400 italic font-normal text-xs">
                                    {t.notRecorded}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.ownerFullName && (
                        <div className="space-y-5 pt-2">
                          <div>
                            <label
                              htmlFor="bcl-contact"
                              className="block text-sm font-semibold text-gray-800 mb-1.5"
                            >
                              {t.mobileLabel} <span className="text-red-600">*</span>
                            </label>
                            <MobileNumberInput
                              id="bcl-contact"
                              value={formData.contactNumber}
                              onChange={handleInputChange}
                              error={errors.contactNumber}
                              isMasked={contactMasked}
                              onUnmask={() => {
                                setContactMasked(false);
                                setFormData((prev) => ({ ...prev, contactNumber: '' }));
                              }}
                            />
                            {errors.contactNumber && (
                              <p className="text-xs text-red-600 mt-1.5">{t.errMobile}</p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="bcl-email"
                              className="block text-sm font-semibold text-gray-800 mb-1.5"
                            >
                              {t.emailLabel}{' '}
                              <span className="font-normal text-gray-400">{t.optional}</span>
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              <input
                                id="bcl-email"
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
                    </div>
                  )}

                  {/* Step 2: Business Details */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {t.businessHeading}
                        </h3>
                        <p className="text-sm text-gray-500">{t.businessHelp}</p>
                      </div>

                      <div>
                        <label
                          htmlFor="bcl-name"
                          className="block text-sm font-semibold text-gray-800 mb-1.5"
                        >
                          {t.businessNameLabel} <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            id="bcl-name"
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            placeholder={t.businessNamePlaceholder}
                            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${
                              errors.businessName
                                ? 'border-red-400 focus:ring-red-100'
                                : 'border-gray-300 focus:ring-gray-200'
                            }`}
                          />
                        </div>
                        {errors.businessName && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errBusinessName}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="bcl-nature"
                          className="block text-sm font-semibold text-gray-800 mb-1.5"
                        >
                          {t.natureLabel} <span className="text-red-600">*</span>
                        </label>
                        <select
                          id="bcl-nature"
                          name="natureOfBusiness"
                          value={formData.natureOfBusiness}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${
                            errors.natureOfBusiness
                              ? 'border-red-400 focus:ring-red-100'
                              : 'border-gray-300 focus:ring-gray-200'
                          }`}
                        >
                          <option value="">{t.naturePlaceholder}</option>
                          {BUSINESS_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                        </select>
                        {errors.natureOfBusiness && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errNature}</p>
                        )}
                      </div>

                      <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {t.businessAddressLabel} <span className="text-red-600">*</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Purok <span className="text-red-600">*</span>
                            </label>
                            <select
                              value={formData.bizPurok}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  bizPurok: e.target.value,
                                  bizHouseNumber: '',
                                  bizBlock: '',
                                  bizLot: '',
                                }));
                                if (errors.bizPurok) setErrors((prev) => ({ ...prev, bizPurok: false }));
                              }}
                              className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm font-semibold uppercase text-gray-900 outline-none focus:ring-2 ${
                                errors.bizPurok
                                  ? 'border-red-400 focus:ring-red-100'
                                  : 'border-gray-300 focus:ring-gray-200'
                              }`}
                            >
                              <option value="">-- SELECT --</option>
                              {PUROK_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {errors.bizPurok && (
                              <p className="text-xs text-red-600 mt-1">
                                {lang === 'tl' ? 'Pumili ng Purok.' : 'Please select a Purok.'}
                              </p>
                            )}
                          </div>

                          {isSubdivisionPurok(formData.bizPurok) ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Block
                                </label>
                                <input
                                  type="text"
                                  placeholder="1"
                                  value={formData.bizBlock}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, bizBlock: e.target.value }))
                                  }
                                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold uppercase text-center text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Lot
                                </label>
                                <input
                                  type="text"
                                  placeholder="2"
                                  value={formData.bizLot}
                                  onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, bizLot: e.target.value }))
                                  }
                                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold uppercase text-center text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                                />
                              </div>
                            </div>
                          ) : formData.bizPurok ? (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                House Number
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., 2706, 123-A"
                                value={formData.bizHouseNumber}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, bizHouseNumber: e.target.value }))
                                }
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold uppercase text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                House Number
                              </label>
                              <input
                                type="text"
                                disabled
                                placeholder="SELECT A PUROK FIRST"
                                value=""
                                className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold uppercase text-gray-500 cursor-not-allowed"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Barangay <span className="text-gray-400 text-[10px]">(auto)</span>
                            </label>
                            <input
                              type="text"
                              disabled
                              readOnly
                              value={bizBarangay}
                              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold uppercase text-gray-700 cursor-not-allowed select-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Municipality <span className="text-gray-400 text-[10px]">(auto)</span>
                            </label>
                            <input
                              type="text"
                              disabled
                              readOnly
                              value={bizMunicipality}
                              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold uppercase text-gray-700 cursor-not-allowed select-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Province <span className="text-gray-400 text-[10px]">(auto)</span>
                            </label>
                            <input
                              type="text"
                              disabled
                              readOnly
                              value={bizProvince}
                              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold uppercase text-gray-700 cursor-not-allowed select-none"
                            />
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Full Address Preview
                          </p>
                          <p className="text-sm font-semibold text-gray-800 uppercase">
                            {composedBusinessAddress ||
                              `${bizBarangay}, ${bizMunicipality}, ${bizProvince}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Closure Details */}
                  {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {lang === 'tl' ? 'Detalye ng Pagsasara' : 'Closure Details'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {lang === 'tl'
                            ? 'Ilagay ang petsa kung kailan tumigil ang operasyon at ang dahilan ng pagsasara.'
                            : 'Specify the effective date of closure and the reason for ceasing operations.'}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="bcl-closure-date"
                          className="block text-sm font-semibold text-gray-800 mb-1.5"
                        >
                          {lang === 'tl' ? 'Petsa ng Pagsasara' : 'Effective Date of Closure'}{' '}
                          <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            id="bcl-closure-date"
                            type="date"
                            name="closureDate"
                            value={formData.closureDate}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${
                              errors.closureDate
                                ? 'border-red-400 focus:ring-red-100'
                                : 'border-gray-300 focus:ring-gray-200'
                            }`}
                          />
                        </div>
                        {errors.closureDate && (
                          <p className="text-xs text-red-600 mt-1.5">
                            {lang === 'tl'
                              ? 'Ilagay ang petsa ng pagsasara.'
                              : 'Please enter the effective date of closure.'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="bcl-reason-preset"
                          className="block text-sm font-semibold text-gray-800 mb-1.5"
                        >
                          {lang === 'tl' ? 'Dahilan ng Pagsasara' : 'Reason(s) for Closure'}{' '}
                          <span className="text-red-600">*</span>
                        </label>
                        <select
                          id="bcl-reason-preset"
                          name="closureReasonPreset"
                          value={formData.closureReasonPreset}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                        >
                          {CLOSURE_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.closureReasonPreset === 'Other' && (
                        <div>
                          <label
                            htmlFor="bcl-reason-custom"
                            className="block text-sm font-semibold text-gray-800 mb-1.5"
                          >
                            {lang === 'tl' ? 'Tukuyin ang Dahilan' : 'Specify Reason'}{' '}
                            <span className="text-red-600">*</span>
                          </label>
                          <textarea
                            id="bcl-reason-custom"
                            name="closureReasonCustom"
                            value={formData.closureReasonCustom}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder={
                              lang === 'tl'
                                ? 'Ilagay ang dahilan ng pagsasara ng negosyo...'
                                : 'Enter reason for business closure...'
                            }
                            className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors resize-none focus:ring-2 ${
                              errors.closureReasonCustom
                                ? 'border-red-400 focus:ring-red-100'
                                : 'border-gray-300 focus:ring-gray-200'
                            }`}
                          />
                          {errors.closureReasonCustom && (
                            <p className="text-xs text-red-600 mt-1.5">
                              {lang === 'tl'
                                ? 'Pakilagay ang dahilan ng pagsasara.'
                                : 'Please specify the reason for closure.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {lang && (
            <div className={certModalFooterClass} onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button type="button" onClick={handleWizardBack} className={certModalFooterBackClass}>
                  {t.back}
                </button>
                {currentStep === 1 && (
                  <p className="hidden sm:block text-xs text-gray-500 truncate">
                    <span className="text-red-600">*</span> {t.requiredFields}
                  </p>
                )}
              </div>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) {
                      if (!formData.ownerFullName) {
                        setErrors({ ownerFullName: true });
                        return;
                      }
                      if (!isValidPhMobile(formData.contactNumber)) {
                        setErrors({ contactNumber: true });
                        return;
                      }
                    }
                    if (currentStep === 2) {
                      const e = {};
                      if (!formData.businessName) e.businessName = true;
                      if (!formData.natureOfBusiness) e.natureOfBusiness = true;
                      if (!formData.bizPurok) e.bizPurok = true;
                      if (Object.keys(e).length) {
                        setErrors(e);
                        return;
                      }
                    }
                    setCurrentStep((p) => p + 1);
                  }}
                  className={certModalFooterPrimaryClass}
                  style={{ backgroundColor: accentColor }}
                >
                  {t.continue} <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const e = {};
                    if (!formData.closureDate) e.closureDate = true;
                    if (
                      formData.closureReasonPreset === 'Other' &&
                      !formData.closureReasonCustom.trim()
                    ) {
                      e.closureReasonCustom = true;
                    }
                    if (Object.keys(e).length) {
                      setErrors(e);
                      return;
                    }
                    setShowConfirmation(true);
                  }}
                  className={certModalFooterPrimaryClass}
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />{' '}
                  <span className="truncate">{t.reviewSubmit}</span>
                </button>
              )}
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
          lang={lang || 'tl'}
        />
      )}
    </>
  );
}

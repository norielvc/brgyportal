import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Search, Phone, Mail, Send, CheckCircle, ChevronRight, AlertCircle, Building2, MapPin, Store } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import LanguageGate from './LanguageGate';
import { getStrings } from '../../lib/certLang';

const BUSINESS_TYPES = [
  'SARI-SARI STORE', 'CARINDERIA / EATERY', 'BAKERY', 'SALON / BARBERSHOP',
  'REPAIR SHOP', 'INTERNET CAFE', 'PHARMACY / DRUGSTORE', 'HARDWARE STORE',
  'CLOTHING / BOUTIQUE', 'GROCERY STORE', 'WATER REFILLING STATION',
  'LAUNDRY SHOP', 'PRINTING / PHOTOCOPYING', 'RICE DEALER', 'LIVESTOCK / POULTRY',
  'CONSTRUCTION MATERIALS', 'FOOD STALL / KIOSK', 'TRANSPORT / TRICYCLE OPERATOR',
  'LENDING / FINANCING', 'OTHER RETAIL BUSINESS', 'OTHER SERVICE BUSINESS',
].sort((a, b) => a.localeCompare(b));

export default function BusinessPermitModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
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
    // Owner info
    ownerFullName: '', residentId: null, age: '', sex: '', civilStatus: '',
    ownerAddress: '', dateOfBirth: '', placeOfBirth: '',
    contactNumber: '', email: '',
    // Business info
    businessName: '', natureOfBusiness: '', businessAddress: '',
    clearanceType: 'NEW', applicationDate: new Date().toISOString().split('T')[0],
    purpose: 'BUSINESS PERMIT / CLEARANCE',
    pickupMethod: 'pickup',
  });
  const [pickupError, setPickupError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    return () => { if (typeof window !== 'undefined') document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1); setShowConfirmation(false); setShowSuccess(false);
      setErrors({}); setNotification(null); setConsentChecked(false); setConsentExpanded(false); setShowPrivacyModal(false);
      setLang(null);
      setFormData({
        ownerFullName: '', residentId: null, age: '', sex: '', civilStatus: '',
        ownerAddress: '', dateOfBirth: '', placeOfBirth: '',
        contactNumber: '', email: '',
        businessName: '', natureOfBusiness: '', businessAddress: '',
        clearanceType: 'NEW', applicationDate: new Date().toISOString().split('T')[0],
        purpose: 'BUSINESS PERMIT / CLEARANCE',
        pickupMethod: 'pickup',
      });
      setPickupError('');
    }
  }, [isOpen]);

  const handleResidentSelect = (resident) => {
    setFormData(prev => ({
      ...prev,
      ownerFullName: resident.full_name || '',
      residentId: resident.id,
      age: resident.age || '',
      sex: resident.gender || resident.sex || '',
      civilStatus: resident.civil_status || '',
      ownerAddress: resident.residential_address || '',
      dateOfBirth: resident.date_of_birth || '',
      placeOfBirth: resident.place_of_birth || '',
    }));
    setIsResidentModalOpen(false);
    setErrors(prev => ({ ...prev, ownerFullName: false }));
    setNotification({ type: 'success', title: 'Profile Found', message: `${resident.full_name}'s details have been auto-filled.` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async () => {
    if (formData.pickupMethod === 'online' && !formData.email?.trim()) {
      setPickupError(t.pickupEmailRequired);
      return;
    }
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
          type: 'business_permit',
          formData: { ...formData, fullName: formData.ownerFullName, address: formData.ownerAddress },
        }),
      });
      const result = await response.json();
      if (result.success) {
        setReferenceNumber(result.referenceNumber);
        setShowConfirmation(false);
        setShowSuccess(true);
      } else if (result.code === 'DUPLICATE_REQUEST' || result.code === 'RATE_LIMITED' || result.code === 'COOLDOWN_ACTIVE') {
        setShowConfirmation(false);
        setNotification({ type: 'error', title: result.code === 'DUPLICATE_REQUEST' ? 'Existing Request Found' : 'Request Blocked', message: result.message });
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

  const accentColor = tenantConfig.primaryColor || '#059669';

  if (!isOpen) return null;

  // Success
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

  // Confirmation
  if (showConfirmation) {
    const fields = [
      { key: 'owner', label: lang === 'tl' ? 'Pangalan ng May-ari' : 'Owner Name', value: formData.ownerFullName },
      { key: 'contact', label: t.mobileLabel, value: formData.contactNumber },
      { key: 'email', label: t.emailLabel, value: formData.email, wide: true },
      { key: 'bizName', label: t.businessNameLabel, value: formData.businessName },
      { key: 'nature', label: t.natureLabel, value: formData.natureOfBusiness },
      { key: 'bizAddress', label: t.businessAddressLabel, value: formData.businessAddress, wide: true },
      { key: 'permit', label: t.permitLabel, value: formData.clearanceType },
    ].filter(f => f.value);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between shrink-0" style={{ backgroundColor: accentColor }}>
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">{t.reviewEyebrow}</p>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{t.reviewTitle}</h2>
            </div>
            <button onClick={() => setShowConfirmation(false)} aria-label={t.close} className="text-white/70 hover:text-white p-2 hover:bg-white/15 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 sm:px-8 py-6 bg-gray-50 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">{t.reviewHelp}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map(({ key, label, value, wide }) => (
                <div key={key} className={`p-4 bg-white border border-gray-200 rounded-xl ${wide ? 'sm:col-span-2' : ''}`}>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] block mb-1">{label}</span>
                  <span className="text-[15px] font-semibold text-gray-900 leading-snug break-words">{value}</span>
                </div>
              ))}
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
                id="biz-consent"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="w-4 h-4 shrink-0 cursor-pointer mt-0.5"
                style={{ accentColor }}
              />
              <label htmlFor="biz-consent" className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed">
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

  const stepLabels = [t.stepOwner, t.stepBusiness, t.stepPermit];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>

          {/* Header */}
          <div className="px-6 sm:px-8 py-5 flex items-start justify-between shrink-0" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3.5">
              <div className="bg-white/15 p-2.5 rounded-xl border border-white/25 shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1">{tenantConfig.shortName || 'Barangay'} &middot; {t.officialForm}</p>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">Business Permit</h2>
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
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{notification.title}</p>
                  <p className={`text-sm mt-0.5 ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
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
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-2 w-[88px] shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= s ? 'text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`} style={currentStep >= s ? { backgroundColor: accentColor } : undefined}>
                      {currentStep > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${currentStep >= s ? 'text-gray-800' : 'text-gray-400'}`}>{stepLabels[s-1]}</span>
                  </div>
                  {s < 3 && <div className="flex-1 h-[3px] rounded-full mt-[18px] bg-gray-200" style={{ backgroundColor: currentStep > s ? accentColor : undefined }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          )}

          {/* Content */}
          {lang && (
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            <div>

              {/* Step 1: Owner Info */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.ownerHeading}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t.ownerHelp}</p>
                  </div>

                  <button type="button" onClick={() => setIsResidentModalOpen(true)}
                    className="w-full flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: accentColor }}>
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
                      <div className="px-5 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${accentColor}12` }}>
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accentColor }}>{t.verifiedOwner}</p>
                      </div>
                      <div className="p-5 bg-white">
                        <p className="text-lg font-bold text-gray-900 leading-tight">{formData.ownerFullName}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.recordNo}</p>
                            <p className="text-sm font-semibold text-gray-800">#{formData.residentId}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.address}</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {formData.ownerAddress || <span className="text-gray-400 italic font-normal">{t.notRecorded}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact in Step 1 for BP */}
                  {formData.ownerFullName && (
                    <div className="space-y-5 pt-2">
                      <div>
                        <label htmlFor="bp-contact" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          {t.mobileLabel} <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input id="bp-contact" type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange}
                            placeholder="09XX XXX XXXX"
                            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.contactNumber ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                        </div>
                        {errors.contactNumber && (
                          <p className="text-xs text-red-600 mt-1.5">{t.errMobile}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="bp-email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          {t.emailLabel} <span className="font-normal text-gray-400">{t.optional}</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input id="bp-email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200" />
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
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.businessHeading}</h3>
                    <p className="text-sm text-gray-500">{t.businessHelp}</p>
                  </div>

                  <div>
                    <label htmlFor="bp-name" className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {t.businessNameLabel} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input id="bp-name" type="text" name="businessName" value={formData.businessName} onChange={handleInputChange}
                        placeholder={t.businessNamePlaceholder}
                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.businessName ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                    </div>
                    {errors.businessName && (
                      <p className="text-xs text-red-600 mt-1.5">{t.errBusinessName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bp-nature" className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {t.natureLabel} <span className="text-red-600">*</span>
                    </label>
                    <select id="bp-nature" name="natureOfBusiness" value={formData.natureOfBusiness} onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 ${errors.natureOfBusiness ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`}>
                      <option value="">{t.naturePlaceholder}</option>
                      {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                    {errors.natureOfBusiness && (
                      <p className="text-xs text-red-600 mt-1.5">{t.errNature}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bp-address" className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {t.businessAddressLabel} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      <textarea id="bp-address" name="businessAddress" value={formData.businessAddress} onChange={handleInputChange}
                        placeholder={t.businessAddressPlaceholder}
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-[15px] text-gray-900 outline-none transition-colors resize-none focus:ring-2 ${errors.businessAddress ? 'border-red-400 focus:ring-red-100' : 'border-gray-300 focus:ring-gray-200'}`} />
                    </div>
                    {errors.businessAddress && (
                      <p className="text-xs text-red-600 mt-1.5">{t.errBusinessAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Permit Type */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{t.permitHeading}</h3>
                    <p className="text-sm text-gray-500">{t.permitHelp}</p>
                  </div>

                  <div>
                    <span className="block text-sm font-semibold text-gray-800 mb-2">
                      {t.permitLabel} <span className="text-red-600">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'NEW', label: t.permitNew, sub: t.permitNewSub },
                        { value: 'RENEWAL', label: t.permitRenewal, sub: t.permitRenewalSub },
                      ].map(({ value, label, sub }) => {
                        const selected = formData.clearanceType === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => setFormData(prev => ({ ...prev, clearanceType: value }))}
                            className={`p-4 rounded-xl border-2 text-left transition-colors ${selected ? 'bg-white' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            style={selected ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}>
                            <span className="block text-sm font-bold" style={selected ? { color: accentColor } : undefined}>
                              {label}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">{sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bp-date" className="block text-sm font-semibold text-gray-800 mb-1.5">{t.applicationDate}</label>
                    <input id="bp-date" type="date" name="applicationDate" value={formData.applicationDate} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200" />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-0.5">{t.inspectionTitle}</p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {t.inspectionBody}
                      </p>
                    </div>
                  </div>
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

            {currentStep < 3 ? (
              <button onClick={() => {
                if (currentStep === 1) {
                  if (!formData.ownerFullName) { setErrors({ ownerFullName: true }); return; }
                  if (!formData.contactNumber) { setErrors({ contactNumber: true }); return; }
                }
                if (currentStep === 2) {
                  const e = {};
                  if (!formData.businessName) e.businessName = true;
                  if (!formData.natureOfBusiness) e.natureOfBusiness = true;
                  if (!formData.businessAddress) e.businessAddress = true;
                  if (Object.keys(e).length) { setErrors(e); return; }
                }
                setCurrentStep(p => p + 1);
              }} className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2" style={{ backgroundColor: accentColor }}>
                {t.continue} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowConfirmation(true)}
                className="px-6 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: accentColor }}>
                <Send className="w-4 h-4" /> {t.reviewSubmit}
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
          lang={lang || 'en'}
        />
      )}
    </>
  );
}

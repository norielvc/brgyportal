import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Search, Phone, Mail, Send, CheckCircle, ChevronRight, AlertCircle, Building2, MapPin, Store } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';

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

  const [formData, setFormData] = useState({
    // Owner info
    ownerFullName: '', residentId: null, age: '', sex: '', civilStatus: '',
    ownerAddress: '', dateOfBirth: '', placeOfBirth: '',
    contactNumber: '', email: '',
    // Business info
    businessName: '', natureOfBusiness: '', businessAddress: '',
    clearanceType: 'NEW', applicationDate: new Date().toISOString().split('T')[0],
    purpose: 'BUSINESS PERMIT / CLEARANCE',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    return () => { if (typeof window !== 'undefined') document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1); setShowConfirmation(false); setShowSuccess(false);
      setErrors({}); setNotification(null);
      setFormData({
        ownerFullName: '', residentId: null, age: '', sex: '', civilStatus: '',
        ownerAddress: '', dateOfBirth: '', placeOfBirth: '',
        contactNumber: '', email: '',
        businessName: '', natureOfBusiness: '', businessAddress: '',
        clearanceType: 'NEW', applicationDate: new Date().toISOString().split('T')[0],
        purpose: 'BUSINESS PERMIT / CLEARANCE',
      });
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
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Request Submitted!</h3>
          <p className="text-gray-500 text-sm mb-4">Your business permit application has been received.</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Reference Number</p>
            <p className="text-2xl font-black font-mono" style={{ color: accentColor }}>{referenceNumber}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 text-white rounded-2xl font-black uppercase tracking-widest text-sm" style={{ backgroundColor: accentColor }}>
            Close / Isara
          </button>
        </div>
      </div>
    );
  }

  // Confirmation
  if (showConfirmation) {
    const fields = [
      { label: 'Owner Name', value: formData.ownerFullName },
      { label: 'Contact No.', value: formData.contactNumber },
      { label: 'Email', value: formData.email },
      { label: 'Business Name', value: formData.businessName },
      { label: 'Nature of Business', value: formData.natureOfBusiness },
      { label: 'Business Address', value: formData.businessAddress },
      { label: 'Permit Type', value: formData.clearanceType },
    ].filter(f => f.value);

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
          <div className="p-8 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ label, value }) => (
                <div key={label} className={`flex items-start gap-4 p-5 bg-white border-2 border-gray-100 rounded-3xl shadow-sm ${label === 'Business Address' || label === 'Email' ? 'sm:col-span-2' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">{label}</span>
                    <span className="text-lg font-black text-black leading-tight break-words uppercase">{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-emerald-700 text-[11px] font-bold uppercase tracking-wide">All details validated. Please ensure business information is accurate.</p>
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

  const stepLabels = ['Owner Info', 'Business Details', 'Permit Type'];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 no-scrollbar" style={{ height: '92vh', maxHeight: '95vh' }}>

          {/* Header */}
          <div className="bg-black px-8 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Business Permit Application</h2>
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
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{notification.title}</p>
                  <p className={`text-sm mt-0.5 ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="px-8 pt-5 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${currentStep >= s ? 'bg-black text-white scale-110' : 'bg-gray-100 text-gray-300'}`}>
                      {currentStep > s ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : s}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${currentStep >= s ? 'text-gray-700' : 'text-gray-300'}`}>{stepLabels[s-1]}</p>
                  </div>
                  {s < 3 && <div className={`flex-1 h-1 mx-4 rounded-full mb-5 ${currentStep > s ? 'bg-black' : 'bg-gray-100'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl mx-auto">

              {/* Step 1: Owner Info */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-in slide-in-from-right-8 duration-500">
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center group cursor-pointer hover:bg-black/5 hover:border-black transition-all active:scale-95 shadow-sm hover:shadow-xl"
                    onClick={() => setIsResidentModalOpen(true)}>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-inner">
                        <Search className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tighter mb-1">Search Owner / Hanapin ang May-ari</h3>
                      <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] max-w-[240px] mx-auto leading-relaxed">
                        Find the business owner's profile from the resident directory.
                      </p>
                    </div>
                  </div>

                  {errors.ownerFullName && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-red-600 text-xs font-bold uppercase">Please select the business owner from the directory.</p>
                    </div>
                  )}

                  {formData.ownerFullName && (
                    <div className="bg-black text-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 group relative overflow-hidden border border-white/5">
                      <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle className="w-16 h-16 text-white" /></div>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Business Owner / May-ari ng Negosyo</p>
                      <h4 className="text-2xl font-black tracking-tighter mb-4 leading-none uppercase">{formData.ownerFullName}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 uppercase font-black">
                          <p className="text-white/30 text-[8px] tracking-widest mb-0.5">Status</p>
                          <p className="text-emerald-400 text-xs">Verified Resident</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 uppercase font-black">
                          <p className="text-white/30 text-[8px] tracking-widest mb-0.5">Address</p>
                          <p className="text-xs truncate">{formData.ownerAddress || 'On file'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact in Step 1 for BP */}
                  {formData.ownerFullName && (
                    <div className="space-y-4 pt-2">
                      <div className="group">
                        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
                          <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange}
                            placeholder="09XX XXX XXXX"
                            className={`w-full pl-14 pr-6 py-4 bg-white border-4 ${errors.contactNumber ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black outline-none font-black text-xl`} />
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Email (Optional)</label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                            placeholder="YOUR@EMAIL.COM"
                            className="w-full pl-14 pr-6 py-4 bg-white border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
                      Business Name / Pangalan ng Negosyo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange}
                        placeholder="ENTER BUSINESS NAME..."
                        className={`w-full pl-14 pr-6 py-4 bg-white border-4 ${errors.businessName ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black outline-none font-black text-xl uppercase`} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
                      Nature of Business / Uri ng Negosyo <span className="text-red-500">*</span>
                    </label>
                    <select name="natureOfBusiness" value={formData.natureOfBusiness} onChange={handleInputChange}
                      className={`w-full px-6 py-4 bg-gray-50 border-4 ${errors.natureOfBusiness ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black outline-none font-black text-xl uppercase`}>
                      <option value="">SELECT TYPE OF BUSINESS...</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
                      Business Address / Lokasyon ng Negosyo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-4 w-5 h-5 text-gray-300" />
                      <textarea name="businessAddress" value={formData.businessAddress} onChange={handleInputChange}
                        placeholder="COMPLETE BUSINESS ADDRESS..."
                        rows={3}
                        className={`w-full pl-14 pr-6 py-4 bg-white border-4 ${errors.businessAddress ? 'border-red-500' : 'border-gray-50'} rounded-2xl focus:border-black outline-none font-black text-xl uppercase resize-none`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Permit Type */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-3 block">
                      Permit Type / Uri ng Permit <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['NEW', 'RENEWAL', 'AMENDMENT', 'CLOSURE'].map(type => (
                        <button key={type} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, clearanceType: type }))}
                          className={`p-6 rounded-3xl border-4 font-black text-lg uppercase tracking-tight transition-all ${formData.clearanceType === type ? 'bg-black text-white border-black scale-105 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-700'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Application Date</label>
                    <input type="date" name="applicationDate" value={formData.applicationDate} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl" />
                  </div>

                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-amber-800 text-xs font-bold uppercase tracking-wide">
                      📋 After submission, a physical inspection will be scheduled. Please prepare your business premises for the inspection committee.
                    </p>
                  </div>
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
              }} className="px-12 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center gap-3">
                Next Step / Susunod <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setShowConfirmation(true)}
                className="px-12 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: accentColor }}>
                <Send className="w-5 h-5" /> Submit Application
              </button>
            )}
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

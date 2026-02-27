import { useState } from 'react';
import { X, Building, AlertCircle, CheckCircle, Loader2, Info, Send, Clock, Eye, Briefcase, User, MapPin, Store } from 'lucide-react';

export default function BusinessPermitModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',

    // Owner Information
    ownerFirstName: '',
    ownerLastName: '',
    ownerAddress: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerBirthdate: '',

    // Business Details
    natureOfBusiness: '',
    capitalInvestment: '',
    numberOfEmployees: '',
    businessHours: '',

    // Requirements
    dtiRegistration: '',
    birTin: '',

    // Purpose
    purpose: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const required = [
      'businessName', 'businessType', 'businessAddress',
      'ownerFirstName', 'ownerLastName', 'ownerAddress', 'ownerPhone', 'ownerBirthdate',
      'natureOfBusiness', 'capitalInvestment', 'purpose'
    ];
    const newErrors = {};
    required.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields highlighted in red.'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

      // Generate reference number
      const currentYear = new Date().getFullYear();
      const referenceResponse = await fetch(`${API_URL}/certificates/next-reference/BP`);
      let refNum = `BP-${currentYear}-00001`;

      if (referenceResponse.ok) {
        const refData = await referenceResponse.json();
        if (refData.success) {
          refNum = refData.referenceNumber;
        }
      }

      setReferenceNumber(refNum);

      const response = await fetch(`${API_URL}/certificates/business-permit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          referenceNumber: refNum,
          certificateType: 'Business Permit'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessModal(true);
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.message || 'Failed to submit application. Please try again.'
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: '', businessType: '', businessAddress: '', businessPhone: '', businessEmail: '',
      ownerFirstName: '', ownerLastName: '', ownerAddress: '', ownerPhone: '', ownerEmail: '', ownerBirthdate: '',
      natureOfBusiness: '', capitalInvestment: '', numberOfEmployees: '', businessHours: '',
      dtiRegistration: '', birTin: '', purpose: ''
    });
    setSubmitStatus(null);
    setReferenceNumber('');
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in my-auto border border-white/20">

        {/* Premium Nature Header */}
        <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="flex items-center gap-3 md:gap-5 relative z-10">
            <div className="bg-white/10 backdrop-blur-lg p-2 md:p-3.5 rounded-xl md:rounded-2xl border border-white/20 shadow-xl">
              <Building className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-white tracking-tight leading-none">Business Clearance</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-red-600 rounded-l-full rounded-tr-md rounded-br-md shadow-md mt-2 block">Commercial Permit Portal</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 md:p-2.5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all duration-300 group"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Optimized Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 space-y-6">

            {/* Status Notice */}
            <div className="bg-amber-50 border-l-[6px] border-amber-500 rounded-r-2xl p-5 shadow-sm relative overflow-hidden mb-6 flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-full shadow-md mt-1 shrink-0">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2.5 flex-1">
                  <div>
                    <h4 className="font-extrabold text-amber-900 uppercase tracking-widest text-[11px] flex items-center gap-2 mb-1">
                      Registration Notice / Paunawa
                    </h4>
                    <p className="text-amber-800 text-xs font-bold leading-relaxed mb-1">
                      If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.
                    </p>
                    <p className="text-amber-800/80 text-[11px] font-bold leading-relaxed">
                      Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {submitStatus?.type === 'error' && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4 animate-shake">
                <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wide">Filing Error</h4>
                  <p className="text-rose-700 text-xs">{submitStatus.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">

              {/* Step 1: Business Profile */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">1</div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Business Enterprise Information</h3>
                    <p className="text-xs text-white/90 font-bold uppercase tracking-widest">Legal Entity Identification</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Registered Business Name / Rehistradong Pangalan ng Negosyo <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="E.G. JUAN'S SARI-SARI STORE..."
                      className={`w-full px-6 py-4 bg-white border-2 ${errors.businessName ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none font-black text-emerald-900 uppercase shadow-sm`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Industry Classification / Uri ng Industriya <span className="text-red-500">*</span></label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className={`w-full px-6 py-4 bg-white border-2 ${errors.businessType ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none font-black text-emerald-900 appearance-none cursor-pointer`}
                    >
                      <option value="">SELECT TYPE... / PUMILI NG URI...</option>
                      {['Retail / Tingian', 'Restaurant / Kainan', 'Service / Serbisyo', 'Manufacturing / Pagawaan', 'Wholesale / Pakyawan', 'Other / Iba pa'].map(type => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Commercial Address / Address ng Negosyo <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      placeholder="PUROK / STREET / BARANGAY..."
                      className={`w-full px-6 py-4 bg-white border-2 ${errors.businessAddress ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase shadow-sm`}
                    />
                    <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Business Telephone/Mobile / Telepono o Mobile ng Negosyo</label>
                    <input type="tel" name="businessPhone" value={formData.businessPhone} onChange={handleInputChange} placeholder="09XX XXX XXXX..." className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Business Email Address (Optional) / Email ng Negosyo (Opsyonal)</label>
                    <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} placeholder="username@example.com" className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-normal text-emerald-900 outline-none" />
                  </div>
                </div>
              </div>

              {/* Step 2: Owner Profile */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">2</div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Proprietor Information</h3>
                    <p className="text-xs text-white/90 font-bold uppercase tracking-widest">Owner Identity details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">First Name / Pangalan <span className="text-red-500">*</span></label>
                    <input type="text" name="ownerFirstName" value={formData.ownerFirstName} onChange={handleInputChange} placeholder="OWNER GIVEN NAME..." className={`w-full px-6 py-4 bg-white border-2 ${errors.ownerFirstName ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase shadow-sm`} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Last Name / Apelyido <span className="text-red-500">*</span></label>
                    <input type="text" name="ownerLastName" value={formData.ownerLastName} onChange={handleInputChange} placeholder="OWNER SURNAME..." className={`w-full px-6 py-4 bg-white border-2 ${errors.ownerLastName ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase shadow-sm`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Owner Residential Address / Tirahan ng May-ari <span className="text-red-500">*</span></label>
                  <input type="text" name="ownerAddress" value={formData.ownerAddress} onChange={handleInputChange} placeholder="COMPLETE HOME ADDRESS..." className={`w-full px-6 py-4 bg-white border-2 ${errors.ownerAddress ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none uppercase shadow-sm`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Owner Mobile Number / Numero ng Mobile ng May-ari <span className="text-red-500">*</span></label>
                    <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleInputChange} placeholder="09XX XXX XXXX..." className={`w-full px-6 py-4 ${errors.ownerPhone ? 'bg-red-50 border-red-500' : 'bg-emerald-50/20 border-emerald-100'} border-2 rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none shadow-sm`} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Owner Email (Optional) / Email ng May-ari (Opsyonal)</label>
                    <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleInputChange} placeholder="username@example.com" className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-normal text-emerald-900 outline-none" />
                  </div>
                </div>
              </div>

              {/* Step 3: Operational Details */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl shadow-sm shrink-0">3</div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Operational Profile</h3>
                    <p className="text-xs text-white/90 font-bold uppercase tracking-widest">Commercial scale & Purpose</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Detailed Nature of Operations / Detalyadong Uri ng Operasyon <span className="text-red-500">*</span></label>
                  <textarea
                    name="natureOfBusiness"
                    value={formData.natureOfBusiness}
                    onChange={handleInputChange}
                    placeholder="DESCRIBE PRODUCTS / SERVICES OFFERED..."
                    rows={3}
                    className={`w-full px-6 py-5 bg-white border-2 ${errors.natureOfBusiness ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-extrabold text-[#112e1f] outline-none uppercase shadow-sm`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Capital Investment (Est. PHP) / Puhunan (Est. PHP)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-900 opacity-40">₱</span>
                      <input type="number" name="capitalInvestment" value={formData.capitalInvestment} onChange={handleInputChange} placeholder="0.00" className={`w-full pl-12 pr-6 py-4 bg-white border-2 ${errors.capitalInvestment ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none`} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Force size (Employees) / Bilang ng Empleyado</label>
                    <div className="relative">
                      <input type="number" name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleInputChange} placeholder="0" className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 outline-none" />
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1 block">Application Intent / Layunin ng Aplikasyon <span className="text-red-500">*</span></label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-4 bg-white border-2 ${errors.purpose ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] font-black text-emerald-900 cursor-pointer appearance-none shadow-sm`}
                  >
                    <option value="">SELECT FILING TYPE... / PUMILI NG LAYUNIN...</option>
                    {['New Business / Bagong Negosyo', 'Renewal / Renobasyon', 'Transfer of Location / Paglipat ng Lokasyon', 'Change of Business Name / Pagbabago ng Pangalan ng Negosyo'].map(p => (
                      <option key={p} value={p}>{p.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="border-t bg-gray-50/80 backdrop-blur-md px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print pb-12 sm:pb-6 flex-shrink-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hidden sm:block">Please verify all data for commercial accuracy / Pakisuri ang lahat ng datos para sa katumpakan</p>

          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-4 border-2 border-gray-200 text-gray-500 hover:bg-white hover:text-[#112e1f] hover:border-[#112e1f]/20 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-12 py-4 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl hover:shadow-emerald-900/40 transform hover:-translate-y-1 transition-all duration-500 disabled:opacity-50 group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Filing Application...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  SUBMIT BUSINESS FILING
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0a1b12]/90 backdrop-blur-xl animate-fade-in" />

          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-white/20">
            {/* Success Header */}
            <div className="bg-gradient-to-br from-[#112e1f] to-[#214431] px-10 py-12 text-center relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="w-24 h-24 bg-emerald-500/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-2xl animate-bounce-subtle">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">Filing Successful!</h2>
              <p className="text-emerald-300/60 text-xs font-black uppercase tracking-[0.2em]">Application Queued For Review</p>
            </div>

            {/* Success Details */}
            <div className="p-8 text-center space-y-4 md:space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-8 shadow-inner relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em] mb-4 opacity-50">Reference ID</p>
                <p className="text-4xl font-black text-[#112e1f] font-mono tracking-tighter scale-110">
                  {referenceNumber}
                </p>
              </div>

              <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-2xl p-6 relative overflow-hidden text-left">
                <div className="flex items-center gap-3 text-[#112e1f] mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.1em]">Commercial Review</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Clock className="w-4 h-4 text-emerald-700" /></div>
                    <p className="text-[11px] text-gray-600 font-bold leading-relaxed">Processing takes 3-5 business days for commercial background verification.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Phone className="w-4 h-4 text-emerald-700" /></div>
                    <p className="text-[11px] text-gray-600 font-bold leading-relaxed">You will receive an <strong>SMS notification</strong> once your permit is ready for collection.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                  onClose();
                }}
                className="w-full bg-[#112e1f] hover:bg-[#112117] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:shadow-emerald-900/30 transform active:scale-95 group"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-subtle { animation: bounceSubtle 3s infinite; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bounceSubtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #112e1f20; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #112e1f40; }
      `}</style>
    </div>
  );
}
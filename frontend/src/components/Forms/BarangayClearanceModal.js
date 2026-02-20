import React, { useState, useEffect, useRef, useMemo } from 'react';
// Build Trigger: 2026-02-07 17:09
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search, Clock, Phone, Mail } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

// Default officials data (fallback)
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

// Enhanced Notification Component - Memoized for performance
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

export default function BarangayClearanceModal({ isOpen, onClose }) {
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
    dateOfBirth: '', placeOfBirth: '', purpose: '', residentId: null
  });

  const handleResidentSelect = (resident) => {
    setFormData(prev => ({
      ...prev,
      fullName: resident.full_name,
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
        ...defaultOfficials,
        ...parsed,
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

  const validateForm = () => {
    setErrors({});
    const required = ['fullName', 'age', 'sex', 'civilStatus', 'dateOfBirth', 'placeOfBirth', 'address', 'purpose', 'contactNumber'];
    const newErrors = {};

    for (const field of required) {
      if (!formData[field]) {
        newErrors[field] = true;
      }
    }

    // Basic email validation
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
      const response = await fetch(`${API_URL}/certificates/clearance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  return (
    <>
      {(!showConfirmationPopup && !showSuccessModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in no-scrollbar">
              <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md p-2 md:p-3.5 rounded-xl md:rounded-2xl border border-white/30 shadow-xl"><FileText className="w-6 h-6 md:w-8 md:h-8 text-white shadow-sm" /></div>
                  <div className="flex flex-col">
                    <h2 className="text-lg md:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">Barangay Clearance Request</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                      <p className="text-emerald-50/90 text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded-full border border-white/5">{referenceNumber || 'New Clearance Request'}</p>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"><X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" /></button>
              </div>

              {notification && <div className="px-6 pt-4"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200 shadow-sm"><Info className="w-6 h-6 text-emerald-600" /></div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-2">Online Portal Guidelines</h4>
                        <p className="text-emerald-800/90 leading-relaxed text-sm">Please ensure all information matches your official records. You will receive an email notification once your request is being processed.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#112e1f] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                          <p className="text-sm text-gray-500 font-medium tracking-wide">Select your profile from the directory</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setIsResidentModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group">
                        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Search Resident Database
                      </button>
                    </div>

                    <div className="relative group">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Resident Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} readOnly onClick={() => setIsResidentModalOpen(true)} placeholder="TAP HERE TO ACCESS DATABASE..." className={`w-full px-6 py-5 bg-white border-2 ${errors.fullName ? 'border-red-500 bg-red-50' : (formData.fullName ? 'border-emerald-200 ring-2 ring-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-2xl transition-all duration-300 font-extrabold text-lg cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Age</label>
                          <input type="number" name="age" value={formData.age} readOnly disabled className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sex</label>
                          <input type="text" value={formData.sex || 'N/A'} readOnly disabled className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Civil Status</label>
                        <input type="text" value={formData.civilStatus || 'N/A'} readOnly disabled className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Residential Address</label>
                      <input type="text" value={formData.address || 'N/A'} readOnly disabled className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#2d5a3d] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Notification & Contact</h3>
                          <p className="text-sm text-gray-500 font-medium tracking-wide">Where to receive your updates</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2 relative group">
                          <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Email Address (Optional)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none border-r pr-3 border-gray-100">
                              <Mail className="w-5 h-5 text-[#2d5a3d]/50" />
                            </div>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className={`w-full pl-16 pr-6 py-4 bg-white border-2 ${errors.email ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-2xl focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-normal text-gray-800 shadow-sm`} />
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold italic ml-2">Notifications will be sent here</p>
                        </div>

                        <div className="space-y-2 relative group">
                          <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Contact Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none border-r pr-3 border-gray-100">
                              <Phone className="w-5 h-5 text-[#2d5a3d]/50" />
                            </div>
                            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={`w-full pl-16 pr-6 py-4 bg-white border-2 ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-2xl focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#112117] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Request Purpose</h3>
                        </div>
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Purpose of Clearance <span className="text-red-500">*</span></label>
                        <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows={3} placeholder="e.g. For employment application, business requirement..." className={`w-full px-6 py-5 bg-white border-2 ${errors.purpose ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl focus:border-[#2d5a3d] focus:shadow-lg transition-all outline-none uppercase font-extrabold text-gray-800 shadow-sm`} />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="border-t bg-gray-50/80 backdrop-blur-md px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print pb-12 sm:pb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Please check all entries before final submission</p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="submit" onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-[#112e1f] to-[#2d5a3d] hover:from-[#2d5a3d] hover:to-[#112e1f] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-1 transition-all duration-300 group">
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmationPopup && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setShowConfirmationPopup(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
              <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/30 shadow-xl"><FileText className="w-8 h-8 text-white shadow-sm" /></div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md uppercase">Review Application</h2>
                </div>
                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                <div className="flex justify-center">
                  <ClearancePreview formData={formData} referenceNumber={referenceNumber || 'PENDING'} currentDate={currentDate} officials={officials} certificateRef={certificateRef} />
                </div>
              </div>
              <div className="border-t bg-gray-50/80 backdrop-blur-[2px] px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                <button onClick={handleCustomizeForm} disabled={isSubmitting} className="px-8 py-3.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all outline-none disabled:opacity-50"><Eye className="w-5 h-5" />Go Back & Edit</button>
                <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-8 py-3.5 bg-gradient-to-r from-[#112e1f] to-[#2d5a3d] hover:from-[#2d5a3d] hover:to-[#112e1f] text-white rounded-2xl font-extrabold flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-75">
                  {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-70 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-8 py-10 text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30"><CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" /></div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Filing Complete!</h2>
              </div>
              <div className="p-6 text-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6 text-green-900">
                  <p className="text-sm font-medium mb-1 uppercase tracking-widest">Reference Number:</p>
                  <p className="text-2xl font-black font-mono tracking-wider">{submittedReferenceNumber}</p>
                </div>
                <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-2xl p-6 relative overflow-hidden text-left mb-6">
                  <div className="flex items-center gap-3 text-[#112e1f] mb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <h4 className="text-xs font-black uppercase tracking-[0.1em]">Next Procedures</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Clock className="w-4 h-4 text-emerald-700" /></div>
                      <p className="text-[11px] text-gray-600 font-bold leading-relaxed">Processing typically takes 1-3 business days. Your application is now in the queue for chairman approval.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Phone className="w-4 h-4 text-emerald-700" /></div>
                      <p className="text-[11px] text-gray-600 font-bold leading-relaxed">We will coordinate via <strong>SMS at {formData.contactNumber}</strong> to confirm your pickup schedule at the Barangay Hall.</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setShowSuccessModal(false); resetForm(); onClose(); }} className="w-full bg-[#112e1f] hover:bg-[#2d5a3d] text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">Return to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isResidentModalOpen && (
        <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} />
      )}
      <style jsx>{`@keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
    </>
  );
}

// Memoized Preview Component for maximum performance
const ClearancePreview = React.memo(({ formData, referenceNumber, currentDate, officials, certificateRef }) => {
  const logos = officials.logos || {};
  const headerStyle = officials.headerStyle || {};
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

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
              <h2 className="text-[24px] font-bold mb-10 border-b-4 border-black inline-block pb-1 px-4 uppercase text-[#004d40]">BARANGAY CLEARANCE CERTIFICATE</h2>
              <div className="w-full space-y-6 text-[15px]">
                <p className="font-bold text-lg mb-6 uppercase">TO WHOM IT MAY CONCERN:</p>
                <p className="mb-6 leading-relaxed">This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:</p>
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
                  <p className="mb-2">Being issued upon the request of above mentioned person for below purpose(s):</p>
                  <p className="font-bold text-lg pl-8 underline">{formData.purpose?.toUpperCase() || 'NOT SPECIFIED'}</p>
                </div>
                <p className="mb-16">Issued this {currentDate} at Barangay Iba O' Este, Calumpit, Bulacan.</p>
                <div className="mt-16 flex flex-col">
                  <div className="mb-12"><div className="h-16 w-64 border-b border-black"></div><p className="text-sm mt-1">Resident's Signature / Thumb Mark</p></div>
                  <div className="self-start text-left">
                    <p className="font-bold text-[15px] mb-8 uppercase">Truly Yours,</p>
                    <p className="text-[20px] font-bold uppercase underline leading-tight">{officials.chairman}</p>
                    <p className="text-sm font-bold mt-1">BARANGAY CHAIRMAN</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Reference Number Section */}
            <div className="w-full text-right mt-auto mb-2 opacity-60">
              <p className="text-[10px] italic">Ref No: <strong>{referenceNumber}</strong></p>
            </div>

            {/* Footer Divider and info */}
            <div className="w-full border-t border-gray-400 pt-1 text-[10px] opacity-60">
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

ClearancePreview.displayName = 'ClearancePreview';

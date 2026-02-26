import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search, Clock, Phone, Users, User, ChevronDown } from 'lucide-react';
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

// Enhanced Notification Component
// Memoized Notification Component
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

export default function GuardianshipCertificateModal({ isOpen, onClose }) {
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [officials, setOfficials] = useState(defaultOfficials);
    const [currentDate, setCurrentDate] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [searchType, setSearchType] = useState('ward'); // 'ward' or 'guardian'
    const [errors, setErrors] = useState({});
    const certificateRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', age: '', sex: '', civilStatus: '', address: '', dateOfBirth: '',
        guardianName: '', guardianRelationship: '',
        contactNumber: '', email: '', residentId: null, guardianId: null
    });

    const handleResidentSelect = (resident) => {
        if (searchType === 'ward') {
            setFormData(prev => ({
                ...prev,
                fullName: resident.full_name,
                age: resident.age || '',
                sex: resident.gender || '',
                civilStatus: resident.civil_status || '',
                address: resident.residential_address || '',
                dateOfBirth: resident.date_of_birth || '',
                contactNumber: resident.contact_number || prev.contactNumber,
                email: resident.email || prev.email,
                residentId: resident.id
            }));
            setErrors(prev => ({ ...prev, fullName: false }));
            setNotification({
                type: 'success',
                title: 'Ward Selected',
                message: `${resident.full_name}'s details have been auto-filled.`
            });
        } else {
            setFormData(prev => ({
                ...prev,
                guardianName: resident.full_name,
                contactNumber: resident.contact_number || prev.contactNumber,
                email: resident.email || prev.email,
                guardianId: resident.id
            }));
            setErrors(prev => ({ ...prev, guardianName: false }));
            setNotification({
                type: 'success',
                title: 'Guardian Selected',
                message: `${resident.full_name} set as guardian.`
            });
        }
        setIsResidentModalOpen(false);
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

    const validateForm = () => {
        const required = ['fullName', 'guardianName', 'guardianRelationship', 'contactNumber'];
        const newErrors = {};
        required.forEach(field => { if (!formData[field]) newErrors[field] = true; });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
            return false;
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowConfirmationPopup(true);
    };

    const resetForm = () => {
        setFormData({
            fullName: '', age: '', sex: '', civilStatus: '', address: '', dateOfBirth: '',
            guardianName: '', guardianRelationship: '',
            contactNumber: '', email: '', residentId: null, guardianId: null
        });
        setShowPreview(false);
        setShowConfirmationPopup(false);
        setShowSuccessModal(false);
        setNotification(null);
        setReferenceNumber('');
        setSubmittedReferenceNumber('');
        setErrors({});
    };

    const handleProceedSubmission = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/certificates/guardianship`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                setSubmittedReferenceNumber(result.referenceNumber);
                setShowConfirmationPopup(false);
                setShowSuccessModal(true);
            } else {
                throw new Error(result.message || 'Failed to submit application');
            }
        } catch (error) {
            setNotification({ type: 'error', title: 'Submission Failed', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {(!showConfirmationPopup && !showSuccessModal) && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 shadow-xl">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">Guardianship Certificate</h2>
                                        <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mt-1">Application Form</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {notification && <div className="px-6 pt-4"><Notification {...notification} onClose={() => setNotification(null)} /></div>}

                            <div className="flex-1 overflow-y-auto p-8 space-y-4 md:space-y-6">
                                {/* Ward Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                                            <div className="w-8 h-8 bg-[#112e1f] text-white rounded-lg flex items-center justify-center font-bold shadow-md">1</div>
                                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Person Under Guardianship (Ward)</h3>
                                        </div>
                                        <button type="button" onClick={() => { setSearchType('ward'); setIsResidentModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm group">
                                            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            Search Ward
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input type="text" value={formData.fullName} readOnly onClick={() => { setSearchType('ward'); setIsResidentModalOpen(true); }} placeholder="TAP SEARCH BUTTON TO SELECT WARD..." className={`w-full px-5 py-4 bg-white border-2 ${errors.fullName ? 'border-red-500 bg-red-50' : (formData.fullName ? 'border-emerald-200 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-xl font-bold cursor-pointer transition-all hover:border-emerald-300 shadow-sm`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-center block">Age / Edad</label>
                                            <input type="text" value={formData.age} readOnly disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-bold text-center" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-center block">Sex / Kasarian</label>
                                            <input type="text" value={formData.sex} readOnly disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-bold text-center" />
                                        </div>
                                    </div>
                                </div>

                                {/* Guardian Information */}
                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                                            <div className="w-8 h-8 bg-[#2d5a3d] text-white rounded-lg flex items-center justify-center font-bold shadow-md">2</div>
                                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Guardian Information</h3>
                                        </div>
                                        <button type="button" onClick={() => { setSearchType('guardian'); setIsResidentModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#112e1f]/20 text-[#112e1f] hover:bg-[#112e1f] hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm group">
                                            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            Search Guardian
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Guardian's Full Name <span className="text-red-500">*</span></label>
                                            <input type="text" name="guardianName" value={formData.guardianName} readOnly onClick={() => { setSearchType('guardian'); setIsResidentModalOpen(true); }} placeholder="TAP SEARCH BUTTON TO SELECT GUARDIAN..." className={`w-full px-5 py-4 bg-white border-2 ${errors.guardianName ? 'border-red-500 bg-red-50' : (formData.guardianName ? 'border-emerald-200 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-xl font-bold cursor-pointer transition-all hover:border-emerald-300 shadow-sm`} />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Relationship <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="guardianRelationship"
                                                    value={formData.guardianRelationship}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-5 py-4 bg-white border-2 ${errors.guardianRelationship ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-xl focus:border-[#2d5a3d] outline-none font-bold text-gray-800 appearance-none cursor-pointer`}
                                                >
                                                    <option value="">SELECT RELATIONSHIP...</option>
                                                    <option value="PARENT">PARENT</option>
                                                    <option value="GRANDPARENT">GRANDPARENT</option>
                                                    <option value="SIBLING">SIBLING</option>
                                                    <option value="AUNT/UNCLE">AUNT/UNCLE</option>
                                                    <option value="COUSIN">COUSIN</option>
                                                    <option value="STEP-PARENT">STEP-PARENT</option>
                                                    <option value="LEGAL GUARDIAN">LEGAL GUARDIAN</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Final step - Contact Info */}
                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-4 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-xl p-2 pr-6 shadow-sm mb-6">
                                        <div className="w-8 h-8 bg-[#112117] text-white rounded-lg flex items-center justify-center font-bold shadow-md">3</div>
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Contact Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#112117] uppercase tracking-widest ml-1 block">Requestor's Contact Number <span className="text-red-500">*</span></label>
                                            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={`w-full px-5 py-4 bg-white border-2 ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-xl focus:border-[#112117] outline-none font-extrabold text-gray-800 shadow-sm`} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#112117] uppercase tracking-widest ml-1 block">Email Address (Optional) / Email (Opsyonal)</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-xl focus:border-[#112117] outline-none font-normal text-gray-800 shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t bg-gray-50/80 backdrop-blur-md px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print pb-12 sm:pb-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Please verify all information before submission</p>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button type="button" onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl transform hover:-translate-y-1 transition-all duration-300 group">
                                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        Review & Submit
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
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10 text-white">
                                    <Eye className="w-8 h-8" />
                                    <h2 className="text-2xl font-extrabold tracking-tight uppercase">Preview Certificate</h2>
                                </div>
                                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                                <div className="flex justify-center">
                                    <GuardianshipPreview formData={formData} referenceNumber="PENDING" currentDate={currentDate} officials={officials} certificateRef={certificateRef} />
                                </div>
                            </div>
                            <div className="border-t bg-gray-50/80 backdrop-blur-[2px] px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                                <button onClick={() => setShowConfirmationPopup(false)} disabled={isSubmitting} className="px-8 py-3.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">Go Back & Edit</button>
                                <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-8 py-3.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-2xl font-extrabold flex items-center justify-center gap-3 shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-75">
                                    {isSubmitting ? 'Processing...' : 'Confirm & Submit Application / Ipadala ang Aplikasyon'}
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
                                            <p className="text-[11px] text-gray-600 font-bold leading-relaxed">We will coordinate with <strong>{formData.guardianName}</strong> via <strong>SMS at {formData.contactNumber}</strong> to confirm the pickup schedule.</p>
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

// Memoized Preview Component
const GuardianshipPreview = React.memo(({ formData, referenceNumber, currentDate, officials, certificateRef }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const logos = officials.logos || {};
    const headerStyle = officials.headerStyle || {};

    useEffect(() => {
        let timeoutId;
        const updateScale = () => { if (containerRef.current) setScale(Math.min(containerRef.current.offsetWidth / 794, 1)); };

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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div ref={containerRef} className="w-full flex justify-center relative overflow-hidden">
            <div style={{ width: `${794 * scale}px`, height: `${1123 * scale}px`, flexShrink: 0, position: 'relative' }}>
                <div ref={certificateRef} className="bg-white shadow-lg flex flex-col" style={{ width: '794px', height: '1123px', transform: `scale(${scale}) translateZ(0)`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden' }}>
                    {/* Header */}
                    <div className="w-full border-b flex justify-center items-center p-8 border-[#1e40af]" style={{ backgroundColor: '#ffffff' }}>
                        <div className="flex-shrink-0" style={{ width: '115px' }}>{logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}</div>
                        <div className="text-center px-4 flex-1">
                            <p className="text-[13px]">{officials.headerInfo?.country}</p>
                            <p className="text-[13px]">{officials.headerInfo?.province}</p>
                            <p className="text-[13px]">{officials.headerInfo?.municipality}</p>
                            <p className="text-[18px] font-bold text-[#1e40af] uppercase leading-tight mt-1">{officials.headerInfo?.barangayName}</p>
                            <p className="text-[14px] font-extrabold text-[#b91c1c] uppercase mt-2">OFFICE OF THE PUNONG BARANGAY</p>
                        </div>
                        <div className="flex-shrink-0" style={{ width: '115px' }}>{logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}</div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 px-16 pt-12 pb-16 flex flex-col relative overflow-hidden">
                        {/* Background Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                            <img src="/iba-o-este.png" className="w-3/4 object-contain" alt="Watermark" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <h2 className="text-[26px] font-bold mb-12 border-b-4 border-black inline-block pb-1 px-6 uppercase text-[#1e40af] tracking-tight">BARANGAY CERTIFICATION FOR GUARDIANSHIP</h2>

                            <div className="w-full space-y-4 md:space-y-6 text-[16px] text-black">
                                <p className="font-bold text-lg mb-8">TO WHOM IT MAY CONCERN:</p>

                                <p className="mb-10 leading-relaxed text-justify">
                                    This is to certify that below person is under the guardianship of <span className="font-bold border-b border-black px-1">{formData.guardianName?.toUpperCase() || "_________________________________"}</span>, both bona fide residents of this barangay:
                                </p>

                                <div className="space-y-4 mb-10 pl-4">
                                    {[
                                        ['Name', formData.fullName?.toUpperCase()],
                                        ['Residential Address', formData.address?.toUpperCase()],
                                        ['Age', formData.age],
                                        ['Sex', formData.sex?.toUpperCase()],
                                        ['Civil Status', formData.civilStatus?.toUpperCase()],
                                        ['Date of Birth', formatDate(formData.dateOfBirth)?.toUpperCase()],
                                        ["Guardian's Relationship", formData.guardianRelationship?.toUpperCase()]
                                    ].map(([label, value]) => (
                                        <div key={label} className="grid grid-cols-[220px_10px_1fr] items-baseline">
                                            <span className="font-bold">{label}</span>
                                            <span className="font-bold text-center">:</span>
                                            <span className={label === 'Name' ? 'font-bold text-xl text-[#064e3b]' : 'font-normal uppercase'}>
                                                {value || "_________________________________"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <p className="mb-16 leading-relaxed text-justify">
                                    Issued this <span className="font-bold">{currentDate}</span> at Barangay Iba O' Este, Calumpit, Bulacan upon the request of above mentioned persons for any legal purposes it may serve.
                                </p>

                                <div className="flex flex-col justify-end" style={{ marginTop: '120px' }}>
                                    <div className="self-start text-left">
                                        <p className="font-bold text-[16px] mb-12">TRULY YOURS,</p>
                                        <p className="text-[22px] font-bold uppercase leading-tight text-[#1e40af]">{officials.chairman}</p>
                                        <p className="text-sm font-bold mt-1 uppercase text-gray-700">BARANGAY CHAIRMAN</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reference & Footer */}
                        <div className="mt-auto">
                            <div className="text-right mb-4 opacity-50">
                                <p className="text-[10px] italic">Reference No: <strong className="font-bold">{referenceNumber}</strong></p>
                            </div>
                            <div className="border-t-2 border-gray-300 pt-2 opacity-50">
                                <p className="text-[10px] text-gray-600">Address: {officials.contactInfo?.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

GuardianshipPreview.displayName = 'GuardianshipPreview';

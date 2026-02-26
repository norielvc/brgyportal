import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, FileText, Eye, Send, CheckCircle, AlertCircle, Info, Search, Clock, Phone, Heart, Users, MapPin } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';

// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

// Default officials data (fallback)
const defaultOfficials = {
    chairman: 'ALEXANDER C. MANIO',
    secretary: 'ROYCE ANN C. GALVEZ',
    contactInfo: {
        address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
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
    logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 115 }
};

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

export default function CohabitationCertificateModal({ isOpen, onClose }) {
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [officials, setOfficials] = useState(defaultOfficials);
    const [currentDate, setCurrentDate] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [selectingFor, setSelectingFor] = useState('person1'); // 'person1' or 'person2'
    const [errors, setErrors] = useState({});
    const certificateRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', age: '', gender: '', dateOfBirth: '', residentId: null,
        partnerFullName: '', partnerAge: '', partnerGender: '', partnerDateOfBirth: '', partnerResidentId: null,
        address: '', noOfChildren: '0', livingTogetherYears: '0', livingTogetherMonths: '0',
        purpose: '', contactNumber: '', email: '',
        person1DbAddress: '', partnerDbAddress: ''
    });

    const handleResidentSelect = (resident) => {
        if (selectingFor === 'person1') {
            setFormData(prev => ({
                ...prev,
                fullName: resident.full_name,
                age: resident.age || '',
                gender: resident.gender || '',
                dateOfBirth: resident.date_of_birth ? new Date(resident.date_of_birth).toISOString().split('T')[0] : '',
                address: resident.residential_address || prev.address,
                contactNumber: resident.contact_number || prev.contactNumber,
                email: resident.email || prev.email,
                residentId: resident.id,
                person1DbAddress: resident.residential_address || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                partnerFullName: resident.full_name,
                partnerAge: resident.age || '',
                partnerGender: resident.gender || '',
                partnerDateOfBirth: resident.date_of_birth ? new Date(resident.date_of_birth).toISOString().split('T')[0] : '',
                partnerResidentId: resident.id,
                partnerDbAddress: resident.residential_address || '',
                email: resident.email || prev.email
            }));
        }
        setIsResidentModalOpen(false);
    };

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

            // Fetch next reference number
            fetch(`${API_URL}/certificates/next-reference/barangay_cohabitation`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setReferenceNumber(data.referenceNumber);
                })
                .catch(err => console.error('Error fetching reference:', err));
        }
    }, [isOpen]);

    useEffect(() => {
        const savedOfficials = localStorage.getItem('barangayOfficials');
        if (savedOfficials) {
            const parsed = JSON.parse(savedOfficials);
            setOfficials({
                ...defaultOfficials, ...parsed,
                contactInfo: { ...defaultOfficials.contactInfo, ...parsed.contactInfo },
                headerInfo: { ...defaultOfficials.headerInfo, ...parsed.headerInfo },
                logos: { ...defaultOfficials.logos, ...parsed.logos },
                headerStyle: { ...defaultOfficials.headerStyle, ...parsed.headerStyle }
            });
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const validateForm = () => {
        const required = ['fullName', 'partnerFullName', 'address', 'contactNumber'];
        const newErrors = {};
        required.forEach(field => { if (!formData[field]) newErrors[field] = true; });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setNotification({ type: 'error', title: 'Missing Info', message: 'Please fill in the required fields.' });
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
            const response = await fetch(`${API_URL}/certificates/cohabitation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    certificate_type: 'barangay_cohabitation'
                })
            });

            const result = await response.json();
            if (result.success) {
                setSubmittedReferenceNumber(result.referenceNumber);
                setShowConfirmationPopup(false);
                setShowSuccessModal(true);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            setNotification({ type: 'error', title: 'Error', message: error.message });
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
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in text-gray-800">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-pink-900 via-rose-800 to-red-900 px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 shadow-xl text-white">
                                        <Heart className="w-8 h-8 fill-current" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Co-habitation Certificate</h2>
                                        <p className="text-rose-100/70 text-xs font-bold uppercase tracking-widest mt-1">Legal Common-Law Partnership Setup</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group">
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {notification && <div className="px-8 mt-4"><Notification {...notification} onClose={() => setNotification(null)} /></div>}

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

                                {/* Person 1 Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                        <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">1</div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-white">First Person Details</h3>
                                            <p className="text-sm text-gray-500 font-medium">Primary resident making the request</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Full Name</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    readOnly
                                                    onClick={() => { setSelectingFor('person1'); setIsResidentModalOpen(true); }}
                                                    className={`flex-1 px-5 py-4 bg-gray-50 border-2 ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl font-bold text-gray-900 cursor-pointer hover:bg-white transition-all`}
                                                    placeholder="Select from directory..."
                                                />
                                                <button type="button" onClick={() => { setSelectingFor('person1'); setIsResidentModalOpen(true); }} className="px-5 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/10 flex items-center gap-2">
                                                    <Search className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Age / Edad</label>
                                            <input type="number" value={formData.age} readOnly className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-600 font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Date of Birth</label>
                                            <input type="text" value={formData.dateOfBirth} readOnly className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-600 font-bold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Person 2 Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                        <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">2</div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-white">Partner Details</h3>
                                            <p className="text-sm text-gray-500 font-medium">Second person in the common-law partnership</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Partner Full Name / Buong Pangalan ng Kapareha</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="partnerFullName"
                                                    value={formData.partnerFullName}
                                                    readOnly
                                                    onClick={() => { setSelectingFor('person2'); setIsResidentModalOpen(true); }}
                                                    className={`flex-1 px-5 py-4 bg-gray-50 border-2 ${errors.partnerFullName ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl font-bold text-gray-900 cursor-pointer hover:bg-white transition-all`}
                                                    placeholder="Select from directory..."
                                                />
                                                <button type="button" onClick={() => { setSelectingFor('person2'); setIsResidentModalOpen(true); }} className="px-5 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/10 flex items-center gap-2">
                                                    <Search className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Age / Edad</label>
                                            <input type="number" value={formData.partnerAge} readOnly className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-600 font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Date of Birth</label>
                                            <input type="text" value={formData.partnerDateOfBirth} readOnly className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-600 font-bold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Partnership Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                        <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">3</div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-white">Co-habitation Information</h3>
                                            <p className="text-sm text-gray-500 font-medium">Common house and duration details</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                                                <label className="text-xs font-black text-rose-800 uppercase tracking-widest ml-1 block">Common Residential Address</label>

                                                {/* QUICK SYNC AREA */}
                                                <div className="flex flex-wrap gap-2">
                                                    {!formData.fullName && !formData.partnerFullName ? (
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                            <Users className="w-3 h-3" />
                                                            Select residents to enable Quick Sync
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {formData.fullName && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, address: formData.person1DbAddress || '' }))}
                                                                    className="flex items-center gap-2 text-[10px] font-black bg-rose-600 text-white px-4 py-2 rounded-xl border border-rose-600 hover:bg-rose-700 transition-all uppercase shadow-md shadow-rose-900/20 group/btn"
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5 group-hover/btn:animate-bounce" />
                                                                    Use {formData.fullName.split(' ')[0]}'s Address
                                                                </button>
                                                            )}
                                                            {formData.partnerFullName && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({ ...prev, address: formData.partnerDbAddress || '' }))}
                                                                    className="flex items-center gap-2 text-[10px] font-black bg-rose-600 text-white px-4 py-2 rounded-xl border border-rose-600 hover:bg-rose-700 transition-all uppercase shadow-md shadow-rose-900/20 group/btn"
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5 group-hover/btn:animate-bounce" />
                                                                    Use {formData.partnerFullName.split(' ')[0]}'s Address
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-300 group-focus-within:text-rose-600 transition-colors">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-14 pr-5 py-4 bg-white border-2 ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl font-bold text-gray-900 focus:border-rose-500 outline-none transition-all shadow-inner`}
                                                    placeholder="Enter or sync shared residential address..."
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 ml-1">
                                                <Info className="w-4 h-4 text-rose-400" />
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">
                                                    This address will be printed as your shared home in the certificate.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Number of Children</label>
                                            <input type="number" name="noOfChildren" value={formData.noOfChildren} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-xl font-bold focus:border-rose-500 outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">Years Together</label>
                                                <input type="number" name="livingTogetherYears" value={formData.livingTogetherYears} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-xl font-bold focus:border-rose-500 outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 block">Months Together</label>
                                                <input type="number" name="livingTogetherMonths" value={formData.livingTogetherMonths} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-xl font-bold focus:border-rose-500 outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-rose-800 uppercase tracking-widest ml-1 block">SMS Contact Number</label>
                                            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className={`w-full px-5 py-4 bg-white border-2 ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-gray-100'} rounded-2xl font-bold text-gray-900 focus:border-rose-500 outline-none`} placeholder="09XX XXX XXXX" />
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <label className="text-xs font-bold text-rose-800 uppercase tracking-widest ml-1 block">Email Address (Optional) / Email (Opsyonal)</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-rose-500 outline-none font-normal text-gray-900 transition-all shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t bg-gray-50 px-8 py-6 flex justify-between items-center pb-12 sm:pb-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] hidden sm:block">Common-Law Partnership Certification</p>
                                <button onClick={handleSubmit} className="px-10 py-4 bg-gradient-to-r from-rose-700 to-red-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:shadow-rose-900/20 transform hover:-translate-y-1 transition-all flex items-center gap-3">
                                    <Send className="w-5 h-5" />
                                    Submit for Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmationPopup && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirmationPopup(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in text-gray-800">
                            <div className="bg-[#5c0b16] px-8 py-4 flex items-center justify-between">
                                <h2 className="text-white font-black uppercase tracking-widest">Preview Certificate Format</h2>
                                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white"><X /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 bg-gray-200">
                                <div className="flex justify-center">
                                    <CohabitationPreview formData={formData} currentDate={currentDate} officials={officials} referenceNumber={referenceNumber || 'PENDING'} />
                                </div>
                            </div>
                            <div className="border-t bg-gray-50 px-8 py-5 flex justify-between gap-4">
                                <button onClick={() => setShowConfirmationPopup(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold uppercase transition-all">Go Back</button>
                                <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-10 py-3 bg-[#5c0b16] text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center gap-3">
                                    {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-[70] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center animate-fade-in text-gray-800">
                            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-14 h-14 text-rose-600" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Application Sent!</h2>
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] block mb-1">Reference Number</span>
                                <span className="text-2xl font-black text-rose-900 font-mono tracking-widest">{submittedReferenceNumber}</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                                Your co-habitation certification request is now under review. We will notify you via <strong>SMS at {formData.contactNumber}</strong>.
                            </p>
                            <button onClick={() => { setShowSuccessModal(false); onClose(); }} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Close Dashboard</button>
                        </div>
                    </div>
                </div>
            )}

            {isResidentModalOpen && (
                <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} />
            )}
            <style jsx>{`@keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.2s ease-out; }`}</style>
        </>
    );
}

// Memoized Preview Component
const CohabitationPreview = React.memo(({ formData, currentDate, officials, referenceNumber }) => {
    const logos = officials.logos || defaultOfficials.logos;
    const headerInfo = officials.headerInfo || defaultOfficials.headerInfo;
    const headerStyle = officials.headerStyle || { bgColor: '#ffffff', borderColor: '#1e40af' };

    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

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

    const formatBday = (date) => {
        if (!date) return '____________________';
        return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div ref={containerRef} className="w-full flex justify-center">
            <div style={{ width: `${794 * scale}px`, height: `${1123 * scale}px`, position: 'relative' }}>
                <div className="bg-white shadow-xl flex flex-col text-black font-sans leading-tight" style={{ width: '794px', height: '1123px', transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute' }}>

                    {/* Official Header */}
                    <div className="w-full border-b flex justify-center items-center p-8 flex-shrink-0" style={{ backgroundColor: headerStyle.bgColor || '#ffffff', borderColor: headerStyle.borderColor || '#1e40af' }}>
                        <div className="flex-shrink-0" style={{ width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 115}px`, height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 115}px` }}>
                            {logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}
                        </div>
                        <div className="text-center px-6 flex-1">
                            <p className="text-[13px] leading-tight text-gray-600">{headerInfo?.country || 'Republic of the Philippines'}</p>
                            <p className="text-[13px] leading-tight text-gray-600">{headerInfo?.province || 'Province of Bulacan'}</p>
                            <p className="text-[13px] leading-tight text-gray-600">{headerInfo?.municipality || 'Municipality of Calumpit'}</p>
                            <p className="text-[18px] font-bold text-blue-900 uppercase leading-tight mt-1">{headerInfo?.barangayName || 'BARANGAY IBA O\' ESTE'}</p>
                            <p className="text-[14px] font-black text-red-700 uppercase mt-2 tracking-wide">OFFICE OF THE PUNONG BARANGAY</p>
                        </div>
                        <div className="flex-shrink-0" style={{ width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 115}px`, height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 115}px` }}>
                            {logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}
                        </div>
                    </div>

                    <div className="flex-1 p-[1.2in] pt-12 relative overflow-hidden flex flex-col">
                        {/* Watermark Logo */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                            <img src={logos.leftLogo} className="w-4/5" alt="" />
                        </div>

                        <div className="relative z-10 w-full flex flex-col">
                            {/* Title - EXACT MATCH: Green, Bold, Underlined */}
                            <div className="text-center mb-12">
                                <h1 className="text-[26px] font-bold text-[#006600] underline decoration-[#006600] underline-offset-8 uppercase leading-normal">
                                    BARANGAY CERTIFICATION OF CO-HABITATION
                                </h1>
                            </div>

                            <div className="space-y-6 text-[18.5px]">
                                <p className="font-bold mb-4 uppercase">TO WHOM IT MAY CONCERN:</p>

                                <p className="text-justify leading-relaxed">
                                    This is to certify that below mentioned persons, bona fide residents of this barangay at
                                    <span className="uppercase font-bold tracking-tight"> {formData.address || '__________________________________________________'}</span>,
                                    are living together in common house (yet to undergo church / civil wedding) as detailed below:
                                </p>

                                {/* Person 1 Details */}
                                <div className="space-y-1.5 mt-8">
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span className="font-bold text-[18.5px]">Name</span>
                                        <span className="font-bold text-[18.5px]">:</span>
                                        <span className="font-bold text-[18.5px] uppercase">{formData.fullName || '____________________'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Age / Edad</span>
                                        <span>:</span>
                                        <span>{formData.age || '_______'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Sex / Kasarian</span>
                                        <span>:</span>
                                        <span>{formData.gender || '_______'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Date of Birth</span>
                                        <span>:</span>
                                        <span>{formatBday(formData.dateOfBirth)}</span>
                                    </div>
                                </div>

                                {/* Person 2 Details */}
                                <div className="space-y-1.5 mt-8">
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span className="font-bold text-[18.5px]">Name</span>
                                        <span className="font-bold text-[18.5px]">:</span>
                                        <span className="font-bold text-[18.5px] uppercase">{formData.partnerFullName || '____________________'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Age / Edad</span>
                                        <span>:</span>
                                        <span>{formData.partnerAge || '_______'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Sex / Kasarian</span>
                                        <span>:</span>
                                        <span>{formData.partnerGender || '_______'}</span>
                                    </div>
                                    <div className="grid grid-cols-[160px_20px_1fr] items-baseline">
                                        <span>Date of Birth</span>
                                        <span>:</span>
                                        <span>{formatBday(formData.partnerDateOfBirth)}</span>
                                    </div>
                                </div>

                                {/* Partnership Stats */}
                                <div className="space-y-1.5 mt-8">
                                    <div className="grid grid-cols-[240px_20px_1fr] items-baseline font-medium">
                                        <span>No. of Children</span>
                                        <span>:</span>
                                        <span>{formData.noOfChildren || '0'}</span>
                                    </div>
                                    <div className="grid grid-cols-[240px_20px_1fr] items-baseline font-medium">
                                        <span>Length Living Together</span>
                                        <span>:</span>
                                        <span>{formData.livingTogetherYears || '0'} Year(s) and {formData.livingTogetherMonths || '0'} Month(s)</span>
                                    </div>
                                </div>

                                {/* Issuance Footer */}
                                <p className="text-justify leading-relaxed mt-12">
                                    Issued this <span className="font-bold">{currentDate || '____________________'}</span> at Barangay Iba O' Este, Calumpit, Bulacan upon the request of above mentioned persons for any legal purposes it may serve.
                                </p>

                                <div className="mt-20">
                                    <p className="font-bold uppercase mb-20 text-[18.5px]">TRULY YOURS,</p>

                                    <div className="mt-16">
                                        <p className="font-black text-[22px] uppercase leading-none mb-1">{officials.chairman}</p>
                                        <p className="font-bold text-[16px] uppercase tracking-wide">BARANGAY CHAIRMAN</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Footer - Bottom Right */}
                            <div className="mt-auto flex justify-end items-center gap-4 text-[16px] font-bold">
                                <span className="uppercase">Reference No:</span>
                                <span className="font-mono text-[18px] tracking-widest">{referenceNumber || '____________________'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

CohabitationPreview.displayName = 'CohabitationPreview';

import { useState, useEffect, useRef } from 'react';
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search, Clock, Phone, Calendar, ClipboardList } from 'lucide-react';
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
    contactInfo: {
        address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
        contactPerson: 'Sec. Royce Ann C. Galvez',
        telephone: '0967 631 9168',
        email: 'ibaoeste@calumpit.gov.ph'
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
    bodyStyle: { bgColor: '#ffffff', textColor: '#1f2937', titleColor: '#1e3a8a', titleSize: 24, textSize: 14, fontFamily: 'default' }
};

// Enhanced Notification Component
function Notification({ type, title, message, onClose }) {
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
}

export default function MedicoLegalModal({ isOpen, onClose }) {
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [officials, setOfficials] = useState(defaultOfficials);
    const [currentDate, setCurrentDate] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const certificateRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', age: '', sex: '', civilStatus: '',
        address: '', contactNumber: '', email: '', dateOfBirth: '',
        dateOfExamination: '', usapingBarangay: '', dateOfHearing: '',
        residentId: null
    });

    const handleResidentSelect = (resident) => {
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
        setIsResidentModalOpen(false);
        setErrors(prev => ({ ...prev, fullName: false }));
        setNotification({
            type: 'success',
            title: 'Profile Found',
            message: `${resident.full_name}'s details have been auto-filled.`
        });
    };

    useEffect(() => {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(now.toLocaleDateString('en-US', options));
    }, [isOpen]);

    useEffect(() => {
        const savedOfficials = localStorage.getItem('barangayOfficials');
        if (savedOfficials) {
            setOfficials({ ...defaultOfficials, ...JSON.parse(savedOfficials) });
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const validateForm = () => {
        const required = ['fullName', 'age', 'sex', 'address', 'dateOfBirth', 'contactNumber', 'dateOfExamination', 'usapingBarangay', 'dateOfHearing'];
        const newErrors = {};
        required.forEach(field => {
            if (!formData[field]) newErrors[field] = true;
        });

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

    const handleProceedSubmission = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/certificates/medico-legal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                setSubmittedReferenceNumber(result.referenceNumber);
                setReferenceNumber(result.referenceNumber);
                setShowConfirmationPopup(false);
                setShowSuccessModal(true);
            } else {
                throw new Error(result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setNotification({ type: 'error', title: 'Submission Failed', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '', age: '', sex: '', civilStatus: '',
            address: '', contactNumber: '', email: '', dateOfBirth: '',
            dateOfExamination: '', usapingBarangay: '', dateOfHearing: '',
            residentId: null
        });
        setShowConfirmationPopup(false);
        setShowSuccessModal(false);
        setNotification(null);
        setReferenceNumber('');
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in text-gray-900">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/30 shadow-xl">
                                    <ClipboardList className="w-8 h-8 text-white shadow-sm" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Request for Medico Legal</h2>
                                    <p className="text-blue-100/80 text-xs font-bold uppercase tracking-widest mt-1">Application Form</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {notification && <div className="px-8 pt-4"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Notice */}
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        This certification is issued for patience in aide of reconciliatory meeting / hearing of involved individuals to be held in this barangay.
                                    </p>
                                </div>

                                {/* Patient / Resident Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Search className="w-5 h-5 text-blue-600" />
                                            Patient Information
                                        </h3>
                                        <button type="button" onClick={() => setIsResidentModalOpen(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                            <Search className="w-4 h-4" />
                                            Search Resident
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                readOnly
                                                onClick={() => setIsResidentModalOpen(true)}
                                                placeholder="TAP TO SELECT PATIENT..."
                                                className={`w-full px-4 py-3 bg-gray-50 border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl font-bold uppercase cursor-pointer text-gray-900`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Age</label>
                                                <input type="text" value={formData.age} readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Sex</label>
                                                <input type="text" value={formData.sex} readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Residential Address</label>
                                            <input type="text" value={formData.address} readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date of Birth</label>
                                            <input type="text" value={formData.dateOfBirth} readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Medico Legal Details */}
                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        Investigation Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-widest ml-1">Date of Examination <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="dateOfExamination"
                                                value={formData.dateOfExamination}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border ${errors.dateOfExamination ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-1">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-widest ml-1">Usaping Barangay No. <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="usapingBarangay"
                                                value={formData.usapingBarangay}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 009-2026"
                                                className={`w-full px-4 py-3 border ${errors.usapingBarangay ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-widest ml-1">Date of Hearing <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="dateOfHearing"
                                                value={formData.dateOfHearing}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border ${errors.dateOfHearing ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info & Note */}
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-widest ml-1">Contact No. <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="contactNumber"
                                                    value={formData.contactNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="09XX XXX XXXX"
                                                    className={`w-full pl-10 pr-4 py-3 border ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                                            <div className="relative">
                                                <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="username@example.com"
                                                    className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl font-normal focus:ring-2 focus:ring-blue-500 outline-none`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start shadow-sm mt-4 tracking-tight">
                                        <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            <span className="font-bold underline">Note:</span> The Barangay Administrator will contact you via this number regarding the official status or schedule of your request.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verify all information before starting the approval workflow</p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors uppercase tracking-widest text-xs">Cancel</button>
                                <button onClick={handleSubmit} className="flex-1 sm:flex-none px-10 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transform hover:-translate-y-0.5 transition-all">Submit Application</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} />

            {
                showConfirmationPopup && (
                    <div className="fixed inset-0 z-[60] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setShowConfirmationPopup(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in">
                                <div className="bg-blue-900 px-8 py-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                                    <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">Confirm Application Details</h2>
                                    <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-200">
                                    <div className="flex justify-center">
                                        <MedicoLegalPreview formData={formData} currentDate={currentDate} officials={officials} referenceNumber={referenceNumber || 'PENDING'} />
                                    </div>
                                </div>
                                <div className="px-8 py-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                                    <button onClick={() => setShowConfirmationPopup(false)} disabled={isSubmitting} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 uppercase tracking-widest text-xs">Back to Edit</button>
                                    <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-10 py-3 bg-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all disabled:opacity-50">
                                        {isSubmitting ? 'Submitting...' : 'Proceed to Submission'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showSuccessModal && (
                    <div className="fixed inset-0 z-[70] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-10 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                    <div className="w-20 h-20 bg-blue-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                                        <CheckCircle className="w-12 h-12 text-blue-400 animate-bounce" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Filing Complete!</h2>
                                </div>
                                <div className="p-6 text-center">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 text-blue-900">
                                        <p className="text-sm font-medium mb-1 uppercase tracking-widest">Reference Number:</p>
                                        <p className="text-2xl font-black font-mono tracking-wider">{submittedReferenceNumber}</p>
                                    </div>

                                    <div className="bg-blue-900/5 border border-blue-900/10 rounded-2xl p-6 relative overflow-hidden text-left mb-6">
                                        <div className="flex items-center gap-3 text-blue-900 mb-4">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.1em]">Next Procedures</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                                                    <Clock className="w-4 h-4 text-blue-700" />
                                                </div>
                                                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                                                    Processing typically takes 1-3 business days. Your application is now in the queue for staff review and initial verification.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5">
                                                    <Phone className="w-4 h-4 text-blue-700" />
                                                </div>
                                                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                                                    We will coordinate via <strong>SMS at {formData.contactNumber}</strong> to confirm your schedule or provide updates regarding your request.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => { resetForm(); onClose(); }} className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">
                                        Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`@keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
        </>
    );
}

function MedicoLegalPreview({ formData, currentDate, officials, referenceNumber }) {
    const logos = officials.logos || {};
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) setScale(Math.min(containerRef.current.offsetWidth / 794, 1));
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div ref={containerRef} className="w-full flex justify-center">
            <div style={{ width: `${794 * scale}px`, height: `${1123 * scale}px`, position: 'relative' }}>
                <div className="bg-white text-black" style={{ width: '794px', height: '1123px', transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, padding: '60px 80px' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                        <img src={logos.leftLogo} style={{ width: '90px', height: '90px' }} alt="Logo" />
                        <div className="text-center">
                            <p className="text-[12px] uppercase font-medium">{officials.headerInfo?.country}</p>
                            <p className="text-[12px] uppercase font-medium">{officials.headerInfo?.province}</p>
                            <p className="text-[12px] uppercase font-medium">{officials.headerInfo?.municipality}</p>
                            <p className="text-[18px] font-bold uppercase">{officials.headerInfo?.barangayName}</p>
                            <p className="text-[14px] font-extrabold text-red-600 mt-1 uppercase">Office of the Punong Barangay</p>
                        </div>
                        <img src={logos.rightLogo} style={{ width: '90px', height: '90px' }} alt="LGU" />
                    </div>

                    {/* Title */}
                    <div className="text-center mb-10">
                        <h1 className="text-[20px] font-bold underline underline-offset-4 uppercase">REQUEST FOR MEDICO LEGAL (COPY)</h1>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 text-[15px]">
                        <p className="font-bold uppercase tracking-tight">TO WHOM IT MAY CONCERN:</p>
                        <p className="mt-6 font-bold uppercase">GREETINGS!</p>
                        <p className="leading-relaxed uppercase">
                            KINDLY REQUESTING YOUR GOOD OFFICE TO FURNISH US A COPY OF "MEDICO LEGAL" OF YOUR BELOW MENTIONED PATIENT IN AIDE OF RECONCILIATORY MEETING / HEARING OF INVOLVED INDIVIDUALS TO BE HELD IN THIS BARANGAY AS DETAILED BELOW:
                        </p>

                        <div className="space-y-1.5 mt-6">
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>REQUEST DATE</span><span>:</span><span>{currentDate.toUpperCase()}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>NAME</span><span>:</span><span className="font-bold uppercase">{formData.fullName}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>AGE</span><span>:</span><span>{formData.age}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>SEX</span><span>:</span><span className="uppercase">{formData.sex}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>RESIDENTIAL ADDRESS</span><span>:</span><span className="uppercase">{formData.address}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start"><span>DATE OF BIRTH</span><span>:</span><span>{formatDate(formData.dateOfBirth).toUpperCase()}</span></div>

                            {/* Date of Examination / Confinement row */}
                            <div className="grid grid-cols-[200px_20px_1fr] items-start pt-1">
                                <div className="flex flex-col">
                                    <span>DATE OF EXAMINATION /</span>
                                    <span>CONFINEMENT</span>
                                </div>
                                <span className="pt-0">:</span>
                                <span className="pt-0">{formatDate(formData.dateOfExamination).toUpperCase()}</span>
                            </div>

                            <div className="grid grid-cols-[200px_20px_1fr] items-start pt-1 font-bold"><span>USAPING BARANGAY NO.</span><span>:</span><span>{formData.usapingBarangay?.toUpperCase()}</span></div>
                            <div className="grid grid-cols-[200px_20px_1fr] items-start font-bold"><span>DATE OF HEARING</span><span>:</span><span>{formatDate(formData.dateOfHearing).toUpperCase()}</span></div>
                        </div>

                        <p className="pt-8 leading-relaxed uppercase">
                            YOU MAY PLEASE HANDOVER THE REQUESTED "MEDICO LEGAL" TO YOUR ABOVE PATIENT DIRECTLY. PRAYING FOR YOUR FAVORABLE RESPONSE AND ASSISTANCE. KEEP SAFE AND GOD BLESS!
                        </p>

                        <div className="pt-16">
                            <p className="font-bold mb-16 uppercase">Truly Yours,</p>
                            <div className="space-y-0.5">
                                <p className="text-[18px] font-bold uppercase">{officials.chairman}</p>
                                <p className="text-[13px] font-bold uppercase">BARANGAY CHAIRMAN</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 opacity-50">
                            <p className="text-[10px] font-bold">Reference No: <span className="underline">{referenceNumber || 'ML-XXXX-YYYY'}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

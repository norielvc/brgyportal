import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Eye, Send, CheckCircle, AlertCircle, Info, Search, Clock, Phone, Mail, Flower2 } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';

// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

// Default officials data (fallback)
const defaultOfficials = {
    chairman: 'ALEXANDER C. MANIO',
    secretary: 'ROYCE ANN C. GALVEZ',
    contactInfo: {
        address: "Purok 2 (Sitio Banawe) Barangay Iba O' Este, Calumpit, Bulacan",
        telephone: '0967 631 9168',
        email: 'anneseriousme@gmail.com'
    },
    headerInfo: {
        country: 'Republic of the Philippines',
        province: 'Province of Bulacan',
        municipality: 'Municipality of Calumpit',
        barangayName: "BARANGAY IBA O' ESTE",
        officeName: 'Office of the Punong Barangay'
    },
    logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 115 }
};

const PURPOSE_LIST_1 = [
    "PERSONAL LOAN - GM SYNERGY MICROFINANCE INC. (CITY OF MALOLOS, BULACAN)",
    "TESDA / SCHOOLING REQUIREMENT",
    "NATIONAL BUREAU OF INVESTIGATION (NBI) REQUIREMENT",
    "TAXPAYER IDENTIFICATION NUMBER (TIN) REQUIREMENT",
    "SOCIAL SECURITY SYSTEM (SSS) REQUIREMENT",
    "PAG-IBIG REQUIREMENT",
    "PHILHEALTH REQUIREMENT",
    "*TAXPAYER IDENTIFICATION NUMBERS (TIN) REQUIREMENT",
    "PERSONAL LOAN - BPI BANKO (CALUMPIT, BULACAN BRANCH)",
    "PERSONAL LOAN* - MERZON & SON FINANCING CORPORATION",
    "POSTAL ID REQUIREMENT - WORK / JOB APPLICATION",
    "CONVERGE INTERNET CONNECTION REQUIREMNET",
    "APPLICATION FOR PERSON WITH DISABILITIES (PWD)*",
    "APPLICATION FOR SENIOR CITIZEN'S ID*",
    "APPLICATION FOR WATER SERVICE CONNECTION (CAWADI)",
    "APPLICATION FOR ELECTRICAL SERVICE CONNECTION (MERALCO)",
    "SCHOLARSHIP ASSISTANCE - LCDFI*",
    "APPLICATION FOR ELECTRICAL SERVICE CONNECTION (MERALCO)*",
    "APPLICATION FOR SENIOR CITIZEN'S ID (OSCA)*",
    "TESDA* - NATIONAL CERTIFICATE II (NCII) APPLICATION REQUIREMENT",
    "SCHOLARSHIP ASSISTANCE* - LA CONSOLACION UNIVERSITY PHILPPINES (LCUP)",
    "PERSONAL LOAN* - LIFEBANK MICROFINANCE FOUNDATION INC.",
    "PERSONAL LOAN - ASA PHILIPPINES FOUNDATION MICRO FINANCE (CAL., BUL)",
    "PERSONAL LOAN - BPI BANKO (CALUMPIT, BULACAN BRANCH)",
    "PERSONAL LOAN - CASHLINE LENDING CORP. (PULILAN, BULACAN)",
    "PERSONAL LOAN - FAST AND EASY LENDING CORP. (CITY OF MAL., BUL.)",
    "PERSONAL LOAN - GM SYNERGY MICROFINANCE INC. (PULILAN, BULACAN)",
    "PERSONAL LOAN - KASAGANA (MALOLOS, BULACAN)",
    "PERSONAL LOAN - KASAGANA LENDING (CITY OF MALOLOS, BUL.)",
    "PERSONAL LOAN - LIBERTY LENDING (APALIT, PAMPANGA)",
    "PERSONAL LOAN - LIGHT MICRO FINANCE (MALOLOS, BULACAN)",
    "PERSONAL LOAN - PAG-ASA LENDING (CITY OF MALOLOS, BUL.)",
    "PERSONAL LOAN - SKY GO (CALUMPIT, BULACAN)",
    "PERSONAL LOAN - SUPERBIKES CENTER (CALUMPIT, BULACAN)",
    "PERSONAL LOAN - TALETE MICRO FINANCE (LONGOS, CITY OF MAL., BUL.)",
    "PERSONAL LOAN - WHEELTEK (CITY OF MALOLOS, BULACAN BRANCH)",
    "PERSONAL LOAN* - MITSUKOSHI MOTORS PHILIPPINES INC.",
    "PERSONAL LOAN - DSE LENDING INC. (CALUMPIT, BULACAN)",
    "PERSONAL LOAN - 7R FINANCE CO. (MALOLOS, BULACAN)",
    "PERSONAL LOAN - C4 STAR KAAGAPAY (MALOLOS, BULACAN)",
    "CANIOGAN COOPERATIVE MEMBERSHIP REQUIREMENT",
    "PERSONAL LOAN - NWOW EBIKE (CALUMPIT, BULACAN) CO-MAKER",
    "PERSONAL LOAN* - L5 AND SONS FINANCING CORPORATION",
    "PERSONAL LOAN - 3R LENDING (APALIT, PAMPANGA)",
    "PERSONAL LOAN - BISIKLETA STA. RITA (CALUMPIT, BULACAN)",
    "PERSONAL LOAN - FASTER LENDING (CITY OF MALOLOS, BULACAN)",
    "PERSONAL LOAN* - JEMS MERCADO AND SONS LENDING CORP.",
    "PERSONAL LOAN - L5 MICROFINANCE (CITY OF MALOLOS, BUL.)",
    "APPLICATION FOR INTERNET SERVICE CONNECTION",
    "FOR NATASHA REQUIREMENT",
    "ON THE JOB TRAINING (OJT) REQUIREMENT",
    "POLICE CLEARANCE REQUIREMENT - FOR RENEWAL OF LTOP*",
    "PERSONAL LOAN - BPI BANKO (APALIT, PAMPANGA)",
    "PERSONAL LOAN - AJ MICROFINANCE (CITY OF MALOLOS, BULACAN)",
    "MERALCO - TRANSFER OF METER",
    "PERSONAL LOAN - GABAY ALAY (MALOLOS, BULACAN)",
    "PERSONAL LOAN - E1 LENDING (PULILAN, BULACAN)",
    "BANK TRANSACTION - OPEN ACCOUNT",
    "APPLICATION FOR BUILDING PERMIT REQUIREMENT",
    "POLICE CLEARANCE REQUIREMENT - WORK / JOB APPLICATION",
    "FOR SCHOOL ADMISSION REQUIREMENT"
];

const PURPOSE_LIST_2 = [
    "CALUMPIT BRANCH",
    "BUREAU OF INTERNAL REVENUE (TIKTOK CONTENT CREATOR)",
    "PULILAN, BULACAN BRANCH",
    "APPLYING FOR INTERNET INSTALLATION REQUIREMENT",
    "MEDICAL CERTIFICATE ATTACHED",
    "OFFICE OF SENIOR CITIZENS AFFAIRS (OSCA)",
    "LANDBANK COUNTRYSIDE DEVELOPMENT FOUNDATION, INC.",
    "OFFICE OF THE SENIOR CITIZENS AFFAIR (OSCA)",
    "SOLAR NET METERING",
    "OFFICE OF THE SENIOR CITIZEN'S AFFAIR",
    "TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY",
    "CITY OF MALOLOS, BULACAN",
    "IKABUHI",
    "DAKILA MALOLOS, BULACAN BRANCH",
    "CALUMPIT, BULACAN",
    "LICENSE TO OWN AND POSSESS FIREARMS"
];

const PURPOSE_LIST_3 = [
    "Medical Bill",
    "Medical abstract",
    "MEDICAL prescription"
];

// Memoized Notification component
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

export default function NaturalDeathCertificateModal({ isOpen, onClose }) {
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [officials, setOfficials] = useState(defaultOfficials);
    const [currentDate, setCurrentDate] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        // Deceased info
        deceasedFullName: '',
        deceasedAge: '',
        deceasedGender: '',
        deceasedCivilStatus: '',
        deceasedAddress: '',
        deceasedDateOfBirth: '',
        deceasedPlaceOfBirth: '',
        dateOfDeath: '',
        placeOfDeath: '',
        causeOfDeath: '',
        // Requester info
        requesterFullName: '',
        relationship: '',
        contactNumber: '',
        email: '',
        purpose: '',
        residentId: null
    });

    const handleResidentSelect = (resident) => {
        setFormData(prev => ({
            ...prev,
            deceasedFullName: resident.full_name,
            deceasedAge: resident.age || '',
            deceasedGender: resident.gender || '',
            deceasedCivilStatus: resident.civil_status || '',
            deceasedAddress: resident.residential_address || '',
            deceasedDateOfBirth: resident.date_of_birth ? new Date(resident.date_of_birth).toISOString().split('T')[0] : '',
            deceasedPlaceOfBirth: resident.place_of_birth || '',
            residentId: resident.id
        }));
        setIsResidentModalOpen(false);
        setNotification({
            type: 'success',
            title: 'Profile Found',
            message: `${resident.full_name}'s details have been auto-filled.`
        });
        setErrors(prev => ({ ...prev, deceasedFullName: false }));
    };

    const handlePurposeSelect = (e) => {
        const selectedValue = e.target.value;
        if (!selectedValue) return;

        setFormData(prev => {
            const currentPurpose = prev.purpose || '';
            // If the purpose already contains this exact value, don't add it again
            if (currentPurpose.includes(selectedValue)) return prev;

            const newPurpose = currentPurpose
                ? `${currentPurpose}\n${selectedValue}`
                : selectedValue;

            return { ...prev, purpose: newPurpose };
        });

        // Reset the dropdown after selection
        e.target.value = '';
    };

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
            setReferenceNumber('');
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
                logos: { ...defaultOfficials.logos, ...parsed.logos }
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
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const validateForm = () => {
        const required = ['deceasedFullName', 'dateOfDeath', 'placeOfDeath', 'causeOfDeath', 'requesterFullName', 'relationship', 'contactNumber'];
        const newErrors = {};
        required.forEach(field => { if (!formData[field]) newErrors[field] = true; });

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields correctly.' });
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
            const response = await fetch(`${API_URL}/certificates/naturaldeath`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, certificate_type: 'natural_death' })
            });

            const result = await response.json();
            if (result.success) {
                setSubmittedReferenceNumber(result.referenceNumber);
                setReferenceNumber(result.referenceNumber);
                setShowConfirmationPopup(false);
                setShowSuccessModal(true);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            setShowConfirmationPopup(false);
            setNotification({ type: 'error', title: 'Submission Failed', message: error.message || 'Could not submit. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            deceasedFullName: '', deceasedAge: '', deceasedGender: '', deceasedCivilStatus: '',
            deceasedAddress: '', deceasedDateOfBirth: '', deceasedPlaceOfBirth: '',
            dateOfDeath: '', placeOfDeath: '', causeOfDeath: '',
            requesterFullName: '', relationship: '', contactNumber: '', email: '', purpose: '', residentId: null
        });
        setShowPreview(false);
        setShowConfirmationPopup(false);
        setShowSuccessModal(false);
        setNotification(null);
        setReferenceNumber('');
        setSubmittedReferenceNumber('');
        setErrors({});
    };

    const [showPreview, setShowPreview] = useState(false);

    if (!isOpen) return null;

    const inputClass = (field) =>
        `w-full px-4 py-2.5 bg-white border-2 ${errors[field] ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`;

    const SectionHeader = ({ num, title, subtitle }) => (
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
            <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">{num}</div>
            <div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                {subtitle && <p className="text-[10px] text-white/90 font-medium tracking-wide">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <>
            {(!showConfirmationPopup && !showSuccessModal) && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden flex-shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl">
                                        <Flower2 className="w-5 h-5 text-white shadow-sm" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md">Natural Death Certificate / Katunayan ng Likas na Kamatayan</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                                            <p className="text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 rounded-md shadow-md">{referenceNumber || 'New Natural Death Request'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group">
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {notification && <div className="px-4 pt-2"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                                    {/* Notice */}
                                    <div className="bg-gradient-to-r from-[#112e1f]/90 to-[#1a3d29]/80 border border-white/10 rounded-lg p-3 shadow-md relative overflow-hidden flex-shrink-0">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                                        <div className="flex items-start gap-2 relative z-10">
                                            <div className="bg-white/10 border border-white/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                                                <Info className="w-3 h-3 text-emerald-300" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                                    <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-[9px]">Registration Notice / Paunawa</h4>
                                                </div>
                                                <p className="text-white/80 text-[10px] font-medium leading-relaxed mb-0.5">
                                                    If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.
                                                </p>
                                                <p className="text-white/50 text-[9px] font-medium leading-relaxed italic">
                                                    Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 1: Deceased Information */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                            <SectionHeader num="1" title="Deceased Information / Impormasyon ng Yumaong" subtitle="Details of the person who passed away" />
                                            <button type="button" onClick={() => setIsResidentModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group">
                                                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                Access Resident Directory / Mag-access sa Directory
                                            </button>
                                        </div>

                                        <div className="relative group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1 block">Full Name of Deceased / Buong Pangalan ng Yumaong <span className="text-red-500">*</span></label>
                                            <input
                                                type="text" name="deceasedFullName" value={formData.deceasedFullName} readOnly
                                                onClick={() => setIsResidentModalOpen(true)}
                                                placeholder="TAP HERE TO SELECT FROM RESIDENT DIRECTORY..."
                                                className={`w-full px-4 py-3 bg-white border-2 ${errors.deceasedFullName ? 'border-red-500 bg-red-50' : (formData.deceasedFullName ? 'border-emerald-200 ring-2 ring-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-lg transition-all duration-300 font-bold text-base cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">Date of Death / Petsa ng Kamatayan <span className="text-red-500">*</span></label>
                                                <input type="date" name="dateOfDeath" value={formData.dateOfDeath} onChange={handleInputChange} className={inputClass('dateOfDeath')} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">Place of Death / Lugar ng Kamatayan <span className="text-red-500">*</span></label>
                                                <input type="text" name="placeOfDeath" value={formData.placeOfDeath} onChange={handleInputChange} placeholder="e.g. Barangay Health Center" className={inputClass('placeOfDeath')} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">Cause of Death / Dahilan ng Kamatayan <span className="text-red-500">*</span></label>
                                                <input type="text" name="causeOfDeath" value={formData.causeOfDeath} onChange={handleInputChange} placeholder="e.g. Natural causes / old age" className={inputClass('causeOfDeath')} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Requester Information */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <SectionHeader num="2" title="Requester Information / Impormasyon ng Humihiling" subtitle="The person requesting the certificate" />

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">Full Name of Requester / Pangalan ng Humihiling <span className="text-red-500">*</span></label>
                                                <input type="text" name="requesterFullName" value={formData.requesterFullName} onChange={handleInputChange} placeholder="Full name of the requester" className={inputClass('requesterFullName')} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">Relationship to Deceased / Relasyon sa Yumaong <span className="text-red-500">*</span></label>
                                                <select name="relationship" value={formData.relationship} onChange={handleInputChange} className={inputClass('relationship')}>
                                                    <option value="">-- Select Relationship --</option>
                                                    <option value="Spouse">Spouse / Asawa</option>
                                                    <option value="Child">Child / Anak</option>
                                                    <option value="Parent">Parent / Magulang</option>
                                                    <option value="Sibling">Sibling / Kapatid</option>
                                                    <option value="Grandchild">Grandchild / Apo</option>
                                                    <option value="Relative">Other Relative / Kamag-anak</option>
                                                    <option value="Authorized Representative">Authorized Representative</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Contact Details */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <SectionHeader num="3" title="Contact Details / Detalye ng Contact" subtitle="Notification details / Detalye ng notification" />

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                                                    <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address (Optional)</div>
                                                </label>
                                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className={inputClass('email')} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block mb-1">
                                                    <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Number / Numero ng Telepono <span className="text-red-500">*</span></div>
                                                </label>
                                                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={inputClass('contactNumber')} />
                                            </div>
                                        </div>


                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden sm:block">Please check all entries before final submission / Pakisuri ang lahat bago i-submit</p>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button type="submit" onClick={handleSubmit} className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all group">
                                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Submit Application / Ipadala ang Aplikasyon
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Popup */}
            {showConfirmationPopup && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setShowConfirmationPopup(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg border border-white/30"><FileText className="w-5 h-5 text-white" /></div>
                                    <h2 className="text-lg font-bold text-white uppercase">Review Application / Suriin ang Aplikasyon</h2>
                                </div>
                                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl group">
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50/80">
                                <div className="max-w-2xl mx-auto space-y-3">
                                    {Object.entries(formData).map(([key, value]) => {
                                        const excludedKeys = ['residentId', 'deceasedAge', 'deceasedGender', 'deceasedCivilStatus', 'deceasedDateOfBirth', 'deceasedPlaceOfBirth', 'deceasedAddress'];
                                        if (!value || excludedKeys.includes(key)) return null;
                                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                        return (
                                            <div key={key} className="flex flex-col md:flex-row md:items-center justify-between px-4 py-2.5 bg-white shadow-sm border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{formattedKey}</span>
                                                <span className="text-sm font-bold text-gray-900 break-words md:text-right mt-1 md:mt-0 group-hover:text-emerald-700 transition-colors uppercase">
                                                    {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="border-t bg-gray-50/80 px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center">
                                <button onClick={() => setShowConfirmationPopup(false)} disabled={isSubmitting} className="px-4 py-2.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-lg font-bold flex items-center gap-2 outline-none">
                                    <Eye className="w-4 h-4" /> Go Back & Edit / Bumalik sa Pag-edit
                                </button>
                                <button onClick={handleProceedSubmission} disabled={isSubmitting} className="px-4 py-2.5 bg-gradient-to-r from-[#8cc63f] to-[#7cb342] hover:from-[#7cb342] hover:to-[#689f38] text-white rounded-lg font-bold flex items-center gap-2 shadow-xl transform hover:-translate-y-0.5 transition-all">
                                    {isSubmitting ? 'Processing... / Pinoproseso...' : 'Confirm & Submit / Kumpirmahin at Ipadala'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[70] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                            <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-6 py-6 text-center">
                                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                                    <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Filing Complete! / Tapos na ang Pag-file!</h2>
                            </div>
                            <div className="p-4 text-center">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm font-medium text-green-800 mb-1">REFERENCE NO:</p>
                                    <p className="text-xl font-bold text-green-900 font-mono tracking-wider">{submittedReferenceNumber}</p>
                                </div>
                                <div className="bg-[#112e1f]/5 border border-[#112e1f]/10 rounded-lg p-4 text-left mb-4">
                                    <div className="flex items-center gap-2 text-[#112e1f] mb-3">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wide">Next Procedures / Susunod na Pamamaraan</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Clock className="w-3 h-3 text-emerald-700" /></div>
                                            <p className="text-[10px] text-gray-600 font-bold leading-relaxed">Processing typically takes 1-3 business days. Your application is now in queue for chairman approval.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-0.5"><Phone className="w-3 h-3 text-emerald-700" /></div>
                                            <p className="text-[10px] text-gray-600 font-bold leading-relaxed">We will coordinate via <strong>SMS at {formData.contactNumber}</strong> to confirm your pickup schedule at the Barangay Hall.</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowSuccessModal(false); resetForm(); onClose(); }} className="w-full bg-[#112e1f] text-white py-3 rounded-lg font-bold uppercase transition-all shadow-lg active:scale-95">
                                    Return to Dashboard / Bumalik sa Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isResidentModalOpen && (
                <ResidentSearchModal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)} onSelect={handleResidentSelect} />
            )}

            <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        input::placeholder, textarea::placeholder { font-family: 'Open Sans', sans-serif !important; font-style: italic !important; font-weight: 400 !important; }
      `}</style>
        </>
    );
}

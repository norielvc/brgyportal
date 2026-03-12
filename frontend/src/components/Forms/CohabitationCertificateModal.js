import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Eye, Send, CheckCircle, AlertCircle, Info, Search, Clock, Phone, Mail, Users, MapPin } from 'lucide-react';
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
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [officials, setOfficials] = useState(defaultOfficials);
    const [currentDate, setCurrentDate] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState('');
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [selectingFor, setSelectingFor] = useState('person1');
    const [errors, setErrors] = useState({});
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
            setNotification({ type: 'success', title: 'Person 1 Found', message: `${resident.full_name}'s details have been auto-filled.` });
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
            setNotification({ type: 'success', title: 'Partner Found', message: `${resident.full_name}'s details have been auto-filled.` });
        }
        setIsResidentModalOpen(false);
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
        const required = ['fullName', 'partnerFullName', 'address', 'contactNumber'];
        const newErrors = {};
        required.forEach(field => { if (!formData[field]) newErrors[field] = true; });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setNotification({ type: 'error', title: 'Missing Info', message: 'Please fill in all required fields.' });
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
                body: JSON.stringify({ ...formData, certificate_type: 'barangay_cohabitation' })
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
            setNotification({ type: 'error', title: 'Error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '', age: '', gender: '', dateOfBirth: '', residentId: null,
            partnerFullName: '', partnerAge: '', partnerGender: '', partnerDateOfBirth: '', partnerResidentId: null,
            address: '', noOfChildren: '0', livingTogetherYears: '0', livingTogetherMonths: '0',
            purpose: '', contactNumber: '', email: '', person1DbAddress: '', partnerDbAddress: ''
        });
        setShowConfirmationPopup(false);
        setShowSuccessModal(false);
        setNotification(null);
        setReferenceNumber('');
        setSubmittedReferenceNumber('');
        setErrors({});
    };

    if (!isOpen) return null;

    const inputClass = (field) =>
        `w-full px-4 py-2.5 bg-white border-2 ${errors[field] ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`;

    const ResidentBlock = ({ nameKey, label, btnLabel, person }) => (
        <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm">
                    <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">{person}</div>
                    <div>
                        <h3 className="text-base font-bold text-white">{label}</h3>
                        <p className="text-[10px] text-white/90 font-medium tracking-wide">Select from resident directory</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { setSelectingFor(nameKey === 'fullName' ? 'person1' : 'person2'); setIsResidentModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-lg text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {btnLabel}
                </button>
            </div>
            <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 mb-1 block">Full Name / Buong Pangalan <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    name={nameKey}
                    value={formData[nameKey]}
                    readOnly
                    onClick={() => { setSelectingFor(nameKey === 'fullName' ? 'person1' : 'person2'); setIsResidentModalOpen(true); }}
                    placeholder="TAP HERE TO SELECT FROM RESIDENT DIRECTORY..."
                    className={`w-full px-4 py-3 bg-white border-2 ${errors[nameKey] ? 'border-red-500 bg-red-50' : (formData[nameKey] ? 'border-emerald-200 ring-2 ring-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-400 italic')} rounded-lg transition-all duration-300 font-bold text-base cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`}
                />
            </div>
            {formData[nameKey] && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-center gap-2 text-emerald-700 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wide italic">Personal Data Protected Under Data Privacy Act</span>
                </div>
            )}
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
                                        <Heart className="w-5 h-5 text-white shadow-sm" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md">Co-habitation Certificate / Katunayan ng Pakikipagsamahan</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                                            <p className="text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 rounded-md shadow-md">{referenceNumber || 'New Cohabitation Request'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group relative z-20">
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {notification && <div className="px-4 pt-2"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                                    {/* Registration Notice */}
                                    <div className="bg-gradient-to-r from-[#112e1f]/90 to-[#1a3d29]/80 border border-white/10 rounded-lg p-3 shadow-md relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none"></div>
                                        <div className="flex items-start gap-2 relative z-10">
                                            <div className="bg-white/10 border border-white/20 p-1.5 rounded-lg shrink-0 mt-0.5"><Info className="w-3 h-3 text-emerald-300" /></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                                    <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-[9px]">Registration Notice / Paunawa</h4>
                                                </div>
                                                <p className="text-white/80 text-[10px] font-medium leading-relaxed mb-0.5">If no record is found in the resident directory, please visit the Barangay Hall and coordinate with the staff to register.</p>
                                                <p className="text-white/50 text-[9px] font-medium leading-relaxed italic">Kung walang rekord sa direktoryo ng residente, mangyaring pumunta sa Barangay Hall upang magparehistro sa ating mga kawani.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 1 — Person 1 */}
                                    <ResidentBlock nameKey="fullName" label="First Person / Unang Tao" btnLabel="Search Resident Directory / Maghanap sa Directory" person="1" />

                                    {/* Section 2 — Partner */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <ResidentBlock nameKey="partnerFullName" label="Partner Details / Detalye ng Kapareha" btnLabel="Search Partner Directory / Maghanap sa Directory ng Kapareha" person="2" />
                                    </div>

                                    {/* Section 3 — Co-habitation Info */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                                            <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">3</div>
                                            <div>
                                                <h3 className="text-base font-bold text-white">Co-habitation Details / Detalye ng Pakikipagsamahan</h3>
                                                <p className="text-[10px] text-white/90 font-medium tracking-wide">Common address and duration of living together</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> Common Address / Pinasamang Tirahan <span className="text-red-500">*</span>
                                            </label>
                                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Full address where both parties are living together..." className={inputClass('address')} />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> No. of Children / Bilang ng Anak
                                                </label>
                                                <input type="number" min="0" name="noOfChildren" value={formData.noOfChildren} onChange={handleInputChange} className={inputClass('noOfChildren')} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Years Together / Taon na Magkasama</label>
                                                <input type="number" min="0" name="livingTogetherYears" value={formData.livingTogetherYears} onChange={handleInputChange} className={inputClass('livingTogetherYears')} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Months Together / Buwan na Magkasama</label>
                                                <input type="number" min="0" max="11" name="livingTogetherMonths" value={formData.livingTogetherMonths} onChange={handleInputChange} className={inputClass('livingTogetherMonths')} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4 — Notification */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3 bg-gradient-to-r from-[#8cc63f] to-[#b4d339] rounded-l-full rounded-r-lg p-1.5 pr-4 shadow-sm mb-4">
                                            <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">4</div>
                                            <div>
                                                <h3 className="text-base font-bold text-white">Notification / Notipikasyon</h3>
                                                <p className="text-[10px] text-white/90 font-medium tracking-wide">Where to receive updates / Saan tatanggap ng mga update</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Email Address (Optional) / Email (Opsyonal)</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100"><Mail className="w-4 h-4 text-[#2d5a3d]/50" /></div>
                                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="username@example.com" className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-emerald-100 rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-normal text-gray-800 shadow-sm" />
                                                </div>
                                                <p className="text-[9px] text-gray-400 font-bold italic ml-2">Notifications will be sent here / Dito ipapadala ang mga abiso</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-[#2d5a3d] uppercase tracking-wide ml-1 block">Contact Number / Numero ng Telepono <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-2 border-gray-100"><Phone className="w-4 h-4 text-[#2d5a3d]/50" /></div>
                                                    <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="09XX XXX XXXX" className={`w-full pl-12 pr-4 py-2.5 bg-white border-2 ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-emerald-100'} rounded-lg focus:border-emerald-500 focus:shadow-lg transition-all outline-none font-bold text-gray-800 shadow-sm`} />
                                                </div>
                                            </div>
                                        </div>


                                    </div>

                                </form>
                            </div>

                            {/* Footer */}
                            <div className="border-t bg-gray-50/80 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row gap-2 justify-between items-center no-print flex-shrink-0">
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
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                            <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-4 py-3 flex items-center justify-between border-b border-white/10">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-xl"><Heart className="w-5 h-5 text-white shadow-sm" /></div>
                                    <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-md uppercase">Review Application / Suriin ang Aplikasyon</h2>
                                </div>
                                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all group">
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 bg-gray-50/80">
                                <div className="max-w-2xl mx-auto space-y-3">
                                    {Object.entries(formData).map(([key, value]) => {
                                        const excludedKeys = ['residentId', 'partnerResidentId', 'age', 'gender', 'dateOfBirth', 'partnerAge', 'partnerGender', 'partnerDateOfBirth', 'person1DbAddress', 'partnerDbAddress'];
                                        if (!value || value === '0' || excludedKeys.includes(key)) return null;
                                        const labelMap = {
                                            fullName: 'Person 1 Full Name', partnerFullName: 'Partner Full Name',
                                            address: 'Common Address', noOfChildren: 'No. of Children',
                                            livingTogetherYears: 'Years Together', livingTogetherMonths: 'Months Together',
                                            purpose: 'Purpose', contactNumber: 'Contact Number', email: 'Email Address'
                                        };
                                        const formattedKey = labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
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
                                            <p className="text-[10px] text-gray-600 font-bold leading-relaxed">Processing typically takes 1-3 business days. Your application is now in the queue for chairman approval.</p>
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
        input::-webkit-input-placeholder, textarea::-webkit-input-placeholder { font-family: 'Open Sans', sans-serif !important; font-style: italic !important; font-weight: 400 !important; }
        input::-moz-placeholder, textarea::-moz-placeholder { font-family: 'Open Sans', sans-serif !important; font-style: italic !important; font-weight: 400 !important; }
        input:-ms-input-placeholder, textarea:-ms-input-placeholder { font-family: 'Open Sans', sans-serif !important; font-style: italic !important; font-weight: 400 !important; }
      `}</style>
        </>
    );
}

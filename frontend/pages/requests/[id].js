import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    FileText, Clock, CheckCircle, AlertCircle, Calendar, User,
    MapPin, Phone, Mail, ChevronRight, ArrowLeft, Printer, RefreshCw,
    Search, Shield, Heart, Activity, Briefcase, GraduationCap, Flower2
} from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import { certificatesAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
    received: { color: 'blue', label: 'Received', icon: Clock },
    staff_review: { color: 'yellow', label: 'Staff Review', icon: Search },
    oic_review: { color: 'purple', label: 'Designated Approver Review', icon: Shield },
    kapitan_review: { color: 'indigo', label: 'Kapitan Review', icon: Shield },
    ready: { color: 'emerald', label: 'Ready for Pickup', icon: CheckCircle },
    ready_for_pickup: { color: 'emerald', label: 'Ready for Pickup', icon: CheckCircle },
    released: { color: 'green', label: 'Released', icon: CheckCircle },
    rejected: { color: 'red', label: 'Rejected', icon: AlertCircle },
    returned: { color: 'orange', label: 'Returned', icon: RefreshCw },
};

const TYPE_CONFIG = {
    barangay_clearance: { label: 'Barangay Clearance', icon: Shield, color: 'blue' },
    certificate_of_indigency: { label: 'Certificate of Indigency', icon: FileText, color: 'emerald' },
    barangay_residency: { label: 'Barangay Residency', icon: User, color: 'orange' },
    business_permit: { label: 'Business Permit', icon: Briefcase, color: 'purple' },
    educational_assistance: { label: 'Educational Assistance', icon: GraduationCap, color: 'blue' },
    natural_death: { label: 'Death Certificate', icon: Flower2, color: 'rose' },
    barangay_guardianship: { label: 'Guardianship Certificate', icon: Shield, color: 'indigo' },
    barangay_cohabitation: { label: 'Cohabitation Certificate', icon: Heart, color: 'rose' },
    medico_legal: { label: 'Medico-Legal Certificate', icon: Activity, color: 'blue' },
};

export default function PublicRequestStatusPage() {
    const router = useRouter();
    const { id } = router.query;

    const [request, setRequest] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchRequestDetails();
        }
    }, [id]);

    const fetchRequestDetails = async () => {
        setLoading(true);
        try {
            const response = await certificatesAPI.getRequest(id);
            if (response.success) {
                setRequest(response.data);

                // Fetch history as well
                const historyResponse = await certificatesAPI.getWorkflowHistory(id);
                if (historyResponse.success) {
                    setHistory(historyResponse.history || []);
                }
            } else {
                setError(response.message || 'Request not found');
            }
        } catch (err) {
            console.error('Error fetching request:', err);
            setError('An error occurred while fetching the request details.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        return STATUS_CONFIG[status] || { color: 'gray', label: status?.toUpperCase() || 'UNKNOWN', icon: Shield };
    };

    const getTypeInfo = (type) => {
        return TYPE_CONFIG[type] || { label: type?.toUpperCase() || 'UNKNOWN', icon: FileText, color: 'gray' };
    };

    if (loading) {
        return (
            <Layout title="Request Status" requireAuth={false}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Verifying Request status...</p>
                </div>
            </Layout>
        );
    }

    if (error || !request) {
        return (
            <Layout title="Request Not Found" requireAuth={false}>
                <div className="max-w-md mx-auto mt-24 text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Request Not Found</h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed uppercase font-bold tracking-tight">
                        We couldn't find a request with the provided ID.
                    </p>
                    <button
                        onClick={() => router.push('/track-status')}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Try Again
                    </button>
                </div>
            </Layout>
        );
    }

    const statusInfo = getStatusInfo(request.status);
    const typeInfo = getTypeInfo(request.certificate_type);
    const StatusIcon = statusInfo.icon;
    const TypeIcon = typeInfo.icon;

    return (
        <Layout requireAuth={false}>
            <Head>
                <title>Status: {request.reference_number} | Barangay Iba O' Este</title>
            </Head>

            <div className="min-h-screen bg-gray-50 py-12 px-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Public Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-1">Barangay Iba O' Este</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Document Tracking System</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => router.push('/track-status')}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all flex items-center gap-2"
                            >
                                <Search className="w-4 h-4" /> Track Another
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" /> Print
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Status Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Status Hero Card */}
                            <div className="p-10 rounded-[3rem] bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 relative overflow-hidden group hover:shadow-primary-100/50 transition-all duration-500">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className={`p-5 rounded-[2rem] bg-gray-900 text-white shadow-xl`}>
                                            <StatusIcon className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Current Application Health</p>
                                            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                                                {statusInfo.label}
                                            </h1>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
                                                <TypeIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Application Type</p>
                                                <p className="font-extrabold text-gray-900 uppercase text-base tracking-tight">{typeInfo.label}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference Number</p>
                                                <p className="font-extrabold text-gray-900 uppercase text-base tracking-tight">{request.reference_number}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Massive background icon */}
                                <StatusIcon className="absolute -bottom-16 -right-16 w-80 h-80 text-gray-50 opacity-50 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                            </div>

                            {/* Progress / Tracker */}
                            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl">
                                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] mb-10 border-l-8 border-primary-600 pl-6">
                                    Application Journey
                                </h3>

                                <div className="space-y-12 relative before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-[4px] before:bg-gray-100">
                                    {history.length > 0 ? (
                                        history.slice().reverse().map((step, index) => (
                                            <div key={index} className="flex gap-8 relative group">
                                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 border-4 border-white shadow-xl relative z-10 transition-transform group-hover:scale-110 ${step.action === 'approve' ? 'bg-emerald-500 text-white' :
                                                    step.action === 'reject' ? 'bg-rose-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                    }`}>
                                                    {step.action === 'approve' ? <CheckCircle className="w-5 h-5" /> :
                                                        step.action === 'reject' ? <AlertCircle className="w-5 h-5" /> :
                                                            <Clock className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-black text-gray-900 uppercase text-base tracking-tight leading-none mb-1">{step.step_name}</h4>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Actioned by: {step.users ? `${step.users.first_name} ${step.users.last_name}` : 'System'}</p>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                            {new Date(step.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    {step.comments && (
                                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600 italic font-medium leading-relaxed group-hover:bg-white transition-colors">
                                                            "{step.comments}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex gap-8 relative items-center">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-blue-500 text-white flex items-center justify-center shrink-0 border-4 border-white shadow-xl relative z-10">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 uppercase text-base tracking-tight leading-none mb-1">Queue Initialized</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting system registration</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Static Info */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-600" />
                                    Applicant Profile
                                </h3>

                                <div className="space-y-6">
                                    <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                                        <p className="text-[14px] font-black text-gray-900 uppercase tracking-tight mb-1">{request.full_name || request.applicant_name}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Registered Name</p>
                                    </div>

                                    <div className="space-y-4 px-2">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="w-5 h-5 text-gray-300 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Location Record</p>
                                                <p className="text-xs font-bold text-gray-600 uppercase leading-relaxed">{request.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <Phone className="w-5 h-5 text-gray-300 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Contact Anchor</p>
                                                <p className="text-xs font-black text-gray-900 font-mono tracking-tighter">{request.contact_number}</p>
                                            </div>
                                        </div>

                                        {['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'].includes(request.certificate_type) && (
                                            <div className="flex items-start gap-4">
                                                <FileText className="w-5 h-5 text-gray-300 shrink-0" />
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Purpose of Request</p>
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{request.purpose || 'NOT SPECIFIED'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border-4 shadow-2xl transition-all duration-500 ${request.status === 'ready' || request.status === 'ready_for_pickup'
                                ? 'bg-emerald-600 text-white border-white shadow-emerald-200'
                                : 'bg-indigo-600 text-white border-white shadow-indigo-200'
                                }`}>
                                <h3 className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-6">Government Guidance</h3>

                                {request.status === 'ready' || request.status === 'ready_for_pickup' ? (
                                    <div className="space-y-6">
                                        <p className="text-lg font-black uppercase tracking-tight leading-tight">
                                            Your Document is Ready!
                                        </p>
                                        <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Claim Checklist</p>
                                            <ul className="text-[11px] font-bold uppercase space-y-3 opacity-90">
                                                <li className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    Valid ID Card
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    Reference: {request.reference_number}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <p className="text-lg font-black uppercase tracking-tight leading-tight">
                                            Application in Review
                                        </p>
                                        <p className="text-[12px] font-bold text-white/70 uppercase leading-relaxed tracking-tight font-medium">
                                            Our staff is currently verifying your details. This standard process takes 24-48 hours.
                                        </p>
                                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Est. Completion: 2 Days</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

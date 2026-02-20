import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    FileText, Clock, CheckCircle, AlertCircle, Calendar, User,
    MapPin, Phone, Mail, ChevronRight, ArrowLeft, Printer, RefreshCw,
    Search, Shield, Heart, Activity, Briefcase, GraduationCap, Flower2, HelpCircle
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

export default function RequestStatusPage() {
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
        return STATUS_CONFIG[status] || { color: 'gray', label: status?.toUpperCase() || 'UNKNOWN', icon: HelpCircle };
    };

    const getTypeInfo = (type) => {
        return TYPE_CONFIG[type] || { label: type?.toUpperCase() || 'UNKNOWN', icon: FileText, color: 'gray' };
    };

    if (loading) {
        return (
            <Layout title="Request Status" requireAuth={true}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Verifying Request status...</p>
                </div>
            </Layout>
        );
    }

    if (error || !request) {
        return (
            <Layout title="Request Not Found" requireAuth={true}>
                <div className="max-w-md mx-auto mt-12 text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Request Not Found</h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed uppercase font-bold tracking-tight">
                        We couldn't find a request with the provided ID. Please double-check the URL or reference number.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
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
        <Layout
            title={`Request Status`}
            subtitle={request.reference_number}
            requireAuth={true}
        >
            <Head>
                <title>Status: {request.reference_number} | Barangay Iba O' Este</title>
            </Head>

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Navigation & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                        onClick={() => router.push('/requests')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-black uppercase tracking-widest text-[10px] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print Details
                        </button>
                        <button
                            onClick={fetchRequestDetails}
                            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-100"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh Status
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Status Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Hero Card */}
                        <div className={`p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-4 rounded-3xl bg-${statusInfo.color}-50 text-${statusInfo.color}-600 border border-${statusInfo.color}-100`}>
                                        <StatusIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Application Health</p>
                                        <h1 className={`text-4xl font-black text-${statusInfo.color}-700 uppercase tracking-tighter leading-none`}>
                                            {statusInfo.label}
                                        </h1>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
                                            <TypeIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Application Type</p>
                                            <p className="font-extrabold text-gray-900 uppercase text-sm tracking-tight">{typeInfo.label}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Submission Date</p>
                                            <p className="font-extrabold text-gray-900 uppercase text-sm tracking-tight">{formatDate(request.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Massive background icon */}
                            <StatusIcon className="absolute -bottom-10 -right-10 w-64 h-64 text-gray-50/50 -rotate-12" />
                        </div>

                        {/* Progress / Tracker */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-lg">
                            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] mb-8 border-l-4 border-primary-600 pl-4">
                                Processing Timeline
                            </h3>

                            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                                {/* Dynamically build steps based on history */}
                                {history.length > 0 ? (
                                    history.slice().reverse().map((step, index) => (
                                        <div key={index} className="flex gap-6 relative group">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-md relative z-10 transition-transform group-hover:scale-110 ${step.action === 'approve' ? 'bg-emerald-500 text-white' :
                                                step.action === 'reject' ? 'bg-rose-500 text-white' :
                                                    step.action === 'return' ? 'bg-amber-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                }`}>
                                                {step.action === 'approve' ? <CheckCircle className="w-4 h-4" /> :
                                                    step.action === 'reject' ? <AlertCircle className="w-4 h-4" /> :
                                                        <Clock className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{step.step_name}</h4>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        {new Date(step.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${step.action === 'approve' ? 'text-emerald-600' :
                                                    step.action === 'reject' ? 'text-rose-600' :
                                                        'text-blue-600'
                                                    }`}>
                                                    Action: {step.action.toUpperCase()}
                                                </p>
                                                {step.comments && (
                                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 italic font-medium leading-relaxed">
                                                        "{step.comments}"
                                                    </div>
                                                )}
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 border border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px] font-black text-gray-500">
                                                        {step.users?.first_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        Personnel: {step.users ? `${step.users.first_name} ${step.users.last_name}` : 'System'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex gap-6 relative">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 border-4 border-white shadow-md relative z-10">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight leading-none mb-2">Initial Review</h4>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Starting the verification process...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Detailed Info */}
                    <div className="space-y-6">
                        {/* Requestor Info Card */}
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg overflow-hidden">
                            <div className="p-6 bg-gray-50 border-b border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-600" />
                                    Record Ownership
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-3xl">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-primary-600 border border-gray-100 shadow-sm">
                                        {request.full_name?.charAt(0) || request.applicant_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                                            {request.full_name || request.applicant_name}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Applicant</p>
                                    </div>
                                </div>

                                <div className="space-y-4 px-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Residential Address</p>
                                            <p className="text-[12px] font-bold text-gray-700 uppercase tracking-tight leading-relaxed">{request.address || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Contact Verified</p>
                                            <p className="text-[12px] font-black text-gray-700 font-mono tracking-tighter">{request.contact_number}</p>
                                        </div>
                                    </div>

                                    {['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'].includes(request.certificate_type) && (
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Purpose of Request</p>
                                                <p className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">{request.purpose || 'NOT SPECIFIED'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {request.email && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Electronic Mail</p>
                                                <p className="text-[12px] font-black text-gray-700 font-mono tracking-tighter">{request.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Next Steps / Helpful Info */}
                        <div className={`p-6 rounded-[2rem] border shadow-lg ${request.status === 'ready' || request.status === 'ready_for_pickup'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-indigo-600 text-white border-indigo-500'
                            }`}>
                            <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-4">Command Guidance</h3>

                            {request.status === 'ready' || request.status === 'ready_for_pickup' ? (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
                                        Your request is now READY! Please proceed to the Barangay Hall during business hours to claim your document.
                                    </p>
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Requirements</p>
                                        <ul className="text-[11px] font-bold uppercase space-y-2 opacity-90">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                Valid Identification ID
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                Reference No: {request.reference_number}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                Processing Fee (if any)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
                                        Your application is currently being processed by our staff. Verification takes 1-2 business days.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">01</div>
                                            <p className="text-[11px] font-bold uppercase tracking-tight">Staff Verification</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">02</div>
                                            <p className="text-[11px] font-bold uppercase tracking-tight">Official Approval</p>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-50">
                                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">03</div>
                                            <p className="text-[11px] font-bold uppercase tracking-tight">Ready for Pickup</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          .lg\\:pl-64 { padding-left: 0 !important; }
          header, aside, button { display: none !important; }
          body { background: white; }
          .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
          .shadow-xl, .shadow-lg { box-shadow: none !important; }
          .border { border-color: #eee !important; }
        }
      `}</style>
        </Layout>
    );
}

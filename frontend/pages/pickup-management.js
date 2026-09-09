import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  FileCheck, Search, Eye, Calendar, User, Phone, MapPin,
  Shield, Clock, CheckCircle, AlertTriangle, QrCode,
  ExternalLink, RefreshCw, Package, History, XCircle, X, ChevronDown, ShieldCheck, Heart, FileText, Skull, Activity, Info, Mail
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import useScrollLock from '@/lib/useScrollLock';

// API Configuration
const API_URL = '/api';

export default function PickupManagementPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [pickupRecords, setPickupRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ready');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingCertificate, setConfirmingCertificate] = useState(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [pickupName, setPickupName] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendCertificate, setSendCertificate] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleManualRelease = async (certificateId, pickedUpBy) => {
    if (!pickedUpBy?.trim()) {
      toast.error('Please enter the name of the person picking up the certificate');
      return;
    }

    setConfirmingPickup(true);
    try {
      const token = getAuthToken();
      // Using the standard status update endpoint for manual release
      const response = await fetch(`${API_URL}/certificates/${certificateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'released',
          action: 'pickup',
          comment: `Manually released to: ${pickedUpBy}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsConfirmModalOpen(false);
        const refNum = confirmingCertificate?.reference_number;
        setPickupName('');
        setSelectedCertificate(null);
        handleRefresh();

        // Custom enhanced notification box
        toast.success(`Success! Certificate ${refNum || ''} has been marked as picked up.`, {
          duration: 5000,
          style: {
            minWidth: '350px',
            padding: '20px',
            borderRadius: '16px',
            background: '#FFFFFF',
            color: '#1F2937',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: '6px solid #10B981',
            fontWeight: '600'
          },
        });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process pickup. Please try again.');
    } finally {
      setConfirmingPickup(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchPickupRecords();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/certificates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickupRecords = async () => {
    try {
      const token = getAuthToken();
      // This would be a new endpoint to get all pickup records
      const response = await fetch(`${API_URL}/pickup/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPickupRecords(data.pickups || []);
        }
      }
    } catch (error) {
      console.error('Error fetching pickup records:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCertificates(), fetchPickupRecords()]);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      'submitted': 'bg-blue-50 text-blue-700 border-blue-100',
      'under_review': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'processing': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'staff_review': 'bg-blue-50 text-blue-700 border-blue-100',
      'secretary_approval': 'bg-purple-50 text-purple-700 border-purple-100',
      'captain_approval': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'oic_review': 'bg-blue-50 text-blue-700 border-blue-100',
      'ready_for_pickup': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'ready': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'released': 'bg-gray-50 text-gray-700 border-gray-100',
      'rejected': 'bg-red-50 text-red-700 border-red-100',
      'returned': 'bg-amber-50 text-amber-700 border-amber-100',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'barangay_clearance': 'Barangay Clearance',
      'certificate_of_indigency': 'Certificate of Indigency',
      'barangay_residency': 'Barangay Residency',
      'barangay_medico_legal': 'Medico-Legal Request',
      'barangay_cohabitation': 'Cohabitation Certificate',
      'barangay_death': 'Death Certification',
      'barangay_guardianship': 'Guardianship Certificate'
    };
    return labels[type] || type?.replace(/_/g, ' ').toUpperCase();
  };

  const getTypeColor = (type) => {
    const colors = {
      'barangay_clearance': 'bg-blue-600',
      'certificate_of_indigency': 'bg-emerald-600',
      'barangay_residency': 'bg-orange-600',
      'barangay_medico_legal': 'bg-rose-600',
      'barangay_cohabitation': 'bg-pink-600',
      'barangay_death': 'bg-gray-900',
      'barangay_guardianship': 'bg-indigo-600'
    };
    return colors[type] || 'bg-blue-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const openPickupVerification = (certificate) => {
    setConfirmingCertificate(certificate);
    setPickupName(certificate.full_name || certificate.applicant_name || '');
    setIsConfirmModalOpen(true);
  };

  const openSendCertificate = (certificate) => {
    setSendCertificate(certificate);
    setIsSendModalOpen(true);
  };

  const handleSendCertificate = async (certificate) => {
    const email = certificate.email || certificate.residents?.email;
    if (!email?.trim()) {
      toast.error('No email address found for this requestor.');
      return;
    }

    setSendingEmail(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/certificates/${certificate.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Certificate sent successfully');
        setIsSendModalOpen(false);
        setSendCertificate(null);
      } else {
        toast.error(data.message || 'Failed to send certificate');
      }
    } catch (error) {
      console.error('Send certificate error:', error);
      toast.error('Failed to send certificate. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(cert.status) : cert.status === statusFilter);

    const matchesType = typeFilter === 'all' || cert.certificate_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get statistics
  const stats = {
    readyForPickup: certificates.filter(c => ['ready', 'ready_for_pickup'].includes(c.status)).length,
    released: certificates.filter(c => c.status === 'released').length,
    totalProcessed: certificates.filter(c => ['ready', 'ready_for_pickup', 'released'].includes(c.status)).length
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Statistics Cards (3 columns on both mobile & desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-6 text-white shadow-md sm:shadow-lg shadow-emerald-200 border border-emerald-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-[8px] sm:text-[10px] uppercase font-black tracking-wider sm:tracking-[0.2em] mb-0.5 sm:mb-1 truncate">Ready for Pickup</p>
            <p className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">{stats.readyForPickup}</p>
            <div className="mt-1 sm:mt-3 flex items-center gap-1">
              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase truncate">Priority</span>
            </div>
          </div>
          <Package className="hidden sm:block absolute -bottom-4 -right-4 w-20 h-20 text-white/10 -rotate-12 pointer-events-none" />
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-6 text-white shadow-md sm:shadow-lg shadow-blue-200 border border-blue-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-[8px] sm:text-[10px] uppercase font-black tracking-wider sm:tracking-[0.2em] mb-0.5 sm:mb-1 truncate">Total Released</p>
            <p className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">{stats.released}</p>
            <div className="mt-1 sm:mt-3 flex items-center gap-1">
              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase truncate">Released</span>
            </div>
          </div>
          <CheckCircle className="hidden sm:block absolute -bottom-4 -right-4 w-20 h-20 text-white/10 -rotate-12 pointer-events-none" />
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-6 text-white shadow-md sm:shadow-lg shadow-gray-200 border border-gray-700/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-black tracking-wider sm:tracking-[0.2em] mb-0.5 sm:mb-1 truncate">Success Rate</p>
            <p className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">{stats.totalProcessed > 0 ? Math.round((stats.released / stats.totalProcessed) * 100) : 0}%</p>
            <div className="mt-1 sm:mt-3 flex items-center gap-1">
              <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase truncate">Efficiency</span>
            </div>
          </div>
          <Activity className="hidden sm:block absolute -bottom-4 -right-4 w-20 h-20 text-white/5 -rotate-12 pointer-events-none" />
        </div>
      </div>

      {/* Filters & Actions Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2.5 sm:p-4">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-4 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ready')}
              className={`flex-1 sm:flex-initial justify-center px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center gap-1.5 ${statusFilter === 'ready'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Ready ({stats.readyForPickup})</span>
            </button>
            <button
              onClick={() => setStatusFilter('released')}
              className={`flex-1 sm:flex-initial justify-center px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center gap-1.5 ${statusFilter === 'released'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Released ({stats.released})</span>
            </button>
          </div>

          {/* Search, Type & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-0 md:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reference, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Type Filter */}
            <div className="relative shrink-0">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700 cursor-pointer outline-none"
              >
                <option value="all">All Types</option>
                <option value="barangay_clearance">Clearance</option>
                <option value="certificate_of_indigency">Indigency</option>
                <option value="barangay_residency">Residency</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Records"
              className="p-2 sm:px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading certificates...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No certificates found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter === 'ready'
                ? 'No certificates are currently ready for pickup'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Touch-Friendly Certificate Cards (block md:hidden) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredCertificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="p-3.5 bg-white transition-all active:bg-gray-50 space-y-2.5"
                >
                  {/* Top Row: Ref number & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 truncate">
                      {certificate.reference_number}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusColor(
                        certificate.status
                      )}`}
                    >
                      {certificate.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Middle Row: Applicant */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight truncate">
                        {certificate.applicant_name || certificate.full_name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                        {certificate.contact_number || "No contact recorded"}
                      </p>
                    </div>
                  </div>

                  {/* Type and Date */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${getTypeColor(
                          certificate.certificate_type
                        )}`}
                      ></div>
                      <span className="font-semibold text-gray-700 truncate">
                        {getTypeLabel(certificate.certificate_type)}
                      </span>
                    </div>
                    <span className="text-gray-400 font-mono text-[10px] shrink-0">
                      {formatDate(certificate.updated_at)}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedCertificate(certificate)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>

                    {["ready", "ready_for_pickup"].includes(certificate.status) &&
                      (certificate.email || certificate.residents?.email) && (
                        <button
                          onClick={() => openSendCertificate(certificate)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </button>
                      )}

                    {["ready", "ready_for_pickup"].includes(certificate.status) && (
                      <button
                        onClick={() => openPickupVerification(certificate)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Release
                      </button>
                    )}

                    {certificate.status === "released" && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200">
                        PICKED UP
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: High-Density Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Reference
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Date Updated
                    </th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr
                      key={certificate.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-sans font-black text-blue-600 scale-110 inline-block tracking-tighter">
                          {certificate.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 uppercase text-[13px] tracking-tight">
                              {certificate.applicant_name ||
                                certificate.full_name}
                            </p>
                            <p className="text-[11px] font-sans font-bold text-gray-400 tracking-tighter">
                              {certificate.contact_number ||
                                "NO CONTACT RECORDED"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getTypeColor(
                              certificate.certificate_type
                            )} ring-4 ring-gray-50`}
                          ></div>
                          <span className="text-[12px] font-extrabold text-gray-700 uppercase tracking-tight">
                            {getTypeLabel(certificate.certificate_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${getStatusColor(
                            certificate.status
                          )}`}
                        >
                          {certificate.status?.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase font-sans">
                          {formatDate(certificate.updated_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedCertificate(certificate)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {["ready", "ready_for_pickup"].includes(
                            certificate.status
                          ) &&
                            (certificate.email ||
                              certificate.residents?.email) && (
                              <button
                                onClick={() => openSendCertificate(certificate)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1.5 text-[11px] shadow-sm transition-all active:scale-95"
                                title="Send Certificate to Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Email
                              </button>
                            )}

                          {["ready", "ready_for_pickup"].includes(
                            certificate.status
                          ) && (
                            <button
                              onClick={() =>
                                openPickupVerification(certificate)
                              }
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-1.5 text-[11px] shadow-sm transition-all active:scale-95"
                              title="Confirm Pickup"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Release
                            </button>
                          )}

                          {certificate.status === "released" && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                              PICKED UP
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Certificate Details Modal */}
      {selectedCertificate && (
        <CertificateDetailsModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          getStatusColor={getStatusColor}
          getTypeLabel={getTypeLabel}
          formatDate={formatDate}
          openPickupVerification={() => openPickupVerification(selectedCertificate)}
          handleManualRelease={handleManualRelease}
        />
      )}

      {/* Send Certificate Modal */}
      {isSendModalOpen && sendCertificate && (
        <SendCertificateModal
          certificate={sendCertificate}
          onClose={() => { setIsSendModalOpen(false); setSendCertificate(null); }}
          onConfirm={handleSendCertificate}
          sending={sendingEmail}
        />
      )}

      {/* Pickup Confirmation Modal */}
      {isConfirmModalOpen && confirmingCertificate && (
        <ConfirmPickupModal
          certificate={confirmingCertificate}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleManualRelease}
          pickupName={pickupName}
          setPickupName={setPickupName}
          confirming={confirmingPickup}
          getTypeLabel={getTypeLabel}
        />
      )}
    </div>
  );
}

PickupManagementPage.getLayout = (page) => (
  <Layout title="Certificate Pickup Management" subtitle="Manage certificate pickups and verification">
    {page}
  </Layout>
);

// Certificate Details Modal Component
function CertificateDetailsModal({ certificate, onClose, getStatusColor, getTypeLabel, formatDate, openPickupVerification, handleManualRelease }) {
  useScrollLock(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96dvh] sm:max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 border-b-4 border-amber-400 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-[0.25em] mb-0.5">Republic of the Philippines · {getTypeLabel(certificate.certificate_type)}</p>
                <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight leading-none">Certificate Details</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
            {/* Status Information */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border shadow-sm ${getStatusColor(certificate.status)}`}>
                    {certificate.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Certificate Type</span>
                  <span className="text-xs sm:text-sm text-slate-900 font-bold uppercase tracking-tight block truncate">{getTypeLabel(certificate.certificate_type)}</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Reference No.</p>
                  <p className="text-xs sm:text-sm font-mono font-bold text-blue-600 truncate">{certificate.reference_number}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Date Updated</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{formatDate(certificate.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Applicant Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                <div className="border-l-4 border-slate-700 pl-3 mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-slate-600" />
                    Applicant Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Full Name</p>
                    <p className="font-bold text-slate-900 uppercase text-sm sm:text-base tracking-tight">{certificate.applicant_name || certificate.full_name || 'NOT RECORDED'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Contact Number</p>
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm font-sans">{certificate.contact_number || 'NOT RECORDED'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Age / Sex</p>
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm uppercase">{certificate.age || '-'} / {certificate.sex || '-'}</p>
                  </div>
                  {(certificate.email || certificate.residents?.email) && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Email Address</p>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">{certificate.email || certificate.residents?.email}</p>
                    </div>
                  )}
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Residential Address</p>
                    <p className="font-medium text-slate-800 text-xs sm:text-sm uppercase leading-relaxed">{certificate.address || 'NOT RECORDED'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Purpose */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm h-full flex flex-col">
                  <div className="border-l-4 border-slate-700 pl-3 mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-slate-600" />
                      Request Purpose
                    </h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-800 font-medium uppercase leading-relaxed border-l-2 border-slate-200 pl-3 py-1.5 italic bg-slate-50 rounded-r-lg">
                      {certificate.purpose || 'NOT SPECIFIED'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Instructions */}
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <div className="bg-amber-50/75 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1.5">
                      Official Release Instructions
                    </h3>
                    <ul className="text-xs text-amber-900 space-y-1.5 font-medium uppercase tracking-tight">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span> Ready for collection at the barangay office</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span> Verify valid government-issued ID of receiver</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span> Mark as "Confirmed" to close this transaction</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 active:scale-95 transition-all text-center"
            >
              Close
            </button>
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <button
                onClick={openPickupVerification}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:bg-emerald-700 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Release
              </button>
            )}
          </div>
        </div>
    </div>
  );
}

// Confirm Pickup Modal Component
function ConfirmPickupModal({ certificate, onClose, onConfirm, pickupName, setPickupName, confirming, getTypeLabel }) {
  useScrollLock(true);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Confirm Release</h3>
                <p className="text-emerald-100/80 font-semibold text-[10px] uppercase tracking-wide">Final Status Update</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Certificate Info - Compact */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mb-1">Ref No.</p>
                  <p className="text-lg font-sans font-black text-emerald-900 tracking-tight truncate">{certificate.reference_number}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wide shrink-0">
                  {getTypeLabel(certificate.certificate_type).split(' ')[0]}
                </span>
              </div>

              <div className="border-t border-emerald-100 pt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-bold uppercase text-[9px] tracking-wider">Applicant</span>
                  <span className="font-black text-slate-800 uppercase text-[11px] truncate max-w-[200px]">
                    {certificate.applicant_name || certificate.full_name || certificate.residents?.full_name || 'N/A'}
                  </span>
                </div>
                {certificate.purpose && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-bold uppercase text-[9px] tracking-wider">Purpose</span>
                    <span className="font-bold text-slate-700 uppercase text-[10px] truncate max-w-[200px]">{certificate.purpose}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                Claimed By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
                placeholder="Enter full name of claimant"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all uppercase"
                autoFocus
              />
              <p className="text-[9px] text-slate-500 font-medium italic">
                * If claimed by representative, enter authorization details in notes
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-800 leading-tight space-y-0.5">
                <p className="font-bold uppercase tracking-wider">Irreversible Action</p>
                <p className="text-amber-700/90 font-medium">This will finalize the request lifecycle and mark the physical copy as issued.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={confirming}
              className="px-4 py-2 text-xs font-black text-slate-600 uppercase tracking-wider hover:bg-slate-200/60 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirming || !pickupName.trim()}
              className="px-5 py-2 text-xs font-black text-white uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Releasing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm Release</span>
                </>
              )}
            </button>
          </div>
        </div>
    </div>
  );
}

// Send Certificate Modal Component
function SendCertificateModal({ certificate, onClose, onConfirm, sending }) {
  useScrollLock(true);
  const email = certificate.email || certificate.residents?.email;
  const name = certificate.applicant_name || certificate.full_name || certificate.residents?.full_name || 'Applicant';
  const type = certificate.certificate_type?.replace(/_/g, ' ').toUpperCase() || 'CERTIFICATE';
  const ref = certificate.reference_number || certificate.id;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[96dvh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Send Certificate</h3>
              <p className="text-blue-100/80 font-semibold text-[10px] uppercase tracking-wide">Email Preview</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-blue-600 uppercase font-black tracking-widest mb-1">Ref No.</p>
                <p className="text-lg font-sans font-black text-blue-900 tracking-tight truncate">{ref}</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wide shrink-0">
                {type.split(' ')[0]}
              </span>
            </div>

            <div className="pt-3 border-t border-blue-200 space-y-2">
              <div>
                <p className="text-[9px] text-blue-600 uppercase font-black tracking-widest mb-1">Applicant</p>
                <p className="text-base font-black text-blue-900 uppercase tracking-tight leading-tight">{name}</p>
              </div>
              <div>
                <p className="text-[9px] text-blue-600 uppercase font-black tracking-widest mb-1">Recipient Email</p>
                <p className="text-sm font-black text-blue-900 break-all">{email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 px-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
              This will send a "certificate ready" email to the address above. Make sure the email is correct.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-gray-50 active:scale-95 transition-all"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(certificate)}
              disabled={sending || !email?.trim()}
              className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Certificate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

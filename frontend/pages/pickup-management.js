import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  FileCheck, Search, Eye, Calendar, User, Phone, MapPin,
  Shield, Clock, CheckCircle, AlertTriangle, QrCode,
  ExternalLink, RefreshCw, Package, History, XCircle, X, ChevronDown, ShieldCheck, Heart, FileText, Skull, Activity
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

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
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Pickup Management</h1>
            <p className="text-gray-500 mt-1">Manage certificate pickups and verification</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 border border-emerald-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-100 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Ready for Pickup</p>
              <p className="text-4xl font-black tracking-tighter">{stats.readyForPickup}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-black uppercase">Active Priority</span>
              </div>
            </div>
            <Package className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 -rotate-12" />
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 border border-blue-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Total Released</p>
              <p className="text-4xl font-black tracking-tighter">{stats.released}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-black uppercase">Completed Tasks</span>
              </div>
            </div>
            <CheckCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 -rotate-12" />
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg shadow-gray-200 border border-gray-700/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Success Rate</p>
              <p className="text-4xl font-black tracking-tighter">{stats.totalProcessed > 0 ? Math.round((stats.released / stats.totalProcessed) * 100) : 0}%</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">Efficiency Index</span>
              </div>
            </div>
            <Activity className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 -rotate-12" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <Package className="w-4 h-4" />
                Ready ({stats.readyForPickup})
              </button>
              <button
                onClick={() => setStatusFilter('released')}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'released'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                Released ({stats.released})
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48 text-sm"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="barangay_clearance">Clearance</option>
                  <option value="certificate_of_indigency">Indigency</option>
                  <option value="barangay_residency">Residency</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Updated</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-black text-blue-600 scale-110 inline-block tracking-tighter">{certificate.reference_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 uppercase text-[13px] tracking-tight">{certificate.applicant_name || certificate.full_name}</p>
                            <p className="text-[11px] font-mono font-bold text-gray-400 tracking-tighter">{certificate.contact_number || 'NO CONTACT RECORDED'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(certificate.certificate_type)} ring-4 ring-gray-50`}></div>
                          <span className="text-[12px] font-extrabold text-gray-700 uppercase tracking-tight">{getTypeLabel(certificate.certificate_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${getStatusColor(certificate.status)}`}>
                          {certificate.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12px] text-gray-600 font-black uppercase tracking-tight flex items-center gap-1.5">
                          {certificate.status === 'released' ? (
                            <><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> CLOSED</>
                          ) : (
                            <><Clock className="w-3.5 h-3.5 text-blue-500" /> PENDING RELEASE</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase font-mono">
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

                          {['ready', 'ready_for_pickup'].includes(certificate.status) && (
                            <button
                              onClick={() => openPickupVerification(certificate)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95"
                              title="Confirm Pickup"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm Pickup
                            </button>
                          )}

                          {certificate.status === 'released' && (
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
    </Layout>
  );
}

// Certificate Details Modal Component
function CertificateDetailsModal({ certificate, onClose, getStatusColor, getTypeLabel, formatDate, openPickupVerification, handleManualRelease }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl border border-white/20">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Certificate Details</h2>
                <p className="text-blue-100/80 font-mono text-[11px] font-bold tracking-widest">{certificate.reference_number}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] space-y-6">
            {/* Status Information */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${getStatusColor(certificate.status)}`}>
                  {certificate.status?.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-[12px] text-gray-900 font-extrabold uppercase tracking-tight">{getTypeLabel(certificate.certificate_type)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-white px-2.5 py-1 rounded-lg border border-gray-100 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(certificate.updated_at)}</span>
              </div>
            </div>

            {/* Applicant Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="border-l-4 border-blue-600 pl-3 mb-5">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                    <User className="w-4 h-4 text-blue-500" />
                    Applicant Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Full Name</p>
                    <p className="font-extrabold text-gray-900 uppercase text-[15px] tracking-tight">{certificate.applicant_name || certificate.full_name || 'NOT RECORDED'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Contact Number</p>
                    <p className="font-black text-gray-900 text-[13px] font-mono tracking-tighter">{certificate.contact_number || 'NOT RECORDED'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Age / Sex</p>
                    <p className="font-black text-gray-900 text-[13px] uppercase">{certificate.age || '-'} / {certificate.sex || '-'}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Residential Address</p>
                    <p className="font-bold text-gray-800 text-[13px] uppercase leading-relaxed">{certificate.address || 'NOT RECORDED'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Purpose */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full flex flex-col">
                  <div className="border-l-4 border-indigo-500 pl-3 mb-5">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                      <FileCheck className="w-4 h-4 text-indigo-500" />
                      Request Purpose
                    </h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-800 font-bold uppercase leading-loose border-l-2 border-gray-100 pl-4 py-2 italic bg-gray-50/50 rounded-r-lg">
                      {certificate.purpose || 'NOT SPECIFIED'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Instructions */}
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-900 text-[11px] uppercase tracking-[0.2em] mb-2">
                      Official Release Instructions
                    </h3>
                    <ul className="text-[12px] text-emerald-800 space-y-2 font-bold uppercase tracking-tight">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Ready for collection at the barangay office</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Verify valid government-issued ID of receiver</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Mark as "Confirmed" to close this transaction</li>
                    </ul>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle className="w-20 h-20 text-emerald-600" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 px-6 py-4 pb-6 flex gap-4 justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-gray-50 active:scale-95 transition-all"
            >
              Close Window
            </button>
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <button
                onClick={openPickupVerification}
                className="px-10 py-3.5 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 hover:bg-emerald-700 transform hover:-translate-y-0.5 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Release
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirm Pickup Modal Component
function ConfirmPickupModal({ certificate, onClose, onConfirm, pickupName, setPickupName, confirming, getTypeLabel }) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl border border-white/20">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Confirm Release</h3>
                <p className="text-emerald-100/80 font-bold text-[10px] uppercase tracking-widest">Final Status Update</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden mb-6">
              <p className="text-[10px] text-emerald-600 uppercase font-black tracking-[0.2em] mb-3">Ref Record No.</p>
              <p className="text-2xl font-mono font-black text-emerald-900 mb-1 tracking-tighter">{certificate.reference_number}</p>
              <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-4">{getTypeLabel(certificate.certificate_type)}</p>

              <div className="pt-4 border-t border-emerald-200/50">
                <p className="text-[10px] text-emerald-600 uppercase font-black tracking-[0.2em] mb-1.5">Official Applicant</p>
                <p className="text-xl font-black text-emerald-900 uppercase tracking-tight leading-none">{certificate.full_name || certificate.applicant_name}</p>
              </div>
              <CheckCircle className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-600 opacity-5" />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] ml-1">
                Name of Person Picking Up *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="ENTER FULL NAME"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-black text-gray-900 uppercase text-sm tracking-tight placeholder:text-gray-300 shadow-inner"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && pickupName.trim() && onConfirm(certificate.id, pickupName)}
                />
              </div>
              <div className="flex items-center gap-2 px-1">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight italic">
                  Always verify the government ID before processing the release.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-gray-50 active:scale-95 transition-all"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(certificate.id, pickupName)}
                disabled={confirming || !pickupName.trim()}
                className="flex-[2] px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 transition-all"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating Systems...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Release
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
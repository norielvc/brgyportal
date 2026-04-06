import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  History, Search, Calendar, User, Clock,
  Smartphone, RefreshCw, Eye, Trash2, Download, CheckCircle, AlertCircle, X,
  MapPin, Activity, HardDrive, Info, Plus, FolderSync
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';

const API_URL = '/api';

// Helper to parse complex QR scan data
const parseQRData = (qrData) => {
  if (!qrData) return { id: 'N/A', name: 'N/A', address: 'N/A', remarks: 'N/A' };

  // If it's a URL, don't try to parse it as structured text
  if (qrData.startsWith('http')) {
    return { id: 'URL', name: 'N/A', address: 'N/A', remarks: 'N/A' };
  }

  // Pattern: ID (HXXXXX-FXXXXX)
  const idMatch = qrData.match(/^H\d{5}-F\d{5}/);
  const id = idMatch ? idMatch[0] : 'N/A';

  let remaining = qrData.replace(id, '').trim();

  // Pattern: Remarks (Starts with GOODS RECD)
  const remarksStart = remaining.indexOf('GOODS RECD');
  let remarks = 'N/A';
  if (remarksStart !== -1) {
    remarks = remaining.substring(remarksStart).trim();
    remaining = remaining.substring(0, remarksStart).trim();
  }

  // Pattern: Address (Starts with SITIO, BLOCK, LOT, PUROK, PHASE, ST.)
  const addressMarkers = ['SITIO', 'BLOCK', 'LOT', 'PUROK', 'PHASE', 'ST.', 'AVE.'];
  let addressStart = -1;
  const upperRemaining = remaining.toUpperCase();

  for (const marker of addressMarkers) {
    const termPos = upperRemaining.indexOf(marker);
    if (termPos !== -1 && (addressStart === -1 || termPos < addressStart)) {
      addressStart = termPos;
    }
  }

  let name = 'N/A';
  let address = 'N/A';

  if (addressStart !== -1) {
    name = remaining.substring(0, addressStart).trim();
    address = remaining.substring(addressStart).trim();
  } else {
    // If no address marker found, might just be name + remarks
    name = remaining || 'N/A';
  }

  return {
    id,
    name: name.replace(/\s+/g, ' '),
    address: address.replace(/\s+/g, ' '),
    remarks
  };
};

export default function QRScanHistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicatesLoading, setDuplicatesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('scans'); // 'scans' or 'duplicates'
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Events API states
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', description: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const [selectedScan, setSelectedScan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteScan = async (id) => {
    try {
      setDeletingId(id);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/qr-scans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Record deleted successfully');
        setIsDeleteConfirmOpen(false);
        setIsViewModalOpen(false);
        loadScans();
        loadStats();
        loadDuplicates();
      } else {
        toast.error(data.error || 'Failed to delete record');
      }
    } catch (err) {
      console.error('Error deleting scan:', err);
      toast.error('System error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadScans();
      loadStats();
      loadDuplicates();
    } else {
      // Clear data if no event is selected
      setScans([]);
      setDuplicates([]);
      setStats({ today: 0, total: 0 });
    }
  }, [currentPage, searchTerm, selectedDate, selectedEventId]);

  const loadEvents = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/scan-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEvents(data.data || []);
        if (data.data && data.data.length > 0 && !selectedEventId) {
           setSelectedEventId(data.data[0].id); // Auto-select first event
        }
      }
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
       setSavingEvent(true);
       const token = getAuthToken();
       const response = await fetch(`${API_URL}/scan-events`, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newEvent)
       });
       const data = await response.json();
       if (data.success) {
          toast.success('Event Created!');
          setNewEvent({ name: '', date: '', description: '' });
          setIsEventModalOpen(false);
          await loadEvents();
          setSelectedEventId(data.data.id);
       } else {
          toast.error('Failed to create event');
       }
    } catch (err) {
       toast.error('System error');
    } finally {
       setSavingEvent(false);
    }
  };

  const loadDuplicates = async () => {
    try {
      if (!selectedEventId) return;
      setDuplicatesLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/qr-scans/duplicates?event_id=${selectedEventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDuplicates(data.data || []);
      } else {
        console.error('Failed to load duplicates');
      }
    } catch (err) {
      console.error('Error loading duplicates:', err);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (!selectedEventId) return;
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/qr-scans/stats?event_id=${selectedEventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadScans = async () => {
    try {
      setLoading(true);
      if (!selectedEventId) {
         setLoading(false);
         return;
      }
      const token = getAuthToken();

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });

      if (searchTerm) params.append('qr_data', searchTerm);
      if (selectedDate) params.append('date', selectedDate);
      params.append('event_id', selectedEventId);

      const response = await fetch(`${API_URL}/qr-scans?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setScans(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError('Failed to load scan history');
      }
    } catch (err) {
      console.error('Error loading scans:', err);
      setError('Error loading scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatQRData = (data) => {
    if (data.length > 50) {
      return data.substring(0, 50) + '...';
    }
    return data;
  };

    const handleClearHistory = async () => {
      try {
        if (!selectedEventId) return;
        setClearing(true);
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/qr-scans?event_id=${selectedEventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Scan history cleared successfully', {
          duration: 5000,
          style: {
            minWidth: '350px',
            padding: '20px',
            borderRadius: '16px',
            background: '#FFFFFF',
            color: '#1F2937',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: '6px solid #EF4444',
            fontWeight: '600'
          }
        });
        loadScans();
        loadStats();
        loadDuplicates();
        setIsClearModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to clear scan history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Error connecting to server. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Household-Family ID', 'Name', 'Address', 'Remarks', 'Raw QR Data', 'Scanner Type', 'User'];
    const csvData = scans.map(scan => {
      const parsed = parseQRData(scan.qr_data);
      return [
        new Date(scan.scan_timestamp).toLocaleDateString(),
        new Date(scan.scan_timestamp).toLocaleTimeString(),
        parsed.id,
        `"${parsed.name.replace(/"/g, '""')}"`,
        `"${parsed.address.replace(/"/g, '""')}"`,
        `"${parsed.remarks.replace(/"/g, '""')}"`,
        `"${scan.qr_data.replace(/"/g, '""')}"`,
        scan.scanner_type,
        scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Event Scans & Relief Operations</h1>
            <p className="text-sm text-gray-500">Manage separate scan databases for each community event</p>
          </div>
        </div>
      </div>

      {/* Event Selection Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 sm:p-6 mb-6">
         <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Active Event Database
               </label>
               <select 
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full text-base font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                  <option value="" disabled>-- Select Event Context --</option>
                  {events.map((evt) => (
                     <option key={evt.id} value={evt.id}>{evt.name} ({new Date(evt.date).toLocaleDateString()})</option>
                  ))}
               </select>
            </div>
            <button 
               onClick={() => setIsEventModalOpen(true)}
               className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
            >
               <Plus className="w-5 h-5" />
               New Event
            </button>
         </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Scans</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Scans</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Scanners</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{scans.length > 0 ? 1 : 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Duplicates</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{duplicates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
              Search QR Data
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan content..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDate('');
              setCurrentPage(1);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all font-bold text-sm border border-gray-200"
          >
            <X className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 font-bold text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadScans}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 font-bold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50">
          <nav className="flex px-2 sm:px-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('scans')}
              className={`flex-1 sm:flex-none py-4 px-4 sm:px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'scans'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
            >
              All Scans
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'scans' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`flex-1 sm:flex-none py-4 px-4 sm:px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'duplicates'
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
            >
              Duplicates
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'duplicates' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                {duplicates.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'scans' ? (
          // Existing scans table
          <div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading scan history...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <p>{error}</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No QR scans found</p>
                <p className="text-sm">Try scanning some QR codes first!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scan Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Household-Family ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Raw Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Scanner Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Scanned By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(scan.scan_timestamp)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {parseQRData(scan.qr_data).id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {parseQRData(scan.qr_data).name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 max-w-[200px] truncate" title={parseQRData(scan.qr_data).address}>
                            {parseQRData(scan.qr_data).address}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-l border-gray-50">
                          <div className="text-xs text-emerald-600 font-semibold italic">
                            {parseQRData(scan.qr_data).remarks}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-gray-400 font-mono bg-gray-50 p-2 rounded truncate max-w-[150px]">
                            {scan.qr_data}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${scan.scanner_type === 'mobile' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {scan.scanner_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-3.5 h-3.5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              {scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedScan(scan);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Duplicates table
          <div>
            {duplicatesLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading duplicate attempts...</p>
              </div>
            ) : duplicates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                <p>No duplicate scan attempts found</p>
                <p className="text-sm">All QR codes have been scanned only once!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Household ID & Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Original Scan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Duplicate Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {duplicates.map((duplicate, index) => (
                      <tr key={index} className="hover:bg-red-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-red-700">{parseQRData(duplicate.qr_data).id}</span>
                            <span className="text-xs text-gray-900 font-medium">{parseQRData(duplicate.qr_data).name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            <div className="font-semibold">{duplicate.original_scan.scanned_by}</div>
                            <div className="text-gray-500">{formatDate(duplicate.original_scan.scan_timestamp)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-900 border-l-2 border-red-200 pl-3">
                            <div className="font-semibold">{duplicate.duplicate_attempt.scanned_by}</div>
                            <div className="text-gray-500">{formatDate(duplicate.duplicate_attempt.scan_timestamp)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase text-center">Blocked</span>
                            <span className="text-[10px] text-gray-500 mt-1">
                              {Math.round(duplicate.time_difference / (1000 * 60))} mins later
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsEventModalOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
              {/* Header with Gradient */}
              <div className="px-8 py-8 bg-gradient-to-r from-indigo-600 to-blue-700 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Create Tracking Event</h3>
                    <p className="text-indigo-100 text-sm font-medium opacity-90">Initialize a new secure scan database</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-8 sm:p-10">
                <form onSubmit={handleCreateEvent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Event Title / Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FolderSync className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        value={newEvent.name}
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold placeholder:text-gray-300 placeholder:font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. Typhoon Relief Operation"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Event Date</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                          type="date"
                          required
                          value={newEvent.date}
                          onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Access Level</label>
                      <div className="w-full px-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 font-bold text-sm flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                         Secure DB Scoping
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Detailed Description (Optional)</label>
                    <textarea
                      value={newEvent.description}
                      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                      rows="4"
                      placeholder="Add specific instructions for scanning staff or relief distribution details..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEventModalOpen(false)}
                      className="flex-1 py-4 text-sm font-bold text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEvent}
                      className="flex-[2] py-4 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {savingEvent ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Initialize Event Database
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Badge */}
              <div className="bg-gray-50 px-10 py-5 border-t border-gray-100 flex items-center lg:justify-between text-center lg:text-left">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                    Multi-Tenant Isolation Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan History Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ display: 'none' }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading scan history...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No QR scans found</p>
            <p className="text-sm">Try scanning some QR codes first!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scan Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanner Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(scan.scan_timestamp)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                        {formatQRData(scan.qr_data)}
                      </div>
                      {scan.qr_data.length > 50 && (
                        <button
                          onClick={() => alert(scan.qr_data)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          View Full Data
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 capitalize">
                          {scan.scanner_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          const details = `
QR Code Data: ${scan.qr_data}
Scan Time: ${formatDate(scan.scan_timestamp)}
Scanner Type: ${scan.scanner_type}
Scanned By: ${scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
Device Info: ${JSON.stringify(scan.device_info, null, 2)}
                            `.trim();
                          alert(details);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Clear History Confirmation Modal */}
      {isClearModalOpen && (
        <ClearHistoryModal
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={handleClearHistory}
          processing={clearing}
        />
      )}

      {/* Scan Details Modal */}
      {isViewModalOpen && selectedScan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Scan Record Details</h3>
                  <p className="text-blue-100 text-xs tracking-tight">Viewing full metadata for Database UUID: {selectedScan.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                disabled={deletingId === selectedScan.id}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Primary Information */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Household-Family ID</label>
                      <div className="text-xl font-mono font-black text-blue-700 flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2.5 animate-pulse"></div>
                        {parseQRData(selectedScan.qr_data).id}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Scanner Type</label>
                      <div className="text-lg font-bold text-gray-800 flex items-center">
                        <Smartphone className="w-5 h-5 text-gray-400 mr-2.5" />
                        <span className="capitalize">{selectedScan.scanner_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Principal Beneficiary Name</label>
                    <div className="text-2xl font-black text-gray-900 flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      {parseQRData(selectedScan.qr_data).name}
                    </div>
                  </div>

                  <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Registered Address</label>
                    <div className="text-base font-semibold text-gray-700 flex items-start">
                      <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
                        <MapPin className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="pt-2">
                        {parseQRData(selectedScan.qr_data).address}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Audit & Secondary Details */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-emerald-50 p-7 rounded-3xl border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full -mr-12 -mt-12"></div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-3">Status/Remarks</label>
                    <p className="text-base font-bold italic text-emerald-800 leading-relaxed">
                      "{parseQRData(selectedScan.qr_data).remarks}"
                    </p>
                  </div>

                  <div className="bg-gray-50/80 p-7 rounded-3xl border border-gray-200">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Scan Timestamp</label>
                          <p className="text-sm font-bold text-gray-900">{new Date(selectedScan.scan_timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Authorized Staff</label>
                          <p className="text-sm font-bold text-gray-900">{selectedScan.users ? `${selectedScan.users.first_name} ${selectedScan.users.last_name}` : 'Unknown'}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{selectedScan.users?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-orange-50/30 rounded-3xl border border-orange-100">
                    <label className="text-[10px] font-bold text-orange-700 uppercase tracking-widest block mb-2 flex items-center">
                      <Info className="w-3 h-3 mr-1" />
                      Device Platform
                    </label>
                    <p className="text-[10px] font-mono text-gray-500 line-clamp-2">
                      {selectedScan.device_info?.userAgent || 'No Agent Detected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw Data Section */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Complete Encoded Payload</label>
                <div className="bg-gray-900 text-blue-300 p-6 rounded-3xl font-mono text-xs leading-relaxed break-all shadow-inner relative group">
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase text-white backdrop-blur-md border border-white/20">SHA-256 Verified Scan</span>
                  </div>
                  {selectedScan.qr_data}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-7 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={deletingId === selectedScan.id}
                className="w-full sm:w-auto px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center space-x-2 border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setIsViewModalOpen(false)}
                disabled={deletingId === selectedScan.id}
                className="w-full sm:w-auto px-12 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Custom Delete Confirmation Modal */}
      {
        isDeleteConfirmOpen && selectedScan && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm shadow-red-200/50">
                  <Trash2 className="w-10 h-10 text-red-600 animate-bounce" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Delete Scan Record?</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  This action is permanent. Information for <span className="text-gray-900 font-bold">{parseQRData(selectedScan.qr_data).name || 'this scan'}</span> will be removed from the history logs.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleDeleteScan(selectedScan.id)}
                    disabled={deletingId === selectedScan.id}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-base hover:bg-red-700 transition-all active:scale-[0.98] shadow-xl shadow-red-600/20 flex items-center justify-center"
                  >
                    {deletingId === selectedScan.id ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Yes, Confirm Delete"
                    )}
                  </button>

                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    disabled={deletingId === selectedScan.id}
                    className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-base hover:bg-gray-100 transition-all active:scale-[0.98]"
                  >
                    Keep Record
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 py-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                  Authorized Admin Action Only
                </p>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}

QRScanHistoryPage.getLayout = (page) => (
  <Layout>
    {page}
  </Layout>
);

// Clear History Confirmation Modal Component
function ClearHistoryModal({ onClose, onConfirm, processing }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
          <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Scan Records
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Are you absolutely sure?</h4>
                <p className="text-gray-500 mt-2">
                  This action will permanently delete <span className="font-bold text-red-600">ALL scan records</span>.
                  This data cannot be recovered once deleted.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={processing}
                className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete All
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
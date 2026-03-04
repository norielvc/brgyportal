import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  FileText, Search, Eye, CheckCircle, XCircle, RotateCcw,
  Clock, User, Calendar, ChevronDown, X, AlertTriangle,
  FileCheck, History, Filter, Shield, Printer, Download, PenTool, ShieldAlert, Info, Edit, Save, RefreshCw, Database,
  Skull, Activity, Heart, Phone, MessageCircle, MapPin, Home, ShieldCheck, Users
} from 'lucide-react';
import { getAuthToken, getUserData } from '@/lib/auth';
import Modal from '@/components/UI/Modal';
import SignaturePad from '@/components/UI/SignaturePad';
// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [historyGroup, setHistoryGroup] = useState('all'); // 'all', 'active', 'closed'
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'all'
  const [totalCount, setTotalCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // Pickup Verification State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupName, setPickupName] = useState('');

  const [userSignature, setUserSignature] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);

  // Fetch history when selectedRequest changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedRequest) {
        setRequestHistory([]);
        return;
      }

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/workflow-assignments/history/${selectedRequest.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setRequestHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, [selectedRequest]);

  // Load current user, workflows, and then requests
  useEffect(() => {
    const user = getUserData();
    setCurrentUser(user);

    const initializeData = async () => {
      // 1. Load workflows first so isUserAssignedToRequest has the data it needs to perform Smart Merge
      let loadedWorkflows = null;
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/workflows`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          loadedWorkflows = data.data;
          setWorkflows(data.data);
        }
      } catch (error) {
        console.log('Could not load workflows from API:', error);
      }

      // Fallback to localStorage if API fails
      if (!loadedWorkflows) {
        const savedWorkflows = localStorage.getItem('certificateWorkflows');
        if (savedWorkflows) {
          loadedWorkflows = JSON.parse(savedWorkflows);
          setWorkflows(loadedWorkflows);
        } else {
          loadedWorkflows = {}; // prevent crash
        }
      }

      // 2. Fetch User Signatures
      fetchUserSignature();

      // 3. Now fetch requests (passing the loaded workflows so the Smart Merge works immediately)
      await fetchRequests(loadedWorkflows, user);
    };

    initializeData();
  }, []);

  const fetchUserSignature = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/user/signatures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.signatures && data.signatures.length > 0) {
        // Find default or use the first one
        const defaultSig = data.signatures.find(s => s.id === data.defaultSignatureId) || data.signatures[0];
        setUserSignature(defaultSig.signatureData);
      }
    } catch (error) {
      console.error('Error fetching user signature:', error);
    }
  };

  // Re-fetch requests when view mode changes
  useEffect(() => {
    if (currentUser && workflows) {
      fetchRequests(workflows, currentUser);
    }
  }, [viewMode]);

  const fetchRequests = async (activeWorkflows = workflows, activeUser = currentUser) => {
    setLoading(true);
    try {
      const token = getAuthToken();

      // Always fetch BOTH or at least counts to keep badges accurate
      // 1. Fetch My Assignments
      const assignedRes = await fetch(`${API_URL}/workflow-assignments/my-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assignedData = await assignedRes.json();
      const myAssigned = assignedData.success ? (assignedData.certificates || []) : [];

      // 2. Fetch All Requests
      const allRes = await fetch(`${API_URL}/certificates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allRes.json();
      const allCertificates = allData.success ? (allData.certificates || []) : [];
      setTotalCount(allCertificates.length);

      // 3. Smart Merge: Always calculate total assignments to keep the badge universally accurate
      const combined = [...myAssigned];

      // Find items in 'allCertificates' that user is assigned to but aren't in 'myAssigned' already
      allCertificates.forEach(cert => {
        const alreadyIn = combined.some(c => c.id === cert.id || c.reference_number === cert.reference_number);
        if (!alreadyIn && isUserAssignedToRequest(cert, activeWorkflows, activeUser)) {
          combined.push(cert);
        }
      });

      // Sort combined list by newest activity first so fallbacks appear at the top too!
      combined.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      });

      // ALWAYS set the accurate assigned count
      setAssignedCount(combined.length);

      // 4. Set the active requests list based on viewMode
      if (viewMode === 'assigned') {
        setRequests(combined);
      } else {
        setRequests(allCertificates);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setHistoryGroup('all');
    setTimeRange('all');
    setDateRange({ start: '', end: '' });
  };

  // Handle Deep Linking from URL
  useEffect(() => {
    if (router.query.id && requests.length > 0 && !selectedRequest) {
      const target = requests.find(r => r.id === router.query.id);
      if (target) {
        setSelectedRequest(target);
      }
    }
  }, [router.query.id, requests]);

  // Check if current user is assigned to approve a request at its current step
  const isUserAssignedToRequest = (request, activeWorkflows = workflows, activeUser = currentUser) => {
    if (!activeUser) return false;
    if (activeUser.role === 'admin') return true;

    // Use the workflow_assignment data attached by the backend if available
    if (request.workflow_assignment) {
      const assignedId = request.workflow_assignment.assigned_user_id || request.workflow_assignment.userId;
      const currentUserId = activeUser._id || activeUser.id;
      return String(assignedId) === String(currentUserId);
    }

    // Fallback: Check based on current status and global workflows
    // 1. Trust explicit backend assignment if available
    if (request.workflow_assignment && String(request.workflow_assignment.assigned_user_id) === String(activeUser._id || activeUser.id)) {
      return true;
    }

    // 2. Fallback to manual check based on current workflows
    if (!activeWorkflows) return false;
    const workflowSteps = activeWorkflows[request.certificate_type] || Object.values(activeWorkflows)[0];
    if (!workflowSteps) return false;

    let currentStep;
    const s = (request.status || '').toLowerCase();

    if (['staff_review', 'staff review', 'pending', 'returned', 'submitted'].some(status => s.includes(status))) {
      currentStep = workflowSteps.find(step => step.status === 'staff_review');
    } else if (['oic_review', 'oic review', 'ready', 'ready_for_pickup', 'ready for pickup'].some(status => s.includes(status))) {
      currentStep = workflowSteps.find(step => step.status === 'oic_review');
    } else if (s.includes('captain')) {
      currentStep = workflowSteps.find(step => step.status === 'captain_approval');
    } else if (s.includes('secretary')) {
      currentStep = workflowSteps.find(step => step.status === 'secretary_approval');
    } else if (s.includes('processing')) {
      // Find the first step that requires approval and isn't staff/oic
      currentStep = workflowSteps.find(step =>
        step.requiresApproval &&
        step.status !== 'staff_review' &&
        step.status !== 'oic_review'
      );
    }

    // 3. Precise Workflow Check
    if (!currentStep) return false;
    const userId = activeUser._id || activeUser.id;
    return (currentStep.assignedUsers || []).some(id => String(id) === String(userId));
  };

  // Get the current workflow step for a request
  const getCurrentWorkflowStep = (request) => {
    // 🛡️ ENFORCED SEQUENTIAL FLOW: Initial requests ALWAYS go to the first step
    const currentStatus = (request.status || 'pending').toLowerCase();
    const workflowSteps = workflows[request.certificate_type] || Object.values(workflows)[0];

    if (workflowSteps && Array.isArray(workflowSteps) && ['pending', 'submitted', 'staff_review', 'returned'].includes(currentStatus)) {
      return workflowSteps[0];
    }

    // 1. Prioritize explicit assignment data from the backend
    if (request.workflow_assignment && request.workflow_assignment.step_name) {
      const step = workflowSteps.find(s => s.name === request.workflow_assignment.step_name);
      return step || { name: request.workflow_assignment.step_name };
    }

    // 2. Fallback to status-based search
    // Note: workflowSteps and currentStatus are already defined above

    // Special case: if processing, we might be at secretary or captain
    // This part is hard to guess without assignment data, but we look for the first step
    // that is NOT staff_review and not oic_review
    if (currentStatus === 'processing') {
      const activeStep = workflowSteps.find(s =>
        s.status !== 'staff_review' &&
        s.status !== 'oic_review' &&
        s.requiresApproval
      );
      return activeStep || workflowSteps[1] || null;
    }

    // Find the step that matches the current status
    const matchingStep = workflowSteps.find(s =>
      s.status?.toLowerCase() === currentStatus ||
      s.name?.toLowerCase().includes(currentStatus.replace('_', ' '))
    );

    return matchingStep || workflowSteps[0] || null;
  };

  // Check if user can take action on request
  const canUserTakeAction = (request) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return isUserAssignedToRequest(request);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'staff_review': 'bg-green-100 text-green-800 border-green-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'under_review': 'bg-purple-100 text-purple-800 border-purple-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
      'oic_review': 'bg-indigo-100 text-indigo-800 border-indigo-200', // Color for Releasing Team step
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'ready': 'bg-green-100 text-green-800 border-green-200',
      'ready_for_pickup': 'bg-green-100 text-green-800 border-green-200',
      'released': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type) => {
    if (!type) return 'N/A';
    const s = String(type).toLowerCase().trim().replace(/[-_ ]/g, '_');

    // Precise matches
    if (s.includes('natural_death')) return 'Natural Death Certificate';
    if (s.includes('clearance')) return 'Barangay Clearance';
    if (s.includes('indigency')) return 'Certificate of Indigency';
    if (s.includes('residency')) return 'Barangay Residency';
    if (s.includes('cohabitation')) return 'Co-habitation Certificate';
    if (s.includes('same_person') || s.includes('same person')) return 'Certification of Same Person';
    if (s.includes('business_permit')) return 'Business Permit';

    // Fallback: remove all underscores/dashes and capitalize
    return String(type)
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const getTypeColor = (type) => {
    const s = String(type || '').toLowerCase();
    if (s.includes('death')) return 'bg-gray-800';
    if (s.includes('clearance')) return 'bg-blue-500';
    if (s.includes('indigency')) return 'bg-green-500';
    if (s.includes('residency')) return 'bg-orange-500';
    if (s.includes('business')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleAction = (request, action) => {
    // ⚡ DIRECT ACTION: Skip modal for "Ready to Pickup" (OIC approve)
    if (action === 'approve' && request.status === 'oic_review') {
      submitAction(null, request, action);
      return;
    }

    // 📦 PICKUP MODAL: Show specialized pickup modal for final release
    if (action === 'approve' && ['ready', 'ready_for_pickup'].includes(request.status)) {
      setSelectedRequest(request);
      setPickupName(request.applicant_name || request.full_name || '');
      setShowPickupModal(true);
      return;
    }

    setSelectedRequest(request);
    setActionType(action);
    setActionComment('');
    setShowActionModal(true);
  };

  const handlePickupConfirm = async () => {
    if (!pickupName.trim()) return;

    // Process release via the specialized pickup comment
    const comment = `Manually released to: ${pickupName}`;
    await submitAction(null, selectedRequest, 'approve', comment);

    setShowPickupModal(false);
    setPickupName('');
  };

  const getNextStatus = (currentStatus, action, request) => {
    if (action === 'reject') return 'rejected';
    if (action === 'return') return 'returned'; // Return to Review Team as 'Returned'

    // For approve action, move to next workflow step
    if (action === 'approve') {
      const workflowSteps = workflows[request.certificate_type];

      // Status progression:
      const statusFlow = {
        'pending': 'processing',
        'staff_review': 'processing',
        'returned': 'processing', // Returned requests go to processing (or next step) when approved
        'submitted': 'processing',
        'processing': 'oic_review', // After Captain, go to OIC
        'oic_review': 'ready',      // After OIC, go to Ready
        'approved': 'released',
        'ready': 'released',
        'ready_for_pickup': 'released'
      };

      return statusFlow[currentStatus] || 'ready';
    }

    if (action === 'reject') return 'cancelled';
    if (action === 'return') return 'returned';

    return 'ready';
  };

  const submitAction = async (signatureData = null, overrideRequest = null, overrideAction = null, overrideComment = null) => {
    const req = overrideRequest || selectedRequest;
    const act = overrideAction || actionType;
    if (!req || !act) return;

    setProcessing(true);
    try {
      const token = getAuthToken();
      const newStatus = getNextStatus(req.status, act, req);

      let url = `${API_URL}/certificates/${req.id}/status`;
      let method = 'PUT';
      let body = {
        status: newStatus,
        comment: (overrideComment !== undefined && overrideComment !== null) ? overrideComment : (overrideAction ? '' : actionComment),
        action: act,
        approvedBy: currentUser?.email,
        signatureData: signatureData
      };

      // If this is a workflow assignment, use the assignment-specific endpoint
      if (req.workflow_assignment) {
        url = `${API_URL}/workflow-assignments/${req.workflow_assignment.id}/status`;
        body = {
          action: act,
          comment: (overrideComment !== undefined && overrideComment !== null) ? overrideComment : (overrideAction ? '' : actionComment),
          signatureData: signatureData
        };
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        // Use actual status from backend if available (workflow returns newStatus, regular returns data.status)
        const confirmedStatus = data.newStatus || data.data?.status || newStatus;

        setRequests(prev => prev.map(r =>
          r.id === req.id ? { ...r, status: confirmedStatus } : r
        ));

        // Update selected request in-place if it matches, so the details modal stays current
        setSelectedRequest(prev => prev && prev.id === req.id ? { ...prev, status: confirmedStatus } : prev);

        setShowActionModal(false);
        setShowPickupModal(false);

        // Wipe selected request only if it wasn't a direct action in the details modal
        if (!overrideAction) {
          setSelectedRequest(null);
        }
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const submitNote = async (note) => {
    if (!selectedRequest || !note.trim()) return;

    try {
      const token = getAuthToken();

      // Use history endpoint to insert a note/comment (we'll implement this backend route shortly)
      // Or use a dedicated endpoint
      const response = await fetch(`${API_URL}/workflow-assignments/add-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          requestType: selectedRequest.certificate_type,
          comment: note,
          stepId: selectedRequest.workflow_assignment?.step_id,
          stepName: selectedRequest.workflow_assignment?.step_name || 'Internal Note'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh history
        const historyRes = await fetch(`${API_URL}/workflow-assignments/history/${selectedRequest.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setRequestHistory(historyData.history || []);
        }
        return true;
      }
      alert(data.message || 'Failed to add note');
      return false;
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
      return false;
    }
  };

  const handleUpdateDetails = async (requestId, updatedData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/certificates/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();
      if (data.success) {
        setRequests(prev => prev.map(r =>
          r.id === requestId ? { ...r, ...data.data } : r
        ));
        setSelectedRequest({ ...selectedRequest, ...data.data });
        return true;
      }
      alert(data.message || 'Update failed');
      return false;
    } catch (error) {
      console.error('Error updating certificate:', error);
      alert('Error updating certificate');
      return false;
    }
  };

  // Filter requests based on view mode and other filters
  const filteredRequests = requests.filter(req => {
    // View mode filter - Robust fallback
    if (viewMode === 'assigned') {
      const isAssigned = req.workflow_assignment || isUserAssignedToRequest(req);
      if (!isAssigned) return false;
    }

    // History group filter (Active/Closed)
    if (historyGroup === 'active') {
      const isActive = !['released', 'cancelled', 'rejected'].includes(req.status);
      if (!isActive) return false;
    } else if (historyGroup === 'closed') {
      const isClosed = ['released', 'cancelled', 'rejected'].includes(req.status);
      if (!isClosed) return false;
    }

    // Time range filter
    if (timeRange !== 'all') {
      const reqDate = new Date(req.created_at);
      const now = new Date();

      if (timeRange === 'daily') {
        const reqDateStr = reqDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const nowDateStr = now.toLocaleDateString('en-CA');
        if (reqDateStr !== nowDateStr) return false;
      } else if (timeRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (reqDate < oneWeekAgo) return false;
      } else if (timeRange === 'monthly') {
        if (reqDate.getMonth() !== now.getMonth() || reqDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeRange === 'yearly') {
        if (reqDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeRange === 'custom') {
        if (dateRange.start && new Date(req.created_at) < new Date(dateRange.start)) return false;
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (new Date(req.created_at) > endDate) return false;
        }
      }
    }

    const matchesSearch =
      req.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' ? ['pending', 'staff_review', 'submitted', 'returned'].includes(req.status) :
        statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(req.status) :
          req.status === statusFilter);
    const matchesType = typeFilter === 'all' || req.certificate_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Count requests assigned to current user
  const [pendingActionCount, setPendingActionCount] = useState(0);

  // Fetch assignment counts for the floating orange badge
  useEffect(() => {
    const visibleAssigned = requests.filter(r => isUserAssignedToRequest(r));

    const pending = visibleAssigned.filter(r =>
      ['staff_review', 'processing', 'oic_review', 'pending', 'captain_approval', 'secretary_approval', 'ready', 'ready_for_pickup'].includes(r.status)
    ).length;

    setPendingActionCount(pending);
  }, [requests, viewMode, currentUser]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Requests</h1>
          <p className="text-gray-500 mt-1">Manage and process certificate applications</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingActionCount > 0 && (
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {pendingActionCount} Pending Your Action
            </span>
          )}
        </div>
      </div>

      {/* Tabs and Filters Navigation */}
      <div className="space-y-4">
        {/* Top Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewMode('assigned')}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${viewMode === 'assigned'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FileCheck className="w-4 h-4" />
            My Assignments
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {assignedCount}
            </span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${viewMode === 'all'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <History className="w-4 h-4" />
            Certificate Request History
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full">
              {/* Search */}
              <div className="relative flex-1 min-w-[300px] md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Reference, Applicant Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="staff_review">Staff Review</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="oic_review">Releasing Team</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="returned">Returned</option>
                  <option value="released">Released</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  <option value="natural_death">Natural Death</option>
                  <option value="barangay_guardianship">Guardianship</option>
                  <option value="barangay_cohabitation">Co-habitation</option>
                  <option value="business_permit">Business Permit</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* History Group */}
              <div className="relative">
                <select
                  value={historyGroup}
                  onChange={(e) => setHistoryGroup(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/50 text-sm font-medium text-blue-700"
                >
                  <option value="all">All Records</option>
                  <option value="active">Active Requests</option>
                  <option value="closed">Closed / Archive</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>

              {/* Time Range */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="all">Any Time</option>
                      <option value="daily">Today</option>
                      <option value="weekly">This Week</option>
                      <option value="monthly">This Month</option>
                      <option value="yearly">This Year</option>
                      <option value="custom">Custom Date</option>
                    </select>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {timeRange === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-2 py-1 border-none bg-transparent text-xs focus:ring-0"
                      />
                      <span className="text-gray-400 text-[10px] font-bold uppercase">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-2 py-1 border-none bg-transparent text-xs focus:ring-0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Filter Button */}
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ml-auto"
                title="Clear all filters"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {viewMode === 'assigned' ? 'No requests assigned to you' : 'No requests found'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {viewMode === 'assigned'
                ? 'Requests will appear here when you are assigned as an approver'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Step</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request) => {
                  const currentStep = getCurrentWorkflowStep(request);
                  const canAct = canUserTakeAction(request);

                  return (
                    <tr
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${canAct ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/requests?id=${request.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                              e.preventDefault();
                              setSelectedRequest(request);
                              router.push(
                                { pathname: router.pathname, query: { ...router.query, id: request.id } },
                                undefined,
                                { shallow: true }
                              );
                            }
                          }}
                          className="font-mono font-semibold text-blue-600 hover:underline relative z-10"
                        >
                          {request.reference_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.applicant_name || request.full_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{request.contact_number || 'No contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(request.certificate_type)}`}></div>
                          <span className="text-sm font-medium text-gray-700">{getTypeLabel(request.certificate_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                          {request.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {currentStep ? (
                          <span className="text-sm text-gray-600">{currentStep.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(request.updated_at || request.created_at)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && !showActionModal && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setSelectedRequest(null);
            const { id, ...rest } = router.query;
            if (id) {
              router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
            }
          }}
          onAction={handleAction}
          onUpdate={handleUpdateDetails}
          setSelectedRequest={setSelectedRequest}
          getStatusColor={getStatusColor}
          getTypeLabel={getTypeLabel}
          formatDate={formatDate}
          canUserTakeAction={canUserTakeAction}
          getCurrentWorkflowStep={getCurrentWorkflowStep}
          history={requestHistory}
        />
      )}

      {/* Status Confirmation Modal */}
      {showActionModal && selectedRequest && (
        <ActionModal
          request={selectedRequest}
          actionType={actionType}
          comment={actionComment}
          setComment={setActionComment}
          onSubmit={submitAction}
          onClose={() => setShowActionModal(false)}
          processing={processing}
          currentStep={workflows[selectedRequest.certificate_type]?.find(s => s.status === (selectedRequest.status === 'processing' ? 'processing' : selectedRequest.status))}
          history={requestHistory}
          userSignature={userSignature}
        />
      )}

      {/* Pickup Verification Modal */}
      {showPickupModal && selectedRequest && (
        <ConfirmPickupModal
          certificate={selectedRequest}
          onClose={() => setShowPickupModal(false)}
          onConfirm={handlePickupConfirm}
          pickupName={pickupName}
          setPickupName={setPickupName}
          confirming={processing}
          getTypeLabel={getTypeLabel}
        />
      )}
    </div>
  );
}

RequestsPage.getLayout = (page) => (
  <Layout>
    {page}
  </Layout>
);


// Request Details Modal Component
// RequestDetailsModal Component
function RequestDetailsModal({ request, onClose, onAction, onUpdate, setSelectedRequest, getStatusColor, getTypeLabel, formatDate, canUserTakeAction, getCurrentWorkflowStep, history = [] }) {
  const currentStep = getCurrentWorkflowStep(request);
  const canAct = canUserTakeAction(request);
  const isGuardianship = String(request.certificate_type || '').toLowerCase().includes('guardian') || String(request.reference_number || '').toUpperCase().startsWith('GD');
  const isMedicoLegal = String(request.certificate_type || '').toLowerCase().includes('medico') || String(request.reference_number || '').toUpperCase().startsWith('ML');
  const isDeath = String(request.certificate_type || '').toLowerCase().includes('death') || String(request.purpose || '').toLowerCase().includes('death');

  // Helper to calculate age from date string
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const displayAge = calculateAge(request.date_of_birth) || request.age;
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showResidentDb, setShowResidentDb] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditResidentMode, setIsEditResidentMode] = useState(false);
  const [residentFormData, setResidentFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: request.first_name || '',
    middle_name: request.middle_name || '',
    last_name: request.last_name || '',
    suffix: request.suffix || '',
    full_name: request.full_name || request.applicant_name || '',
    contact_number: request.contact_number || '',
    age: request.age || '',
    sex: request.sex || '',
    civil_status: request.civil_status || '',
    date_of_birth: request.date_of_birth || '',
    place_of_birth: request.place_of_birth || '',
    address: request.address || '',
    purpose: request.purpose || '',
    date_of_death: request.date_of_death || '',
    cause_of_death: request.cause_of_death || '',
    covid_related: request.covid_related || false,
    requestor_name: request.requestor_name || '',
    guardian_name: request.guardian_name || '',
    guardian_relationship: request.guardian_relationship || '',
    partner_full_name: request.partner_full_name || '',
    partner_sex: request.partner_sex || '',
    partner_date_of_birth: request.partner_date_of_birth || '',
    partner_address: request.partner_address || request.address || '',
    partner_civil_status: request.partner_civil_status || 'CO-HABITING',
    no_of_children: request.no_of_children || '0',
    living_together_years: request.living_together_years || '0',
    living_together_months: request.living_together_months || '0',
    date_of_examination: request.date_of_examination || '',
    usaping_barangay: request.usaping_barangay || '',
    date_of_hearing: request.date_of_hearing || ''
  });

  // Split name if fields are empty but full_name exists
  useEffect(() => {
    if (isEditing && !editFormData.first_name && !editFormData.last_name && editFormData.full_name) {
      const parts = editFormData.full_name.trim().split(' ');
      if (parts.length >= 2) {
        setEditFormData(prev => ({
          ...prev,
          first_name: parts[0],
          last_name: parts[parts.length - 1],
          middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : ''
        }));
      }
    }
  }, [isEditing]);

  // Calculate age when date_of_birth changes
  useEffect(() => {
    if (editFormData.date_of_birth) {
      const birthDate = new Date(editFormData.date_of_birth);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setEditFormData(prev => ({ ...prev, age: age >= 0 ? age : '' }));
      }
    }
  }, [editFormData.date_of_birth]);

  // Calculate partner age when partner_date_of_birth changes
  useEffect(() => {
    if (editFormData.partner_date_of_birth) {
      const birthDate = new Date(editFormData.partner_date_of_birth);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setEditFormData(prev => ({ ...prev, partner_age: age >= 0 ? age : '' }));
      }
    }
  }, [editFormData.partner_date_of_birth]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // Mismatch Detection Logic
  const resident = request.residents;
  const mismatches = [];
  if (resident) {
    const normalize = (val) => String(val || '').trim().toUpperCase();
    if (request.first_name && resident.first_name && normalize(request.first_name) !== normalize(resident.first_name)) mismatches.push('First Name');
    if (request.middle_name && resident.middle_name && normalize(request.middle_name) !== normalize(resident.middle_name)) mismatches.push('Middle Name');
    if (request.last_name && resident.last_name && normalize(request.last_name) !== normalize(resident.last_name)) mismatches.push('Last Name');
    if (request.suffix && resident.suffix && normalize(request.suffix) !== normalize(resident.suffix)) mismatches.push('Suffix');
    if (request.contact_number && resident.contact_number && normalize(request.contact_number) !== normalize(resident.contact_number)) mismatches.push('Contact Number');
    if (request.address && resident.residential_address && normalize(request.address) !== normalize(resident.residential_address)) mismatches.push('Address');
    if (request.date_of_birth && resident.date_of_birth && request.date_of_birth !== resident.date_of_birth) mismatches.push('Date of Birth');
    if (request.place_of_birth && resident.place_of_birth && normalize(request.place_of_birth) !== normalize(resident.place_of_birth)) mismatches.push('Place of Birth');
    if (request.sex && resident.gender && normalize(request.sex) !== normalize(resident.gender)) mismatches.push('Gender');
    if (request.civil_status && resident.civil_status && normalize(request.civil_status) !== normalize(resident.civil_status)) mismatches.push('Civil Status');

    // Check for deceased status mismatch
    if (request.certificate_type === 'natural_death' && !resident.is_deceased) {
      mismatches.push('Deceased Status');
    }

    // Check for Second Name mismatch for Same Person certificates
    if (request.certificate_type === 'certification_same_person') {
      try {
        const details = typeof request.details === 'string' ? JSON.parse(request.details || '{}') : (request.details || {});
        const requestSecondName = details.fullName2 || details.name_2 || details.name2;
        if (requestSecondName && normalize(requestSecondName) !== normalize(resident.second_name)) {
          mismatches.push('Second Name');
        }
      } catch (e) {
        console.error('Error detecting second name mismatch:', e);
      }
    }

    // Check for Guardian mismatch for Guardianship certificates
    if (request.certificate_type === 'barangay_guardianship') {
      const reqGName = normalize(request.guardian_name);
      const resGName = normalize(resident.guardian_name);
      if (reqGName && reqGName !== resGName) mismatches.push('Guardian Name');

      const reqGRel = normalize(request.guardian_relationship);
      const resGRel = normalize(resident.guardian_relationship);
      if (reqGRel && reqGRel !== resGRel) mismatches.push('Guardian Relationship');
    }
  }
  const hasMismatch = mismatches.length > 0;

  const handleSyncToResident = () => {
    setShowSyncConfirm(true);
  };

  const executeSync = async () => {
    setShowSyncConfirm(false);
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_URL}/certificates/${request.id}/sync-resident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: request.assigned_user_id || 'manual-sync' })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Resident profile successfully updated!');
        if (onUpdate) await onUpdate(request.id, {});
      } else {
        toast.error('Sync failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Error syncing data: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditResident = () => {
    setIsEditResidentMode(true);
    setResidentFormData({
      ...request.residents,
      first_name: request.residents.first_name || '',
      middle_name: request.residents.middle_name || '',
      last_name: request.residents.last_name || '',
      suffix: request.residents.suffix || '',
      contact_number: request.residents.contact_number || '',
      age: request.residents.age || '',
      gender: request.residents.gender || request.residents.sex || 'MALE',
      civil_status: request.residents.civil_status || 'SINGLE',
      date_of_birth: request.residents.date_of_birth || '',
      place_of_birth: request.residents.place_of_birth || '',
      residential_address: request.residents.residential_address || '',
      pending_case: request.residents.pending_case || false,
      case_record_history: request.residents.case_record_history || '',
      is_deceased: request.residents.is_deceased || false,
      date_of_death: request.residents.date_of_death || '',
      covid_related: request.residents.covid_related || false,
      cause_of_death: request.residents.cause_of_death || '',
      second_name: request.residents.second_name || '',
    });
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const submitData = { ...residentFormData };
      delete submitData.id;
      delete submitData.created_at;

      const response = await fetch(`${API_URL}/residents/${request.residents.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Resident profile updated successfully');
        setIsEditResidentMode(false);
        setShowResidentDb(false); // Close modal to refresh data on next open
      } else {
        toast.error(data.message || 'Failed to update resident');
      }
    } catch (error) {
      console.error('Error updating resident:', error);
      toast.error('An error occurred while updating.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Combine names for full_name
    const combinedName = `${editFormData.first_name} ${editFormData.middle_name} ${editFormData.last_name} ${editFormData.suffix}`.replace(/\s+/g, ' ').trim();
    const dataToSave = { ...editFormData, full_name: combinedName };

    const success = await onUpdate(request.id, dataToSave);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const hasComments = (Array.isArray(history) && history.some(h => h.comment || h.comments)) || !!request.admin_comment;

  if (showPdfPreview) {
    return (
      <CertificatePreviewModal
        request={request}
        onClose={() => setShowPdfPreview(false)}
        onBack={() => setShowPdfPreview(false)}
        getTypeLabel={getTypeLabel}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Request Details</h2>
                <p className="text-blue-200 text-sm">{request.reference_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && canAct && !['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2 transition-colors"
                  title="Edit Request Details"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditFormData({
                        full_name: request.full_name || request.applicant_name || '',
                        contact_number: request.contact_number || '',
                        age: request.age || '',
                        sex: request.sex || '',
                        civil_status: request.civil_status || '',
                        date_of_birth: request.date_of_birth || '',
                        place_of_birth: request.place_of_birth || '',
                        address: request.address || '',
                        purpose: request.purpose || '',
                        date_of_death: request.date_of_death || '',
                        cause_of_death: request.cause_of_death || '',
                        covid_related: request.covid_related || false,
                        requestor_name: request.requestor_name || '',
                        guardian_name: request.guardian_name || '',
                        guardian_relationship: request.guardian_relationship || '',
                        partner_full_name: request.partner_full_name || '',
                        partner_age: request.partner_age || '',
                        partner_sex: request.partner_sex || '',
                        partner_date_of_birth: request.partner_date_of_birth || '',
                        no_of_children: request.no_of_children || '',
                        living_together_years: request.living_together_years || '',
                        living_together_months: request.living_together_months || '',
                        date_of_examination: request.date_of_examination || '',
                        usaping_barangay: request.usaping_barangay || '',
                        date_of_hearing: request.date_of_hearing || ''
                      });
                    }}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => setShowPdfPreview(true)}
                className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2 transition-colors"
                title="View Certificate Preview"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 pt-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Request Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 pt-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>History & Comments</span>
              {hasComments && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </button>
          </div>

          <div className="p-8 overflow-y-auto overflow-x-hidden flex-1 space-y-8 custom-scrollbar">
            {activeTab === 'details' && (
              <>
                {/* OIC / Ready Guidance Banner */}
                {['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                  <div className="bg-green-600 p-4 rounded-xl shadow-lg border-2 border-green-400 text-white mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Printer className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black uppercase leading-tight">APPROVED REQUEST</h4>
                        <p className="text-sm font-bold opacity-90">Please print the certificate and contact the requestor for collection.</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Status and Step */}
                {/* Status, Type, and Step Layout */}
                {/* Status, Type, and Step Layout */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] border shadow-sm ${getStatusColor(request.status)}`}>
                      {request.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-900 font-extrabold text-[13.5px] tracking-tight">{getTypeLabel(request.certificate_type)}</span>
                      {currentStep && (
                        <>
                          <span className="text-gray-300 font-light text-xl">/</span>
                          <span className="text-blue-600 font-extrabold text-[13.5px] uppercase tracking-wide">{currentStep.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(request.created_at)}</span>
                    </div>
                    {request.residents?.pending_case && (
                      <span className="mt-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1 shadow-sm uppercase tracking-widest">
                        <ShieldAlert className="w-3 h-3" />
                        CRITICAL: CASE RECORDED
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Mismatch Warning */}
                {hasMismatch && !isEditing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Information Mismatch Detected</h4>
                        <p className="text-xs text-amber-800 mt-1 font-medium italic">
                          Request data differs from record for: <span className="font-extrabold not-italic text-amber-900">{mismatches.join(', ').toUpperCase()}</span>.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncToResident}
                        disabled={isSyncing}
                        className="self-center px-4 py-2 bg-amber-600 text-white rounded-lg text-[11px] font-black hover:bg-amber-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 tracking-widest"
                      >
                        {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                        {isSyncing ? 'SYNCING...' : 'SYNC TO RESIDENT'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Compact Applicant Info Grid */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-5 border-l-4 border-blue-500 pl-3">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                      <User className="w-4 h-4 text-blue-500" />
                      Applicant Information
                    </h3>
                    {isEditing && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 italic flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Master DB sync required after save
                      </span>
                    )}
                  </div>
                  <div className={`grid gap-8 ${['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`}>
                    {isEditing ? (
                      <>
                        <div className="col-span-1">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">First Name</p>
                          <input
                            type="text"
                            name="first_name"
                            value={editFormData.first_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Middle Name</p>
                          <input
                            type="text"
                            name="middle_name"
                            value={editFormData.middle_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Last Name</p>
                          <input
                            type="text"
                            name="last_name"
                            value={editFormData.last_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Suffix</p>
                          <input
                            type="text"
                            name="suffix"
                            value={editFormData.suffix}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-full">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Applicant Identity</p>
                          {request.residents && !isEditing && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  // Force refresh resident data to ensure all fields are available
                                  const token = getAuthToken();
                                  const res = await fetch(`${API_URL}/certificates/${request.id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  const data = await res.json();
                                  if (data.success && data.data) {
                                    // Merge fresh data into selected request
                                    setSelectedRequest(prev => ({ ...prev, ...data.data }));
                                  }
                                } catch (err) {
                                  console.error("Failed to refresh resident data:", err);
                                }
                                setShowResidentDb(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 transition-all bg-blue-50/50 hover:bg-blue-100 rounded-lg border border-blue-100/50 group relative active:scale-90"
                              title="VIEW MASTER RECORD"
                            >
                              <Database className="w-4 h-4" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                                View Master Record
                              </span>
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-2">
                          <p className="font-black text-gray-900 uppercase text-xl tracking-tight" title={request.applicant_name || request.full_name}>
                            {request.applicant_name || request.full_name || 'NOT RECORDED'}
                          </p>

                          {request.certificate_type === 'certification_same_person' && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm animate-in fade-in zoom-in duration-300">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none border-r border-blue-200 pr-2">AKA</span>
                              <span className="font-black text-blue-700 uppercase text-sm tracking-tight leading-none">
                                {(() => {
                                  try {
                                    const details = typeof request.details === 'string' ? JSON.parse(request.details || '{}') : (request.details || {});
                                    return details.fullName2 || details.name_2 || details.name2 || 'NOT RECORDED';
                                  } catch (e) {
                                    return 'NOT RECORDED';
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="col-span-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Date of Birth</p>
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_of_birth"
                          value={editFormData.date_of_birth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                        />
                      ) : (
                        <p className="font-black text-gray-900 text-[13px] font-mono">
                          {request.date_of_birth || (request.residents?.date_of_birth ? new Date(request.residents.date_of_birth).toISOString().split('T')[0] : 'NOT RECORDED')}
                        </p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Civil Status</p>
                      {isEditing ? (
                        <select
                          name="civil_status"
                          value={editFormData.civil_status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                        >
                          <option value="SINGLE">SINGLE</option>
                          <option value="MARRIED">MARRIED</option>
                          <option value="WIDOWED">WIDOWED</option>
                          <option value="SEPARATED">SEPARATED</option>
                          <option value="CO-HABITING">CO-HABITING</option>
                        </select>
                      ) : (
                        <p className="font-black text-gray-900 text-[13px] uppercase">{request.civil_status || 'NOT RECORDED'}</p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Age / Sex</p>
                      <p className="font-black text-gray-900 text-[13px] uppercase">
                        {displayAge || '-'} / {request.sex || '-'}
                      </p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Contact No.</p>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 text-[12.5px] font-mono tracking-tighter">{request.contact_number || 'NOT RECORDED'}</p>
                        {!isEditing && request.contact_number && (
                          <div className="flex items-center gap-1">
                            <a href={`tel:${request.contact_number}`} className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a href={`sms:${request.contact_number}`} className="p-1 hover:bg-emerald-50 rounded text-emerald-500 transition-colors">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-full md:col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Residential Address</p>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={editFormData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                          rows="2"
                        />
                      ) : (
                        <p className="font-bold text-gray-800 text-[13px] uppercase leading-relaxed truncate" title={request.address}>
                          {request.address || 'NOT RECORDED'}
                        </p>
                      )}
                    </div>

                    {['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'].includes(request.certificate_type) && (
                      <div className="col-span-full md:col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Purpose of Request</p>
                        {isEditing ? (
                          <textarea
                            name="purpose"
                            value={editFormData.purpose}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                            rows="2"
                            placeholder="ENTER PURPOSE HERE..."
                          />
                        ) : (
                          <p className="font-bold text-gray-800 text-[13px] uppercase leading-relaxed truncate" title={request.purpose}>
                            {request.purpose || 'NOT SPECIFIED'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {request.certificate_type === 'barangay_cohabitation' && (
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mt-4">
                    <div className="flex justify-between items-center mb-5 border-l-4 border-rose-500 pl-3">
                      <h3 className="font-black text-gray-900 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        Partner Information
                      </h3>
                    </div>
                    <div className={`grid gap-6 ${['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                      {isEditing ? (
                        <>
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Partner Full Name</p>
                            <input
                              type="text"
                              name="partner_full_name"
                              value={editFormData.partner_full_name}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Date of Birth</p>
                            <input
                              type="date"
                              name="partner_date_of_birth"
                              value={editFormData.partner_date_of_birth ? new Date(editFormData.partner_date_of_birth).toISOString().split('T')[0] : ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 text-sm"
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Sex</p>
                            <select
                              name="partner_sex"
                              value={editFormData.partner_sex}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                            >
                              <option value="">SELECT...</option>
                              <option value="MALE">MALE</option>
                              <option value="FEMALE">FEMALE</option>
                            </select>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Civil Status</p>
                            <input
                              type="text"
                              name="partner_civil_status"
                              value={editFormData.partner_civil_status}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Partner Address</p>
                            <input
                              type="text"
                              name="partner_address"
                              value={editFormData.partner_address}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Years Living Together</p>
                            <input type="number" name="living_together_years" value={editFormData.living_together_years} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-extrabold text-gray-900" />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Months</p>
                            <input type="number" name="living_together_months" value={editFormData.living_together_months} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-extrabold text-gray-900" />
                          </div>
                          <div className="col-span-2 md:col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">No. of Children</p>
                            <input type="number" name="no_of_children" value={editFormData.no_of_children} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-extrabold text-gray-900" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) ? "col-span-1" : "col-span-2 md:col-span-2"}>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Partner Name</p>
                            <p className="font-extrabold text-gray-900 uppercase text-[15px] tracking-tight truncate">{request.partner_full_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Date of Birth</p>
                            <p className="font-black text-gray-900 text-[13px] font-mono whitespace-nowrap">{request.partner_date_of_birth || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Age / Sex</p>
                            <p className="font-black text-gray-900 text-[13px] uppercase">{(calculateAge(request.partner_date_of_birth) || request.partner_age || '-') + ' / ' + (request.partner_sex || '-')}</p>
                          </div>
                          <div className="col-span-2 md:col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Partner Address</p>
                            <p className="font-extrabold text-gray-900 text-[13px] uppercase leading-relaxed" title={request.partner_address || request.address}>
                              {request.partner_address || request.address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Previous Status</p>
                            <p className="font-black text-gray-900 text-[13px] uppercase">{request.partner_civil_status || 'CO-HABITING'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">No. of Children</p>
                            <p className="font-black text-gray-900 text-sm font-mono tracking-tighter">{request.no_of_children || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Partnership Length</p>
                            <p className="font-black text-gray-900 text-[13px] uppercase">{request.living_together_years || '0'} YRS, {request.living_together_months || '0'} MOS</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Purpose & Timeline */}
                {!['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                  <div className={`grid gap-6 ${isMedicoLegal ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {isGuardianship && (
                      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
                        <div className="border-l-4 border-blue-500 pl-3 mb-5">
                          <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                            <User className="w-4 h-4 text-blue-500" />
                            Guardian Information
                          </h3>
                        </div>
                        <div className="space-y-5 flex-1">
                          {isEditing ? (
                            <>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Guardian's Full Name</p>
                                <input
                                  type="text"
                                  name="guardian_name"
                                  value={editFormData.guardian_name}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Relationship</p>
                                <select
                                  name="guardian_relationship"
                                  value={editFormData.guardian_relationship}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-extrabold text-gray-900 uppercase text-sm select-none"
                                >
                                  <option value="">SELECT...</option>
                                  <option value="PARENT">PARENT</option>
                                  <option value="GRANDPARENT">GRANDPARENT</option>
                                  <option value="SIBLING">SIBLING</option>
                                  <option value="AUNT/UNCLE">AUNT/UNCLE</option>
                                  <option value="COUSIN">COUSIN</option>
                                  <option value="STEP-PARENT">STEP-PARENT</option>
                                  <option value="LEGAL GUARDIAN">LEGAL GUARDIAN</option>
                                  <option value="OTHER">OTHER</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Guardian Name</p>
                                <p className="font-extrabold text-gray-900 uppercase text-[15px] tracking-tight">{request.guardian_name || 'NOT SPECIFIED'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Relationship</p>
                                <p className="font-black text-gray-900 text-[13px] uppercase">{request.guardian_relationship || 'NOT SPECIFIED'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}



                    {request.admin_comment && (
                      <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-orange-100 p-1.5 rounded-lg">
                            <FileText className="w-4 h-4 text-orange-600" />
                          </div>
                          <h3 className="font-black text-orange-900 text-[11px] uppercase tracking-[0.2em]">
                            Admin Remarks
                          </h3>
                        </div>
                        <p className="text-sm text-orange-800 italic leading-relaxed font-medium">
                          "{request.admin_comment}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(isDeath || isMedicoLegal) && (
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mt-6">
                    <div className="flex justify-between items-center mb-5 border-l-4 border-blue-600 pl-3">
                      <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                        <Activity className="w-4 h-4 text-blue-500" />
                        {isMedicoLegal ? 'Investigation Details' : 'Death Certification Details'}
                      </h3>
                    </div>

                    <div className="grid gap-6 text-sm grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                      {isEditing ? (
                        <>
                          {isDeath && (
                            <>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Date of Death</p>
                                <input
                                  type="date"
                                  name="date_of_death"
                                  value={editFormData.date_of_death ? new Date(editFormData.date_of_death).toISOString().split('T')[0] : ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Cause of Death</p>
                                <input
                                  type="text"
                                  name="cause_of_death"
                                  value={editFormData.cause_of_death}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">COVID-19</p>
                                <select
                                  name="covid_related"
                                  value={editFormData.covid_related ? 'true' : 'false'}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, covid_related: e.target.value === 'true' }))}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                >
                                  <option value="false">NO / NEGATIVE</option>
                                  <option value="true">YES / POSITIVE</option>
                                </select>
                              </div>
                            </>
                          )}
                          {isMedicoLegal && (
                            <>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Date of Exam</p>
                                <input
                                  type="date"
                                  name="date_of_examination"
                                  value={editFormData.date_of_examination ? new Date(editFormData.date_of_examination).toISOString().split('T')[0] : ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Usaping Brgy</p>
                                <input
                                  type="text"
                                  name="usaping_barangay"
                                  value={editFormData.usaping_barangay}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Date of Hearing</p>
                                <input
                                  type="date"
                                  name="date_of_hearing"
                                  value={editFormData.date_of_hearing ? new Date(editFormData.date_of_hearing).toISOString().split('T')[0] : ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black uppercase text-sm"
                                />
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {isDeath && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Date of Death</p>
                              <p className="font-black text-gray-900 text-[13px] font-mono">
                                {(request.date_of_death || request.residents?.date_of_death) ? new Date(request.date_of_death || request.residents.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'NOT RECORDED'}
                              </p>
                            </div>
                          )}

                          {isMedicoLegal && (
                            <>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Date of Exam</p>
                                <p className="font-black text-gray-900 text-[13px] font-mono whitespace-nowrap">
                                  {request.date_of_examination ? new Date(request.date_of_examination).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'NOT RECORDED'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Usaping Brgy No.</p>
                                <p className="font-black text-gray-900 text-[13px] font-mono">
                                  {request.usaping_barangay || 'NOT RECORDED'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Date of Hearing</p>
                                <p className="font-black text-gray-900 text-[13px] font-mono whitespace-nowrap">
                                  {request.date_of_hearing ? new Date(request.date_of_hearing).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'NOT RECORDED'}
                                </p>
                              </div>
                            </>
                          )}

                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Cause / Purpose</p>
                            <p className="font-black text-gray-900 text-[13px] uppercase truncate" title={request.cause_of_death || request.purpose || 'NOT STATED'}>
                              {request.cause_of_death || request.purpose || 'NOT STATED'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Current Status</p>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${request.status === 'released' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {String(request.status || 'PENDING').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-6 border-l-4 border-indigo-500 pl-3">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Activity Log & Comments
                  </h3>
                </div>

                {Array.isArray(history) && history.length > 0 ? (
                  <div className="space-y-6">
                    {history
                      .filter(entry =>
                        entry.step_name !== 'Request Submission' &&
                        entry.step_name !== 'Request submitted' &&
                        !(entry.step_id === 0 && entry.action === 'submitted')
                      )
                      .map((entry, index) => (
                        <div key={index} className="flex gap-4 group">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${entry.action === 'approve' ? 'bg-green-50 text-green-600 border-green-100' :
                              entry.action === 'reject' ? 'bg-red-50 text-red-600 border-red-100' :
                                entry.action === 'return' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                              {entry.action === 'approve' ? <CheckCircle className="w-5 h-5" /> :
                                entry.action === 'reject' ? <XCircle className="w-5 h-5" /> :
                                  entry.action === 'return' ? <RotateCcw className="w-5 h-5" /> :
                                    <FileText className="w-5 h-5" />}
                            </div>
                          </div>
                          <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 group-hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-extrabold text-gray-900 uppercase text-[12px] tracking-tight">
                                {entry.users
                                  ? `${entry.users.first_name || ''} ${entry.users.last_name || ''}`.trim() || entry.users.email
                                  : (entry.performed_by_name || entry.performed_by_email || 'System Log')}
                              </p>
                              <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter bg-white px-2 py-0.5 rounded border border-gray-100">
                                {new Date(entry.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.1em] ${entry.action === 'approve' ? 'bg-green-100 text-green-700' :
                                entry.action === 'reject' ? 'bg-red-100 text-red-700' :
                                  entry.action === 'return' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {entry.action.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{entry.step_name}</span>
                            </div>
                            {(entry.comments || entry.comment) && (
                              <div className="bg-white p-3 rounded-xl border border-gray-100 text-[13px] text-gray-700 italic font-medium leading-relaxed shadow-sm">
                                "{entry.comments || entry.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest italic">No activity recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Official Resident Record Modal */}
          {showResidentDb && request.residents && (
            <Modal
              isOpen={showResidentDb}
              onClose={() => setShowResidentDb(false)}
              title={isEditResidentMode ? "Edit Resident Profile" : "Resident Official Profile"}
              size="xl"
            >
              {!isEditResidentMode ? (
                <div className="space-y-5">
                  {/* Profile Header */}
                  <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
                    <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-white text-3xl font-black shadow-lg relative z-10 shrink-0">
                      {request.residents.last_name?.charAt(0)}
                    </div>
                    <div className="space-y-1 relative z-10 flex-1">
                      <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">
                        {request.residents.last_name}, {request.residents.first_name} {request.residents.middle_name} {request.residents.suffix}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-blue-200" /> OFFICIAL DATABASE RECORD
                        </span>
                        {request.residents.is_deceased ? (
                          <span className="bg-rose-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-rose-900/20">
                            <Skull className="w-3.5 h-3.5" /> DECEASED RECORD
                          </span>
                        ) : (
                          <span className="bg-emerald-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                            <Activity className="w-3.5 h-3.5" /> ACTIVE RESIDENT
                          </span>
                        )}
                      </div>
                    </div>
                    {request.residents.second_name && (
                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right z-10">
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5 whitespace-nowrap">Also Known As</p>
                        <p className="text-[14px] font-black text-white uppercase tracking-tight truncate">{request.residents.second_name}</p>
                      </div>
                    )}
                    {/* Decorative background icons */}
                    <Users className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 -rotate-12" />
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="space-y-3">
                      <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          Personal Metrics
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Gender & Maturity</p>
                            <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">{request.residents.gender || request.residents.sex} • {calculateAge(request.residents.date_of_birth) || request.residents.age} YEARS OLD</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Social Status</p>
                            <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">{request.residents.civil_status || 'SINGLE'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Birth Information</p>
                            <p className="text-[14px] font-black text-gray-800 font-mono tracking-tighter">{request.residents.date_of_birth || 'NOT RECORDED'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" />
                          Location Profile
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Residential Address</p>
                            <p className="text-[13px] font-black text-gray-800 uppercase leading-relaxed font-medium">{request.residents.residential_address || request.residents.address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Place of Birth</p>
                            <p className="text-[13px] font-black text-gray-800 uppercase leading-relaxed font-medium">{request.residents.place_of_birth || 'NOT SPECIFIED'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={`p-5 border rounded-2xl h-full flex flex-col ${request.residents.is_deceased ? 'bg-rose-50 border-rose-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                          <Phone className="w-3.5 h-3.5 text-orange-500" />
                          Contact Channels
                        </p>

                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase">Primary Phone</p>
                              <p className="text-[14px] font-black text-gray-800 font-mono tracking-tighter">{request.residents.contact_number || 'NONE'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 opacity-40 grayscale">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                              <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase">Email Sync</p>
                              <p className="text-[12px] font-bold text-gray-500 uppercase italic">Not Connected</p>
                            </div>
                          </div>
                        </div>

                        {!request.residents.is_deceased && (
                          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                            <div className="bg-emerald-100 p-1.5 rounded-lg">
                              <Activity className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Live Status Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Legal Records Section */}
                  <div className={`mt-6 p-5 rounded-2xl border-2 shadow-xl ${request.residents.pending_case ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-3">
                      <div className={`p-1.5 rounded-lg border ${request.residents.pending_case ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] leading-none ${request.residents.pending_case ? 'text-rose-900' : 'text-gray-900'}`}>Official Clearance Status</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">Verification against Barangay Law Records</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="md:col-span-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Electronic Tag</p>
                        <div className={`inline-flex items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${request.residents.pending_case
                          ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200 animate-pulse'
                          : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200'
                          }`}>
                          {request.residents.pending_case ? 'HOLD / PENDING CASE' : 'CLEARED / ACTIVE'}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Case History & Administrative Remarks</p>
                        <div className={`p-4 rounded-xl border-2 text-[12px] font-extrabold leading-relaxed min-h-[80px] shadow-inner ${request.residents.pending_case
                          ? 'bg-white border-rose-100 text-rose-900 italic'
                          : 'bg-gray-50 border-gray-100 text-gray-400 border-dashed'
                          }`}>
                          {request.residents.case_record_history || 'NO PREVIOUS LEGAL HISTORY OR PENDING CASES REPORTED FOR THIS RESIDENT RECORD.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-5 flex justify-end items-center border-t border-gray-100">
                    <div className="flex gap-3">
                      <button
                        onClick={handleEditResident}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Edit Profile
                      </button>
                      <button
                        onClick={() => setShowResidentDb(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all"
                      >
                        Close Window
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveResident} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Identity Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">First Name</label>
                        <input type="text" required className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                          value={residentFormData.first_name} onChange={(e) => setResidentFormData({ ...residentFormData, first_name: e.target.value })} />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Middle Name</label>
                        <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                          value={residentFormData.middle_name} onChange={(e) => setResidentFormData({ ...residentFormData, middle_name: e.target.value })} />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Last Name</label>
                        <input type="text" required className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                          value={residentFormData.last_name} onChange={(e) => setResidentFormData({ ...residentFormData, last_name: e.target.value })} />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Suffix</label>
                        <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none" placeholder="JR/SR"
                          value={residentFormData.suffix} onChange={(e) => setResidentFormData({ ...residentFormData, suffix: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/50 p-4 rounded-xl border border-blue-100 shadow-inner">
                    <p className="text-[10px] font-black text-blue-400 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Also Known As / Second Name
                    </p>
                    <input
                      type="text"
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-black uppercase focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 placeholder:text-blue-200"
                      placeholder="E.G. NICKNAME OR SECOND NAME"
                      value={residentFormData.second_name || ''}
                      onChange={(e) => setResidentFormData({ ...residentFormData, second_name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Personal Info</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Age</label>
                          <input type="number" required className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            value={residentFormData.age} onChange={(e) => setResidentFormData({ ...residentFormData, age: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Gender</label>
                          <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            value={residentFormData.gender} onChange={(e) => setResidentFormData({ ...residentFormData, gender: e.target.value })}>
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Civil Status</label>
                        <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          value={residentFormData.civil_status} onChange={(e) => setResidentFormData({ ...residentFormData, civil_status: e.target.value })}>
                          <option value="SINGLE">SINGLE</option>
                          <option value="MARRIED">MARRIED</option>
                          <option value="WIDOWED">WIDOWED</option>
                          <option value="SEPARATED">SEPARATED</option>
                          <option value="CO-HABITING">CO-HABITING</option>
                        </select>
                      </div>
                      {/* Address */}
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Residential Address</label>
                        <textarea className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 uppercase resize-none" rows="2"
                          value={residentFormData.residential_address} onChange={(e) => setResidentFormData({ ...residentFormData, residential_address: e.target.value })} />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Birth & Contact</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Birth Date</label>
                          <input type="date" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            value={residentFormData.date_of_birth} onChange={(e) => setResidentFormData({ ...residentFormData, date_of_birth: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Contact No.</label>
                          <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" placeholder="09..."
                            value={residentFormData.contact_number} onChange={(e) => setResidentFormData({ ...residentFormData, contact_number: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Birth Place</label>
                        <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                          value={residentFormData.place_of_birth} onChange={(e) => setResidentFormData({ ...residentFormData, place_of_birth: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Legal Status Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Legal Status</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={residentFormData.pending_case} onChange={(e) => setResidentFormData({ ...residentFormData, pending_case: e.target.checked })} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                          <span className="ml-2 text-[10px] font-bold text-red-700 uppercase">With Case</span>
                        </label>
                      </div>
                      <textarea className="w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] resize-none uppercase" placeholder="Enter case records..."
                        value={residentFormData.case_record_history} onChange={(e) => setResidentFormData({ ...residentFormData, case_record_history: e.target.value })} />
                    </div>

                    <div className={`p-6 rounded-2xl border transition-all space-y-4 ${residentFormData.is_deceased ? 'bg-[#FFE6E6] border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${residentFormData.is_deceased ? 'text-red-500' : 'text-gray-500'}`}>Deceased Status</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={residentFormData.is_deceased} onChange={(e) => setResidentFormData({ ...residentFormData, is_deceased: e.target.checked })} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-600"></div>
                          <span className={`ml-2 text-[10px] font-bold uppercase ${residentFormData.is_deceased ? 'text-gray-900' : 'text-gray-700'}`}>Deceased</span>
                        </label>
                      </div>
                      {residentFormData.is_deceased && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-red-500 uppercase block mb-1">Date of Death</label>
                              <input type="date" className="w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500"
                                value={residentFormData.date_of_death} onChange={(e) => setResidentFormData({ ...residentFormData, date_of_death: e.target.value })} />
                            </div>
                            <div className="flex items-end pb-1">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-red-200 bg-white text-red-600 focus:ring-red-500"
                                  checked={residentFormData.covid_related} onChange={(e) => setResidentFormData({ ...residentFormData, covid_related: e.target.checked })} />
                                <span className="text-[10px] font-black text-red-600 uppercase group-hover:text-red-500 transition-colors">COVID-19 Related</span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-red-500 uppercase block mb-1">Cause of Death</label>
                            <input type="text" className="w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 uppercase" placeholder="Enter cause..."
                              value={residentFormData.cause_of_death} onChange={(e) => setResidentFormData({ ...residentFormData, cause_of_death: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-5 flex justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setIsEditResidentMode(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </form>
              )}
            </Modal>
          )}

          {/* Sync Confirmation Modal */}
          {
            showSyncConfirm && (
              <Modal
                isOpen={showSyncConfirm}
                onClose={() => setShowSyncConfirm(false)}
                title="Confirm Database Synchronization"
                size="sm"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl flex gap-3 items-start border border-amber-100">
                    <RefreshCw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 leading-tight">Sync information to Master Database?</p>
                      <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                        This will update the permanent Resident Profile for <span className="font-bold underline">{request.full_name || request.applicant_name}</span> with the information from this certificate request.
                      </p>
                      <div className="mt-3 bg-white/50 p-2 rounded border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 uppercase mb-1 underline">Updates to be applied:</p>
                        <ul className="text-[10px] text-amber-700 list-disc pl-4 space-y-0.5 font-medium">
                          {mismatches.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowSyncConfirm(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeSync}
                      className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-100"
                    >
                      <Database className="w-4 h-4" />
                      YES, UPDATE PROFILE
                    </button>
                  </div>
                </div>
              </Modal>
            )
          }

          {/* Footer Actions */}
          {
            canAct && ['pending', 'processing', 'staff_review', 'secretary_approval', 'captain_approval', 'oic_review', 'ready', 'ready_for_pickup', 'returned'].includes(request.status) && (
              <div className="border-t bg-gray-50 px-6 py-4 pb-6 shrink-0 mt-auto">
                {request.residents?.pending_case && (
                  <div className="bg-red-600 p-4 rounded-xl shadow-lg border-2 border-red-400 text-white mb-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Legal Hold Notification</p>
                        <h4 className="text-lg font-black uppercase leading-tight">This applicant has a PENDING CASE</h4>
                        <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/20">
                          <p className="text-[10px] font-bold uppercase mb-1 opacity-70">Official Record History / Remarks:</p>
                          <p className="text-sm font-semibold italic">"{request.residents.case_record_history || 'No detail remarks provided.'}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep?.status === 'staff_review' ? (
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={() => onAction(request, 'reject')}
                      disabled={isEditing}
                      className={`px-8 py-3.5 bg-white border-2 border-red-200 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-sm ${isEditing ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-300 transform active:scale-95'}`}
                    >
                      <XCircle className="w-4 h-4" />
                      Mark as Ineligible
                    </button>
                    <button
                      onClick={() => onAction(request, 'approve')}
                      disabled={isEditing}
                      className={`px-10 py-3.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-lg shadow-blue-200 ${isEditing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-blue-300 transform hover:-translate-y-0.5 active:scale-95'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify & Forward
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 justify-end">
                    {['ready', 'ready_for_pickup'].includes(request.status) ? (
                      <button
                        onClick={() => onAction(request, 'approve')}
                        disabled={isEditing}
                        className={`px-10 py-3.5 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 ${isEditing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-700 hover:shadow-emerald-300 transform hover:-translate-y-0.5 active:scale-95'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Official Release
                      </button>
                    ) : (
                      <>
                        {!['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                          <>
                            <button
                              onClick={() => onAction(request, 'return')}
                              disabled={isEditing}
                              className={`px-6 py-3.5 bg-white border-2 border-amber-200 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-sm ${isEditing ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-amber-50 hover:border-amber-300 active:scale-95'}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              Send Back
                            </button>
                            <button
                              onClick={() => onAction(request, 'reject')}
                              disabled={isEditing}
                              className={`px-6 py-3.5 bg-white border-2 border-red-200 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-sm ${isEditing ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-300 active:scale-95'}`}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onAction(request, 'approve')}
                          disabled={isEditing}
                          className={`px-10 py-3.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-lg shadow-blue-200 ${isEditing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-blue-300 transform hover:-translate-y-0.5 active:scale-95'}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {request.status === 'captain_approval' ? 'Official Approval' : (request.status === 'oic_review' ? 'Set as Ready' : 'Forward to Next')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          }
        </div >
      </div >
    </div >
  );
}

// Action Modal Component
function ActionModal({ request, actionType, comment, setComment, onSubmit, onClose, processing, currentStep, userSignature, history = [] }) {
  const [tempSignature, setTempSignature] = useState(null);
  const [showSignPad, setShowSignPad] = useState(false);

  // Dynamic config based on current step
  const isReviewStep = currentStep?.status === 'staff_review';

  const config = {
    approve: isReviewStep ? {
      title: 'Verify & Forward Request',
      description: 'I confirm that the resident is legitimate and the request is valid.',
      icon: CheckCircle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'Verify & Forward'
    } : (request.status === 'oic_review') ? {
      title: 'Ready for Pickup',
      description: 'Mark this certificate as ready for the resident to collect.',
      icon: CheckCircle,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      buttonText: 'Ready to Pickup'
    } : (['ready', 'ready_for_pickup'].includes(request.status)) ? {
      title: 'Release Certificate',
      description: 'Confirm that this certificate has been officially released to the resident.',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Confirm Release'
    } : {
      title: 'Approve Request',
      description: 'Are you sure you want to approve this certificate request?',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: (currentStep?.status === 'captain_approval' || request.status === 'captain_approval') ? 'Approve Request' : 'Forward Request'
    },
    reject: isReviewStep ? {
      title: 'Mark as Not Legitimate',
      description: 'Please provide a reason why this request is not legitimate.',
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Reject Request'
    } : {
      title: 'Reject Request',
      description: 'Please provide a reason for rejecting this request.',
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Reject Request'
    },
    return: {
      title: 'Send Back for Revision',
      description: 'Please specify what needs to be corrected or updated.',
      icon: RotateCcw,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonBg: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Send Back'
    }
  };

  const cfg = config[actionType];
  const Icon = cfg.icon;

  const isEsignRole = currentStep && currentStep.officialRole && currentStep.officialRole !== 'None';
  const canUseEsign = actionType === 'approve' && !['oic_review', 'ready', 'ready_for_pickup'].includes(request.status); // Disable sign pad for OIC/Ready steps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Landscape Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-5 bg-white shrink-0">
          <div className={`w-14 h-14 ${cfg.iconBg} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transform rotate-3`}>
            <Icon className={`w-7 h-7 ${cfg.iconColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1.5">{cfg.title}</h2>
            <p className="text-sm font-medium text-gray-500 leading-none">{cfg.description}</p>
          </div>
        </div>

        {/* Landscape Body - Split Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">

            {/* LEFT COLUMN: Context (Span 5) */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Request Context</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Reference No</p>
                    <p className="font-mono font-black text-blue-600 text-lg tracking-tighter leading-none">{request.reference_number}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Applicant Name</p>
                    <p className="font-extrabold text-gray-900 uppercase text-sm tracking-tight leading-relaxed">{request.applicant_name || request.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Current Stage</p>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                      {request.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed opacity-80">
                  Review the details carefully. This action will be logged in the official audit trail and cannot be undone once confirmed.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Actions (Span 7) */}
            <div className="md:col-span-7 flex flex-col gap-6">

              {/* Comments Section */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-1 transition-all focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-300">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-full p-5 bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-700 placeholder:text-gray-300 resize-none rounded-xl"
                  placeholder={actionType === 'approve'
                    ? "Add optional notes, remarks, or specific instructions for the next step..."
                    : "REQUIRED: Please provide a detailed justification for this decision..."}
                />
              </div>

              {/* Signature Block (Conditional) */}
              {canUseEsign && (
                <div className="mt-auto border-t-2 border-dashed border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                        <Shield className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-black  text-gray-900 uppercase tracking-widest">Digital Authorization</p>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{isEsignRole ? currentStep.officialRole : 'Official Sign'}</p>
                  </div>

                  <div className="bg-white rounded-xl border border-blue-200 p-1 shadow-sm">
                    {!showSignPad && (userSignature || tempSignature) ? (
                      <div
                        className="relative h-28 flex items-center justify-center rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 cursor-pointer overflow-hidden group transition-all"
                        onClick={() => setShowSignPad(true)}
                      >
                        <img src={tempSignature || userSignature} className="h-full object-contain p-2" alt="Sign" />
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-200 px-3 py-1 rounded bg-blue-50">Click to Resign</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                        <SignaturePad onSignatureChange={setTempSignature} height={120} label="" />
                        <div className="flex bg-gray-50 border-t border-gray-200">
                          <button onClick={() => setTempSignature(null)} className="flex-1 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-800 uppercase">Clear</button>
                          <div className="w-px bg-gray-200"></div>
                          <button onClick={() => setShowSignPad(false)} className="flex-1 py-2 text-[10px] font-black text-blue-600 hover:bg-blue-50 uppercase">Confirm</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Landscape Footer */}
        <div className="px-8 py-5 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-3 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {actionType === 'approve' && canUseEsign ? (
              <>
                <button
                  onClick={() => onSubmit(null)}
                  disabled={processing}
                  className="px-6 py-3 rounded-xl border-2 border-gray-100 text-[11px] font-black text-gray-600 uppercase tracking-widest hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Skip Signature
                </button>
                <button
                  onClick={() => onSubmit(tempSignature || userSignature)}
                  disabled={processing || (!tempSignature && !userSignature)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PenTool className="w-4 h-4" />}
                  Sign & {currentStep?.status === 'captain_approval' ? 'Approve' : 'Forward'}
                </button>
              </>
            ) : (
              <button
                onClick={() => onSubmit(null)}
                disabled={processing || (['reject', 'return'].includes(actionType) && !comment.trim())}
                className={`px-8 py-3 ${cfg.buttonBg} text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <cfg.icon className="w-4 h-4" />}
                {cfg.buttonText}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Default officials data (fallback) - Same as BarangayClearanceModal
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

// Certificate Preview Modal Component
function CertificatePreviewModal({ request, onClose, onBack, getTypeLabel }) {
  const certificateRef = useRef(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentDate, setCurrentDate] = useState('');

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/workflow-assignments/history/${request.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    // Fetch officials from API for real-time sync
    const fetchOfficials = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/officials/config`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        if (data.success && data.data) {
          // Merge with defaults to ensure structure
          setOfficials(prev => ({ ...defaultOfficials, ...data.data }));

          // Also update localStorage to keep it fresh
          localStorage.setItem('barangayOfficials', JSON.stringify({ ...defaultOfficials, ...data.data }));
        } else {
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error fetching officials config:', error);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedOfficials = localStorage.getItem('barangayOfficials');
      if (savedOfficials) {
        try {
          const parsed = JSON.parse(savedOfficials);
          setOfficials(prev => ({ ...defaultOfficials, ...parsed }));
        } catch (e) {
          console.error('Error parsing saved officials', e);
        }
      }
    };

    fetchOfficials();
    fetchHistory();

    // Set current date
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getTypeLabel(request.certificate_type)} - ${request.reference_number}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @page {size: A4 portrait; margin: 0; }
              @media print {
                html, body {width: 210mm; height: 297mm; margin: 0; padding: 0; }
              * {-webkit - print - color - adjust: exact !important; print-color-adjust: exact !important; }
          }
              body {margin: 0; padding: 0; display: flex; justify-content: center; }
              .certificate {width: 210mm; min-height: 297mm; padding: 8mm; box-sizing: border-box; background: white; }
            </style>
        </head>
        <body>
          <div class="certificate">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function () {
                window.print();
                window.close();
              }, 500); 
          };
          </script>
        </body>
      </html>
      `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${request.reference_number}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Could not generate PDF. Please try printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/80">
      <div className="flex min-h-screen items-start justify-center p-4 pt-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg mr-2"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Certificate Preview</h2>
                <p className="text-purple-200 text-sm">{request.reference_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm disabled:opacity-50"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download
              </button>              <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg ml-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Certificate Preview - Using exact same template as BarangayClearanceModal */}
          <div className="p-6 bg-gray-100 overflow-y-auto max-h-[calc(100vh-150px)]">
            <ClearancePreviewForRequests
              request={request}
              currentDate={currentDate}
              officials={officials}
              certificateRef={certificateRef}
              history={history}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Certificate Preview Component - Exact copy from BarangayClearanceModal
function ClearancePreviewForRequests({ request, currentDate, officials, certificateRef, history = [] }) {
  const logos = officials.logos || {};
  const headerStyle = officials.headerStyle || {};
  const countryStyle = officials.countryStyle || {};
  const provinceStyle = officials.provinceStyle || {};
  const municipalityStyle = officials.municipalityStyle || {};
  const barangayNameStyle = officials.barangayNameStyle || {};
  const officeNameStyle = officials.officeNameStyle || {};
  const sidebarStyle = officials.sidebarStyle || {};
  const bodyStyle = officials.bodyStyle || {};
  const footerStyle = officials.footerStyle || {};

  const getFontClass = (font) => ({ 'default': '', 'serif': 'font-serif', 'sans': 'font-sans', 'mono': 'font-mono' }[font] || '');

  // Map request data to formData format
  const formData = {
    fullName: request.applicant_name || request.full_name || '',
    age: request.age || '',
    sex: request.sex || '',
    civilStatus: request.civil_status || '',
    address: request.address || '',
    dateOfBirth: request.date_of_birth || '',
    placeOfBirth: request.place_of_birth || '',
    dateOfDeath: request.date_of_death || request.residents?.date_of_death || '',
    causeOfDeath: request.cause_of_death || request.residents?.cause_of_death || '',
    covidRelated: (request.covid_related ?? request.residents?.covid_related) ? 'Yes' : 'No',
    requestorName: request.requestor_name || '',
    guardianName: request.guardian_name || '',
    guardianRelationship: request.guardian_relationship || '',
    partnerFullName: request.partner_full_name || '',
    partnerAge: request.partner_age || '',
    partnerSex: request.partner_sex || '',
    partnerDateOfBirth: request.partner_date_of_birth || '',
    noOfChildren: request.no_of_children || '',
    livingTogetherYears: request.living_together_years || '',
    livingTogetherMonths: request.living_together_months || '',
    dateOfExamination: request.date_of_examination || '',
    usapingBarangay: request.usaping_barangay || '',
    dateOfHearing: request.date_of_hearing || '',
    purpose: Array.isArray(request.purpose) ? request.purpose.join('\n') : (request.purpose || '')
  };

  const isNaturalDeath =
    String(request.certificate_type || '').toLowerCase().includes('death') ||
    String(request.purpose || '').toLowerCase().includes('death') ||
    String(request.reference_number || '').toUpperCase().startsWith('ND');

  const isGuardianship =
    String(request.certificate_type || '').toLowerCase().includes('guardian') ||
    String(request.reference_number || '').toUpperCase().startsWith('GD');

  const isCohabitation =
    String(request.certificate_type || '').toLowerCase().includes('cohabitation') ||
    String(request.reference_number || '').toUpperCase().startsWith('CH');

  const isMedicoLegal =
    String(request.certificate_type || '').toLowerCase().includes('medico') ||
    String(request.reference_number || '').toUpperCase().startsWith('CDL');

  const isSamePerson =
    String(request.certificate_type || '').toLowerCase().includes('same_person') ||
    String(request.certificate_type || '').toLowerCase().includes('same person');

  const isBusinessPermit = String(request.certificate_type || '').toLowerCase() === 'business_permit';

  // Parse details if string
  let additionalDetails = {};
  try {
    if (typeof request.details === 'string') {
      additionalDetails = JSON.parse(request.details);
    } else if (typeof request.details === 'object') {
      additionalDetails = request.details || {};
    }
  } catch (e) { console.error('Error parsing details', e); }

  const name1 = request.name_1 || additionalDetails.name_1 || additionalDetails.fullName1 || formData.fullName;
  const name2 = request.name_2 || additionalDetails.name_2 || additionalDetails.fullName2 || '';

  // Determine Issued Date (Final Approval Date or Current Date)
  const captainApproval = history?.find(h =>
    h.action === 'approve' &&
    (h.step_name?.toLowerCase().includes('captain') || h.step_name?.toLowerCase().includes('chairman') || h.officialRole === 'Brgy. Captain' || h.official_role === 'Brgy. Captain')
  );

  const issuedDate = captainApproval?.created_at
    ? new Date(captainApproval.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-1 flex justify-center print:p-0">
      {/* A4 Size Container - 210mm x 297mm */}
      <div ref={certificateRef} className={`certificate-container bg-white shadow-lg print:shadow-none flex flex-col ${getFontClass(bodyStyle.fontFamily)}`} style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box' }}>

        {/* Header Section */}
        <div className={`w-full border-b flex justify-center items-center pt-4 pb-6 px-8 flex-shrink-0 ${getFontClass(headerStyle.fontFamily)}`}
          style={{
            backgroundColor: headerStyle.bgColor,
            borderColor: headerStyle.borderColor
          }}>
          {/* Left Logo */}
          <div style={{
            width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            marginRight: `${headerStyle.logoSpacing || 0}px`
          }} className="flex-shrink-0">
            {logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}
          </div>

          {/* Text Content */}
          <div className="text-center flex flex-col justify-center">
            <p className={getFontClass(countryStyle.fontFamily)} style={{ color: countryStyle.color, fontSize: '13px', fontWeight: countryStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.country || 'Republic of the Philippines'}</p>
            <p className={getFontClass(provinceStyle.fontFamily)} style={{ color: provinceStyle.color, fontSize: '13px', fontWeight: provinceStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.province || 'Province of Bulacan'}</p>
            <p className={getFontClass(municipalityStyle.fontFamily)} style={{ color: municipalityStyle.color, fontSize: '13px', fontWeight: municipalityStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.municipality || 'Municipality of Calumpit'}</p>
            <p className="mt-1 uppercase" style={{ color: barangayNameStyle.color || '#1e40af', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>{officials.headerInfo?.barangayName || "BARANGAY IBA O' ESTE"}</p>
            <p className="mt-2 text-red-700 font-bold uppercase tracking-wider" style={{ fontSize: '14px' }}>OFFICE OF THE BARANGAY CHAIRMAN</p>
          </div>

          {/* Right Logo */}
          <div style={{
            width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            marginLeft: `${headerStyle.logoSpacing || 0}px`
          }} className="flex-shrink-0">
            {logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 relative">
          {/* Sidebar (Conditional) - Only show if enabled AND content exists AND not Medico Legal AND not Business Permit */}
          {(sidebarStyle.showSidebar && !isMedicoLegal && !isBusinessPermit) && (
            <div className={`w-64 p-6 flex flex-col text-center flex-shrink-0 ${getFontClass(sidebarStyle.fontFamily)}`} style={{
              background: `linear-gradient(to bottom, ${sidebarStyle.bgColor || '#1e40af'}, ${sidebarStyle.gradientEnd || '#1e3a8a'})`,
              color: sidebarStyle.textColor || '#ffffff'
            }}>
              {/* Reuse existing sidebar structure if needed, or simplify to match layout. Keeping simple consistency. */}
              <div className="text-center mb-4">
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px` }}>BARANGAY</p>
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px` }}>IBA O' ESTE</p>
              </div>
              {/* ... officials list preserved in simplified form or assume existing structure matches ... */}
              {/* For brevity in this large replacement, I'll render the key officials similar to before */}
              <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <p className="font-bold mb-3" style={{ fontSize: `${(sidebarStyle.titleSize || 13) + 2}px`, color: sidebarStyle.labelColor }}>BARANGAY COUNCIL</p>
                <div className="mb-3">
                  <div className="mb-2 w-24 h-32 mx-auto bg-black/10 rounded overflow-hidden">
                    {logos.captainImage && <img src={logos.captainImage} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs opacity-80">Punong Barangay</p>
                  <p className="font-semibold text-sm">{officials.chairman}</p>
                </div>
                {officials.councilors?.slice(0, 7).map((c, i) => <p key={i} className="text-xs leading-snug">{c}</p>)}
              </div>
            </div>
          )}

          {/* Document Body */}
          <div className="flex-1 px-20 pt-6 pb-2 relative flex flex-col" style={{ backgroundColor: bodyStyle.bgColor || '#ffffff', color: bodyStyle.textColor || '#000000', fontFamily: bodyStyle.fontFamily }}>
            {/* Watermark */}
            {logos.leftLogo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                <img src={logos.leftLogo} className="w-3/4 object-contain" alt="Watermark" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center flex-1">
              {!isBusinessPermit && (
                <h2 className="text-center font-bold mb-10 border-b-4 border-black inline-block pb-1 px-4 uppercase leading-normal" style={{
                  color: isMedicoLegal ? '#000000' : '#004d40',
                  fontSize: '24px',
                  borderBottom: isMedicoLegal ? '2px solid black' : '4px solid black'
                }}>
                  {isNaturalDeath ? 'NATURAL DEATH CERTIFICATION' :
                    isGuardianship ? 'BARANGAY CERTIFICATION FOR GUARDIANSHIP' :
                      isCohabitation ? 'BARANGAY CERTIFICATION OF CO-HABITATION' :
                        isSamePerson ? 'BARANGAY CERTIFICATION BEING THE SAME PERSON' :
                          isMedicoLegal ? 'REQUEST FOR MEDICO LEGAL (COPY)' :
                            request.certificate_type === 'barangay_clearance' ? 'BARANGAY CLEARANCE CERTIFICATE' :
                              request.certificate_type === 'certificate_of_indigency' ? 'CERTIFICATE OF INDIGENCY' :
                                request.certificate_type === 'barangay_residency' ? 'BARANGAY RESIDENCY CERTIFICATE' : 'CERTIFICATE'}
                </h2>
              )}

              {isBusinessPermit ? (
                <div className="w-full text-[11px] print:text-[11px]">
                  <h2 className="text-center font-bold uppercase mb-4 tracking-wide" style={{ color: '#880000', fontSize: '16px', letterSpacing: '0.05em' }}>
                    BARANGAY BUSINESS CLEARANCE APPLICATION FORM
                  </h2>

                  {/* Application Info Table */}
                  <table className="w-full border-collapse border border-black mb-4 font-bold">
                    <tbody>
                      <tr>
                        <td className="border border-black p-1.5 w-[35%]">DATE OF APPLICATION AND NO.</td>
                        <td className="border border-black p-1.5 w-[35%] font-normal">
                          {request.applicationDate ? new Date(request.applicationDate).toLocaleDateString('en-US') : (request.created_at ? new Date(request.created_at).toLocaleDateString('en-US') : '')}
                        </td>
                        <td className="border border-black p-1.5 w-[30%] text-center text-red-700 font-bold">
                          {request.applicationNo || request.reference_number || '2026 -'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5" colSpan="3">OWNER'S DETAILS</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">FULL NAME</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">{request.ownerFullName || additionalDetails.ownerFullName || formData.fullName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">COMPLETE ADDRESS</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">{request.ownerAddress || additionalDetails.ownerAddress || formData.address}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">BUSINESS NAME</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">{request.businessName || additionalDetails.businessName || ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">NATURE OF BUSINESS</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">{request.natureOfBusiness || additionalDetails.natureOfBusiness || ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">BUSINESS COMPLETE ADDRESS</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">{request.businessAddress || additionalDetails.businessAddress || ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-normal">CONTACT PERSON / NUMBER</td>
                        <td className="border border-black p-1.5 font-bold" colSpan="2">
                          {request.contactPerson || additionalDetails.contactPerson || request.ownerFullName || additionalDetails.ownerFullName || formData.fullName} / {request.contactNumber || additionalDetails.contactNumber || request.contact_number || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="font-bold mb-1">A. ACTIONS TAKEN BY INSPECTION COMMITTEE:</p>
                  <table className="w-full border-collapse border border-black text-center mb-4">
                    <thead>
                      <tr className="font-bold">
                        <td className="border border-black p-1.5 w-[25%]">AREAS</td>
                        <td className="border border-black p-1.5 w-[35%]">FINDINGS AND RECOMMENDATIONS</td>
                        <td className="border border-black p-1.5 w-[20%]">DATE OF INSPECTION</td>
                        <td className="border border-black p-1.5 w-[20%]">REMARKS</td>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-left">
                      {[
                        'HEALTH AND SAFETY', 'SANITATION', 'HEALTH HAZARD', 'BUILDING PERMIT',
                        'FIRE EXIT / HAZARD', 'ENVIRONMENT', 'WASTE MANAGEMENT', 'HAZARDOUS WASTE',
                        'OTHERS', 'COMPLAINTS, ETC.'
                      ].map((area, idx) => (
                        <tr key={idx} className="h-6">
                          <td className="border border-black p-1 pl-2 text-[10px]">{area}</td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-col gap-4 mb-6 font-bold">
                    <div className="flex items-center gap-2">
                      <span>DATE AND TIME OF VISIT:</span>
                      <div className="flex-1 border-b border-black h-4"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>NAME OF OWNER / REPRESENTATIVE AND SIGNATURE:</span>
                      <div className="flex-1 border-b border-black h-4"></div>
                    </div>
                  </div>

                  <p className="font-bold mb-1">B. RECOMMENDING APPROVAL</p>
                  <table className="w-full border-collapse border border-black text-center mb-8">
                    <thead>
                      <tr className="font-bold">
                        <td className="border border-black p-1.5 w-[30%]">NAME</td>
                        <td className="border border-black p-1.5 w-[30%]">COMMITTEE</td>
                        <td className="border border-black p-1.5 w-[15%]">DATE</td>
                        <td className="border border-black p-1.5 w-[25%]">SIGNATURE</td>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {['HEALTH', 'ENVIRONMENT', 'INFRASTRUCTURE', 'PEACE & ORDER'].map((committee, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="border border-black p-1 text-left pl-2">{idx + 1}.</td>
                          <td className="border border-black p-1 text-[10px]">{committee}</td>
                          <td className="border border-black p-1"></td>
                          <td className="border border-black p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="font-bold mb-6">C. APPROVAL</p>
                  <div className="flex flex-col mb-4 relative ml-4">
                    {/* Optional e-signature rendering if available and wanted on business permits */}
                    <p className="font-bold text-[14px]">ALEXANDER C. MANIO</p>
                    <p className="font-bold text-[13px]">BARANGAY CHAIRMAN</p>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6 text-justify" style={{ fontSize: '15px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <p className="font-bold text-lg">TO WHOM IT MAY CONCERN:</p>
                  </div>  {/* Date removed for Indigency as per new layout */}

                  <>
                    <div className="text-left mb-6 leading-relaxed">
                      {isNaturalDeath ? (
                        <p>This is to certify that below mentioned person, a bona fide resident of this barangay has died at his residence and classified as "Natural Death":</p>
                      ) : isGuardianship ? (
                        <p className="uppercase">
                          THIS IS TO CERTIFY THAT BELOW PERSON IS UNDER THE GUARDIANSHIP OF <span className="font-bold">{formData.guardianName?.toUpperCase() || "_________________________________"}</span>, BOTH BONA FIDE RESIDENTS OF THIS BARANGAY:
                        </p>
                      ) : isCohabitation ? (
                        <p className="uppercase">
                          THIS IS TO CERTIFY THAT BELOW MENTIONED PERSONS, BONA FIDE RESIDENTS OF THIS BARANGAY AT <span className="font-bold">{formData.address?.toUpperCase() || '____________________'}</span>, ARE LIVING TOGETHER IN COMMON HOUSE (YET TO UNDERGO CHURCH / CIVIL WEDDING) AS DETAILED BELOW:
                        </p>
                      ) : isMedicoLegal ? (
                        <div className="space-y-6">
                          <p className="font-bold uppercase">GREETINGS!</p>
                          <p className="uppercase">
                            KINDLY REQUESTING YOUR GOOD OFFICE TO FURNISH US A COPY OF "MEDICO LEGAL" OF YOUR BELOW MENTIONED PATIENT IN AIDE OF RECONCILIATORY MEETING / HEARING OF INVOLVED INDIVIDUALS TO BE HELD IN THIS BARANGAY AS DETAILED BELOW:
                          </p>
                        </div>
                      ) : isSamePerson ? (
                        <p>This is to certify that below names belongs to one and the same person, bona fide resident of this barangay as described herein:</p>
                      ) : (
                        <p>
                          {request.certificate_type === 'barangay_clearance' ?
                            'This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:' :
                            request.certificate_type === 'certificate_of_indigency' ?
                              'This is to certify that below mentioned person is a bona fide resident and their family belongs to the "Indigent Families" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:' :
                              'This is to certify that below mentioned person is a bona fide resident of this barangay as detailed below:'}
                        </p>
                      )}
                    </div>

                    <div className="mb-6 space-y-1">
                      {(() => {
                        const getLabels = () => {
                          if (isMedicoLegal) {
                            return [
                              ['REQUEST DATE', issuedDate.toUpperCase()],
                              ['NAME', formData.fullName?.toUpperCase()],
                              ['AGE', formData.age],
                              ['SEX', (request.sex || formData.sex || 'N/A').toUpperCase()],
                              ['RESIDENTIAL ADDRESS', formData.address?.toUpperCase()],
                              ['DATE OF BIRTH', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'N/A'],
                              ['DATE OF EXAMINATION', formData.date_of_examination || formData.dateOfExamination ? new Date(formData.date_of_examination || formData.dateOfExamination).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'NOT RECORDED'],
                              ['USAPING BARANGAY NO.', formData.usaping_barangay || formData.usapingBarangay || 'NOT RECORDED'],
                              ['DATE OF HEARING', formData.date_of_hearing || formData.dateOfHearing ? new Date(formData.date_of_hearing || formData.dateOfHearing).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'NOT RECORDED']
                            ];
                          }

                          let baseLabels = [
                            ['NAME', formData.fullName?.toUpperCase()],
                            ['AGE', formData.age],
                            ['SEX', formData.sex?.toUpperCase()],
                          ];

                          if (!isCohabitation) {
                            baseLabels.push(['CIVIL STATUS', formData.civilStatus?.toUpperCase()]);
                            baseLabels.push(['RESIDENTIAL ADDRESS', formData.address?.toUpperCase()]);
                          }

                          let extraLabels = [];
                          if (isNaturalDeath) {
                            extraLabels = [
                              ['DATE OF DEATH', formData.dateOfDeath ? new Date(formData.dateOfDeath).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                              ['CAUSE OF DEATH', formData.causeOfDeath?.toUpperCase()],
                              ['COVID-19 RELATED', formData.covidRelated?.toUpperCase()]
                            ];
                          } else if (isGuardianship) {
                            extraLabels = [
                              ['DATE OF BIRTH', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                              ["GUARDIAN'S RELATIONSHIP", formData.guardianRelationship?.toUpperCase()]
                            ];
                          } else if (isCohabitation) {
                            extraLabels = [
                              ['NAME', formData.partnerFullName?.toUpperCase()],
                              ['AGE', formData.partnerAge],
                              ['SEX', formData.partnerSex?.toUpperCase()],
                              ['DATE OF BIRTH', formData.partnerDateOfBirth ? new Date(formData.partnerDateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                              ['NO. OF CHILDREN', formData.noOfChildren],
                              ['DURATION', `${formData.livingTogetherYears} YEAR(S) AND ${formData.livingTogetherMonths} MONTH(S)`]
                            ];
                          } else {
                            extraLabels = [
                              ['DATE OF BIRTH', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                              ['PLACE OF BIRTH', formData.placeOfBirth?.toUpperCase()]
                            ];
                          }

                          if (isSamePerson) {
                            // Override entirely for same person
                            return [
                              ['Name (1)', name1?.toUpperCase()],
                              ['Name (2)', name2?.toUpperCase()],
                              ['Residential Address', formData.address?.toUpperCase()],
                              ['Age', formData.age],
                              ['Sex', formData.sex?.toUpperCase()],
                              ['Civil Status', formData.civilStatus?.toUpperCase()],
                              ['Date of Birth', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '']
                            ];
                          }


                          return baseLabels.concat(extraLabels);
                        };

                        return getLabels().map(([label, value], idx) => {
                          const isPartnerSeparator = isCohabitation && idx === 3;
                          const isCohabChildrenSeparator = isCohabitation && idx === 7;
                          const isMedicoExam = isMedicoLegal && label === 'DATE OF EXAMINATION';
                          const isBoldRow = isMedicoLegal && (label === 'USAPING BARANGAY NO.' || label === 'DATE OF HEARING');

                          return (
                            <div
                              key={`${label}-${idx}`}
                              className={`grid grid-cols-[180px_10px_1fr] items-baseline text-black ${isBoldRow ? 'font-bold' : ''}`}
                              style={{ marginTop: (isPartnerSeparator || isCohabChildrenSeparator) ? '24px' : '0' }}
                            >
                              <span className={isSamePerson ? "font-bold" : "font-normal"}>
                                {isMedicoExam ? (
                                  <div className="flex flex-col">
                                    <span>DATE OF EXAMINATION /</span>
                                    <span>CONFINEMENT</span>
                                  </div>
                                ) : label}
                              </span>
                              <span className="font-normal">:</span>
                              <span className={label === 'NAME' || label === 'Name' || isBoldRow || isSamePerson ? 'font-bold' : 'font-normal'}>
                                {String(value || '_________________').toUpperCase()}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {isNaturalDeath || isGuardianship || isCohabitation || isSamePerson ? (
                      <p className={`mb-10 text-left leading-relaxed ${(isGuardianship || isCohabitation) ? 'uppercase' : ''}`}>
                        Issued this {isSamePerson ? issuedDate : issuedDate.toUpperCase()} at Barangay Iba O' Este, Calumpit, Bulacan upon the request of <span className={(isGuardianship || isCohabitation || isSamePerson) ? "" : "font-bold"}>{(isGuardianship || isCohabitation || isSamePerson) ? (isSamePerson ? "above mentioned persons" : "ABOVE MENTIONED PERSONS") : (formData.requestorName ? formData.requestorName.toUpperCase() : "THE ABOVE PERSON'S RELATIVES")}</span> for any legal purposes it may serve.
                      </p>
                    ) : isMedicoLegal ? (
                      <div className="space-y-6">
                        <p className="text-left leading-relaxed uppercase">
                          YOU MAY PLEASE HANDOVER THE REQUESTED "MEDICO LEGAL" TO YOUR ABOVE PATIENT DIRECTLY. PRAYING FOR YOUR FAVORABLE RESPONSE AND ASSISTANCE. KEEP SAFE AND GOD BLESS!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <p className="mb-3">
                            Being issued upon the request of above mentioned person for below purpose(s):
                          </p>
                          <div className="pl-8 space-y-1 font-bold">
                            {formData.purpose ? (
                              formData.purpose.split('\n').map((line, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <span>{idx + 1}.</span>
                                  <span>{line.toUpperCase()}</span>
                                </div>
                              ))
                            ) : (
                              <p>• PURPOSE NOT SPECIFIED</p>
                            )}
                          </div>
                        </div>

                        <p className="mb-10 text-left">
                          Issued this {issuedDate} at Barangay Iba O' Este, Calumpit, Bulacan.
                        </p>
                      </>
                    )}

                    {/* Unified Signature Section (Left Aligned for All) */}
                    <div
                      className="relative text-left"
                      style={{
                        marginTop: (isGuardianship || isCohabitation || isMedicoLegal || isSamePerson) ? '120px' : (request.certificate_type === 'certificate_of_indigency' ? '32px' : '64px')
                      }}
                    >
                      {isNaturalDeath && <div className="h-10"></div>}
                      {!isNaturalDeath && !isGuardianship && !isCohabitation && !isMedicoLegal && !isSamePerson && (
                        <div className={`${request.certificate_type === 'certificate_of_indigency' ? 'mb-8' : 'mb-12'}`}>
                          <div className={`${request.certificate_type === 'certificate_of_indigency' ? 'h-12' : 'h-16'}`}></div>
                          <div className="border-t border-black w-64 pt-1">
                            <p className="text-[15px]">Resident's Signature / Thumb Mark</p>
                          </div>
                        </div>
                      )}

                      <div className="text-left mb-4 self-start">
                        <p className="font-bold text-[15px] mb-12">TRULY YOURS,</p>

                        <div className="relative inline-block">
                          {/* Big Backdrop Signature centered horizontally but positioned above name */}
                          {captainApproval?.signature_data && (
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[80%] w-60 h-32 pointer-events-none flex items-center justify-center z-20" style={{ mixBlendMode: 'multiply' }}>
                              <img src={captainApproval.signature_data} className="w-full h-full object-contain" alt="Captain Sig" />
                            </div>
                          )}

                          <p className="uppercase font-bold mb-1 relative z-10" style={{ fontSize: '20px' }}>
                            {officials.chairman}
                          </p>

                          <div className="relative flex items-center z-10">
                            <p className="text-[15px] font-bold shrink-0">BARANGAY CHAIRMAN</p>

                            {/* Additional Forwarder Signatures (Backdrop Overlay - does not affect text layout) */}
                            <div className="absolute left-32 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
                              {(() => {
                                const seenSignatories = new Set();
                                return history
                                  ?.filter(h => {
                                    if (h.action !== 'approve' || !h.signature_data) return false;

                                    // Skip captain/chairman signatures as they are handled separately above
                                    const isCaptain = h.step_name?.toLowerCase().includes('captain') ||
                                      h.step_name?.toLowerCase().includes('chairman') ||
                                      h.officialRole === 'Brgy. Captain' ||
                                      h.official_role === 'Brgy. Captain';
                                    if (isCaptain) return false;

                                    // Unique per person
                                    if (seenSignatories.has(h.performed_by)) return false;
                                    seenSignatories.add(h.performed_by);
                                    return true;
                                  })
                                  .map((sigEntry, idx) => (
                                    <div key={idx} className="h-12 w-28">
                                      <img
                                        src={sigEntry.signature_data}
                                        className="h-full w-full object-contain"
                                        alt="Official Sig"
                                      />
                                    </div>
                                  ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                </div>
              )}

              {/* Reference Number Section */}
              <div className="w-full text-right mt-auto mb-2">
                <p className="text-sm">Reference No: <strong>{request.reference_number || request.id}</strong></p>
              </div>

              {/* Footer Divider and info */}
              <div className="w-full border-t border-gray-400 pt-1 text-[11px] leading-tight pb-4">
                <div className="flex flex-col items-start text-gray-700 gap-0.5">
                  <p><strong>Address:</strong> {officials.contactInfo?.address}</p>
                  <p><strong>Contact:</strong> {officials.contactInfo?.contactPerson} Tel No.: {officials.contactInfo?.telephone} email: {officials.contactInfo?.email}</p>
                </div>
              </div>
            </div>

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
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirm Certificate Pickup
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-green-600 uppercase font-black tracking-wider mb-2">Certificate Details</p>
              <p className="text-xl font-mono font-bold text-green-900 mb-1">{certificate.reference_number}</p>
              <p className="text-sm font-medium text-green-800 mb-3">{getTypeLabel(certificate.certificate_type)}</p>

              <div className="pt-3 border-t border-green-200">
                <p className="text-xs text-green-600 uppercase font-black tracking-wider mb-1">Registered Applicant</p>
                <p className="text-lg font-bold text-green-900">{certificate.full_name || certificate.applicant_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Name of Person Picking Up *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Enter receiver's full name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-medium"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && pickupName.trim() && onConfirm()}
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Please verify the ID of the person picking up the certificate.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm()}
                disabled={confirming || !pickupName.trim()}
                className="flex-[2] px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Pickup
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

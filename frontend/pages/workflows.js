import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import {
  GitBranch, Plus, Edit2, Trash2, Save, X, ChevronRight,
  CheckCircle, Clock, UserCheck, FileText, AlertCircle,
  ArrowUp, ArrowDown, GripVertical, Settings, Eye, Users, Mail, Shield, Briefcase
} from 'lucide-react';
import { isAuthenticated, getUserData, getAuthToken } from '@/lib/auth';
// API Configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api').replace(/\/$/, '').replace(/\/api$/, '') + '/api';
const MASTER_WORKFLOW_ID = 'master_certificate_flow';

// Certificate types
const certificateTypes = [
  { id: 'barangay_clearance', name: 'Barangay Clearance', color: 'blue', isUnified: true },
  { id: 'certificate_of_indigency', name: 'Certificate of Indigency', color: 'green', isUnified: true },
  { id: 'barangay_residency', name: 'Barangay Residency', color: 'orange', isUnified: true },
  { id: 'business_permit', name: 'Business Permit', color: 'purple', isUnified: false },
  { id: 'natural_death', name: 'Natural Death', color: 'red', isUnified: true },
  { id: 'medico_legal', name: 'Medico Legal', color: 'pink', isUnified: true },
  { id: 'barangay_guardianship', name: 'Barangay Guardianship', color: 'indigo', isUnified: true },
  { id: 'barangay_cohabitation', name: 'Barangay Cohabitation', color: 'teal', isUnified: true },
  { id: 'certification_same_person', name: 'Certify Same Person', color: 'yellow', isUnified: true }
];

// Default workflow steps
const defaultSteps = [
  { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
  { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
  { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
  { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true }
];

const iconOptions = [
  { name: 'FileText', icon: FileText },
  { name: 'Clock', icon: Clock },
  { name: 'UserCheck', icon: UserCheck },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Settings', icon: Settings },
  { name: 'Eye', icon: Eye }
];

const getIcon = (iconName) => {
  const found = iconOptions.find(i => i.name === iconName);
  return found ? found.icon : FileText;
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(MASTER_WORKFLOW_ID);
  const [workflows, setWorkflows] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [notification, setNotification] = useState(null);
  const [newStep, setNewStep] = useState({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false, officialRole: '' });
  const [users, setUsers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUserData();
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadWorkflows();
    loadUsers();
    setLoading(false);
  }, []);

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Users loaded:', data);
      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error('Failed to load users:', data.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadWorkflows = async () => {
    // First try to load from API (database)
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
        const data_workflows = data.data;
        if (data_workflows[MASTER_WORKFLOW_ID]) {
          setWorkflows(data_workflows);
        } else {
          // Migration/Initialization
          const initial = { ...data_workflows };
          if (!initial[MASTER_WORKFLOW_ID]) {
            initial[MASTER_WORKFLOW_ID] = data_workflows['barangay_clearance'] || defaultSteps;
          }
          if (!initial['business_permit']) {
            initial['business_permit'] = data_workflows['business_permit'] || defaultSteps;
          }
          setWorkflows(initial);
        }
        console.log('Workflows loaded from database');
        return;
      }
    } catch (error) {
      console.log('Could not load workflows from API, falling back to localStorage');
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('certificateWorkflows');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If saved workflows are still per-certificate (old format), migrate to master format
      if (parsed[MASTER_WORKFLOW_ID]) {
        setWorkflows(parsed);
      } else {
        const firstCertId = certificateTypes[0].id;
        const masterWorkflow = parsed[firstCertId] || defaultSteps;
        const initial = { [MASTER_WORKFLOW_ID]: masterWorkflow };
        setWorkflows(initial);
        localStorage.setItem('certificateWorkflows', JSON.stringify(initial));
      }
    } else {
      // Create initial state using default steps
      const initial = { [MASTER_WORKFLOW_ID]: JSON.parse(JSON.stringify(defaultSteps)) };
      setWorkflows(initial);
      localStorage.setItem('certificateWorkflows', JSON.stringify(initial));
    }
  };

  const saveWorkflows = async (updated) => {
    // Determine which workflow we are actually editing
    const certId = updated[selectedCertificate] ? selectedCertificate : (updated[MASTER_WORKFLOW_ID] ? MASTER_WORKFLOW_ID : selectedCertificate);
    let targetSteps = updated[certId] || workflows[certId] || JSON.parse(JSON.stringify(defaultSteps));

    // 🛡️ RE-ORDERING LOGIC - ENSURE SEQUENTIAL FLOW
    const staffReview = targetSteps.find(s => s.status === 'staff_review');
    const oicReview = targetSteps.find(s => s.status === 'oic_review' || s.name?.toLowerCase().includes('releasing'));
    const middleSteps = targetSteps.filter(s => s.status !== 'staff_review' && s.status !== 'oic_review' && !s.name?.toLowerCase().includes('releasing'));

    const orderedSteps = [];
    if (staffReview) {
      const stepName = certId === MASTER_WORKFLOW_ID ? 'Review Request Team' : (staffReview.name || 'Initial Review');
      orderedSteps.push({ ...staffReview, name: stepName, requiresApproval: true });
    }

    orderedSteps.push(...middleSteps);

    if (oicReview) {
      const stepName = certId === MASTER_WORKFLOW_ID ? 'Releasing Team' : (oicReview.name || 'Final Releasing');
      orderedSteps.push({ ...oicReview, name: stepName, requiresApproval: true });
    }

    // Prepare the final state
    const unifiedWorkflows = { ...workflows, ...updated, [certId]: orderedSteps };

    // Sync master steps ALWAYS to unified certificates
    if (certId === MASTER_WORKFLOW_ID) {
      certificateTypes.filter(c => c.isUnified).forEach(cert => {
        unifiedWorkflows[cert.id] = JSON.parse(JSON.stringify(orderedSteps));
      });
    }

    // Update local state and storage
    setWorkflows(unifiedWorkflows);
    localStorage.setItem('certificateWorkflows', JSON.stringify(unifiedWorkflows));

    // Save to API (database)
    try {
      const token = getAuthToken();
      const validCertTypes = certificateTypes.map(c => c.id);
      const filteredWorkflows = {};
      Object.keys(unifiedWorkflows).forEach(key => {
        if (validCertTypes.includes(key)) {
          filteredWorkflows[key] = unifiedWorkflows[key];
        }
      });

      console.log('[DEBUG] Saving to database:', filteredWorkflows);

      const response = await fetch(`${API_URL}/workflows`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workflows: filteredWorkflows })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('[EROR] API Save failed:', data);
        showNotificationMsg('error', data.message || 'Database error: ' + (data.details || 'Check console'));
        return;
      }

      showNotificationMsg('success', 'Workflow successfully saved to database!');
    } catch (error) {
      console.error('[ERROR] Network error saving to API:', error);
      showNotificationMsg('success', 'Workflow saved locally (network error for database sync)');
    }
  };

  const syncWorkflowAssignments = async () => {
    setSyncing(true);
    try {
      const token = getAuthToken();

      // FIRST: Save the current workflows to database (including assignedUsers)
      const unifiedWorkflows = JSON.parse(JSON.stringify(workflows));

      // Force master steps to unified certs before sync
      const masterSteps = workflows[MASTER_WORKFLOW_ID] || [];
      certificateTypes.filter(c => c.isUnified).forEach(cert => {
        unifiedWorkflows[cert.id] = JSON.parse(JSON.stringify(masterSteps));
      });

      // Ensure standalone workflows (like business_permit) have proper status fields
      certificateTypes.filter(c => !c.isUnified).forEach(cert => {
        const steps = unifiedWorkflows[cert.id];
        if (!steps || steps.length === 0) return;
        // Find and tag the first approval step as staff_review
        const firstApproval = steps.find(s => s.requiresApproval === true);
        if (firstApproval && !firstApproval.status) firstApproval.status = 'staff_review';
        // Find and tag the last step as oic_review
        const lastApproval = [...steps].reverse().find(s => s.requiresApproval === true);
        if (lastApproval && lastApproval !== firstApproval && !lastApproval.status) lastApproval.status = 'oic_review';
        unifiedWorkflows[cert.id] = steps;
      });

      // Save workflows to DB first
      const saveResponse = await fetch(`${API_URL}/workflows`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workflows: unifiedWorkflows })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save workflows to database');
      }

      console.log('Workflows saved to DB, now syncing assignments...');

      // THEN: Sync assignments (reads from DB)
      const response = await fetch(`${API_URL}/workflows/sync-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        showNotificationMsg('success', `Workflow assignments synced! Created ${data.data.totalAssignments} assignments across ${data.data.updatedSteps} steps.`);
        if (data.data.errors && data.data.errors.length > 0) {
          console.warn('Sync completed with errors:', data.data.errors);
          showNotificationMsg('warning', `Sync completed with ${data.data.errors.length} warnings. Check console for details.`);
        }
      } else {
        showNotificationMsg('error', data.message || 'Failed to sync workflow assignments');
      }
    } catch (error) {
      console.error('Error syncing workflow assignments:', error);
      showNotificationMsg('error', 'Failed to sync workflow assignments');
    } finally {
      setSyncing(false);
    }
  };

  const showNotificationMsg = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'success' ? 5000 : 3000);
  };

  const getCurrentSteps = () => workflows[selectedCertificate] || defaultSteps;

  // Filter out the automatic Releasing Team and Review Team steps from the main management list
  const getVisibleSteps = () => getCurrentSteps().filter(s => s.status !== 'oic_review' && s.status !== 'staff_review');

  const handleAddStep = () => {
    if (!newStep.name || !newStep.status) {
      showNotificationMsg('error', 'Please fill in step name and status');
      return;
    }
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: [...steps, { ...newStep, id: Date.now(), assignedUsers: [] }]
    };
    saveWorkflows(updated);
    setNewStep({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false, officialRole: '' });
    setShowAddStep(false);
  };

  const handleAssignUsers = (stepId, selectedUserIds) => {
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.map(s => s.id === stepId ? { ...s, assignedUsers: selectedUserIds } : s)
    };
    saveWorkflows(updated);
    setShowAssignModal(null);
  };

  const handleAssignReleasingTeam = (certId, stepId, selectedUserIds) => {
    let certSteps = workflows[certId] || [];

    // Check if the releasing step exists
    const releasingStepIndex = certSteps.findIndex(s => s.status === 'oic_review');

    let updatedSteps;
    if (releasingStepIndex !== -1) {
      // Update existing step
      updatedSteps = certSteps.map(s => s.status === 'oic_review' ? { ...s, assignedUsers: selectedUserIds } : s);
    } else {
      // Step missing (user might have deleted it), recreate it as the automatic last step
      const newReleasingStep = {
        id: Date.now(),
        name: 'Releasing Team',
        description: 'Processing approved certificate',
        status: 'oic_review',
        icon: 'Settings',
        autoApprove: false,
        assignedUsers: selectedUserIds,
        requiresApproval: true,
        sendEmail: true
      };
      updatedSteps = [...certSteps, newReleasingStep];
    }

    const updated = {
      ...workflows,
      [certId]: updatedSteps
    };
    saveWorkflows(updated);
    setShowAssignModal(null);
  };

  const handleAssignReviewTeam = (certId, stepId, selectedUserIds) => {
    let certSteps = workflows[certId] || [];

    // Check if the review step exists
    const reviewStepIndex = certSteps.findIndex(s => s.status === 'staff_review');

    let updatedSteps;
    if (reviewStepIndex !== -1) {
      // Update existing step
      updatedSteps = certSteps.map(s => s.status === 'staff_review' ? { ...s, assignedUsers: selectedUserIds } : s);
    } else {
      // Create new review step at the beginning
      const newReviewStep = {
        id: Date.now(),
        name: 'Review Request Team',
        description: 'Initial review of submitted requests',
        status: 'staff_review',
        icon: 'Eye',
        autoApprove: false,
        assignedUsers: selectedUserIds,
        requiresApproval: true,
        sendEmail: true
      };
      updatedSteps = [newReviewStep, ...certSteps];
    }

    const updated = {
      ...workflows,
      [certId]: updatedSteps
    };
    saveWorkflows(updated);
    setShowAssignModal(null);
  };

  const handleUpdateStep = (stepId, updates) => {
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    };
    saveWorkflows(updated);
    setEditingStep(null);
  };

  const handleDeleteStep = (stepId) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.filter(s => s.id !== stepId)
    };
    saveWorkflows(updated);
  };

  const handleMoveStep = (stepId, direction) => {
    const allSteps = [...getCurrentSteps()];
    const visibleSteps = allSteps.filter(s => s.status !== 'staff_review' && s.status !== 'oic_review');
    const index = visibleSteps.findIndex(s => s.id === stepId);

    if (index === -1) return; // Cannot move staff_review or oic_review via this method
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === visibleSteps.length - 1)) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [visibleSteps[index], visibleSteps[newIndex]] = [visibleSteps[newIndex], visibleSteps[index]];

    // Reconstruct allSteps with the new middle order
    const staffReview = allSteps.find(s => s.status === 'staff_review');
    const oicReview = allSteps.find(s => s.status === 'oic_review');

    const updatedSteps = [];
    if (staffReview) updatedSteps.push(staffReview);
    updatedSteps.push(...visibleSteps);
    if (oicReview) updatedSteps.push(oicReview);

    const updated = { ...workflows, [selectedCertificate]: updatedSteps };
    saveWorkflows(updated);
  };

  const handleResetToDefault = () => {
    if (!confirm('Reset workflow to default? This will remove all custom steps and assignments.')) return;
    const updated = { ...workflows, [selectedCertificate]: JSON.parse(JSON.stringify(defaultSteps)) };
    saveWorkflows(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentCert = certificateTypes.find(c => c.id === selectedCertificate);
  const visibleSteps = getVisibleSteps();
  const allSteps = getCurrentSteps();
  // Ensure preview always shows Releasing Team at the end if it exists
  const previewSteps = [...allSteps].sort((a, b) => {
    if (a.status === 'staff_review') return -1;
    if (b.status === 'staff_review') return 1;
    if (a.status === 'oic_review') return 1;
    if (b.status === 'oic_review') return -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-blue-600" />
            Approval Workflows
          </h1>
          <p className="text-gray-600 mt-1">Configure approval flow for each certificate type. Click "Save & Sync Assignments" to update the database with current assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={syncWorkflowAssignments}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {syncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Syncing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Sync Assignments
              </>
            )}
          </button>
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
            notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
              <AlertCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Workflow Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-fit mb-6">
        <button
          onClick={() => setSelectedCertificate(MASTER_WORKFLOW_ID)}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${selectedCertificate === MASTER_WORKFLOW_ID
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Unified (Clearance/Death/Etc.)
        </button>
        <button
          onClick={() => setSelectedCertificate('business_permit')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${selectedCertificate === 'business_permit'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Business Permit
        </button>
      </div>

      {/* Unified Workflow Header */}
      {selectedCertificate === MASTER_WORKFLOW_ID ? (
        <div className="bg-blue-600 rounded-xl shadow-md border border-blue-700 p-6 text-white text-center">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <Settings className="w-6 h-6" />
            Unified Certificate Workflow
          </h2>
          <p className="text-blue-100 mt-2 text-sm italic">
            Changes made here are applied to <b>Guardianship</b>, <b>Clearance</b>, <b>Death</b>, and other general certificates.
          </p>
        </div>
      ) : (
        <div className="bg-purple-600 rounded-xl shadow-md border border-purple-700 p-6 text-white text-center">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <Briefcase className="w-6 h-6" />
            Business Permit Workflow
          </h2>
          <p className="text-purple-100 mt-2 text-sm italic">
            This configuration is <b>exclusive</b> to Business Permits and does not affect other certificates.
          </p>
        </div>
      )}

      {/* Workflow Title */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-4 mb-4">
          {selectedCertificate === MASTER_WORKFLOW_ID ? 'Master Workflow Steps' : 'Business Permit Workflow Steps'}
        </h2>
        <p className="text-xs text-gray-400 italic mb-4">
          {selectedCertificate === MASTER_WORKFLOW_ID
            ? 'Common approval process for majority of barangay services.'
            : 'Custom process for business registrations and permits.'}
        </p>
      </div>

      {/* Review Request Team Table */}
      <div className={`z-10 mt-8 mb-4 bg-white rounded-xl shadow-2xl border-2 overflow-hidden transform transition-all ${selectedCertificate === MASTER_WORKFLOW_ID ? 'border-green-500' : 'border-purple-500'
        }`}>
        <div className={`p-4 border-b ${selectedCertificate === MASTER_WORKFLOW_ID ? 'bg-green-600 border-green-700' : 'bg-purple-600 border-purple-700'
          }`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Review Request Team ({selectedCertificate === MASTER_WORKFLOW_ID ? 'Global' : 'Exclusive'})
          </h2>
          <p className="text-xs text-white/80 mt-0.5">Assigned users will handle the initial review for <b>{selectedCertificate === MASTER_WORKFLOW_ID ? 'ALL UNIFIED' : 'BUSINESS PERMIT'}</b> requests.</p>
        </div>
        <div className="p-6">
          {(() => {
            const allSteps = getCurrentSteps();
            const reviewStep = allSteps.find(s => s.status === 'staff_review');

            return (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900">Assigned Review Officers</h4>
                  <p className="text-xs text-gray-500">These users are the first to receive and review submitted requests.</p>
                </div>

                <div className="flex-1 flex justify-center px-4">
                  {reviewStep && reviewStep.assignedUsers && reviewStep.assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {reviewStep.assignedUsers.map(userId => {
                        const user = users.find(u => (u._id === userId || u.id === userId));
                        return user ? (
                          <span key={userId} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs border border-green-200 font-bold">
                            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-[10px]">
                              {user.firstName?.charAt(0)}
                            </div>
                            {user.firstName} {user.lastName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic bg-gray-100 px-4 py-1 rounded-lg border border-dashed border-gray-300">No members assigned yet</span>
                  )}
                </div>

                <button
                  onClick={() => setShowAssignModal({ certId: selectedCertificate, stepId: reviewStep?.id || 'new_review', type: 'review' })}
                  className={`px-6 py-2 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${selectedCertificate === MASTER_WORKFLOW_ID ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                  Assign Team Members
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Approval & Releasing Flow Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Approval & Releasing Flow
              </h2>
              <p className="text-sm text-gray-500 mt-1">1 initial review phase + {visibleSteps.length} approval steps + 1 releasing phase</p>
            </div>
            <button
              onClick={() => setShowAddStep(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Approval Step
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4">
          {visibleSteps.map((step, index) => {
            const StepIcon = getIcon(step.icon);
            const isEditing = editingStep === step.id;

            return (
              <div key={step.id} className="relative">
                {index < visibleSteps.length - 1 && (
                  <div className="absolute left-6 top-20 w-0.5 h-6 bg-gray-300"></div>
                )}

                <div className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  {/* Reorder Buttons - Left Side */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveStep(step.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleMoveStep(step.id, 'down')}
                      disabled={index === visibleSteps.length - 1}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Step Number */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                    <StepIcon className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    {isEditing ? (
                      <EditStepForm
                        step={step}
                        onSave={(updates) => handleUpdateStep(step.id, updates)}
                        onCancel={() => setEditingStep(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{step.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {step.status}
                          </span>
                          {step.requiresApproval && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                              Requires Approval
                            </span>
                          )}
                          {step.sendEmail && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email Notify
                            </span>
                          )}
                          {step.officialRole && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                              {step.officialRole}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{step.description}</p>

                        {/* Assigned Users Section */}
                        {step.requiresApproval && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-blue-800 uppercase flex items-center gap-1">
                                <Users className="w-3 h-3" /> Assigned Approvers
                              </span>
                              <button
                                onClick={() => setShowAssignModal(step.id)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                Assign Users
                              </button>
                            </div>
                            {step.assignedUsers && step.assignedUsers.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {step.assignedUsers.map(userId => {
                                  const user = users.find(u => u._id === userId || u.id === userId);
                                  return user ? (
                                    <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-blue-800 rounded-full text-xs border border-blue-200">
                                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                                        {user.firstName?.charAt(0) || user.email?.charAt(0)}
                                      </div>
                                      {user.firstName} {user.lastName}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-blue-600 italic">Click "Assign Users" to add approvers</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit/Delete Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingStep(step.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {visibleSteps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No extra workflow steps configured</p>
              <button onClick={() => setShowAddStep(true)} className="mt-4 text-blue-600 hover:underline">
                Add an approval step
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unified Releasing Team Table */}
      <div className={`z-10 mt-8 mb-4 bg-white rounded-xl shadow-2xl border-2 overflow-hidden transform transition-all ${selectedCertificate === MASTER_WORKFLOW_ID ? 'border-blue-500' : 'border-purple-500'
        }`}>
        <div className={`p-4 border-b ${selectedCertificate === MASTER_WORKFLOW_ID ? 'bg-blue-600 border-blue-700' : 'bg-purple-600 border-purple-700'
          }`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Releasing Team ({selectedCertificate === MASTER_WORKFLOW_ID ? 'Unified' : 'Exclusive'})
          </h2>
          <p className="text-xs text-white/80 mt-0.5">Assigned users will handle the final processing for <b>{selectedCertificate === MASTER_WORKFLOW_ID ? 'ALL UNIFIED' : 'BUSINESS PERMIT'}</b> requests.</p>
        </div>
        <div className="p-6">
          {(() => {
            const masterSteps = getCurrentSteps();
            const captainIndex = masterSteps.findIndex(s => s.status === 'captain_approval');
            const releasingStep = masterSteps.find(s =>
              s.status === 'oic_review' ||
              s.name?.toLowerCase().includes('releasing')
            ) || (captainIndex !== -1 && captainIndex < masterSteps.length - 1 ? masterSteps[captainIndex + 1] : null);

            return (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900">Assigned Releasing Officers</h4>
                  <p className="text-xs text-gray-500">Only these users can print and release certificates.</p>
                </div>

                <div className="flex-1 flex justify-center px-4">
                  {releasingStep && releasingStep.assignedUsers && releasingStep.assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {releasingStep.assignedUsers.map(userId => {
                        const user = users.find(u => (u._id === userId || u.id === userId));
                        return user ? (
                          <span key={userId} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs border border-blue-200 font-bold">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">
                              {user.firstName?.charAt(0)}
                            </div>
                            {user.firstName} {user.lastName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic bg-gray-100 px-4 py-1 rounded-lg border border-dashed border-gray-300">No members assigned yet</span>
                  )}
                </div>

                <button
                  onClick={() => setShowAssignModal({ certId: selectedCertificate, stepId: releasingStep?.id || 'new_releasing' })}
                  className={`px-6 py-2 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${selectedCertificate === MASTER_WORKFLOW_ID ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                  Assign Team Members
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Preview (Standard Approval Flow)</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {previewSteps.map((step, index) => {
            const StepIcon = getIcon(step.icon);
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.requiresApproval ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    <StepIcon className={`w-5 h-5 ${step.requiresApproval ? 'text-orange-600' : 'text-blue-600'}`} />
                  </div>
                  <p className="text-xs font-medium text-gray-700 mt-2 text-center">{step.name}</p>
                  {step.requiresApproval && <span className="text-[10px] text-orange-600">Approval</span>}
                </div>
                {index < previewSteps.length - 1 && <ChevronRight className="w-5 h-5 text-gray-400 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-4"></div>

      {/* Add Step Modal */}
      {showAddStep && (
        <AddStepModal
          newStep={newStep}
          setNewStep={setNewStep}
          onAdd={handleAddStep}
          onClose={() => {
            setShowAddStep(false);
            setNewStep({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false, officialRole: '' });
          }}
        />
      )}

      {/* Assign Users Modal */}
      {showAssignModal && (
        <AssignUsersModal
          step={showAssignModal.certId
            ? (workflows[showAssignModal.certId] || []).find(s => s.id === showAssignModal.stepId)
            : getCurrentSteps().find(s => s.id === showAssignModal)
          }
          users={users}
          onSave={(selectedUserIds) => {
            if (showAssignModal.certId) {
              if (showAssignModal.type === 'review') {
                handleAssignReviewTeam(showAssignModal.certId, showAssignModal.stepId, selectedUserIds);
              } else {
                handleAssignReleasingTeam(showAssignModal.certId, showAssignModal.stepId, selectedUserIds);
              }
            } else {
              handleAssignUsers(showAssignModal, selectedUserIds);
            }
          }}
          onClose={() => setShowAssignModal(null)}
        />
      )}
    </div>
  );
}

WorkflowsPage.getLayout = (page) => (
  <Layout>
    {page}
  </Layout>
);


// Edit Step Form Component
function EditStepForm({ step, onSave, onCancel }) {
  const [form, setForm] = useState({ ...step });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Step Name"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          placeholder="Status Key"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input
        type="text"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {iconOptions.map(opt => (
            <option key={opt.name} value={opt.name}>{opt.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
          <input
            type="checkbox"
            checked={form.requiresApproval}
            onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded"
          />
          <span className="text-orange-700 font-medium">Requires Approval</span>
        </label>
        <label className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <input
            type="checkbox"
            checked={form.sendEmail}
            onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
            className="w-4 h-4 text-green-600 rounded"
          />
          <span className="text-green-700 font-medium flex items-center gap-1">
            <Mail className="w-3 h-3" /> Send Email
          </span>
        </label>
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Designated Official Role (Optional)</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Brgy. Captain', 'Brgy. Secretary', 'Brgy. Kagawad', 'Brgy. Treasurer',
              'SK Chairman', 'SK Kagawad', 'Brgy. Admin', 'Brgy. Clerk'
            ].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                <input
                  type="radio"
                  name="officialRole"
                  checked={form.officialRole === role}
                  onChange={() => setForm({ ...form, officialRole: role })}
                  className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500"
                />
                <span className="text-gray-700">{role}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
              <input
                type="radio"
                name="officialRole"
                checked={!form.officialRole}
                onChange={() => setForm({ ...form, officialRole: '' })}
                className="w-4 h-4 text-gray-500 rounded-full focus:ring-gray-400"
              />
              <span className="text-gray-500 italic">None</span>
            </label>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Save className="w-4 h-4" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

// Add Step Modal Component
function AddStepModal({ newStep, setNewStep, onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Workflow Step</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name *</label>
            <input
              type="text"
              value={newStep.name}
              onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
              placeholder="e.g., Document Verification"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Key *</label>
            <input
              type="text"
              value={newStep.status}
              onChange={(e) => setNewStep({ ...newStep, status: e.target.value })}
              placeholder="e.g., verifying"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newStep.description}
              onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
              placeholder="Brief description of this step"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <select
              value={newStep.icon}
              onChange={(e) => setNewStep({ ...newStep, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {iconOptions.map(opt => (
                <option key={opt.name} value={opt.name}>{opt.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newStep.requiresApproval}
                onChange={(e) => setNewStep({ ...newStep, requiresApproval: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span className="text-orange-800 font-medium">Requires user approval</span>
            </label>
            <p className="text-xs text-orange-600 mt-1 ml-6">Enable this to assign approvers to this step</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newStep.sendEmail}
                onChange={(e) => setNewStep({ ...newStep, sendEmail: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-green-800 font-medium flex items-center gap-1">
                <Mail className="w-4 h-4" /> Send email notification
              </span>
            </label>
            <p className="text-xs text-green-600 mt-1 ml-6">Notify assigned users when request reaches this step</p>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Designated Official Role (Optional)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {[
                'Brgy. Captain', 'Brgy. Secretary', 'Brgy. Kagawad', 'Brgy. Treasurer',
                'SK Chairman', 'SK Kagawad', 'Brgy. Admin', 'Brgy. Clerk'
              ].map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name="newStepOfficialRole"
                    checked={newStep.officialRole === role}
                    onChange={() => setNewStep({ ...newStep, officialRole: role })}
                    className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{role}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                <input
                  type="radio"
                  name="newStepOfficialRole"
                  checked={!newStep.officialRole}
                  onChange={() => setNewStep({ ...newStep, officialRole: '' })}
                  className="w-4 h-4 text-gray-500 rounded-full focus:ring-gray-400"
                />
                <span className="text-gray-500 italic">None</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select if this step requires action from a specific official.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Step
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Assign Users Modal Component
function AssignUsersModal({ step, users, onSave, onClose }) {
  const [selectedUsers, setSelectedUsers] = useState(step?.assignedUsers || []);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users based on search query and only show active accounts
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const isActive = user.status === 'active' || !user.status; // Default to active if status is missing
    const matchesSearch = (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
    return isActive && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assign User Accounts</h3>
            <p className="text-xs text-gray-500">Only verified accounts can be assigned to Releasing Team.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map(user => {
                // Users from API have _id (Supabase UUID), not id
                const userId = user._id || user.id;
                const isSelected = selectedUsers.includes(userId);
                return (
                  <div
                    key={userId}
                    onClick={() => toggleUser(userId)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${isSelected ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                      {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : users.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-medium">No users found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No users available</p>
              <p className="text-sm">Add users in the Employees page first</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t">
          <button
            onClick={() => onSave(selectedUsers)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save ({selectedUsers.length} selected)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

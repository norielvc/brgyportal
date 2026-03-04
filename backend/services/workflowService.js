const defaultAssignments = {
    staff: ["1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae"],     // Luffy Dono (Review Team)
    secretary: ["ca847635-fd64-4e69-9cc7-01998200ddfe"], // Franky Dono (Brgy. Secretary)
    captain: ["9550a8b2-9e32-4f52-a260-52766afb49b1"],   // Noriel Cruz (Brgy. Captain)
    releasing: ["0daafd45-47d3-40a9-bb2b-3a337226b3af"]  // Brook Dono (Releasing Team)
};

const defaultWorkflows = {
    barangay_clearance: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    certificate_of_indigency: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    barangay_residency: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    medico_legal: [
        { id: 1, name: 'Review Request Team', description: 'Initial review of medico-legal requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Brgy. Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    certification_same_person: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    natural_death: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    barangay_guardianship: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    barangay_cohabitation: [
        { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ],
    business_permit: [
        { id: 111, name: 'Review Request Team', description: 'Initial review of business permit applications', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: defaultAssignments.staff, requiresApproval: true, sendEmail: true },
        { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: defaultAssignments.secretary, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
        { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: defaultAssignments.captain, requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
        { id: 999, name: 'Releasing Team', description: 'Certificate is ready for business permit release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: defaultAssignments.releasing, requiresApproval: true, sendEmail: true }
    ]
};

const getWorkflowSteps = (type, customSteps = null) => {
    if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) {
        return customSteps;
    }
    return defaultWorkflows[type] || defaultWorkflows.barangay_clearance;
};

module.exports = {
    defaultWorkflows,
    getWorkflowSteps
};

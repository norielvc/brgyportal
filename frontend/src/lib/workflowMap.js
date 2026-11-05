import { supabase } from "../../lib/supabase";

const defaultWorkflows = {
  barangay_clearance: [
    {
      id: 1,
      name: "Staff Review",
      status: "staff_review",
      requiresApproval: true,
      assignedUsers: [],
    },
    {
      id: 2,
      name: "Secretary Approval",
      status: "secretary_approval",
      requiresApproval: true,
      assignedUsers: [],
    },
    {
      id: 3,
      name: "Chairman Approval",
      status: "captain_approval",
      requiresApproval: true,
      assignedUsers: [],
    },
    {
      id: 4,
      name: "Release",
      status: "released",
      requiresApproval: false,
      assignedUsers: [],
    },
  ],
};

const certTypes = [
  "barangay_clearance",
  "first_time_job_seeker",
  "certificate_of_indigency",
  "barangay_residency",
  "natural_death",
  "barangay_guardianship",
  "barangay_cohabitation",
  "medico_legal",
  "business_permit",
  "certification_same_person",
  "educational_assistance",
];

certTypes.forEach((t) => {
  if (!defaultWorkflows[t]) {
    defaultWorkflows[t] = defaultWorkflows.barangay_clearance.map((s) => ({
      ...s,
    }));
  }
});

export async function getWorkflowMapForTenant(tenantId) {
  const workflows = { ...defaultWorkflows };
  const { data, error } = await supabase
    .from("workflow_configurations")
    .select("certificate_type, workflow_config")
    .eq("tenant_id", tenantId);
  if (!error && data) {
    data.forEach((config) => {
      if (config.workflow_config?.steps) {
        workflows[config.certificate_type] = config.workflow_config.steps;
      }
    });
  }
  return workflows;
}

export { certTypes, defaultWorkflows };

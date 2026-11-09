import { supabase } from "../../lib/supabase";
import {
  normalizeWorkflowStepsForSave,
  WORKFLOW_CHAIRMAN_OFFICIAL_ROLE,
} from "./workflowStatus";

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
      name: "Barangay Chairman Approval",
      status: "captain_approval",
      requiresApproval: true,
      assignedUsers: [],
      officialRole: WORKFLOW_CHAIRMAN_OFFICIAL_ROLE,
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

const workflowMapCache = new Map();
const WORKFLOW_MAP_TTL_MS = 5 * 60 * 1000;

export function buildWorkflowMapFromConfigRows(rows) {
  const workflows = { ...defaultWorkflows };
  for (const t of certTypes) {
    if (!workflows[t]) {
      workflows[t] = defaultWorkflows.barangay_clearance.map((s) => ({ ...s }));
    }
  }
  for (const config of rows || []) {
    if (config.workflow_config?.steps) {
      workflows[config.certificate_type] = normalizeWorkflowStepsForSave(
        config.workflow_config.steps,
        config.certificate_type,
      );
    }
  }
  return workflows;
}

export async function getWorkflowMapForTenant(tenantId) {
  if (!tenantId) return buildWorkflowMapFromConfigRows([]);
  const cached = workflowMapCache.get(tenantId);
  if (cached && Date.now() - cached.at < WORKFLOW_MAP_TTL_MS) {
    return cached.map;
  }
  const { data, error } = await supabase
    .from("workflow_configurations")
    .select("certificate_type, workflow_config")
    .eq("tenant_id", tenantId);
  const map = error ? buildWorkflowMapFromConfigRows([]) : buildWorkflowMapFromConfigRows(data);
  workflowMapCache.set(tenantId, { map, at: Date.now() });
  return map;
}

export { certTypes, defaultWorkflows };

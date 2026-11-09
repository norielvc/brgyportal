import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import { normalizeWorkflowStepsForSave } from "../../../src/lib/workflowStatus";

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
      officialRole: "Barangay Chairman",
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

// Replicate defaults for all cert types
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
  if (!defaultWorkflows[t])
    defaultWorkflows[t] = defaultWorkflows.barangay_clearance.map((s) => ({
      ...s,
    }));
});

async function reconcileStoredWorkflowSteps(rows) {
  if (!rows?.length) return;
  const updates = [];
  for (const config of rows) {
    const steps = config.workflow_config?.steps;
    if (!steps?.length) continue;
    const normalized = normalizeWorkflowStepsForSave(
      steps,
      config.certificate_type,
    );
    if (JSON.stringify(normalized) === JSON.stringify(steps)) continue;
    updates.push(
      supabase
        .from("workflow_configurations")
        .update({
          workflow_config: { ...config.workflow_config, steps: normalized },
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id),
    );
  }
  if (updates.length) {
    await Promise.all(updates);
  }
}

const getWorkflowsFromDB = async (tenantId, { reconcile = false } = {}) => {
  const { data, error } = await supabase
    .from("workflow_configurations")
    .select("*")
    .eq("tenant_id", tenantId);
  if (reconcile && !error && data?.length) {
    await reconcileStoredWorkflowSteps(data);
  }
  const workflows = { ...defaultWorkflows };
  if (!error && data) {
    data.forEach((config) => {
      if (config.workflow_config?.steps) {
        workflows[config.certificate_type] = normalizeWorkflowStepsForSave(
          config.workflow_config.steps,
          config.certificate_type,
        );
      }
    });
  }
  Object.keys(workflows).forEach((certType) => {
    if (Array.isArray(workflows[certType])) {
      workflows[certType] = normalizeWorkflowStepsForSave(
        workflows[certType],
        certType,
      );
    }
  });
  return workflows;
};

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    const canReconcile = ["admin", "superadmin", "captain"].includes(user.role);
    const workflows = await getWorkflowsFromDB(tenantId, {
      reconcile: canReconcile,
    });
    return res.status(200).json({ success: true, data: workflows });
  }

  if (req.method === "PUT") {
    if (!["admin", "superadmin", "captain"].includes(user.role))
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    const { workflows } = req.body;
    if (!workflows || typeof workflows !== "object")
      return res
        .status(400)
        .json({ success: false, message: "Invalid workflows data" });

    const validTypes = certTypes;
    const normalizedWorkflows = {};
    Object.keys(workflows)
      .filter((t) => validTypes.includes(t))
      .forEach((certType) => {
        normalizedWorkflows[certType] = normalizeWorkflowStepsForSave(
          workflows[certType],
          certType,
        );
      });
    const promises = Object.keys(normalizedWorkflows).map((certType) =>
        supabase.from("workflow_configurations").upsert(
          [
            {
              certificate_type: certType,
              tenant_id: tenantId,
              workflow_config: { steps: normalizedWorkflows[certType] },
              is_active: true,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "certificate_type,tenant_id" },
        ),
      );

    await Promise.all(promises);
    return res
      .status(200)
      .json({ success: true, message: "Workflows saved successfully" });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

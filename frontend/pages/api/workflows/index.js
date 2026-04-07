import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

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
      name: "Captain Approval",
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

// Replicate defaults for all cert types
const certTypes = [
  "barangay_clearance",
  "certificate_of_indigency",
  "barangay_residency",
  "natural_death",
  "barangay_guardianship",
  "barangay_cohabitation",
  "medico_legal",
  "business_permit",
  "certification_same_person",
];
certTypes.forEach((t) => {
  if (!defaultWorkflows[t])
    defaultWorkflows[t] = defaultWorkflows.barangay_clearance.map((s) => ({
      ...s,
    }));
});

const getWorkflowsFromDB = async (tenantId) => {
  const { data, error } = await supabase
    .from("workflow_configurations")
    .select("*")
    .eq("tenant_id", tenantId);
  const workflows = { ...defaultWorkflows };
  if (!error && data) {
    data.forEach((config) => {
      if (config.workflow_config?.steps)
        workflows[config.certificate_type] = config.workflow_config.steps;
    });
  }
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
    const workflows = await getWorkflowsFromDB(tenantId);
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
    const promises = Object.keys(workflows)
      .filter((t) => validTypes.includes(t))
      .map((certType) =>
        supabase.from("workflow_configurations").upsert(
          [
            {
              certificate_type: certType,
              tenant_id: tenantId,
              workflow_config: { steps: workflows[certType] },
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

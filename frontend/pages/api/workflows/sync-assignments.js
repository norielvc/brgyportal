import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

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
const activeStatuses = [
  "pending",
  "submitted",
  "staff_review",
  "processing",
  "secretary_approval",
  "captain_approval",
  "oic_review",
  "ready",
  "ready_for_pickup",
];

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["admin", "superadmin", "captain"].includes(user.role))
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { data: workflowConfigs } = await supabase
    .from("workflow_configurations")
    .select("*")
    .eq("tenant_id", tenantId);
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("tenant_id", tenantId);

  let totalAssignments = 0;
  const errors = [];

  for (const certType of certTypes) {
    const config = workflowConfigs?.find(
      (c) => c.certificate_type === certType,
    );
    const steps = config?.workflow_config?.steps;
    if (!steps) continue;

    await supabase
      .from("workflow_assignments")
      .delete()
      .eq("request_type", certType)
      .eq("status", "pending")
      .eq("tenant_id", tenantId);

    const { data: requests } = await supabase
      .from("certificate_requests")
      .select("id, status, certificate_type")
      .eq("certificate_type", certType)
      .eq("tenant_id", tenantId)
      .in("status", activeStatuses);

    for (const request of requests || []) {
      let currentStep = null;
      const s = request.status;
      if (["staff_review", "pending", "submitted"].includes(s))
        currentStep =
          steps.find((st) => st.status === "staff_review") ||
          steps.find((st) => st.requiresApproval);
      else if (s === "secretary_approval")
        currentStep = steps.find((st) => st.status === "secretary_approval");
      else if (s === "captain_approval")
        currentStep = steps.find((st) => st.status === "captain_approval");
      else
        currentStep =
          steps.find((st) => st.status === s) ||
          [...steps].reverse().find((st) => st.requiresApproval);

      if (currentStep?.assignedUsers?.length) {
        for (const userId of currentStep.assignedUsers) {
          if (!users?.find((u) => u.id === userId)) continue;
          const { error } = await supabase.from("workflow_assignments").insert([
            {
              request_id: request.id,
              tenant_id: tenantId,
              request_type: certType,
              step_id: currentStep.id.toString(),
              step_name: currentStep.name,
              assigned_user_id: userId,
              status: "pending",
            },
          ]);
          if (!error) totalAssignments++;
          else errors.push(`Failed to assign ${userId} to ${request.id}`);
        }
      }
    }
  }

  return res
    .status(200)
    .json({
      success: true,
      message: "Workflow assignments synced",
      data: { totalAssignments, errors },
    });
}

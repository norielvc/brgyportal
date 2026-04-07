import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

const statusFlow = {
  staff_review: "processing",
  pending: "processing",
  submitted: "processing",
  returned: "processing",
  processing: "secretary_approval",
  secretary_approval: "captain_approval",
  captain_approval: "oic_review",
  Treasury: "oic_review",
  oic_review: "ready",
  ready: "released",
  ready_for_pickup: "released",
};

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res.status(403).json({ success: false, message: "Tenant context required" });

  const { id } = req.query;
  const { status, comments, current_step, action } = req.body;

  if (!status)
    return res.status(400).json({ success: false, message: "Status is required" });

  // Fetch current cert to know its current status before update
  const { data: currentCert } = await supabase
    .from("certificate_requests")
    .select("status, certificate_type")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  const updateData = { status, updated_at: new Date().toISOString() };
  if (current_step) updateData.current_step = current_step;

  const { data, error } = await supabase
    .from("certificate_requests")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error)
    return res.status(400).json({ success: false, message: error.message });

  // Mark all pending assignments for this request as completed
  await supabase.from("workflow_assignments")
    .update({ status: ["rejected", "cancelled"].includes(status) ? status : "approved", updated_at: new Date().toISOString() })
    .eq("request_id", id)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  // Log to workflow history
  await supabase.from("workflow_history").insert([{
    tenant_id: tenantId,
    request_id: id,
    request_type: data.certificate_type,
    step_name: current_step || status,
    action: action || status,
    performed_by: user._id,
    comments: comments || "",
    new_status: status,
  }]);

  // Create next-step assignments if this is an approval moving forward
  const isApproval = action === "approve" || (!["rejected", "cancelled", "returned", "staff_review"].includes(status));
  if (isApproval && !["released", "rejected", "cancelled", "ready"].includes(status)) {
    try {
      const { data: wfConfig } = await supabase
        .from("workflow_configurations")
        .select("workflow_config")
        .eq("certificate_type", data.certificate_type)
        .eq("tenant_id", tenantId)
        .single();

      const steps = wfConfig?.workflow_config?.steps || [];
      // Find the step that matches the NEW status
      const nextStep = steps.find(s => s.status === status);

      if (nextStep?.assignedUsers?.length) {
        for (const userId of nextStep.assignedUsers) {
          await supabase.from("workflow_assignments").insert([{
            request_id: id,
            tenant_id: tenantId,
            request_type: data.certificate_type,
            step_id: nextStep.id.toString(),
            step_name: nextStep.name,
            assigned_user_id: userId,
            status: "pending",
          }]);
        }
      }
    } catch (wfErr) {
      console.warn("Could not create next-step assignments:", wfErr.message);
    }
  }

  // If returned/send_back_to_start, reassign to Step 1
  if ((status === "staff_review" || status === "returned") && currentCert?.status !== "staff_review") {
    try {
      const { data: wfConfig } = await supabase
        .from("workflow_configurations")
        .select("workflow_config")
        .eq("certificate_type", data.certificate_type)
        .eq("tenant_id", tenantId)
        .single();

      const steps = wfConfig?.workflow_config?.steps || [];
      const firstStep = steps.find(s => s.requiresApproval);
      if (firstStep?.assignedUsers?.length) {
        for (const userId of firstStep.assignedUsers) {
          await supabase.from("workflow_assignments").insert([{
            request_id: id,
            tenant_id: tenantId,
            request_type: data.certificate_type,
            step_id: firstStep.id.toString(),
            step_name: firstStep.name,
            assigned_user_id: userId,
            status: "pending",
          }]);
        }
      }
    } catch (wfErr) {
      console.warn("Could not create return assignments:", wfErr.message);
    }
  }

  return res.json({ success: true, data });
}

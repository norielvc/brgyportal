import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res.status(403).json({ success: false, message: "Tenant context required" });

  const { id } = req.query;
  const { action, comments, comment } = req.body;
  const note = comments || comment || "";

  // 1. Fetch the assignment being acted on
  const { data: assignment, error: fetchErr } = await supabase
    .from("workflow_assignments")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !assignment)
    return res.status(404).json({ success: false, message: "Assignment not found" });

  const requestId = assignment.request_id;
  const certType = assignment.request_type;

  // 2. Fetch the certificate to get current status
  const { data: cert } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .single();

  if (!cert)
    return res.status(404).json({ success: false, message: "Certificate not found" });

  // 3. Mark ALL pending assignments for this request as completed
  await supabase
    .from("workflow_assignments")
    .update({ status: action === "approve" ? "approved" : action === "reject" ? "rejected" : action, updated_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  // 4. Determine next certificate status
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

  let newCertStatus = cert.status;
  if (action === "approve") {
    newCertStatus = statusFlow[cert.status] || cert.status;
  } else if (action === "reject") {
    newCertStatus = "rejected";
  } else if (action === "return") {
    newCertStatus = "returned"; // stays in returned, but Step 1 gets reassigned
  } else if (action === "send_back_to_start") {
    newCertStatus = "staff_review";
  }

  // 5. Update certificate status
  await supabase
    .from("certificate_requests")
    .update({ status: newCertStatus, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("tenant_id", tenantId);

  // 6. Log to workflow history
  await supabase.from("workflow_history").insert([{
    tenant_id: tenantId,
    request_id: requestId,
    request_type: certType,
    step_id: assignment.step_id,
    step_name: assignment.step_name,
    action,
    performed_by: user._id,
    comments: note,
    new_status: newCertStatus,
  }]);

  // 7. If approved, create next-step assignments from workflow config
  if (action === "approve" && !["released", "rejected", "cancelled"].includes(newCertStatus)) {
    const { data: wfConfig } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("certificate_type", certType)
      .eq("tenant_id", tenantId)
      .single();

    const steps = wfConfig?.workflow_config?.steps || [];

    // Find the step matching the new certificate status
    const nextStep = steps.find(s => s.status === newCertStatus)
      || steps.find(s => s.requiresApproval && s.status !== cert.status);

    if (nextStep?.assignedUsers?.length) {
      for (const userId of nextStep.assignedUsers) {
        await supabase.from("workflow_assignments").insert([{
          request_id: requestId,
          tenant_id: tenantId,
          request_type: certType,
          step_id: nextStep.id.toString(),
          step_name: nextStep.name,
          assigned_user_id: userId,
          status: "pending",
        }]);
      }
    }
  }

  // 8. If returned/send_back_to_start, reassign to Step 1
  if (action === "return" || action === "send_back_to_start") {
    const { data: wfConfig } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("certificate_type", certType)
      .eq("tenant_id", tenantId)
      .single();

    const steps = wfConfig?.workflow_config?.steps || [];
    const firstStep = steps.find(s => s.requiresApproval);
    if (firstStep?.assignedUsers?.length) {
      for (const userId of firstStep.assignedUsers) {
        await supabase.from("workflow_assignments").insert([{
          request_id: requestId,
          tenant_id: tenantId,
          request_type: certType,
          step_id: firstStep.id.toString(),
          step_name: firstStep.name,
          assigned_user_id: userId,
          status: "pending",
        }]);
      }
    }
  }

  return res.json({ success: true, data: { ...assignment, status: action }, newStatus: newCertStatus });
}

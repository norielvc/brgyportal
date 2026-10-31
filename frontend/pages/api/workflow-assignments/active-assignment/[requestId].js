import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import {
  certificateStatusMatchesStep,
  pickAssignmentForCertificateStatus,
} from "../../../../src/lib/workflowStatus";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { requestId } = req.query;
  if (!requestId || requestId === ".")
    return res
      .status(400)
      .json({ success: false, message: "Invalid Request ID" });

  const userId = user._id || user.id;

  const { data: cert, error: certError } = await supabase
    .from("certificate_requests")
    .select("id, status, certificate_type")
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (certError)
    return res.status(500).json({ success: false, message: certError.message });

  if (!cert)
    return res
      .status(404)
      .json({ success: false, message: "Certificate request not found." });

  const { data: pending, error } = await supabase
    .from("workflow_assignments")
    .select("*")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error)
    return res.status(500).json({ success: false, message: error.message });

  let candidates = pending || [];
  let workflowSteps = [];

  if (cert.certificate_type) {
    const { data: wfConfig } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("certificate_type", cert.certificate_type)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    workflowSteps = wfConfig?.workflow_config?.steps || [];

    if (candidates.length > 1) {
      const matchingSteps = workflowSteps.filter((step) =>
        certificateStatusMatchesStep(cert.status, step, cert.certificate_type),
      );

      if (matchingSteps.length) {
        const bySteps = candidates.filter((row) =>
          matchingSteps.some(
            (step) => String(row.step_id) === String(step.id),
          ),
        );
        if (bySteps.length) candidates = bySteps;
      }
    }
  }

  const forCurrentUser = candidates.filter(
    (row) => String(row.assigned_user_id) === String(userId),
  );
  let assignment =
    pickAssignmentForCertificateStatus(
      workflowSteps,
      cert,
      forCurrentUser.length ? forCurrentUser : candidates,
    ) ||
    forCurrentUser[0] ||
    candidates[0] ||
    null;

  if (!assignment) {
    const { data: recent, error: recentError } = await supabase
      .from("workflow_assignments")
      .select("*")
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentError)
      return res
        .status(500)
        .json({ success: false, message: recentError.message });

    assignment = recent?.[0] || null;
  }

  if (!assignment) {
    const { data: created, error: insertError } = await supabase
      .from("workflow_assignments")
      .insert([
        {
          tenant_id: tenantId,
          request_id: requestId,
          request_type: cert.certificate_type || "business_permit",
          step_id: "111",
          step_name: "Review Request Team",
          assigned_user_id: userId,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (insertError || !created)
      return res.status(500).json({
        success: false,
        message: insertError?.message || "No active assignment found.",
      });

    assignment = created;
  }

  return res.json({ success: true, assignment });
}

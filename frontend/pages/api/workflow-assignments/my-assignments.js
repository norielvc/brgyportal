import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

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

  const { data, error } = await supabase
    .from("workflow_assignments")
    .select("*, certificate_requests:request_id (*, residents:resident_id (*))")
    .eq("assigned_user_id", user._id)
    .eq("status", "pending")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error)
    return res.status(500).json({ success: false, message: error.message });

  // Flatten: attach workflow_assignment info onto the certificate record
  const certificates = (data || [])
    .map((assignment) => {
      const cert = assignment.certificate_requests;
      if (!cert) return null;
      return {
        ...cert,
        workflow_assignment: {
          id: assignment.id,
          step_id: assignment.step_id,
          step_name: assignment.step_name,
          assigned_user_id: assignment.assigned_user_id,
          status: assignment.status,
        },
      };
    })
    .filter(Boolean);

  return res.json({ success: true, data: certificates, certificates });
}

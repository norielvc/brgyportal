import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  const { requestId } = req.query;

  const { data, error } = await supabase
    .from("workflow_history")
    .select("*, users:performed_by (first_name, middle_name, last_name, email, role, employee_code)")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error)
    return res.status(500).json({ success: false, message: error.message });

  const { data: assignments, error: assignmentError } = await supabase
    .from("workflow_assignments")
    .select(
      "id, step_id, step_name, status, assigned_user_id, completed_at, updated_at, users:assigned_user_id (first_name, middle_name, last_name, role, employee_code)",
    )
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: true });

  if (assignmentError)
    return res
      .status(500)
      .json({ success: false, message: assignmentError.message });

  return res.json({
    success: true,
    history: data || [],
    assignments: assignments || [],
  });
}

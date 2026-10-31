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
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { requestId } = req.query;
  if (!requestId || requestId === ".")
    return res
      .status(400)
      .json({ success: false, message: "Invalid Request ID" });

  const { data: pending, error } = await supabase
    .from("workflow_assignments")
    .select("*")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error)
    return res.status(500).json({ success: false, message: error.message });

  let assignment = pending?.[0] || null;

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
    const { data: request, error: requestError } = await supabase
      .from("certificate_requests")
      .select("id, certificate_type")
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (requestError)
      return res
        .status(500)
        .json({ success: false, message: requestError.message });

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "No active assignment found." });

    const userId = user._id || user.id;
    const { data: created, error: insertError } = await supabase
      .from("workflow_assignments")
      .insert([
        {
          tenant_id: tenantId,
          request_id: requestId,
          request_type: request.certificate_type || "business_permit",
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

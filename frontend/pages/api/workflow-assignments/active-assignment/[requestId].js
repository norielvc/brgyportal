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
    .from("workflow_assignments")
    .select("*")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116")
    return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: data || null });
}

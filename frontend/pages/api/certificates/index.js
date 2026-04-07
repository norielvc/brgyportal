import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    const { type, status } = req.query;
    let query = supabase
      .from("certificate_requests")
      .select("*, residents:resident_id (*)")
      .eq("tenant_id", tenantId);
    if (type && type !== "all") query = query.eq("certificate_type", type);
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });
    if (error)
      return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, certificates: data || [] });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

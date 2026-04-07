import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST")
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
  const { id } = req.query;

  const { data: cert, error } = await supabase
    .from("certificate_requests")
    .select("*, residents:resident_id (*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();
  if (error || !cert)
    return res
      .status(404)
      .json({ success: false, message: "Certificate not found" });

  return res.json({ success: true, data: cert });
}

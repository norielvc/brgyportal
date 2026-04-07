import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["admin", "superadmin", "captain", "secretary"].includes(user.role))
    return res.status(403).json({ success: false, message: "Access denied" });

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  const { residents } = req.body;

  if (!Array.isArray(residents) || residents.length === 0)
    return res
      .status(400)
      .json({ success: false, message: "residents array is required" });

  const insertData = residents.map((r) => ({
    ...r,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from("residents")
    .insert(insertData)
    .select();
  if (error)
    return res.status(400).json({ success: false, message: error.message });

  return res.status(201).json({ success: true, data, inserted: data.length });
}

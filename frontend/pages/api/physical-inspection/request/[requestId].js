import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  const { requestId } = req.query;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("physical_inspection")
      .select("*")
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116")
      return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, data: data || null });
  }

  if (req.method === "POST") {
    const insertData = {
      ...req.body,
      request_id: requestId,
      tenant_id: tenantId,
      inspected_by: user._id,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("physical_inspection")
      .insert([insertData])
      .select()
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

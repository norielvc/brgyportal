import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const tenantId = req.headers["x-tenant-id"];
  const { token, ref } = req.query;
  if (!token && !ref)
    return res
      .status(400)
      .json({ valid: false, message: "No verification info provided" });

  let query = supabase
    .from("certificate_requests")
    .select("*, residents:resident_id (*)");
  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (token) query = query.eq("pickup_token", token);
  else query = query.eq("reference_number", ref.toUpperCase());

  const { data, error } = await query.single();
  if (error || !data)
    return res.json({ valid: false, message: "Record not found" });

  return res.json({ valid: true, data });
}

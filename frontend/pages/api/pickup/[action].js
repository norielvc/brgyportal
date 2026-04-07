import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const tenantId = req.headers["x-tenant-id"];
  const { action } = req.query;
  const { token, ref, pickedUpBy } = req.body;

  let query = supabase
    .from("certificate_requests")
    .select("id, status, reference_number, tenant_id");
  if (token) query = query.eq("pickup_token", token);
  else if (ref) query = query.eq("reference_number", ref.toUpperCase());
  else
    return res
      .status(400)
      .json({ success: false, message: "token or ref required" });

  const { data: record, error: fetchError } = await query.single();
  if (fetchError || !record)
    return res
      .status(404)
      .json({ success: false, message: "Record not found" });

  // Ensure the record belongs to the requesting tenant
  if (tenantId && record.tenant_id !== tenantId) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { error } = await supabase
    .from("certificate_requests")
    .update({
      status: "released",
      picked_up_by: pickedUpBy,
      picked_up_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id)
    .eq("tenant_id", record.tenant_id);

  if (error)
    return res.status(400).json({ success: false, message: error.message });
  return res.json({
    success: true,
    message: "Pickup confirmed",
    referenceNumber: record.reference_number,
  });
}

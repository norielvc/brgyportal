import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { id } = req.query;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("certificate_requests")
      .select("*, residents:resident_id (*)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();
    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: "Certificate not found" });

    // Enrich resident residential_address from structured fields when flat field is empty
    if (data.residents && !data.residents.residential_address) {
      const r = data.residents;
      if (r.house_number || r.purok || r.barangay || r.municipality || r.province) {
        const parts = [
          r.house_number ? `HOUSE NO. ${String(r.house_number).trim()}` : null,
          r.purok ? String(r.purok).trim().toUpperCase() : null,
          r.barangay ? String(r.barangay).trim().toUpperCase() : null,
          r.municipality ? String(r.municipality).trim().toUpperCase() : null,
          r.province ? String(r.province).trim().toUpperCase() : null,
        ].filter(Boolean);
        data.residents.residential_address = parts.join(", ");
      }
    }

    return res.json({ success: true, data });
  }

  if (req.method === "PUT") {
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    delete updateData.id;
    delete updateData.tenant_id;
    const { data, error } = await supabase
      .from("certificate_requests")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, data });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

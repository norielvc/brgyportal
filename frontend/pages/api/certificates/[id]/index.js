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
      .select("*, residents:resident_id (*), workflow_assignments (id, step_id, step_name, assigned_user_id, status, created_at)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();
    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: "Certificate not found" });

    const assignments = data.workflow_assignments || [];
    const pendingAssignment = assignments
      .filter(a => a.status === 'pending')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    data.workflow_assignment = pendingAssignment || null;

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

  if (req.method === "DELETE") {
    const role = String(user.role || "").toLowerCase();
    if (!["admin", "superadmin", "super_admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete certificate requests",
      });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("certificate_requests")
      .select("id, reference_number, certificate_type")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Certificate request not found" });
    }

    // Clean up related records first
    await Promise.allSettled([
      supabase
        .from("workflow_assignments")
        .delete()
        .eq("request_id", id)
        .eq("tenant_id", tenantId),
      supabase
        .from("workflow_history")
        .delete()
        .eq("request_id", id)
        .eq("tenant_id", tenantId),
      supabase
        .from("certificate_pickups")
        .delete()
        .eq("request_id", id)
        .eq("tenant_id", tenantId),
      supabase
        .from("official_receipts")
        .delete()
        .eq("request_id", id),
      supabase
        .from("physical_inspection_reports")
        .delete()
        .eq("request_id", id),
    ]);

    const { error: deleteError } = await supabase
      .from("certificate_requests")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (deleteError) {
      return res
        .status(400)
        .json({ success: false, message: deleteError.message });
    }

    return res.json({
      success: true,
      message: "Certificate request deleted successfully",
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import { realignBusinessPermitRequest } from "../../../../src/lib/businessPermitWorkflowRealign";
import { fetchCertificateById } from "../../../../src/lib/certificateListQuery";
import { fetchWorkflowHistoryPdfBundle } from "../../../../src/lib/workflowHistoryQuery";

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
    const view =
      req.query.view === "pdf" || req.query.pdf === "1" ? "pdf" : "full";
    let data;
    try {
      if (view === "full") {
        const { data: precheck } = await supabase
          .from("certificate_requests")
          .select("certificate_type")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        if (precheck?.certificate_type === "business_permit") {
          try {
            await realignBusinessPermitRequest(supabase, tenantId, id);
          } catch (realignErr) {
            console.warn(
              "[certificates/[id]] business permit realign skipped:",
              realignErr?.message || realignErr,
            );
          }
        }
      }
      data = await fetchCertificateById(tenantId, id, { view });
    } catch (err) {
      if (err.code === "NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Certificate not found" });
      }
      console.error("[certificates/[id] GET]", err?.message || err);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Failed to load certificate" });
    }

    // Enrich resident residential_address from structured fields when flat field is empty
    if (data.residents && !data.residents.residential_address) {
      const r = data.residents;
      if (r.house_number || r.purok || r.barangay || r.municipality || r.province) {
        const parts = [
          r.house_number ? String(r.house_number).trim().toUpperCase() : null,
          r.purok ? String(r.purok).trim().toUpperCase() : null,
          r.barangay ? String(r.barangay).trim().toUpperCase() : null,
          r.municipality ? String(r.municipality).trim().toUpperCase() : null,
          r.province ? String(r.province).trim().toUpperCase() : null,
        ].filter(Boolean);
        data.residents.residential_address = parts.join(", ");
      }
    }

    const includeHistory =
      view === "pdf" &&
      (req.query.includeHistory === "1" || req.query.includeHistory === "true");

    if (includeHistory) {
      try {
        const workflowHistory = await fetchWorkflowHistoryPdfBundle(tenantId, id);
        return res.json({ success: true, data, workflowHistory });
      } catch (histErr) {
        console.error("[certificates/[id] GET includeHistory]", histErr?.message || histErr);
        return res.json({ success: true, data });
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

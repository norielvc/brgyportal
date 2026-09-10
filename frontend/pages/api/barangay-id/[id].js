import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: "ID parameter is required" });
  }

  const supabase = getSupabase();

  // ── GET: Single ID details ────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("barangay_ids")
        .select("*, resident:residents(*)")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: "Barangay ID not found" });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── PUT: Update / Renew / Revoke ID ──────────────────────────────────────
  if (req.method === "PUT") {
    try {
      const {
        action,
        status,
        validity_years,
        blood_type,
        emergency_contact_name,
        emergency_contact_number,
        emergency_contact_relation,
        photo_url,
        cardholder_signature_url,
        remarks,
      } = req.body;

      const updates = {
        updated_at: new Date().toISOString(),
      };

      if (action === "renew") {
        const years = parseInt(validity_years || 1, 10);
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + years);
        updates.expiry_date = newExpiry.toISOString().split("T")[0];
        updates.status = "active";
        updates.remarks = `Renewed on ${new Date().toLocaleDateString()} for ${years} year(s)`;
      } else if (action === "revoke") {
        updates.status = "revoked";
        updates.remarks = remarks || "Revoked by Barangay Administrator";
      } else if (action === "activate") {
        updates.status = "active";
      } else {
        if (status) updates.status = status;
        if (blood_type) updates.blood_type = blood_type;
        if (emergency_contact_name) updates.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_number) updates.emergency_contact_number = emergency_contact_number;
        if (emergency_contact_relation) updates.emergency_contact_relation = emergency_contact_relation;
        if (photo_url) updates.photo_url = photo_url;
        if (cardholder_signature_url) updates.cardholder_signature_url = cardholder_signature_url;
        if (remarks) updates.remarks = remarks;
      }

      const { data, error } = await supabase
        .from("barangay_ids")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: action === "renew" ? "Barangay ID successfully renewed!" : "Barangay ID updated!",
        data,
      });
    } catch (error) {
      console.error("PUT /api/barangay-id/[id] error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── DELETE: Delete ID record ─────────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("barangay_ids")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      return res.status(200).json({ success: true, message: "Barangay ID record deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

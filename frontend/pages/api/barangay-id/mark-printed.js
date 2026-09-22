import { authenticateToken } from "../../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  const { id_number } = req.body;
  
  if (!id_number || typeof id_number !== "string") {
    return res.status(400).json({ success: false, message: "Valid id_number is required" });
  }

  const normalizedId = id_number.trim();
  const supabase = getSupabase();

  try {
    // 1. Find the ID record
    const { data: idRecord, error: findError } = await supabase
      .from("barangay_ids")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id_number", normalizedId)
      .single();

    if (findError || !idRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "ID record not found. Please verify the QR code belongs to this Barangay." 
      });
    }

    if (idRecord.status !== "active") {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot print this ID. Current status is: ${idRecord.status.toUpperCase()}` 
      });
    }

    if (idRecord.is_printed) {
      return res.status(400).json({
        success: false,
        message: "This ID has already been marked as printed."
      });
    }

    // 2. Update the record
    const now = new Date().toISOString();
    const { data: updatedRecord, error: updateError } = await supabase
      .from("barangay_ids")
      .update({
        is_printed: true,
        printed_at: now,
        updated_at: now
      })
      .eq("id", idRecord.id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: `ID ${normalizedId} successfully marked as printed!`,
      data: updatedRecord
    });
  } catch (error) {
    console.error("POST /api/barangay-id/mark-printed error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

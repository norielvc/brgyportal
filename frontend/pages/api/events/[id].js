/**
 * PUT    /api/events/[id] — update a single event
 * DELETE /api/events/[id] — delete a single event
 *
 * Tenant isolation: tenantId always comes from JWT (user.tenant_id).
 */
import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    const userRes = await authenticateToken(req, res);
    if (!userRes) return;

    const tenantId = userRes.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ success: false, message: "No tenant context in token" });
    }

    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "Event ID is required" });
    }

    const supabase = getSupabase();

    if (req.method === "PUT") {
      const { title, date, description, body, image } = req.body;

      console.log(`Updating event ${id} for tenant ${tenantId}`);

      // Verify the event belongs to this tenant
      const { data: existing, error: checkError } = await supabase
        .from("events")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (checkError) {
        console.error('Check error:', checkError);
        return res.status(500).json({ success: false, message: checkError.message });
      }

      if (!existing) {
        return res.status(404).json({ success: false, message: "Event not found or access denied" });
      }

      const { data, error } = await supabase
        .from("events")
        .update({
          title,
          date: date || null,
          description: description || "",
          body: body || "",
          image: image || "",
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
      
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "DELETE") {
      console.log(`Deleting event ${id} for tenant ${tenantId}`);

      // Verify the event belongs to this tenant
      const { data: existing, error: checkError } = await supabase
        .from("events")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (checkError) {
        console.error('Check error:', checkError);
        return res.status(500).json({ success: false, message: checkError.message });
      }

      if (!existing) {
        return res.status(404).json({ success: false, message: "Event not found or access denied" });
      }

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
      
      return res.status(200).json({ success: true, message: "Event deleted" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}

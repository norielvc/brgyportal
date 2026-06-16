/**
 * PUT /api/events/bulk/update — bulk replace events for tenant
 *
 * Tenant isolation: tenantId always comes from JWT (user.tenant_id).
 */
import { authenticateToken } from "../../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const userRes = await authenticateToken(req, res);
    if (!userRes) return;

    const tenantId = userRes.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ success: false, message: "No tenant context in token" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ success: false, message: "events must be an array" });
    }

    console.log(`Bulk updating ${events.length} events for tenant ${tenantId}`);

    // Delete only this tenant's events, then re-insert
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("tenant_id", tenantId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    if (events.length > 0) {
      const toInsert = events.map((e, index) => ({
        title: e.title,
        date: e.date || null,
        description: e.description || "",
        body: e.body || "",
        image: e.image || "",
        order_index: index,
        tenant_id: tenantId,
      }));

      const { error: insertError } = await supabase.from("events").insert(toInsert);
      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ success: false, message: insertError.message });
      }
    }

    return res.status(200).json({ success: true, message: "Events updated" });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}

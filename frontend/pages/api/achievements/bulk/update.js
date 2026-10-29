/**
 * PUT /api/achievements/bulk/update — bulk replace achievements for tenant
 */
import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase, isSupabaseServerConfigured } from "../../../../lib/supabase";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  if (!isSupabaseServerConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Database is not configured on this server",
    });
  }

  const { achievements } = req.body;
  if (!Array.isArray(achievements)) {
    return res.status(400).json({ success: false, message: "achievements must be an array" });
  }

  try {
    const { error: deleteError } = await supabase
      .from("achievements")
      .delete()
      .eq("tenant_id", tenantId);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    if (achievements.length > 0) {
      const toInsert = achievements.map((a, index) => ({
        title: a.title,
        category: a.category || "",
        description: a.description || "",
        year: a.year || new Date().getFullYear().toString(),
        image: a.image || DEFAULT_IMAGE,
        color_class: a.color_class || "bg-blue-500",
        text_color: a.text_color || "blue-400",
        order_index: index,
        tenant_id: tenantId,
      }));

      const { error: insertError } = await supabase.from("achievements").insert(toInsert);
      if (insertError) {
        return res.status(500).json({ success: false, message: insertError.message });
      }
    }

    return res.status(200).json({ success: true, message: "Achievements updated" });
  } catch (err) {
    console.error("Achievements bulk update error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update achievements",
    });
  }
}

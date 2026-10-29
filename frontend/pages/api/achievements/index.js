/**
 * GET  /api/achievements — list achievements for the authenticated user's tenant
 * POST /api/achievements — create a new achievement
 */
import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase, isSupabaseServerConfigured } from "../../../lib/supabase";

export default async function handler(req, res) {
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
      data: [],
    });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("order_index", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      if (
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        String(error.message || "").includes("not find the table")
      ) {
        return res.status(200).json({ success: true, data: [] });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === "POST") {
    const { title, category, description, year, image, color_class, text_color } = req.body;

    const { data: maxOrder } = await supabase
      .from("achievements")
      .select("order_index")
      .eq("tenant_id", tenantId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const order_index = (maxOrder?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from("achievements")
      .insert({
        title,
        category: category || "",
        description: description || "",
        year: year || new Date().getFullYear().toString(),
        image: image || "",
        color_class: color_class || "bg-blue-500",
        text_color: text_color || "blue-400",
        order_index,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(201).json({ success: true, data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

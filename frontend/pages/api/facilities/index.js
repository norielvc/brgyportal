/**
 * GET  /api/facilities — list facilities for the authenticated user's tenant
 * POST /api/facilities — create a new facility
 *
 * Tenant isolation: tenantId always comes from JWT (user.tenant_id).
 * Never trusts user-supplied tenant values.
 */
import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  // All operations require authentication — tenant comes from JWT only
  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("order_index", { ascending: true });

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === "POST") {
    const { name, description, icon, color, images, features } = req.body;

    const { data: maxOrder } = await supabase
      .from("facilities")
      .select("order_index")
      .eq("tenant_id", tenantId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from("facilities")
      .insert({
        name,
        description,
        icon: icon || "Building2",
        color: color || "bg-blue-500",
        images: images || [],
        features: features || [],
        order_index: (maxOrder?.order_index || 0) + 1,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

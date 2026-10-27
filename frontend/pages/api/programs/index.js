/**
 * GET  /api/programs — list programs for the authenticated user's tenant
 * POST /api/programs — create a new program
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
      .from("programs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("id", { ascending: true });

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === "POST") {
    const { title, category, description, image } = req.body;
    const { data, error } = await supabase
      .from("programs")
      .insert({
        title,
        category: category || "",
        description: description || "",
        image: image || "",
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

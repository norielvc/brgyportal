/**
 * PUT /api/programs/bulk/update — bulk replace programs for tenant
 */
import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;
  const tenantId = userRes.tenant_id;

  const { programs } = req.body;
  if (!Array.isArray(programs)) {
    return res.status(400).json({ success: false, message: "programs must be an array" });
  }

  await supabase.from("programs").delete().eq("tenant_id", tenantId);

  if (programs.length > 0) {
    const toInsert = programs.map((p) => ({
      title: p.title,
      category: p.category || "",
      description: p.description || "",
      image: p.image || "",
      tenant_id: tenantId,
    }));

    const { error } = await supabase.from("programs").insert(toInsert);
    if (error) return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true, message: "Programs updated" });
}

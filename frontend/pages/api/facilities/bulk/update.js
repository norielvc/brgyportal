/**
 * PUT /api/facilities/bulk/update — bulk replace facilities for tenant
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

  const { facilities } = req.body;
  if (!Array.isArray(facilities)) {
    return res.status(400).json({ success: false, message: "facilities must be an array" });
  }

  // Delete existing and re-insert (preserves ordering)
  await supabase.from("facilities").delete().eq("tenant_id", tenantId);

  if (facilities.length > 0) {
    const toInsert = facilities.map((f, index) => ({
      name: f.name,
      description: f.description,
      icon: f.icon || "Building2",
      color: f.color || "bg-blue-500",
      images: f.images || [],
      features: f.features || [],
      order_index: index,
      tenant_id: tenantId,
    }));

    const { error } = await supabase.from("facilities").insert(toInsert);
    if (error) return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true, message: "Facilities updated" });
}

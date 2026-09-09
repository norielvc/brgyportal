import { authenticateToken } from "../../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  const tenantId = userRes?.tenant_id || "ibaoeste";

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { achievements } = req.body;
  if (!Array.isArray(achievements)) {
    return res.status(400).json({ success: false, message: "achievements must be an array" });
  }

  try {
    await supabase.from("achievements").delete().eq("tenant_id", tenantId);

    if (achievements.length > 0) {
      const toInsert = achievements.map((a) => ({
        title: a.title,
        category: a.category || "",
        description: a.description || "",
        year: a.year || new Date().getFullYear().toString(),
        image: a.image || "",
        color_class: a.color_class || "bg-blue-500",
        text_color: a.text_color || "blue-400",
        tenant_id: tenantId,
      }));

      const { error } = await supabase.from("achievements").insert(toInsert);
      if (error) return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: "Achievements updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

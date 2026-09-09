import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req, res) {
  try {
    const userRes = await authenticateToken(req, res);
    const tenantId = userRes?.tenant_id || "ibaoeste";

    const supabase = getSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("id", { ascending: true });

      if (error) {
        // Return empty array gracefully if table does not exist
        return res.status(200).json({ success: true, data: [] });
      }
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === "POST") {
      const { title, category, description, year, image, color_class, text_color } = req.body;
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
  } catch (err) {
    return res.status(200).json({ success: true, data: [] });
  }
}

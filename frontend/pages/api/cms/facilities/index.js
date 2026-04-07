import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return; // Auth handled response

  const tenantId = userRes.tenant_id;

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
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

      const newOrderIndex = (maxOrder?.order_index || 0) + 1;

      const { data: facility, error } = await supabase
        .from("facilities")
        .insert({
          name,
          description,
          icon: icon || "Building2",
          color: color || "bg-blue-500",
          images: images || ["/background.jpg"],
          features: features || [],
          order_index: newOrderIndex,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return res
        .status(201)
        .json({ success: true, message: "Facility created", data: facility });
    }

    if (req.method === "PUT") {
      // Check for bulk update
      if (req.body.bulk && Array.isArray(req.body.facilities)) {
        const { facilities } = req.body;
        await supabase.from("facilities").delete().eq("tenant_id", tenantId);

        const listToInsert = facilities.map((f, index) => ({
          name: f.name,
          description: f.description,
          icon: f.icon || "Building2",
          color: f.color || "bg-blue-500",
          images: f.images || ["/background.jpg"],
          features: f.features || [],
          order_index: index,
          tenant_id: tenantId,
        }));

        const { error } = await supabase
          .from("facilities")
          .insert(listToInsert);
        if (error) throw error;
        return res
          .status(200)
          .json({ success: true, message: "Facilities updated" });
      }

      // Single update
      const {
        id,
        name,
        description,
        icon,
        color,
        images,
        features,
        order_index,
      } = req.body;
      const { data, error } = await supabase
        .from("facilities")
        .update({
          name,
          description,
          icon,
          color,
          images,
          features,
          order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      const { error } = await supabase
        .from("facilities")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res
        .status(200)
        .json({ success: true, message: "Facility deleted" });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("CMS Facilities API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

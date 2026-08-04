import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("tourism_destinations")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === "POST") {
      const { name, description, image, directions_url } = req.body;

      const { data: maxOrder } = await supabase
        .from("tourism_destinations")
        .select("order_index")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const newOrderIndex = (maxOrder?.order_index || 0) + 1;

      const { data: destination, error } = await supabase
        .from("tourism_destinations")
        .insert({
          name,
          description: description || "",
          image: image || "",
          directions_url: directions_url || "",
          order_index: newOrderIndex,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return res
        .status(201)
        .json({ success: true, message: "Destination created", data: destination });
    }

    if (req.method === "PUT") {
      if (req.body.bulk && Array.isArray(req.body.destinations)) {
        const { destinations } = req.body;
        await supabase.from("tourism_destinations").delete().eq("tenant_id", tenantId);

        const listToInsert = destinations.map((d, index) => ({
          name: d.name,
          description: d.description || "",
          image: d.image || "",
          directions_url: d.directions_url || "",
          order_index: index,
          tenant_id: tenantId,
        }));

        const { error } = await supabase
          .from("tourism_destinations")
          .insert(listToInsert);
        if (error) throw error;
        return res
          .status(200)
          .json({ success: true, message: "Destinations updated" });
      }

      const {
        id,
        name,
        description,
        image,
        directions_url,
        order_index,
      } = req.body;
      const { data, error } = await supabase
        .from("tourism_destinations")
        .update({
          name,
          description,
          image,
          directions_url,
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
        .from("tourism_destinations")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res
        .status(200)
        .json({ success: true, message: "Destination deleted" });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("CMS Tourism API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

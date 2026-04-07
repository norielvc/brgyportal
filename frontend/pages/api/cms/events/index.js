import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return; // Auth handled response

  const tenantId = userRes.tenant_id;

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === "POST") {
      const { title, description, body, date, image } = req.body;

      const { data: maxOrder } = await supabase
        .from("events")
        .select("order_index")
        .eq("tenant_id", tenantId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const newOrderIndex = (maxOrder?.order_index || 0) + 1;

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          title,
          description,
          body: body || "",
          date,
          image: image || "/background.jpg",
          order_index: newOrderIndex,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return res
        .status(201)
        .json({ success: true, message: "Event created", data: event });
    }

    if (req.method === "PUT") {
      // Check for bulk update
      if (req.body.bulk && Array.isArray(req.body.events)) {
        const { events } = req.body;
        // Native bulk update logic (delete and re-insert for ordering)
        await supabase.from("events").delete().eq("tenant_id", tenantId);

        const eventsToInsert = events.map((event, index) => ({
          title: event.title,
          description: event.description,
          body: event.body || "",
          date: event.date,
          image: event.image || "/background.jpg",
          order_index: index,
          tenant_id: tenantId,
        }));

        const { error } = await supabase.from("events").insert(eventsToInsert);
        if (error) throw error;
        return res
          .status(200)
          .json({ success: true, message: "Events updated" });
      }

      // Single update
      const { id, title, description, body, date, image, order_index } =
        req.body;
      const { data, error } = await supabase
        .from("events")
        .update({
          title,
          description,
          body,
          date,
          image,
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
        .from("events")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res.status(200).json({ success: true, message: "Event deleted" });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("CMS Events API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

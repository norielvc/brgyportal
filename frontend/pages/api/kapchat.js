import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      message: "Supabase URL and key are not configured",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === "POST") {
      const { name, contact, message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Required field: message",
        });
      }

      const { data, error } = await supabase
        .from("kapchat_messages")
        .insert([
          {
            tenant_id: tenantId,
            sender_name: name ? name.trim() : null,
            contact: contact ? contact.trim() : null,
            message: message.trim(),
            is_admin: false,
            status: "unread",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: "Chat message submitted successfully",
        chat: data,
      });
    }

    if (req.method === "GET") {
      const { status } = req.query;

      let query = supabase
        .from("kapchat_messages")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return res.json({
        success: true,
        messages: data,
        totalItems: count,
      });
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const { status } = req.body;

      if (!id || !status) {
        return res.status(400).json({
          success: false,
          message: "id and status are required",
        });
      }

      const { data, error } = await supabase
        .from("kapchat_messages")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Chat status updated",
        chat: data,
      });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling KapChat message:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to handle KapChat message",
    });
  }
}

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
      const { name, sender_name, contact, message, is_admin, status } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Required field: message",
        });
      }

      const isAdminMsg = Boolean(is_admin);
      const sName = sender_name ? sender_name.trim() : (name ? name.trim() : (isAdminMsg ? "Barangay Captain" : "Resident"));
      const sContact = contact ? contact.trim() : null;
      const initialStatus = status || (isAdminMsg ? "replied" : "unread");

      const { data, error } = await supabase
        .from("kapchat_messages")
        .insert([
          {
            tenant_id: tenantId,
            sender_name: sName,
            contact: sContact,
            message: message.trim(),
            is_admin: isAdminMsg,
            status: initialStatus,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // If this is an admin reply and we have contact, mark earlier unread citizen messages from this contact as 'replied'
      if (isAdminMsg && sContact) {
        await supabase
          .from("kapchat_messages")
          .update({ status: "replied" })
          .eq("tenant_id", tenantId)
          .eq("contact", sContact)
          .eq("is_admin", false);
      }

      return res.status(201).json({
        success: true,
        message: "Chat message submitted successfully",
        chat: data,
      });
    }

    if (req.method === "GET") {
      const { status, contact, order } = req.query;

      const isAsc = order === "asc" || Boolean(contact);
      let query = supabase
        .from("kapchat_messages")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: isAsc });

      if (contact) {
        query = query.eq("contact", contact.trim());
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return res.json({
        success: true,
        messages: data || [],
        totalItems: count || 0,
      });
    }

    if (req.method === "PUT") {
      const { id, contact } = req.query;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "status is required",
        });
      }

      if (contact) {
        // Bulk update for all messages in a contact thread
        const { data, error } = await supabase
          .from("kapchat_messages")
          .update({ status })
          .eq("contact", contact.trim())
          .eq("tenant_id", tenantId)
          .select();

        if (error) throw error;

        return res.json({
          success: true,
          message: `Thread status updated to ${status}`,
          updated: data,
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id or contact is required",
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

    if (req.method === "DELETE") {
      const { id, contact } = req.query;
      if (!id && !contact) {
        return res.status(400).json({ success: false, message: "id or contact is required" });
      }

      let query = supabase.from("kapchat_messages").delete().eq("tenant_id", tenantId);

      if (contact) {
        query = query.eq("contact", contact.trim());
      } else {
        query = query.eq("id", id);
      }

      const { error } = await query;

      if (error) throw error;
      return res.json({ success: true, message: "Chat message(s) deleted successfully" });
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

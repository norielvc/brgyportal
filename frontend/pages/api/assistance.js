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
      const { firstName, lastName, email, phone, message } = req.body;

      if (!firstName || !lastName || !message) {
        return res.status(400).json({
          success: false,
          message: "Required fields: firstName, lastName, message",
        });
      }

      const { data, error } = await supabase
        .from("assistance_inquiries")
        .insert([
          {
            tenant_id: tenantId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email ? email.trim() : null,
            phone: phone ? phone.trim() : null,
            message: message.trim(),
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: "Assistance inquiry submitted successfully",
        inquiry: data,
      });
    }

    if (req.method === "GET") {
      const { status } = req.query;

      let query = supabase
        .from("assistance_inquiries")
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
        inquiries: data,
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
        .from("assistance_inquiries")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Inquiry updated",
        inquiry: data,
      });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling assistance inquiry:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to handle assistance inquiry",
    });
  }
}

import { supabase, isSupabaseServerConfigured } from "../../lib/supabase";

export default async function handler(req, res) {
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  if (!isSupabaseServerConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Supabase URL and key are not configured",
    });
  }

  try {
    if (req.method === "POST") {
      const { firstName, lastName, email, phone, message, resident_id } =
        req.body;

      if (!firstName || !lastName || !message) {
        return res.status(400).json({
          success: false,
          message: "Required fields: firstName, lastName, message",
        });
      }

      const residentId =
        resident_id != null ? String(resident_id).trim() : "";
      if (!residentId) {
        return res.status(403).json({
          success: false,
          message:
            "Brgy Assistance is available to registered barangay residents only. Select your record from the census directory.",
        });
      }

      const { data: resident, error: residentErr } = await supabase
        .from("residents")
        .select("id, full_name, contact_number, tenant_id, is_deceased")
        .eq("tenant_id", tenantId)
        .eq("id", residentId)
        .maybeSingle();

      if (residentErr) throw residentErr;
      if (!resident || resident.is_deceased) {
        return res.status(403).json({
          success: false,
          message: "Invalid or inactive resident record for Brgy Assistance.",
        });
      }

      const insertRow = {
        tenant_id: tenantId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        message: message.trim(),
        status: "pending",
        resident_id: String(resident.id),
      };

      let { data, error } = await supabase
        .from("assistance_inquiries")
        .insert([insertRow])
        .select()
        .single();

      if (error && /resident_id/i.test(error.message || "")) {
        const { resident_id: _rid, ...legacyRow } = insertRow;
        ({ data, error } = await supabase
          .from("assistance_inquiries")
          .insert([legacyRow])
          .select()
          .single());
      }

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

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: "id is required" });
      }
      const { error } = await supabase
        .from("assistance_inquiries")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res.json({ success: true, message: "Assistance inquiry deleted successfully" });
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

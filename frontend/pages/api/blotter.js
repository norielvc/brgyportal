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

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      const {
      complainant_resident_id,
      complainant_name,
      respondent_name,
      details,
      incident_date,
      incident_time,
      contact_number,
      email,
    } = req.body;

    if (!complainant_name || !respondent_name || !details || !incident_date || !contact_number) {
      return res.status(400).json({
        success: false,
        message: "Required fields: complainant_name, respondent_name, details, incident_date, contact_number",
      });
    }

    const { data, error } = await supabase
      .from("blotter_reports")
      .insert([
        {
          tenant_id: tenantId,
          complainant_resident_id: complainant_resident_id || null,
          complainant_name: complainant_name.trim(),
          respondent_name: respondent_name.trim(),
          details: details.trim(),
          incident_date,
          incident_time: incident_time || null,
          contact_number: contact_number.trim(),
          email: email ? email.trim() : null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Blotter report submitted successfully",
      report: data,
    });
    }

    if (req.method === "GET") {
      const { status } = req.query;

      let query = supabase
        .from("blotter_reports")
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
        reports: data,
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
        .from("blotter_reports")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Blotter report updated",
        report: data,
      });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error creating blotter report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit blotter report",
    });
  }
}

import { supabase, isSupabaseServerConfigured } from "../../lib/supabase";
import { BLOTTER_DETAILS_MAX_CHARS } from "../../src/lib/blotterConstants";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuidOrNull(value) {
  if (value == null || value === "") return null;
  const v = String(value).trim();
  return UUID_RE.test(v) ? v : null;
}

function normalizeTime(value) {
  if (value == null || String(value).trim() === "") return null;
  const t = String(value).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return t.length === 5 ? `${t}:00` : t;
  return null;
}

function mapSupabaseError(error) {
  const msg = error?.message || "";
  const code = error?.code || "";

  if (
    code === "42P01" ||
    msg.includes("blotter_reports") ||
    msg.includes("Could not find the table")
  ) {
    return {
      status: 503,
      message:
        "Hindi pa naka-setup ang blotter sa database. Patakbuhin ang backend/CREATE_BLOTTER_TABLE.sql sa Supabase.",
    };
  }

  if (code === "42501" || msg.toLowerCase().includes("row-level security")) {
    return {
      status: 503,
      message:
        "Hindi makapag-submit: kailangan ng SUPABASE_SERVICE_ROLE_KEY sa server (Vercel env) o RLS policy para sa blotter_reports.",
    };
  }

  return {
    status: 500,
    message: msg || "Failed to submit blotter report",
  };
}

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
      const {
        complainant_resident_id,
        complainant_name,
        respondent_name,
        details,
        incident_date,
        incident_time,
        contact_number,
        email,
      } = req.body || {};

      if (
        !complainant_name ||
        !respondent_name ||
        !details ||
        !incident_date ||
        !contact_number
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Required fields: complainant_name, respondent_name, details, incident_date, contact_number",
        });
      }

      const detailsText = String(details).trim();
      if (detailsText.length > BLOTTER_DETAILS_MAX_CHARS) {
        return res.status(400).json({
          success: false,
          message: `Ang detalye ay hanggang ${BLOTTER_DETAILS_MAX_CHARS.toLocaleString()} titik lamang`,
        });
      }

      const row = {
        tenant_id: String(tenantId).trim().toLowerCase(),
        complainant_resident_id: asUuidOrNull(complainant_resident_id),
        complainant_name: String(complainant_name).trim(),
        respondent_name: String(respondent_name).trim(),
        details: detailsText,
        incident_date: String(incident_date).trim(),
        incident_time: normalizeTime(incident_time),
        contact_number: String(contact_number).trim(),
        email: email ? String(email).trim() : null,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("blotter_reports")
        .insert([row])
        .select()
        .single();

      if (error) {
        const mapped = mapSupabaseError(error);
        console.error("Blotter insert error:", error);
        return res.status(mapped.status).json({
          success: false,
          message: mapped.message,
          code: error.code,
        });
      }

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

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: "id is required" });
      }
      const { error } = await supabase
        .from("blotter_reports")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res.json({ success: true, message: "Blotter report deleted successfully" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling blotter request:", error);
    const mapped = mapSupabaseError(error);
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
    });
  }
}

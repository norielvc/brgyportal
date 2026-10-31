import { supabase, isSupabaseServerConfigured } from "../../lib/supabase";
import { BLOTTER_DETAILS_MAX_CHARS } from "../../src/lib/blotterConstants";
import { authenticateToken } from "../../src/lib/api-auth";
import { defaultPetsaNgPaghaharap } from "../../src/lib/blotterVerify";

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

function normalizeTenantId(value) {
  return String(value || "").trim().toLowerCase();
}

function supabaseErrorText(error) {
  if (!error) return "";
  return [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ");
}

function normalizeTime(value) {
  if (value == null || String(value).trim() === "") return null;
  const t = String(value).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) return t.length === 5 ? `${t}:00` : t;
  return null;
}

function mapSupabaseError(error) {
  const msg = supabaseErrorText(error);
  const code = error?.code || "";

  if (code === "PGRST116" || code === "NOT_FOUND" || code === "TENANT_MISMATCH") {
    return {
      status: 404,
      message:
        "Hindi mahanap ang E-Sumbong record para sa barangay na ito. I-refresh ang list at subukang muli.",
    };
  }

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

  if (
    msg.includes("usaping_barangay_number") ||
    msg.includes("petsa_ng_paghaharap") ||
    msg.includes("oras_ng_paghaharap") ||
    msg.includes("verified_at")
  ) {
    return {
      status: 503,
      message:
        "Kailangan i-run ang backend/BLOTTER_VERIFY_MIGRATION.sql sa Supabase para sa verify ng E-Sumbong.",
    };
  }

  if (msg.includes("intake_source")) {
    return {
      status: 503,
      message:
        "Run backend/BLOTTER_INTAKE_SOURCE_MIGRATION.sql on Supabase for walk-in E-Sumbong intake.",
    };
  }

  if (
    code === "23514" ||
    msg.includes("check constraint") ||
    msg.includes("under_review")
  ) {
    return {
      status: 503,
      message:
        "Hindi suportado ng database ang status na under_review. Patakbuhin ang backend/BLOTTER_STATUS_CHECK_FIX.sql sa Supabase.",
    };
  }

  return {
    status: 500,
    message: msg.trim() || "Failed to submit blotter report",
  };
}

async function generateUsapingBarangayNumber(supabaseClient, tenantId) {
  const year = new Date().getFullYear();
  const prefix = `UB-${year}-`;
  const { count, error } = await supabaseClient
    .from("blotter_reports")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .not("usaping_barangay_number", "is", null)
    .like("usaping_barangay_number", `${prefix}%`);

  if (error) throw error;
  const next = (count || 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function verifyBlotterReport({
  supabaseClient,
  tenantId,
  id,
  petsaOverride,
}) {
  const normalizedTenant = normalizeTenantId(tenantId);

  const { data: existing, error: fetchErr } = await supabaseClient
    .from("blotter_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  if (!existing) {
    const notFound = new Error("Blotter report not found");
    notFound.code = "NOT_FOUND";
    throw notFound;
  }

  if (normalizeTenantId(existing.tenant_id) !== normalizedTenant) {
    const mismatch = new Error("Tenant mismatch");
    mismatch.code = "TENANT_MISMATCH";
    throw mismatch;
  }

  if (existing.verified_at && existing.usaping_barangay_number) {
    return { report: existing, alreadyVerified: true };
  }

  const usaping_barangay_number = await generateUsapingBarangayNumber(
    supabaseClient,
    existing.tenant_id,
  );
  const petsa_ng_paghaharap =
    petsaOverride && /^\d{4}-\d{2}-\d{2}$/.test(String(petsaOverride).trim())
      ? String(petsaOverride).trim()
      : defaultPetsaNgPaghaharap(new Date());

  const patch = {
    verified_at: new Date().toISOString(),
    usaping_barangay_number,
    petsa_ng_paghaharap,
    oras_ng_paghaharap: "09:00:00",
    status:
      existing.status === "pending" ? "under_review" : existing.status,
  };

  const { data, error } = await supabaseClient
    .from("blotter_reports")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", existing.tenant_id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const failed = new Error("Verify update returned no row");
    failed.code = "PGRST116";
    throw failed;
  }
  return { report: data, alreadyVerified: false };
}

function parsePetsaNgPaghaharapInput(value) {
  if (value == null || String(value).trim() === "") return null;
  const d = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const parsed = new Date(`${d}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return d;
}

async function updatePetsaNgPaghaharap({
  supabaseClient,
  tenantId,
  id,
  petsa_ng_paghaharap,
  oras_ng_paghaharap,
}) {
  const normalizedTenant = normalizeTenantId(tenantId);
  const petsa = parsePetsaNgPaghaharapInput(petsa_ng_paghaharap);
  if (!petsa) {
    const err = new Error("Invalid petsa_ng_paghaharap (use YYYY-MM-DD)");
    err.code = "INVALID_DATE";
    throw err;
  }
  const oras = normalizeTime(oras_ng_paghaharap);

  const { data: existing, error: fetchErr } = await supabaseClient
    .from("blotter_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!existing) {
    const notFound = new Error("Blotter report not found");
    notFound.code = "NOT_FOUND";
    throw notFound;
  }
  if (normalizeTenantId(existing.tenant_id) !== normalizedTenant) {
    const mismatch = new Error("Tenant mismatch");
    mismatch.code = "TENANT_MISMATCH";
    throw mismatch;
  }
  if (!existing.verified_at || !existing.usaping_barangay_number) {
    const err = new Error("Verify E-Sumbong first before setting hearing date");
    err.code = "NOT_VERIFIED";
    throw err;
  }

  const patch = { petsa_ng_paghaharap: petsa };
  if (oras_ng_paghaharap !== undefined) {
    patch.oras_ng_paghaharap = oras;
  }

  const { data, error } = await supabaseClient
    .from("blotter_reports")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", existing.tenant_id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const failed = new Error("Update returned no row");
    failed.code = "PGRST116";
    throw failed;
  }
  return data;
}

export default async function handler(req, res) {
  const tenantId = normalizeTenantId(req.headers["x-tenant-id"]);
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
        intake_source: intakeSourceRaw,
      } = req.body || {};

      const intake_source =
        String(intakeSourceRaw || "portal").trim().toLowerCase() === "walk_in"
          ? "walk_in"
          : "portal";

      if (intake_source === "walk_in") {
        const user = await authenticateToken(req, res);
        if (!user) return;
        const staffTenant = normalizeTenantId(user.tenant_id || user.tenantId);
        if (staffTenant && staffTenant !== tenantId) {
          return res.status(403).json({
            success: false,
            message: "Tenant mismatch for walk-in intake",
          });
        }
      } else if (!asUuidOrNull(complainant_resident_id)) {
        return res.status(400).json({
          success: false,
          message:
            "Portal submissions require a registered census resident (complainant_resident_id)",
        });
      }

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
        tenant_id: tenantId,
        complainant_resident_id: asUuidOrNull(complainant_resident_id),
        complainant_name: String(complainant_name).trim(),
        respondent_name: String(respondent_name).trim(),
        details: detailsText,
        incident_date: String(incident_date).trim(),
        incident_time: normalizeTime(incident_time),
        contact_number: String(contact_number).trim(),
        email: email ? String(email).trim() : null,
        intake_source,
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

      try {
        const { notifyNewBlotterReport } = await import(
          "../../src/lib/blotterNotificationHelper"
        );
        const notifyResult = await notifyNewBlotterReport({
          supabase,
          tenantId: row.tenant_id,
          report: data,
        });
        console.log("[blotter] submit notifications:", notifyResult);
      } catch (notifyErr) {
        console.error("[blotter] submit notification error:", notifyErr);
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
      const body = req.body || {};
      const {
        status,
        action,
        petsa_ng_paghaharap: petsaOverride,
        oras_ng_paghaharap: orasOverride,
      } = body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id is required",
        });
      }

      if (action === "verify") {
        const user = await authenticateToken(req, res);
        if (!user) return;

        try {
          const result = await verifyBlotterReport({
            supabaseClient: supabase,
            tenantId,
            id,
            petsaOverride,
          });
          const { report, alreadyVerified } = result;

          if (!alreadyVerified) {
            try {
              const { notifyBlotterStatusChange } = await import(
                "../../src/lib/blotterNotificationHelper"
              );
              await notifyBlotterStatusChange({
                supabase,
                report,
                newStatus: report.status,
                previousStatus: "pending",
              });
            } catch (notifyErr) {
              console.error("[blotter] verify notification error:", notifyErr);
            }
          }

          return res.json({
            success: true,
            message: alreadyVerified
              ? "E-Sumbong already verified"
              : "E-Sumbong verified — usaping barangay number assigned",
            report,
            alreadyVerified,
          });
        } catch (verifyErr) {
          const mapped = mapSupabaseError(verifyErr);
          console.error(
            "Blotter verify error:",
            verifyErr?.code,
            verifyErr?.message,
            verifyErr?.details,
            verifyErr,
          );
          return res.status(mapped.status).json({
            success: false,
            message: mapped.message,
          });
        }
      }

      if (action === "update_petsa") {
        const user = await authenticateToken(req, res);
        if (!user) return;

        try {
          const report = await updatePetsaNgPaghaharap({
            supabaseClient: supabase,
            tenantId,
            id,
            petsa_ng_paghaharap: petsaOverride,
            oras_ng_paghaharap: orasOverride,
          });
          return res.json({
            success: true,
            message: "Petsa ng paghaharap updated",
            report,
          });
        } catch (petsaErr) {
          if (petsaErr?.code === "INVALID_DATE") {
            return res.status(400).json({
              success: false,
              message: "Invalid date. Use format YYYY-MM-DD.",
            });
          }
          if (petsaErr?.code === "NOT_VERIFIED") {
            return res.status(400).json({
              success: false,
              message: petsaErr.message,
            });
          }
          const mapped = mapSupabaseError(petsaErr);
          console.error("Blotter update petsa error:", petsaErr);
          return res.status(mapped.status).json({
            success: false,
            message: mapped.message,
          });
        }
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "status is required (or use action: verify / update_petsa)",
        });
      }

      const { data: before, error: beforeErr } = await supabase
        .from("blotter_reports")
        .select("status, email, complainant_name, incident_date, id, respondent_name")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (beforeErr) throw beforeErr;

      const { data, error } = await supabase
        .from("blotter_reports")
        .update({ status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      try {
        const { notifyBlotterStatusChange } = await import(
          "../../src/lib/blotterNotificationHelper"
        );
        const statusNotify = await notifyBlotterStatusChange({
          supabase,
          report: data,
          newStatus: status,
          previousStatus: before?.status,
        });
        console.log("[blotter] status notifications:", statusNotify);
      } catch (notifyErr) {
        console.error("[blotter] status notification error:", notifyErr);
      }

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

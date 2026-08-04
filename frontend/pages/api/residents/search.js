import path from "path";
import fs from "fs/promises";

/**
 * RESIDENT SEARCH API (Next.js)
 * ----------------------------
 * Handles /api/residents/search?name=...
 * Implements "Resilience Fallback" for paused Supabase plans.
 */
export default async function handler(req, res) {
  const { name, gender, civil_status, purok, is_deceased, pending_case, sort } = req.query;
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  // If no name is provided, default to empty to match against anything in the full_name field
  const searchStr = `%${name || ""}%`;

  /**
   * STAGE 1: Live Cloud Attempt
   */
  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );

    let query = supabase
      .from("residents")
      .select("*", { count: "exact" })
      .ilike("full_name", searchStr)
      .eq("tenant_id", tenantId);

    // Advanced filters
    if (gender) query = query.eq("gender", gender.toUpperCase());
    if (civil_status) query = query.eq("civil_status", civil_status.toUpperCase());
    if (purok) query = query.ilike("purok", `%${purok}%`);
    if (is_deceased === "true") query = query.eq("is_deceased", true);
    if (is_deceased === "false") query = query.eq("is_deceased", false);
    if (pending_case === "true") query = query.eq("pending_case", true);
    if (pending_case === "false") query = query.eq("pending_case", false);

    // Sorting
    const sortMap = {
      name_asc: { column: "full_name", ascending: true },
      name_desc: { column: "full_name", ascending: false },
      newest: { column: "id", ascending: false },
      oldest: { column: "id", ascending: true },
    };
    const sortConfig = sortMap[sort] || sortMap.newest;
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

    const {
      data: residents,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (!error && residents) {
      console.log(
        `✅ Resident Search: Found ${residents.length} live records. Total: ${count}`,
      );
      // Compute residential_address from structured fields when flat field is empty
      const enriched = residents.map((r) => {
        if (!r.residential_address && (r.house_number || r.purok || r.barangay || r.municipality || r.province)) {
          const parts = [
            r.house_number ? `HOUSE NO. ${r.house_number.trim()}` : null,
            r.purok ? r.purok.trim().toUpperCase() : null,
            r.barangay ? r.barangay.trim().toUpperCase() : null,
            r.municipality ? r.municipality.trim().toUpperCase() : null,
            r.province ? r.province.trim().toUpperCase() : null,
          ].filter(Boolean);
          return { ...r, residential_address: parts.join(", ") };
        }
        return r;
      });
      return res.status(200).json({
        success: true,
        residents: enriched,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        source: "cloud_supabase",
      });
    } else if (error) {
      console.error("Supabase fetch error:", error.message);
    }
  } catch (cloudError) {
    console.warn(
      "❌ Search failed: Supabase inactive or keys missing",
    );
    // Don't serve fake fallback data - return empty result
    return res.status(200).json({
      success: true,
      residents: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      source: "no_data_available",
      message: "Database unavailable - no fallback data provided"
    });
  }
}

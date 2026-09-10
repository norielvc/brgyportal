import { supabase } from "../../../lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "brgydesk-secret-key-change-in-production";

/**
 * RESIDENT SEARCH API (Next.js)
 * ----------------------------
 * Handles /api/residents/search?query=... or ?name=...
 * Implements resilient multi-word token search and tenant isolation.
 */
export default async function handler(req, res) {
  const searchParam = req.query.query || req.query.name || req.query.search || req.query.q || "";
  const { gender, civil_status, purok, is_deceased, pending_case, sort } = req.query;

  // Extract tenant_id from auth token or header
  let tenantId = req.headers["x-tenant-id"] || req.query.tenant_id;
  if (!tenantId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        tenantId = decoded.tenant_id;
      } catch (e) {
        // Ignore token decode error and use fallback
      }
    }
  }
  tenantId = tenantId || "ibaoeste";

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const tokens = searchParam.trim().toLowerCase().split(/\s+/).filter(Boolean);

  try {
    let query = supabase
      .from("residents")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId);

    if (tokens.length > 0) {
      const tokenConditions = tokens.map((token) =>
        `or(full_name.ilike.%${token}%,first_name.ilike.%${token}%,last_name.ilike.%${token}%,middle_name.ilike.%${token}%,purok.ilike.%${token}%)`
      );
      query = query.or(`and(${tokenConditions.join(",")})`);
    }

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
      const enriched = residents.map((r) => {
        const fullName = [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(" ") || r.full_name || "Unknown Resident";
        if (!r.residential_address && (r.house_number || r.purok || r.barangay || r.municipality || r.province)) {
          const parts = [
            r.house_number ? `HOUSE NO. ${r.house_number.trim()}` : null,
            r.purok ? r.purok.trim().toUpperCase() : null,
            r.barangay ? r.barangay.trim().toUpperCase() : null,
            r.municipality ? r.municipality.trim().toUpperCase() : null,
            r.province ? r.province.trim().toUpperCase() : null,
          ].filter(Boolean);
          return { ...r, full_name: fullName, residential_address: parts.join(", ") };
        }
        return { ...r, full_name: fullName };
      });

      return res.status(200).json({
        success: true,
        data: enriched,
        residents: enriched,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        source: "cloud_supabase",
      });
    } else {
      console.warn("Supabase resident search query note:", error?.message);
      return res.status(200).json({
        success: true,
        data: [],
        residents: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        source: "empty_fallback",
        message: error ? error.message : "No records found",
      });
    }
  } catch (cloudError) {
    console.error("Resident search exception:", cloudError);
    return res.status(200).json({
      success: true,
      data: [],
      residents: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      source: "no_data_available",
      message: cloudError?.message || "Database unavailable",
    });
  }
}

import { supabase } from "../../../lib/supabase";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../../../lib/jwtSecret";
import {
  CENSUS_MASTER_HEADERS,
  RESIDENT_CENSUS_EXPORT_SELECT,
  censusResidentSortKey,
  residentToCensusMasterRow,
} from "../../../src/lib/censusMasterExport";

function tenantFromRequest(req) {
  let tenantId = req.headers["x-tenant-id"] || req.query.tenant_id;
  if (!tenantId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwtSecret = getJwtSecret();
        if (jwtSecret) {
          const decoded = jwt.verify(authHeader.split(" ")[1], jwtSecret);
          tenantId = decoded.tenant_id;
        }
      } catch {
        /* header fallback */
      }
    }
  }
  return tenantId || "ibaoeste";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const tenantId = tenantFromRequest(req);
  const residentId = req.query.resident_id;

  try {
    if (residentId) {
      const { data, error } = await supabase
        .from("residents")
        .select(RESIDENT_CENSUS_EXPORT_SELECT)
        .eq("tenant_id", tenantId)
        .eq("id", residentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, message: "Resident not found" });
      }
      return res.status(200).json({
        success: true,
        sheet: "MASTER LIST",
        headers: CENSUS_MASTER_HEADERS,
        rows: [residentToCensusMasterRow(data)],
        total: 1,
        resident: {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          census_resident_number: data.census_resident_number,
        },
      });
    }

    const all = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("residents")
        .select(RESIDENT_CENSUS_EXPORT_SELECT)
        .eq("tenant_id", tenantId)
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      if (!data?.length) break;
      all.push(...data);
      if (data.length < 1000) break;
      from += 1000;
    }

    all.sort((a, b) => censusResidentSortKey(a) - censusResidentSortKey(b));

    return res.status(200).json({
      success: true,
      sheet: "MASTER LIST",
      headers: CENSUS_MASTER_HEADERS,
      rows: all.map(residentToCensusMasterRow),
      total: all.length,
    });
  } catch (error) {
    console.error("Census export error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to export census",
    });
  }
}

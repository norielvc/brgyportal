import { supabase } from "../../../lib/supabase";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../../../lib/jwtSecret";
import { authenticateToken } from "../../../src/lib/api-auth";
import {
  CENSUS_MASTER_HEADERS,
  RESIDENT_CENSUS_EXPORT_SELECT,
  censusResidentSortKey,
  residentToCensusMasterRow,
} from "../../../src/lib/censusMasterExport";
import {
  checkFullCensusExportAllowed,
  recordFullCensusExport,
} from "../../../src/lib/censusExportGuard";
import { normalizeCensusResidentNumber } from "../../../src/lib/censusResidentNumber";

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
          census_resident_number: normalizeCensusResidentNumber(
            data.census_resident_number,
          ),
        },
      });
    }

    const user = await authenticateToken(req, res);
    if (!user) return;

    const userTenant = user.tenant_id || tenantId;
    if (userTenant !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant mismatch for census export",
      });
    }

    const confirm =
      req.query.confirm === "1" ||
      req.query.confirm === "true" ||
      req.headers["x-confirm-full-census"] === "1";

    if (!confirm) {
      const { count } = await supabase
        .from("residents")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      return res.status(428).json({
        success: false,
        code: "CONFIRM_REQUIRED",
        message:
          "Full census export moves a large amount of data. Confirm in the UI or pass confirm=1.",
        estimatedResidents: count ?? 0,
      });
    }

    const actorKey = String(user._id || user.id || user.email || "staff");
    const cooldown = checkFullCensusExportAllowed(tenantId, actorKey);
    if (!cooldown.allowed) {
      return res.status(429).json({
        success: false,
        code: "EXPORT_COOLDOWN",
        message: `Full census export was run recently. Try again in ${cooldown.retryAfterSec} seconds.`,
        retryAfterSec: cooldown.retryAfterSec,
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

    recordFullCensusExport(tenantId, actorKey);

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

import { supabase } from "../../../lib/supabase";
import { authenticateToken } from "../../../src/lib/api-auth";
import { fetchMaxCensusResidentNumber } from "../../../src/lib/fetchMaxCensusResidentNumber";
import {
  CENSUS_RESIDENT_NUMBER_FLOOR,
  formatCensusResidentNumberFromNumeric,
  nextCensusResidentNumberAfterMax,
} from "../../../src/lib/censusResidentNumber";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId =
    user.tenant_id || req.headers["x-tenant-id"] || req.query.tenant_id;
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: "Tenant ID is required",
    });
  }

  try {
    const max = await fetchMaxCensusResidentNumber(supabase, tenantId);
    const next_number = nextCensusResidentNumberAfterMax(max);
    return res.status(200).json({
      success: true,
      next_number,
      last_number:
        max == null ? null : formatCensusResidentNumberFromNumeric(max),
      floor: CENSUS_RESIDENT_NUMBER_FLOOR,
    });
  } catch (error) {
    console.error("next-number error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to compute next resident number",
    });
  }
}

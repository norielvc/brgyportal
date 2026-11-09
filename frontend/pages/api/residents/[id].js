import { supabase } from "../../../lib/supabase";
import { authenticateToken } from "../../../src/lib/api-auth";
import {
  getResidentEcLinkStatus,
  syncEcCardsFromResident,
} from "../../../src/lib/ecCardResidentSync";
import {
  normalizeCensusResidentNumber,
  withNormalizedCensusResidentNumber,
} from "../../../src/lib/censusResidentNumber";

async function resolveTenantId(req, res) {
  let tenantId = req.headers["x-tenant-id"];
  if (tenantId) return tenantId;
  const userRes = await authenticateToken(req, res);
  if (!userRes) return null;
  return userRes.tenant_id || null;
}

const sanitizeResidentData = (data) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === "") {
      sanitized[key] = null;
    }
  });
  if (sanitized.census_resident_number != null) {
    sanitized.census_resident_number = normalizeCensusResidentNumber(
      sanitized.census_resident_number,
    );
  }
  return sanitized;
};

export default async function handler(req, res) {
  const tenantId = await resolveTenantId(req, res);
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const updates = sanitizeResidentData(req.body);

      // Remove read-only or generated columns to prevent Supabase errors
      delete updates.full_name;
      delete updates.id;
      delete updates.created_at;
      delete updates.updated_at;
      delete updates.tenant_id; // Do not allow manual updates of tenant_id

      const { data, error } = await supabase
        .from("residents")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      const resident = withNormalizedCensusResidentNumber(data);
      let ecCardsSynced = 0;
      let ecCardSyncError = null;
      let ecCardIds = [];

      try {
        const sync = await syncEcCardsFromResident(supabase, tenantId, resident);
        ecCardsSynced = sync.synced;
        ecCardIds = sync.cardIds || [];
        if (sync.errors?.length) {
          ecCardSyncError = sync.errors.join("; ");
          console.error("Resident → EC card sync partial failure:", sync.errors);
        }
      } catch (syncErr) {
        ecCardSyncError = syncErr.message || String(syncErr);
        console.error("Resident → EC card sync failed:", syncErr);
      }

      const ecLink = await getResidentEcLinkStatus(supabase, tenantId, resident);

      return res.status(200).json({
        success: true,
        resident,
        ecCardsSynced,
        ecCardSyncError,
        ecCardIds,
        ecLink,
      });
    } catch (error) {
      console.error("Error updating resident:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("residents")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return res
        .status(200)
        .json({ success: true, message: "Resident deleted successfully" });
    } catch (error) {
      console.error("Error deleting resident:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("residents")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Resident not found" });
      }

      const resident = withNormalizedCensusResidentNumber(data);
      const ecLink = await getResidentEcLinkStatus(supabase, tenantId, resident);

      return res.status(200).json({
        success: true,
        resident,
        ecLink,
      });
    } catch (error) {
      console.error("Error fetching resident:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}

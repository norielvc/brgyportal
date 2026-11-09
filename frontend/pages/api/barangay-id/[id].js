import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  applyEcCardNameFieldsToUpdates,
  buildFullResidentPatchFromEcCard,
  buildResidentPatchFromEcCard,
  extractPurokFromAddress,
  resolveResidentIdForEcCard,
  shouldSyncEcCardEditsToResident,
} from "../../../src/lib/ecCardResidentSync";
export default async function handler(req, res) {
  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: "ID parameter is required" });
  }

  // ── GET: Single ID details ────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("barangay_ids")
        .select("*, resident:residents(*)")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: "Barangay ID not found" });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── PUT: Update / Renew / Revoke ID ──────────────────────────────────────
  if (req.method === "PUT") {
    try {
      const {
        action,
        status,
        validity_years,
        blood_type,
        emergency_contact_name,
        emergency_contact_number,
        emergency_contact_relation,
        photo_url,
        cardholder_signature_url,
        remarks,
      } = req.body;

      const { data: existingCard, error: existingErr } = await supabase
        .from("barangay_ids")
        .select("*, resident:residents(id)")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existingErr) throw existingErr;
      if (!existingCard) {
        return res.status(404).json({ success: false, message: "Barangay ID not found" });
      }

      const updates = {
        updated_at: new Date().toISOString(),
      };

      if (action === "renew") {
        const years = parseInt(validity_years || 1, 10);
        const newExpiry = new Date();
        newExpiry.setFullYear(newExpiry.getFullYear() + years);
        updates.expiry_date = newExpiry.toISOString().split("T")[0];
        updates.status = "active";
        updates.remarks = `Renewed on ${new Date().toLocaleDateString()} for ${years} year(s)`;
      } else if (action === "revoke") {
        updates.status = "revoked";
        updates.remarks = remarks || "Revoked by Barangay Administrator";
      } else if (action === "activate") {
        updates.status = "active";
      } else if (action === "toggle_print") {
        updates.is_printed = req.body.is_printed;
        updates.printed_at = req.body.is_printed ? new Date().toISOString() : null;
      } else {
        Object.assign(
          updates,
          applyEcCardNameFieldsToUpdates(updates, req.body),
        );
        if (req.body.id_number !== undefined) {
          updates.id_number = String(req.body.id_number).trim().toUpperCase();
        }
        if (req.body.gender !== undefined) {
          updates.gender = String(req.body.gender).trim().toUpperCase();
        }
        if (req.body.birth_date !== undefined) {
          updates.birth_date = req.body.birth_date || null;
        }
        if (req.body.civil_status !== undefined) {
          updates.civil_status = String(req.body.civil_status)
            .trim()
            .toUpperCase();
        }
        if (req.body.address !== undefined) {
          updates.address = req.body.address
            ? String(req.body.address).trim().toUpperCase()
            : null;
        }
        if (req.body.purok !== undefined) {
          updates.purok = req.body.purok
            ? String(req.body.purok).trim().toUpperCase()
            : null;
        } else if (updates.address) {
          const inferred = extractPurokFromAddress(updates.address);
          if (inferred) updates.purok = inferred;
        }
        if (req.body.contact_number !== undefined) {
          updates.contact_number = req.body.contact_number || null;
        }

        if (status) updates.status = status;
        if (blood_type) updates.blood_type = blood_type;
        if (emergency_contact_name) updates.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_number) updates.emergency_contact_number = emergency_contact_number;
        if (emergency_contact_relation) updates.emergency_contact_relation = emergency_contact_relation;
        if (photo_url) updates.photo_url = photo_url;
        if (cardholder_signature_url) updates.cardholder_signature_url = cardholder_signature_url;
        if (remarks) updates.remarks = remarks;
      }

      const { data, error } = await supabase
        .from("barangay_ids")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;

      let residentSynced = false;
      let residentSyncError = null;
      let residentSyncSkippedReason = null;
      let residentAfterSync = null;
      const mergedCard = { ...existingCard, ...data };

      const isDemographicEdit =
        shouldSyncEcCardEditsToResident(action) &&
        Object.keys(updates).length > 1 &&
        !["renew", "revoke", "activate", "toggle_print"].includes(action);

      if (isDemographicEdit) {
        const residentId = await resolveResidentIdForEcCard(
          supabase,
          tenantId,
          mergedCard,
        );

        if (!residentId) {
          residentSyncSkippedReason = "no_linked_resident";
        } else {
          if (!data.resident_id && residentId) {
            await supabase
              .from("barangay_ids")
              .update({ resident_id: residentId })
              .eq("id", id)
              .eq("tenant_id", tenantId);
            data.resident_id = residentId;
          }

          const { data: censusRow } = await supabase
            .from("residents")
            .select("census_extras")
            .eq("id", residentId)
            .eq("tenant_id", tenantId)
            .maybeSingle();

          const useFullDemographicSync =
            !action || action === "update" || action === "edit";
          const residentPatch = useFullDemographicSync
            ? buildFullResidentPatchFromEcCard(
                mergedCard,
                censusRow?.census_extras,
              )
            : buildResidentPatchFromEcCard(mergedCard, updates);

          if (!residentPatch) {
            residentSyncSkippedReason = "nothing_to_sync";
          } else {
            const {
              data: updatedResident,
              error: residentErr,
            } = await supabase
              .from("residents")
              .update(residentPatch)
              .eq("id", residentId)
              .eq("tenant_id", tenantId)
              .select(
                "id, first_name, last_name, middle_name, suffix, gender, civil_status, date_of_birth, age, purok, residential_address, ec_card_number",
              )
              .maybeSingle();

            if (residentErr) {
              console.error(
                "EC card → resident sync failed:",
                residentErr.message,
              );
              residentSyncError = residentErr.message;
            } else if (!updatedResident) {
              residentSyncError =
                "Census record not updated (resident id or tenant mismatch).";
            } else {
              residentSynced = true;
              residentAfterSync = updatedResident;
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: action === "renew" ? "Barangay ID successfully renewed!" : "Barangay ID updated!",
        data,
        residentSynced,
        residentSyncError,
        residentSyncSkippedReason,
        residentAfterSync,
      });
    } catch (error) {
      console.error("PUT /api/barangay-id/[id] error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── DELETE: Delete ID record ─────────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("barangay_ids")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      return res.status(200).json({ success: true, message: "Barangay ID record deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  ecNumbersReferToSameCard,
  normalizeEcCardNumber,
} from "../../../src/lib/ecCardResidentSync";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  const raw = req.query.number || req.query.id_number || "";
  const normalized = normalizeEcCardNumber(raw);
  const excludeResidentId = req.query.exclude_resident_id || null;

  if (!normalized || normalized.length < 5) {
    return res.status(200).json({
      success: true,
      available: true,
      checked: false,
      message: null,
    });
  }

  try {
    const { data: existingCard, error: cardErr } = await supabase
      .from("barangay_ids")
      .select("id, id_number, full_name, resident_id, status")
      .eq("tenant_id", tenantId)
      .eq("id_number", normalized)
      .maybeSingle();

    if (cardErr) throw cardErr;

    if (existingCard) {
      const sameResident =
        excludeResidentId &&
        String(existingCard.resident_id) === String(excludeResidentId);
      if (!sameResident) {
        return res.status(200).json({
          success: true,
          available: false,
          checked: true,
          message: `EC Card No. "${existingCard.id_number}" is already issued to ${existingCard.full_name || "another resident"}.`,
          existing: existingCard,
        });
      }
    }

    let residentHit = null;
    const { data: residentExact, error: resExactErr } = await supabase
      .from("residents")
      .select("id, full_name, ec_card_number")
      .eq("tenant_id", tenantId)
      .eq("ec_card_number", normalized)
      .maybeSingle();

    if (resExactErr) throw resExactErr;

    if (
      residentExact &&
      (!excludeResidentId || String(residentExact.id) !== String(excludeResidentId))
    ) {
      residentHit = residentExact;
    }

    if (!residentHit) {
      const { data: residentRows, error: resErr } = await supabase
        .from("residents")
        .select("id, full_name, ec_card_number")
        .eq("tenant_id", tenantId)
        .not("ec_card_number", "is", null)
        .limit(500);

      if (resErr) throw resErr;

      residentHit = (residentRows || []).find((r) => {
        if (excludeResidentId && String(r.id) === String(excludeResidentId)) {
          return false;
        }
        return ecNumbersReferToSameCard(r.ec_card_number, normalized);
      });
    }

    if (residentHit) {
      return res.status(200).json({
        success: true,
        available: false,
        checked: true,
        message: `EC Card No. "${normalized}" is already linked on the census record for ${residentHit.full_name || "another resident"}.`,
        existing: { resident_id: residentHit.id, full_name: residentHit.full_name },
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      checked: true,
      message: null,
    });
  } catch (error) {
    console.error("[barangay-id/check]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not verify EC Card number",
    });
  }
}

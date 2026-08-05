import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    const { type, status } = req.query;
    let query = supabase
      .from("certificate_requests")
      .select("*, residents:resident_id (*)")
      .eq("tenant_id", tenantId);
    if (type && type !== "all") query = query.eq("certificate_type", type);
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });
    if (error)
      return res.status(500).json({ success: false, message: error.message });

    // For cohabitation requests, enrich with partner resident's place_of_birth
    const certificates = data || [];

    // Enrich resident residential_address from structured fields when flat field is empty
    for (const cert of certificates) {
      if (cert.residents && !cert.residents.residential_address) {
        const r = cert.residents;
        if (r.house_number || r.purok || r.barangay || r.municipality || r.province) {
          const parts = [
            r.house_number ? `HOUSE NO. ${String(r.house_number).trim()}` : null,
            r.purok ? String(r.purok).trim().toUpperCase() : null,
            r.barangay ? String(r.barangay).trim().toUpperCase() : null,
            r.municipality ? String(r.municipality).trim().toUpperCase() : null,
            r.province ? String(r.province).trim().toUpperCase() : null,
          ].filter(Boolean);
          cert.residents.residential_address = parts.join(", ");
        }
      }
    }
    const cohabitationRequests = certificates.filter(
      (c) => c.certificate_type === "barangay_cohabitation" && c.details?.partnerId
    );

    if (cohabitationRequests.length > 0) {
      const partnerIds = [...new Set(cohabitationRequests.map((c) => c.details.partnerId))];
      const { data: partnerResidents } = await supabase
        .from("residents")
        .select("id, place_of_birth, date_of_birth, age, sex, gender, residential_address")
        .eq("tenant_id", tenantId)
        .in("id", partnerIds);

      if (partnerResidents?.length) {
        const partnerMap = Object.fromEntries(partnerResidents.map((r) => [r.id, r]));
        for (const cert of certificates) {
          if (cert.certificate_type === "barangay_cohabitation" && cert.details?.partnerId) {
            const partner = partnerMap[cert.details.partnerId];
            if (partner) {
              cert.partner_place_of_birth = partner.place_of_birth || "";
              cert.partner_residential_address = partner.residential_address || "";
              if (!cert.partner_age) cert.partner_age = partner.age || "";
              if (!cert.partner_sex) cert.partner_sex = partner.sex || partner.gender || "";
              if (!cert.partner_date_of_birth) cert.partner_date_of_birth = partner.date_of_birth || "";
            }
          }
        }
      }
    }

    return res.json({ success: true, certificates });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

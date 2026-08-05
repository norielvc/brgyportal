import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

/**
 * POST /api/certificates/[id]/sync-resident
 * Syncs certificate request data back to the resident(s) profile.
 * For cohabitation: updates BOTH the requestor and partner's residential_address.
 */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res.status(403).json({ success: false, message: "Tenant context required" });

  const { id } = req.query;

  const { data: cert, error } = await supabase
    .from("certificate_requests")
    .select("*, residents:resident_id (*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !cert)
    return res.status(404).json({ success: false, message: "Certificate not found" });

  const updates = [];

  // --- Requestor sync ---
  if (cert.resident_id) {
    const residentUpdate = {};

    if (cert.address) residentUpdate.residential_address = cert.address;
    if (cert.contact_number) residentUpdate.contact_number = cert.contact_number;
    if (cert.email) residentUpdate.email = cert.email;
    if (cert.place_of_birth) residentUpdate.place_of_birth = cert.place_of_birth;
    if (cert.civil_status) residentUpdate.civil_status = cert.civil_status;

    // Natural death
    if (cert.certificate_type === "natural_death") {
      residentUpdate.is_deceased = true;
      if (cert.date_of_death) residentUpdate.date_of_death = cert.date_of_death;
      if (cert.cause_of_death) residentUpdate.cause_of_death = cert.cause_of_death;
    }

    if (Object.keys(residentUpdate).length > 0) {
      const { error: updateErr } = await supabase
        .from("residents")
        .update({ ...residentUpdate, updated_at: new Date().toISOString() })
        .eq("id", cert.resident_id)
        .eq("tenant_id", tenantId);

      if (updateErr) {
        console.error("Requestor sync error:", updateErr.message);
      } else {
        updates.push(`Requestor (${cert.full_name})`);
      }
    }
  }

  // --- Partner sync (cohabitation only) ---
  if (cert.certificate_type === "barangay_cohabitation") {
    const details = typeof cert.details === "string" ? JSON.parse(cert.details || "{}") : (cert.details || {});
    const partnerId = details.partnerId;
    const newAddress = cert.address || details.currentAddress;

    if (partnerId && newAddress) {
      const { error: partnerErr } = await supabase
        .from("residents")
        .update({
          residential_address: newAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", partnerId)
        .eq("tenant_id", tenantId);

      if (partnerErr) {
        console.error("Partner sync error:", partnerErr.message);
      } else {
        updates.push(`Partner (${cert.partner_full_name || details.partnerFullName || "Partner"})`);
      }

      // Also update the certificate record's partner_residential_address field to match
      await supabase
        .from("certificate_requests")
        .update({
          partner_residential_address: newAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", tenantId);
    }
  }

  // --- Refresh the certificate record to get updated resident data ---
  const { data: updatedCert } = await supabase
    .from("certificate_requests")
    .select("*, residents:resident_id (*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (updates.length === 0) {
    return res.json({ success: true, message: "No updates needed", data: cert });
  }

  return res.json({
    success: true,
    message: `Updated: ${updates.join(", ")}`,
    updated: updates,
    data: updatedCert || cert,
  });
}

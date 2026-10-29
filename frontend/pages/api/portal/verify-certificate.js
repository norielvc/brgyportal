/**
 * PUBLIC certificate verification (QR scan target).
 * GET /api/portal/verify-certificate?no=BD-2026-12345&tenant=ibaoeste
 */
import {
  isOfficialCertificateStatus,
  formatCertificateTypeLabel,
} from "../../../src/lib/certificateVerify";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const no = (req.query.no || "").trim();
  const tenantId = (req.query.tenant || req.headers["x-tenant-id"] || "")
    .toString()
    .toLowerCase()
    .trim();

  if (!no) {
    return res.status(400).json({ success: false, message: "Verification number required" });
  }
  if (!tenantId) {
    return res.status(400).json({ success: false, message: "Tenant required" });
  }

  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");

  try {
    const { supabase, isSupabaseServerConfigured } = await import(
      "../../../lib/supabase"
    );
    if (!isSupabaseServerConfigured()) {
      return res.status(500).json({ success: false, message: "Database not configured" });
    }

    const selectFields =
      "id, reference_number, certificate_type, status, full_name, date_issued, created_at, details, tenant_id";

    let record = null;

    const { data: byRef, error: refErr } = await supabase
      .from("certificate_requests")
      .select(selectFields)
      .eq("tenant_id", tenantId)
      .eq("reference_number", no.toUpperCase())
      .maybeSingle();

    if (!refErr && byRef) record = byRef;

    if (!record) {
      const { data: byBd, error: bdErr } = await supabase
        .from("certificate_requests")
        .select(selectFields)
        .eq("tenant_id", tenantId)
        .filter("details->>brgydesk_no", "eq", no)
        .maybeSingle();

      if (!bdErr && byBd) record = byBd;
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No matching certificate record found.",
        code: "NOT_FOUND",
      });
    }

    const details =
      typeof record.details === "string"
        ? JSON.parse(record.details || "{}")
        : record.details || {};
    const brgydeskNo = details.brgydesk_no || details.brgydeskNo || record.reference_number;

    const official = isOfficialCertificateStatus(record.status);
    const name = record.full_name || "";
    const maskedName =
      name.length > 3
        ? `${name.split(/\s+/)[0] || ""} ${(name.split(/\s+/).pop() || "").charAt(0)}.`.trim()
        : "—";

    let tenantMeta = null;
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("id, name, municipality, region")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantRow) {
      tenantMeta = {
        id: tenantRow.id,
        name: tenantRow.name,
        municipality: tenantRow.municipality,
        region: tenantRow.region,
      };
    }

    return res.status(200).json({
      success: true,
      verified: official,
      data: {
        brgydesk_no: brgydeskNo,
        reference_number: record.reference_number,
        certificate_type: record.certificate_type,
        certificate_type_label: formatCertificateTypeLabel(record.certificate_type),
        status: record.status,
        is_official: official,
        applicant_name_masked: maskedName,
        date_issued: record.date_issued || record.created_at,
        tenant_id: record.tenant_id,
        tenant: tenantMeta,
      },
      message: official
        ? "This is an official barangay certificate issued through BrgyDesk."
        : "This request is on file but is not yet released as an official certificate.",
    });
  } catch (err) {
    console.error("[verify-certificate]", err);
    return res.status(500).json({ success: false, message: "Verification unavailable" });
  }
}

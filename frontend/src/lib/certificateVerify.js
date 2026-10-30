/** Statuses that count as an officially issued certificate (scan = legit). */
export const OFFICIAL_CERTIFICATE_STATUSES = new Set([
  "released",
  "ready_for_pickup",
]);

/** Visible on verify page while still in workflow. */
export const PENDING_CERTIFICATE_STATUSES = new Set([
  "staff_review",
  "pending",
  "processing",
  "under_review",
  "approved",
  "forwarded",
  "physical_inspection",
  "payment_pending",
  "or_generated",
]);

export function generateBrgydeskNo(year = new Date().getFullYear()) {
  const suffix = String(Math.floor(10000 + Math.random() * 90000));
  return `BD-${year}-${suffix}`;
}

export function parseRequestDetails(details) {
  if (!details) return {};
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  }
  return details || {};
}

/** BrgyDesk verification number stored on the request, or legacy fallback. */
export function resolveBrgydeskNo(request) {
  if (!request) return null;
  const details = parseRequestDetails(request.details);
  const stored = details.brgydesk_no || details.brgydeskNo;
  if (stored) return String(stored).trim();
  if (request.reference_number) {
    return String(request.reference_number).trim();
  }
  return null;
}

/** Production host for QR codes (never localhost on printed certificates). */
const DEFAULT_CERT_QR_ORIGIN = "https://brgydesk.vercel.app";

function normalizeQrSiteOrigin(raw) {
  let base = String(raw || DEFAULT_CERT_QR_ORIGIN)
    .trim()
    .replace(/\/$/, "");
  try {
    const u = new URL(base.startsWith("http") ? base : `https://${base}`);
    base = u.origin;
  } catch {
    base = DEFAULT_CERT_QR_ORIGIN;
  }
  return base;
}

export function getCertificateQrSiteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_CERT_VERIFY_BASE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    DEFAULT_CERT_QR_ORIGIN;
  return normalizeQrSiteOrigin(raw);
}

/**
 * Public URL encoded in certificate QR codes.
 * Iba O' Este: https://ibaoeste.brgydesk.com/verify-certificate?no=...
 * Other tenants: https://brgydesk.vercel.app/{tenant}/verify-certificate?no=...
 * Always uses a public origin for print/QR (not localhost).
 */
export function buildCertificateVerifyUrl({ brgydeskNo, tenantId, origin }) {
  if (!brgydeskNo || !tenantId) return "";
  const tenant = String(tenantId).toLowerCase();
  const params = new URLSearchParams({ no: brgydeskNo });
  const path = `/${tenant}/verify-certificate?${params.toString()}`;

  if (origin) {
    return `${String(origin).replace(/\/$/, "")}${path}`;
  }

  if (tenant === "ibaoeste" && !process.env.NEXT_PUBLIC_CERT_VERIFY_BASE) {
    return `https://ibaoeste.brgydesk.com/verify-certificate?${params.toString()}`;
  }

  return `${getCertificateQrSiteOrigin()}${path}`;
}

export function isOfficialCertificateStatus(status) {
  return OFFICIAL_CERTIFICATE_STATUSES.has(String(status || "").toLowerCase());
}

export function formatCertificateTypeLabel(type) {
  if (!type) return "Certificate";
  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Certificate PDF/preview layout is determined by request type — never by purpose text
 * (indigency purposes may mention burial, death benefits, etc.).
 */

export function certificateTypeKey(request) {
  return String(request?.certificate_type || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function referencePrefix(request) {
  const ref = String(request?.reference_number || "").toUpperCase();
  const m = ref.match(/^([A-Z]{2,4})[-\s]/);
  return m ? m[1] : "";
}

export function isNaturalDeathCertificate(request) {
  const key = certificateTypeKey(request);
  if (key === "natural_death" || key.includes("natural_death")) return true;
  if (key) return false;
  return referencePrefix(request) === "ND";
}

export function isGuardianshipCertificate(request) {
  const key = certificateTypeKey(request);
  if (key.includes("guardian")) return true;
  if (key) return false;
  return referencePrefix(request) === "GD";
}

export function isCohabitationCertificate(request) {
  const key = certificateTypeKey(request);
  if (key.includes("cohabitation")) return true;
  if (key) return false;
  return referencePrefix(request) === "CH";
}

export function isMedicoLegalCertificate(request) {
  const key = certificateTypeKey(request);
  if (key.includes("medico")) return true;
  if (key) return false;
  const prefix = referencePrefix(request);
  return prefix === "CDL" || prefix === "ML";
}

export function isSamePersonCertificate(request) {
  const key = certificateTypeKey(request);
  return (
    key.includes("same_person") ||
    key.includes("same person") ||
    key === "certification_same_person"
  );
}

export function isIndigencyCertificate(request) {
  return certificateTypeKey(request) === "certificate_of_indigency";
}

export function isResidencyCertificate(request) {
  return certificateTypeKey(request) === "barangay_residency";
}

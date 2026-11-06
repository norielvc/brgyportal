/**
 * Portal guardian name — collected as parts, stored as single guardian_name for API/DB.
 */
export function buildGuardianFullName(parts) {
  if (!parts || typeof parts !== "object") return "";
  const fn = String(parts.guardianFirstName ?? "").trim();
  const mn = String(parts.guardianMiddleName ?? "").trim();
  const ln = String(parts.guardianLastName ?? "").trim();
  const sx = String(parts.guardianSuffix ?? "").trim();
  return [fn, mn, ln, sx].filter(Boolean).join(" ");
}

/** First, middle, and last are required; suffix optional. */
export function guardianNamePartsComplete(parts) {
  return (
    String(parts?.guardianFirstName ?? "").trim().length > 0 &&
    String(parts?.guardianMiddleName ?? "").trim().length > 0 &&
    String(parts?.guardianLastName ?? "").trim().length > 0
  );
}

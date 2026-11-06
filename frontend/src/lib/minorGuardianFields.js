/** Certificate types where a parent/guardian is required for applicants under 18 (portal). */
export const MINOR_GUARDIAN_CERT_TYPES = [
  "barangay_clearance",
  "certificate_of_indigency",
  "barangay_residency",
];

/**
 * Stored value is uppercase English (API normalizes); labels follow portal language.
 * Aligned with guardianship certificate relationship options where applicable.
 */
export const GUARDIAN_RELATIONSHIP_TO_APPLICANT_OPTIONS = [
  { value: "PARENT", en: "Parent", tl: "Magulang" },
  { value: "GRANDPARENT", en: "Grandparent", tl: "Lolo / Lola" },
  { value: "SIBLING", en: "Sibling", tl: "Kapatid" },
  { value: "AUNT/UNCLE", en: "Aunt / Uncle", tl: "Tiyo / Tiya" },
  { value: "LEGAL GUARDIAN", en: "Legal guardian", tl: "Legal na tagapag-alaga" },
  { value: "OTHER RELATIVE", en: "Other relative", tl: "Iba pang kamag-anak" },
];

/** Readable label for review UI; `stored` is the uppercase value from the select. */
export function labelForGuardianRelationshipToApplicant(stored, lang) {
  const v = String(stored || "").trim().toUpperCase();
  // Legacy values before Mother/Father were merged into Parent
  if (v === "MOTHER" || v === "FATHER") {
    const parent = GUARDIAN_RELATIONSHIP_TO_APPLICANT_OPTIONS.find((o) => o.value === "PARENT");
    if (parent) return lang === "en" ? parent.en : parent.tl;
  }
  const opt = GUARDIAN_RELATIONSHIP_TO_APPLICANT_OPTIONS.find((o) => o.value === v);
  if (!opt) return stored || "";
  return lang === "en" ? opt.en : opt.tl;
}

export function ageYearsFromForm(ageVal, dateOfBirthVal) {
  const parsed = parseInt(String(ageVal || "").trim(), 10);
  if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  if (!dateOfBirthVal) return null;
  const d = new Date(dateOfBirthVal);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
  return Math.max(0, years);
}

export function requiresGuardianForMinor(certType, ageVal, dateOfBirthVal) {
  if (!MINOR_GUARDIAN_CERT_TYPES.includes(String(certType || ""))) return false;
  const years = ageYearsFromForm(ageVal, dateOfBirthVal);
  if (years === null) return false;
  return years < 18;
}

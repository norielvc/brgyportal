/** First auto-assigned number when no higher value exists in the tenant. */
export const CENSUS_RESIDENT_NUMBER_FLOOR = 16182;

/**
 * Census master list resident number — always 5 digits (e.g. 1 → 00001).
 */
export function parseCensusResidentNumberNumeric(value) {
  if (value === null || value === undefined) return null;
  const digits = String(value)
    .trim()
    .replace(/^#?\s*/i, "")
    .replace(/^sr\s*/i, "")
    .replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatCensusResidentNumberFromNumeric(num) {
  if (!Number.isFinite(num) || num < 0) return "";
  if (num > 99999) return String(num);
  return String(num).padStart(5, "0");
}

export function nextCensusResidentNumberAfterMax(
  maxNumeric,
  floor = CENSUS_RESIDENT_NUMBER_FLOOR,
) {
  const base = maxNumeric == null || maxNumeric < 0 ? floor - 1 : maxNumeric;
  return formatCensusResidentNumberFromNumeric(Math.max(floor, base + 1));
}

export function normalizeCensusResidentNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const stripped = raw.replace(/^#?\s*/i, "").replace(/^sr\s*/i, "");
  const digits = stripped.replace(/\D/g, "");
  if (!digits) return stripped;

  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num < 0) return stripped;
  if (num > 99999) return String(num);

  return String(num).padStart(5, "0");
}

export function formatCensusResidentNumberDisplay(value) {
  return normalizeCensusResidentNumber(value) || "";
}

export function withNormalizedCensusResidentNumber(resident) {
  if (!resident) return resident;
  if (resident.census_resident_number == null) return resident;
  return {
    ...resident,
    census_resident_number: normalizeCensusResidentNumber(
      resident.census_resident_number,
    ),
  };
}

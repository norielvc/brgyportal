/** How many years back the resident-since dropdown lists (no fixed 1950 cap). */
export const RESIDENT_SINCE_YEAR_LOOKBACK = 150;

export function residentSinceYearBounds() {
  const max = new Date().getFullYear();
  const min = max - RESIDENT_SINCE_YEAR_LOOKBACK;
  return { min, max };
}

export function buildResidentSinceYearOptions(includeYear) {
  const { min, max } = residentSinceYearBounds();
  const years = new Set();
  for (let y = max; y >= min; y -= 1) years.add(y);

  const extra = parseInt(String(includeYear || "").trim(), 10);
  if (Number.isFinite(extra) && extra <= max) {
    years.add(extra);
  }

  return [...years].sort((a, b) => b - a);
}

export function isValidResidentSinceYear(value) {
  const y = parseInt(String(value || "").trim(), 10);
  const { min, max } = residentSinceYearBounds();
  return Number.isFinite(y) && y >= min && y <= max;
}

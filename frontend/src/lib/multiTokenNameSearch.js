/**
 * Multi-word search: every token must match at least one field (AND across tokens).
 * Same behavior as Resident Database `/api/residents/search`.
 */

export function parseSearchTokens(searchParam) {
  return String(searchParam || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function applyMultiTokenSearch(query, searchParam, ilikeFields) {
  const tokens = parseSearchTokens(searchParam);
  if (!tokens.length || !ilikeFields?.length) return query;

  const tokenConditions = tokens.map((token) => {
    const fieldClauses = ilikeFields
      .map((col) => `${col}.ilike.%${token}%`)
      .join(",");
    return `or(${fieldClauses})`;
  });

  return query.or(`and(${tokenConditions.join(",")})`);
}

export const RESIDENT_NAME_SEARCH_FIELDS = [
  "full_name",
  "first_name",
  "last_name",
  "middle_name",
  "purok",
];

export const BARANGAY_ID_SEARCH_FIELDS = [
  "full_name",
  "first_name",
  "last_name",
  "middle_name",
  "suffix",
  "id_number",
  "purok",
  "address",
];

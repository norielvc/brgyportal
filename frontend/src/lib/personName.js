const SUFFIXES = new Set([
  "JR",
  "JR.",
  "SR",
  "SR.",
  "II",
  "III",
  "IV",
  "V",
]);

/**
 * Split a display full name into first / middle / last / suffix (best effort).
 */
export function splitFullNameIntoParts(fullName) {
  const raw = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!raw) {
    return { first_name: "", middle_name: "", last_name: "", suffix: "" };
  }

  let parts = raw.split(" ");
  let suffix = "";
  const lastPart = parts[parts.length - 1]?.toUpperCase();
  if (parts.length > 2 && lastPart && SUFFIXES.has(lastPart)) {
    suffix = parts.pop();
  }

  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: "", last_name: parts[0], suffix };
  }
  if (parts.length === 2) {
    return {
      first_name: parts[0],
      middle_name: "",
      last_name: parts[1],
      suffix,
    };
  }

  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
    suffix,
  };
}

/** Build display full name from structured parts. */
export function joinNameParts({ first_name, middle_name, last_name, suffix } = {}) {
  return [first_name, middle_name, last_name, suffix]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefer census/resident structured names; avoid naive full_name splits that
 * put extra given names into middle_name.
 */
export function resolveApplicantNameParts(request) {
  const resident = request?.residents;
  if (resident && (resident.first_name || resident.last_name)) {
    return {
      first_name: resident.first_name || "",
      middle_name: resident.middle_name || "",
      last_name: resident.last_name || "",
      suffix: resident.suffix || "",
    };
  }

  if (request?.first_name || request?.last_name || request?.middle_name) {
    return {
      first_name: request.first_name || "",
      middle_name: request.middle_name || "",
      last_name: request.last_name || "",
      suffix: request.suffix || "",
    };
  }

  return splitFullNameIntoParts(
    request?.full_name || request?.applicant_name || "",
  );
}

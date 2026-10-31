export function normalizeSignatoryName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function signatoryNamesMatch(a, b) {
  const left = normalizeSignatoryName(a);
  const right = normalizeSignatoryName(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }
  const leftParts = left.split(" ").filter(Boolean);
  const rightParts = right.split(" ").filter(Boolean);
  if (leftParts.length < 2 || rightParts.length < 2) return false;
  return (
    leftParts[0] === rightParts[0] &&
    leftParts[leftParts.length - 1] === rightParts[rightParts.length - 1]
  );
}

/** Three-letter code from official name (e.g. ENGELBERT M. INDUCTIVO → EMI). */
export function deriveInitialsFromOfficialName(name) {
  const parts = normalizeSignatoryName(name).split(" ").filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  if (parts.length === 2) {
    const a = parts[0][0] || "";
    const b = parts[1][0] || "";
    const c = parts[1][1] || parts[0][1] || "";
    return `${a}${b}${c}`.toUpperCase();
  }
  const first = parts[0][0] || "";
  const middle = parts[parts.length - 2][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return `${first}${middle}${last}`.toUpperCase();
}

export function userDisplayName(userRow) {
  if (!userRow) return "";
  return `${userRow.first_name || userRow.firstName || ""} ${userRow.middle_name || userRow.middleName || ""} ${userRow.last_name || userRow.lastName || ""}`.trim();
}

export function userEmployeeCode(userRow) {
  if (!userRow) return "";
  const code = userRow.employee_code || userRow.employeeCode;
  return code ? String(code).toUpperCase() : "";
}

export function resolveEmployeeCodeForName(name, users = []) {
  if (!name) return "";
  const match = (users || []).find((userRow) =>
    signatoryNamesMatch(name, userDisplayName(userRow)),
  );
  const code = userEmployeeCode(match);
  if (code) return code;
  return deriveInitialsFromOfficialName(name);
}

export function normalizeWorkflowStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return raw;
  if (raw.toLowerCase() === "verifying") return "verifying";
  return raw;
}

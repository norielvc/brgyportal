const CASE_STATUSES = ["PENDING", "ONGOING", "RESOLVED", "DISMISSED"];
const DASH = "—";

export function emptyPendingCase() {
  return {
    sn: "",
    caseNo: "",
    description: "",
    dateRecorded: "",
    status: "PENDING",
  };
}

function dashToEmpty(value) {
  const v = String(value ?? "").trim();
  return v === DASH ? "" : v;
}

function emptyToDash(value) {
  const v = String(value ?? "").trim();
  return v || DASH;
}

/** @returns {{ sn: string, caseNo: string, description: string, dateRecorded: string, status: string }[]} */
export function parseCaseRecordHistory(history) {
  const lines = String(history || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(/\s*\|\s*/).map((p) => dashToEmpty(p));

    if (parts.length >= 5) {
      return {
        sn: parts[0] || "",
        caseNo: parts[1] || "",
        description: parts[2] || "",
        dateRecorded: parts[3] || "",
        status: normalizeCaseStatus(parts[4]),
      };
    }

    if (parts.length === 4) {
      return {
        sn: parts[0] || "",
        caseNo: parts[1] || "",
        description: parts[2] || "",
        dateRecorded: "",
        status: normalizeCaseStatus(parts[3]),
      };
    }

    if (parts.length === 3) {
      return {
        sn: "",
        caseNo: parts[0] || "",
        description: parts[1] || "",
        dateRecorded: "",
        status: normalizeCaseStatus(parts[2]),
      };
    }

    if (parts.length === 2) {
      return {
        sn: "",
        caseNo: "",
        description: parts[0] || "",
        dateRecorded: parts[1] || "",
        status: "PENDING",
      };
    }

    return {
      sn: "",
      caseNo: "",
      description: line,
      dateRecorded: "",
      status: "PENDING",
    };
  });
}

export function normalizeCaseStatus(status) {
  const s = String(status || "PENDING")
    .trim()
    .toUpperCase();
  return CASE_STATUSES.includes(s) ? s : "PENDING";
}

/** @param {{ sn?: string, caseNo?: string, description?: string, dateRecorded?: string, status?: string }[]} cases */
export function serializeCaseRecordHistory(cases) {
  if (!Array.isArray(cases) || !cases.length) return "";

  return cases
    .map((row) => {
      const sn = String(row.sn || "").trim();
      const caseNo = String(row.caseNo || "").trim();
      const description = String(row.description || "").trim();
      const dateRecorded = String(row.dateRecorded || "").trim();
      const status = normalizeCaseStatus(row.status);
      return [
        emptyToDash(sn),
        emptyToDash(caseNo),
        emptyToDash(description),
        emptyToDash(dateRecorded),
        status,
      ].join(" | ");
    })
    .join("\n");
}

/** For clearance PDF tables and request previews */
export function pendingCaseRows(history) {
  const parsed = parseCaseRecordHistory(history);
  if (!parsed.length) {
    return [
      {
        sn: "1",
        caseNo: DASH,
        description: "Not recorded",
        dateRecorded: DASH,
        status: "PENDING",
      },
    ];
  }
  return parsed.map((row, index) => ({
    sn: row.sn || String(index + 1),
    caseNo: row.caseNo || DASH,
    description: row.description || DASH,
    dateRecorded: row.dateRecorded || DASH,
    status: normalizeCaseStatus(row.status),
  }));
}

export { CASE_STATUSES };

/**
 * Persist chairman/captain signatures on certificate_requests.details only from
 * actual captain workflow steps — never from secretary/witness/review.
 */

export function shouldPersistCaptainSignature({
  certStatus: _certStatus,
  stepName,
  officialRole,
  signatureData,
}) {
  if (!signatureData) return false;
  const step = (stepName || "").toLowerCase();
  const role = (officialRole || "").toLowerCase();

  if (step.includes("secretary") || role.includes("secretary")) return false;
  if (step.includes("witness") || role.includes("witness")) return false;
  if (
    step.includes("councilor") &&
    !step.includes("captain") &&
    !step.includes("chairman")
  ) {
    return false;
  }

  return (
    step.includes("captain") ||
    step.includes("chairman") ||
    step.includes("punong") ||
    role.includes("captain") ||
    role.includes("chairman") ||
    role.includes("punong")
  );
}

export function mergeCaptainSignatureDetails(
  existingDetails,
  signatureData,
  certStatus,
  stepName,
  officialRole,
) {
  if (
    !shouldPersistCaptainSignature({
      certStatus,
      stepName,
      officialRole,
      signatureData,
    })
  ) {
    return null;
  }
  let details = existingDetails;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }
  if (!details || typeof details !== "object") details = {};
  return {
    ...details,
    captain_signature: signatureData,
    captain_signed_at: new Date().toISOString(),
  };
}

export function clearCaptainSignatureDetails(existingDetails) {
  let details = existingDetails;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }
  if (!details || typeof details !== "object") details = {};
  const next = { ...details };
  delete next.captain_signature;
  delete next.captainSignature;
  delete next.captain_signed_at;
  return next;
}

/** True when workflow history row is a captain/chairman approval (for backfill). */
export function isCaptainWorkflowHistoryEntry(h) {
  if (!h) return false;
  const s = (h.step_name || "").toUpperCase();
  const r = String(h.official_role || h.officialRole || "").toUpperCase();
  if (s.includes("SECRETARY") || r.includes("SECRETARY")) return false;
  if (s.includes("WITNESS") || r.includes("WITNESS")) return false;
  if (s.includes("REVIEW") && !s.includes("CAPTAIN") && !s.includes("CHAIRMAN")) {
    return false;
  }
  return (
    s.includes("CAPTAIN") ||
    s.includes("CHAIRMAN") ||
    s.includes("PUNONG") ||
    r.includes("CAPTAIN") ||
    r.includes("CHAIRMAN") ||
    r.includes("PUNONG") ||
    (h.previous_status || "").toLowerCase() === "captain_approval"
  );
}

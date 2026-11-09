/**
 * Classify workflow_history rows for secretary vs witness signatures (FTJS witness uses DB status "processing").
 */

export function isWitnessVerificationHistoryEntry(h, certificateType = "") {
  if (!h) return false;

  const prev = String(h.previous_status || "").toLowerCase();
  const step = String(h.step_name || "").toLowerCase();
  const role = String(h.official_role || h.officialRole || "").toLowerCase();
  const uRole = String(h.users?.role || "").toLowerCase();
  const newSt = String(h.new_status || "").toLowerCase();
  const cert = String(certificateType || "").toLowerCase();

  if (
    step.includes("secretary") ||
    role.includes("secretary") ||
    uRole.includes("secretary") ||
    step.includes("captain") ||
    role.includes("captain") ||
    step.includes("chairman") ||
    role.includes("chairman") ||
    step.includes("punong") ||
    role.includes("punong") ||
    step.includes("treasury") ||
    step.includes("review") ||
    step.includes("inspection")
  ) {
    return false;
  }

  if (
    cert === "first_time_job_seeker" &&
    prev === "processing" &&
    (newSt === "captain_approval" || newSt.includes("captain"))
  ) {
    return true;
  }

  return (
    step.includes("witness") ||
    role.includes("witness") ||
    uRole.includes("witness") ||
    prev.includes("witness") ||
    (step.includes("councilor") && !step.includes("secretary")) ||
    (role.includes("councilor") && !role.includes("secretary"))
  );
}

export function isSecretaryApprovalHistoryEntry(h, certificateType = "") {
  if (!h) return false;
  if (isWitnessVerificationHistoryEntry(h, certificateType)) return false;

  const step = String(h.step_name || "").toLowerCase();
  const role = String(h.official_role || h.officialRole || "").toLowerCase();
  const uRole = String(h.users?.role || "").toLowerCase();
  const prev = String(h.previous_status || "").toLowerCase();
  const newSt = String(h.new_status || "").toLowerCase();

  if (step.includes("secretary") || role.includes("secretary") || uRole.includes("secretary")) {
    return true;
  }

  if (prev === "secretary_approval") {
    return !newSt.includes("witness");
  }

  if (prev === "processing") {
    if (newSt === "captain_approval" || newSt.includes("captain")) return false;
    return step.includes("secretary") || role.includes("secretary") || uRole.includes("secretary");
  }

  return false;
}

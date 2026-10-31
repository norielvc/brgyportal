export function normalizeStepStatusKey(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function workflowStatusesMatch(stepStatus, certStatus) {
  const a = normalizeStepStatusKey(stepStatus);
  const b = normalizeStepStatusKey(certStatus);
  if (!a || !b) return false;
  if (a === b) return true;
  return false;
}

export function isBusinessPermitPreparationStep(step) {
  if (!step) return false;
  const name = String(step.name || "").toLowerCase();
  const statusKey = normalizeStepStatusKey(step.status);
  return (
    name.includes("business permit preparation") || statusKey === "staff_clerk"
  );
}

/** Map workflow step status to value stored on certificate_requests. */
export function normalizeCertificateStatus(status, options = {}) {
  const { stepName, certificateType } = options;
  const raw = String(status || "").trim();
  if (!raw) return raw;

  const key = normalizeStepStatusKey(raw);
  const name = String(stepName || "").toLowerCase();

  if (key === "verifying") return "verifying";
  if (key === "treasury") return "Treasury";
  if (key === "physical_inspection") return "physical_inspection";
  if (key === "captain_approval") return "captain_approval";
  if (key === "oic_review") return "oic_review";
  if (key === "staff_review") return "staff_review";

  if (
    certificateType === "business_permit" &&
    (key === "staff_clerk" || name.includes("business permit preparation"))
  ) {
    return "oic_review";
  }

  return raw;
}

/** Certificate DB status implied by a workflow step (e.g. Staff Clerk → oic_review). */
export function certificateStatusForStep(step, certificateType) {
  return normalizeCertificateStatus(step?.status, {
    stepName: step?.name,
    certificateType,
  });
}

export function certificateStatusMatchesStep(certStatus, step, certificateType) {
  const certKey = normalizeStepStatusKey(
    normalizeCertificateStatus(String(certStatus || ""), { certificateType }),
  );
  const stepKey = normalizeStepStatusKey(
    certificateStatusForStep(step, certificateType),
  );
  return Boolean(certKey && stepKey && certKey === stepKey);
}

export function isReleasingTeamStep(step) {
  if (!step) return false;
  const name = String(step.name || "").toLowerCase();
  return name.includes("releasing");
}

export function isCaptainApprovalStep(step) {
  if (!step) return false;
  if (workflowStatusesMatch(step.status, "captain_approval")) return true;
  const name = String(step.name || "").toLowerCase();
  return (
    name.includes("captain") ||
    name.includes("chairman") ||
    name.includes("punong")
  );
}

function captainStepsForBusinessPermit(steps) {
  if (!steps?.length) return [];
  return steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => isCaptainApprovalStep(step));
}

/** Which captain-approval step applies (physical inspection vs business permit). */
export function resolveBusinessPermitCaptainStep(steps, request = {}) {
  const captains = captainStepsForBusinessPermit(steps);
  if (!captains.length) return null;
  if (captains.length === 1) return captains[0].step;

  const assignment = request.workflow_assignment || {};
  if (assignment.step_id != null) {
    const byId = captains.find(
      ({ step }) => String(step.id) === String(assignment.step_id),
    );
    if (byId) return byId.step;
  }
  if (assignment.step_name) {
    const byName = captains.find(
      ({ step }) => step.name === assignment.step_name,
    );
    if (byName) return byName.step;
  }

  const prepIdx = steps.findIndex(isBusinessPermitPreparationStep);
  const afterPrep = captains.filter(
    ({ index }) => prepIdx === -1 || index > prepIdx,
  );
  const beforePrep = captains.filter(
    ({ index }) => prepIdx !== -1 && index < prepIdx,
  );

  const history = request.workflow_history || request.workflowHistory || [];
  const prepApproved = history.some(
    (h) =>
      h.action === "approve" &&
      String(h.step_name || "")
        .toLowerCase()
        .includes("business permit preparation"),
  );
  const finalCaptainApproved = history.some(
    (h) =>
      h.action === "approve" &&
      String(h.step_name || "")
        .toLowerCase()
        .includes("business permit") &&
      String(h.step_name || "")
        .toLowerCase()
        .includes("captain"),
  );

  if (prepApproved && !finalCaptainApproved && afterPrep.length) {
    return afterPrep[0].step;
  }

  const prevKey = normalizeStepStatusKey(
    history[0]?.previous_status || history[0]?.new_status,
  );
  const lastTransition = [...history].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  )[0];
  const fromStatus = normalizeStepStatusKey(lastTransition?.previous_status);

  if (fromStatus === "oic_review" && afterPrep.length) return afterPrep[0].step;
  if (
    (fromStatus === "verifying" || fromStatus === "physical_inspection") &&
    beforePrep.length
  ) {
    return beforePrep[0].step;
  }

  const name = String(assignment.step_name || "").toLowerCase();
  if (name.includes("business permit") && name.includes("captain")) {
    return afterPrep[0]?.step || captains[captains.length - 1].step;
  }
  if (name.includes("physical")) {
    return beforePrep[0]?.step || captains[0].step;
  }

  if (prevKey === "oic_review" && afterPrep.length) return afterPrep[0].step;

  return beforePrep[0]?.step || captains[0].step;
}

export function findStepById(steps, stepId) {
  if (!steps?.length || stepId == null) return null;
  return steps.find((step) => String(step.id) === String(stepId)) || null;
}

/** Index of the step that matches this request (prefers explicit assignment). */
export function resolveWorkflowStepIndex(steps, request) {
  if (!steps?.length || !request) return -1;

  const assignment = request.workflow_assignment;
  if (assignment?.step_id != null) {
    const byId = steps.findIndex(
      (step) => String(step.id) === String(assignment.step_id),
    );
    if (byId !== -1) return byId;
  }

  const certType = request.certificate_type;
  const certStatus = request.status;
  const matches = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => certificateStatusMatchesStep(certStatus, step, certType));

  if (matches.length === 1) return matches[0].index;

  if (
    certType === "business_permit" &&
    normalizeStepStatusKey(certStatus) === "oic_review" &&
    matches.length > 1
  ) {
    if (assignment?.step_name) {
      const byName = steps.findIndex((step) => step.name === assignment.step_name);
      if (byName !== -1) return byName;
    }
    const prep = matches.find(({ step }) => isBusinessPermitPreparationStep(step));
    const releasing = matches.find(({ step }) => isReleasingTeamStep(step));
    if (prep && releasing) {
      const name = String(assignment?.step_name || "").toLowerCase();
      if (name.includes("releasing")) return releasing.index;
      return prep.index;
    }
  }

  if (
    certType === "business_permit" &&
    normalizeStepStatusKey(certStatus) === "captain_approval" &&
    matches.length > 1
  ) {
    const captainStep = resolveBusinessPermitCaptainStep(steps, request);
    if (captainStep) {
      const idx = steps.findIndex(
        (step) => String(step.id) === String(captainStep.id),
      );
      if (idx !== -1) return idx;
    }
  }

  if (matches.length) return matches[0].index;

  return steps.findIndex((step) => workflowStatusesMatch(step.status, certStatus));
}

export function findWorkflowStepForCertificate(steps, request) {
  if (!steps?.length || !request) return null;
  const index = resolveWorkflowStepIndex(steps, request);
  return index !== -1 ? steps[index] : null;
}

/** When several pending assignments share oic_review, pick Preparation vs Releasing. */
export function pickAssignmentForCertificateStatus(steps, cert, candidates) {
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0];

  const certType = cert.certificate_type;
  const certKey = normalizeStepStatusKey(cert.status);

  if (certType === "business_permit" && certKey === "oic_review" && steps?.length) {
    const prep = steps.find(isBusinessPermitPreparationStep);
    const releasing = steps.find(isReleasingTeamStep);
    const prepRows = prep
      ? candidates.filter((row) => String(row.step_id) === String(prep.id))
      : [];
    const releaseRows = releasing
      ? candidates.filter((row) => String(row.step_id) === String(releasing.id))
      : [];
    if (prepRows.length) return prepRows[0];
    if (releaseRows.length) return releaseRows[0];
  }

  if (
    certType === "business_permit" &&
    certKey === "captain_approval" &&
    steps?.length
  ) {
    const captainStep = resolveBusinessPermitCaptainStep(steps, cert);
    if (captainStep) {
      const row = candidates.find(
        (c) => String(c.step_id) === String(captainStep.id),
      );
      if (row) return row;
    }
  }

  if (steps?.length) {
    const matchingSteps = steps.filter((step) =>
      certificateStatusMatchesStep(cert.status, step, certType),
    );
    for (const step of matchingSteps) {
      const row = candidates.find(
        (c) => String(c.step_id) === String(step.id),
      );
      if (row) return row;
    }
  }

  return candidates[0];
}

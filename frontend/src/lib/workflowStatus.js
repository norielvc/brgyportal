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
  if (key === "staff_review") return "staff_review";
  if (key === "witness_verification" || key.includes("witness") || name.includes("witness")) return "witness_verification";

  if (
    certificateType === "business_permit" &&
    (key === "staff_clerk" ||
      name.includes("business permit preparation") ||
      (key === "oic_review" && !name.includes("releasing")))
  ) {
    return "oic_review";
  }

  if (name.includes("releasing") || key === "oic_review") {
    return "ready";
  }

  if (key === "ready" || key === "ready_for_pickup") {
    return "ready";
  }

  // Custom labels such as "Awaiting Barangay Chairman Approval" must stay
  // on the allowed captain_approval status so the chairman queue keeps the request.
  if (
    name.includes("captain") ||
    name.includes("chairman") ||
    name.includes("punong") ||
    key.includes("captain") ||
    key.includes("chairman") ||
    key.includes("punong")
  ) {
    return "captain_approval";
  }

  return raw;
}

/** Canonical workflow label for punong barangay / chairman step assignees. */
export const WORKFLOW_CHAIRMAN_OFFICIAL_ROLE = "Barangay Chairman";

export function isChairmanOfficialRole(role) {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return false;
  return (
    r.includes("chairman") ||
    r.includes("captain") ||
    r.includes("punong") ||
    r.includes("brgy. chairman") ||
    r.includes("barangay chairman")
  );
}

export function normalizeWorkflowOfficialRole(role) {
  const r = String(role || "").trim();
  if (!r) return "";
  if (isChairmanOfficialRole(r)) return WORKFLOW_CHAIRMAN_OFFICIAL_ROLE;
  return r;
}

/**
 * Keep chairman steps on certificate status `captain_approval` (DB key) while
 * allowing display names like "Barangay Chairman Approval".
 */
export function normalizeWorkflowStepForSave(step, certificateType) {
  if (!step || typeof step !== "object") return step;
  const next = { ...step };

  if (next.officialRole) {
    next.officialRole = normalizeWorkflowOfficialRole(next.officialRole);
  }

  const chairmanStep = isCaptainApprovalStep(next);
  if (chairmanStep) {
    next.status = "captain_approval";
    if (!next.officialRole) {
      next.officialRole = WORKFLOW_CHAIRMAN_OFFICIAL_ROLE;
    }
  } else if (next.status) {
    const normalized = normalizeCertificateStatus(next.status, {
      stepName: next.name,
      certificateType,
    });
    if (normalized) next.status = normalized;
  }

  return next;
}

export function normalizeWorkflowStepsForSave(steps, certificateType) {
  return (steps || []).map((s) =>
    normalizeWorkflowStepForSave(s, certificateType),
  );
}

/** Normalize every certificate workflow map (API load, localStorage, workflow map cache). */
export function normalizeWorkflowsRecord(workflows) {
  if (!workflows || typeof workflows !== "object") return workflows;
  const out = { ...workflows };
  for (const certType of Object.keys(out)) {
    if (Array.isArray(out[certType])) {
      out[certType] = normalizeWorkflowStepsForSave(out[certType], certType);
    }
  }
  return out;
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

export function isBusinessPermitFinalChairmanStep(step) {
  if (!step) return false;
  const name = String(step.name || "").toLowerCase();
  return (
    name.includes("business permit") &&
    (name.includes("captain") ||
      name.includes("chairman") ||
      name.includes("punong"))
  );
}

/** Step 1 — Inspection Team (not chairman physical-inspection approval). */
export function isPhysicalInspectionTeamStep(step) {
  if (!step) return false;
  const name = String(step.name || "").toLowerCase();
  if (!workflowStatusesMatch(step.status, "physical_inspection")) return false;
  return !name.includes("captain") && !name.includes("chairman");
}

/** Step 2 — Barangay Captain Approval - Physical Inspection. */
export function isPhysicalInspectionCaptainStep(step) {
  if (!step) return false;
  if (!isCaptainApprovalStep(step)) return false;
  const name = String(step.name || "").toLowerCase();
  return name.includes("physical") || (name.includes("inspection") && !isBusinessPermitFinalChairmanStep(step));
}

export function workflowHistoryAfterLastReset(history = []) {
  let cutoff = 0;
  for (const row of history || []) {
    const action = String(row.action || "").toLowerCase();
    if (action === "return" || action === "send_back_to_start") {
      cutoff = Math.max(cutoff, new Date(row.created_at || 0).getTime());
    }
  }
  return (history || []).filter(
    (row) => new Date(row.created_at || 0).getTime() > cutoff,
  );
}

export function physicalInspectionTeamApproved(history = []) {
  const recent = workflowHistoryAfterLastReset(history);
  return recent.some((row) => {
    const action = String(row.action || "").toLowerCase();
    if (action !== "approve" && action !== "physical_inspection") return false;
    const name = String(row.step_name || "").toLowerCase();
    if (name.includes("captain") || name.includes("chairman")) return false;
    if (name.includes("review request") || name.includes("staff")) return false;
    return (
      name.includes("inspection") ||
      normalizeStepStatusKey(row.new_status) === "captain_approval" ||
      (normalizeStepStatusKey(row.previous_status) === "physical_inspection" &&
        action === "approve")
    );
  });
}

export function physicalInspectionChairmanApproved(history = []) {
  return (history || []).some((row) => {
    if (String(row.action || "").toLowerCase() !== "approve") return false;
    return isPhysicalInspectionCaptainStep({
      name: row.step_name,
      status: "captain_approval",
    });
  });
}

export function firstPhysicalInspectionCaptainStep(steps) {
  if (!steps?.length) return null;
  const inspectIdx = steps.findIndex(isPhysicalInspectionTeamStep);
  const searchFrom = inspectIdx >= 0 ? inspectIdx + 1 : 0;
  return (
    steps.slice(searchFrom).find(isPhysicalInspectionCaptainStep) ||
    steps.slice(searchFrom).find((step) => isCaptainApprovalStep(step) && !isBusinessPermitFinalChairmanStep(step)) ||
    null
  );
}

/**
 * Business permits that jumped to Finance (verifying) without chairman physical-inspection approval.
 */
export function alignBusinessPermitCertificateStatus(steps, request = {}) {
  const statusKey = normalizeStepStatusKey(request.status);
  if (request.certificate_type !== "business_permit") return request.status;

  const chairmanStep = firstPhysicalInspectionCaptainStep(steps);
  if (!chairmanStep) return request.status;

  const history = request.workflow_history || request.workflowHistory || [];
  const recent = workflowHistoryAfterLastReset(history);
  const inspectionDone = physicalInspectionTeamApproved(history);
  const chairmanDone = physicalInspectionChairmanApproved(recent);

  if (!inspectionDone || chairmanDone) return request.status;

  const needsChairman = [
    "verifying",
    "physical_inspection",
    "staff_review",
    "pending",
    "submitted",
    "processing",
    "returned",
  ].includes(statusKey);

  if (needsChairman) return "captain_approval";

  const finalChairmanDone = (history || []).some(
    (row) =>
      String(row.action || "").toLowerCase() === "approve" &&
      isBusinessPermitFinalChairmanStep({
        name: row.step_name,
        status: "captain_approval",
      }),
  );

  if (
    chairmanDone &&
    !finalChairmanDone &&
    ["ready", "ready_for_pickup"].includes(statusKey)
  ) {
    const hasFinanceStep = steps.some(
      (s) =>
        normalizeStepStatusKey(s.status) === "verifying" ||
        String(s.name || "").toLowerCase().includes("finance"),
    );
    if (hasFinanceStep) return "verifying";
  }

  return request.status;
}

/**
 * Business permit approve target.
 * Preparation always advances to the chairman. Ready is reached directly when
 * the final chairman step is approved (Releasing Team is handled in Pickup Management).
 */
export function resolveBusinessPermitApproveTarget(
  steps,
  { status, assignmentStepId, history } = {},
) {
  if (!steps?.length) return null;

  const assignmentIdx = steps.findIndex(
    (step) => String(step.id) === String(assignmentStepId),
  );
  const assignmentStep = assignmentIdx >= 0 ? steps[assignmentIdx] : null;
  const statusKey = normalizeStepStatusKey(status);
  const prepIdx = steps.findIndex(isBusinessPermitPreparationStep);
  const releaseIdx = steps.findIndex(isReleasingTeamStep);

  const chairmanApproved = (history || []).some((row) => {
    const name = String(row.step_name || "").toLowerCase();
    const prev = normalizeStepStatusKey(row.previous_status);
    return (
      String(row.action || "").toLowerCase() === "approve" &&
      name.includes("business permit") &&
      (name.includes("captain") || name.includes("chairman")) &&
      prev === "captain_approval"
    );
  });

  let currentIdx = assignmentIdx;
  if (currentIdx < 0 && statusKey) {
    const statusIdx = steps.findIndex((step) =>
      certificateStatusMatchesStep(status, step, "business_permit"),
    );
    if (statusIdx >= 0) currentIdx = statusIdx;
    if (statusKey === "captain_approval") {
      const captainStep = resolveBusinessPermitCaptainStep(steps, {
        status,
        workflow_history: history,
      });
      if (captainStep) {
        const capIdx = steps.findIndex(
          (step) => String(step.id) === String(captainStep.id),
        );
        if (capIdx >= 0) currentIdx = capIdx;
      }
    }
  }
  if (statusKey === "oic_review") {
    const onReleasing = assignmentStep && isReleasingTeamStep(assignmentStep);
    if (onReleasing && chairmanApproved && releaseIdx !== -1) {
      currentIdx = releaseIdx;
    } else if (prepIdx !== -1) {
      currentIdx = prepIdx;
    }
  }

  if (currentIdx < 0) return null;

  const currentStep = steps[currentIdx];
  const stepAfter = (fromIdx) =>
    fromIdx >= 0 && fromIdx < steps.length - 1 ? steps[fromIdx + 1] : null;

  if (assignmentStep && isPhysicalInspectionCaptainStep(assignmentStep)) {
    const financeStep =
      steps
        .slice(assignmentIdx + 1)
        .find(
          (s) =>
            normalizeStepStatusKey(s.status) === "verifying" ||
            String(s.name || "").toLowerCase().includes("finance"),
        ) || stepAfter(assignmentIdx);
    if (financeStep && !isReleasingTeamStep(financeStep)) {
      return {
        current: assignmentStep,
        next: financeStep,
        status: normalizeCertificateStatus(financeStep.status, {
          stepName: financeStep.name,
          certificateType: "business_permit",
        }),
      };
    }
  }

  if (
    assignmentStep &&
    (normalizeStepStatusKey(assignmentStep.status) === "verifying" ||
      String(assignmentStep.name || "").toLowerCase().includes("finance"))
  ) {
    const finalCaptain =
      steps
        .slice(assignmentIdx + 1)
        .find((s) => isBusinessPermitFinalChairmanStep(s)) ||
      steps.slice(assignmentIdx + 1).find(isCaptainApprovalStep);
    if (finalCaptain) {
      return {
        current: assignmentStep,
        next: finalCaptain,
        status: "captain_approval",
      };
    }
  }

  if (assignmentStep && isBusinessPermitFinalChairmanStep(assignmentStep)) {
    const releasing =
      steps.slice(assignmentIdx + 1).find(isReleasingTeamStep) ||
      stepAfter(assignmentIdx);
    if (releasing) {
      return {
        current: assignmentStep,
        next: releasing,
        status: isReleasingTeamStep(releasing)
          ? "ready"
          : normalizeCertificateStatus(releasing.status, {
              stepName: releasing.name,
              certificateType: "business_permit",
            }),
      };
    }
  }

  const next = stepAfter(currentIdx);
  if (!next) {
    return {
      current: currentStep,
      next: null,
      status: releaseIdx === currentIdx ? "ready" : status,
    };
  }

  if (
    isReleasingTeamStep(next) &&
    !(assignmentStep && isPhysicalInspectionCaptainStep(assignmentStep))
  ) {
    return {
      current: currentStep,
      next,
      status: "ready",
    };
  }

  return {
    current: currentStep,
    next,
    status: normalizeCertificateStatus(next.status, {
      stepName: next.name,
      certificateType: "business_permit",
    }),
  };
}

export function isCaptainApprovalStep(step) {
  if (!step) return false;
  if (workflowStatusesMatch(step.status, "captain_approval")) return true;
  if (isChairmanOfficialRole(step.officialRole)) return true;
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
  const physicalCaptain = captains.find(({ step }) =>
    isPhysicalInspectionCaptainStep(step),
  );
  const finalCaptain =
    captains.find(({ step }) => isBusinessPermitFinalChairmanStep(step)) ||
    captains[captains.length - 1];

  const certStatusKey = normalizeStepStatusKey(request.status);
  if (certStatusKey === "captain_approval") {
    const inspectionChairmanDone = physicalInspectionChairmanApproved(history);
    const inspectionDone = physicalInspectionTeamApproved(history);
    if (inspectionDone && !inspectionChairmanDone && physicalCaptain) {
      return physicalCaptain.step;
    }
    if (inspectionChairmanDone && finalCaptain) {
      return finalCaptain.step;
    }
  }

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
  if (fromStatus === "physical_inspection" && physicalCaptain) {
    return physicalCaptain.step;
  }
  if (fromStatus === "verifying" && finalCaptain) {
    return finalCaptain.step;
  }
  if (fromStatus === "physical_inspection" && beforePrep.length) {
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

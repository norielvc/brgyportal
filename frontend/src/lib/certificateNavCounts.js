/**
 * Lightweight certificate / pickup nav badge logic (no full request payloads).
 */

const COMPLETED_STATUSES = [
  "ready",
  "ready_for_pickup",
  "released",
  "cancelled",
  "rejected",
];

export function isCertReadyForPickup(cert, wfMap, activeUser) {
  if (!cert || !activeUser) return false;
  const isReady =
    ["ready", "ready_for_pickup"].includes(cert.status) ||
    (cert.status === "oic_review" && cert.certificate_type !== "business_permit");
  if (!isReady) return false;

  const role = String(activeUser.role || "").toLowerCase();
  if (["superadmin", "super_admin", "admin"].includes(role)) {
    return true;
  }
  const userId = String(activeUser._id || activeUser.id || "");
  if (!userId) return false;

  if (
    Array.isArray(cert.releasing_user_ids) &&
    cert.releasing_user_ids.length > 0
  ) {
    return cert.releasing_user_ids.some((id) => String(id) === userId);
  }

  const steps = wfMap?.[cert.certificate_type] || [];
  const relStep =
    steps.find((s) => String(s.name || "").toLowerCase().includes("releasing")) ||
    steps.find(
      (s) =>
        String(s.status || "").toLowerCase() === "oic_review" &&
        !String(s.name || "").toLowerCase().includes("preparation"),
    ) ||
    steps.find((s) =>
      ["ready", "ready_for_pickup", "released"].includes(
        String(s.status || "").toLowerCase(),
      ),
    );

  if (relStep && Array.isArray(relStep.assignedUsers)) {
    return relStep.assignedUsers.some((id) => String(id) === userId);
  }
  return false;
}

export function isRequestAssignedToUser(request, wfMap, activeUser) {
  if (!activeUser || !request) return false;
  if (COMPLETED_STATUSES.includes(request.status)) return false;
  if (request.status === "oic_review") {
    if (request.certificate_type !== "business_permit") return false;
    const stepName = String(
      request.workflow_assignment?.step_name || "",
    ).toLowerCase();
    if (stepName.includes("releasing")) return false;
  }

  const bypassRoles = ["superadmin", "super_admin", "admin"];
  if (bypassRoles.includes(String(activeUser.role || "").toLowerCase())) {
    return true;
  }

  const currentUserId = String(activeUser._id || activeUser.id || "");
  if (!currentUserId) return false;

  if (request.workflow_assignment) {
    const assignedId = String(
      request.workflow_assignment.assigned_user_id ||
        request.workflow_assignment.userId ||
        "",
    );
    if (assignedId === currentUserId) return true;
  }

  if (!wfMap) return false;
  const steps =
    wfMap[request.certificate_type] || Object.values(wfMap)[0] || [];
  if (!Array.isArray(steps) || !steps.length) return false;

  const s = String(request.status || "").toLowerCase();
  let currentStep = null;
  if (
    ["staff_review", "staff review", "pending", "returned", "submitted"].some(
      (st) => s.includes(st),
    )
  ) {
    currentStep = steps.find((st) => st.status === "staff_review");
  } else if (s.includes("physical_inspection")) {
    currentStep = steps.find(
      (st) => String(st.status || "").toLowerCase() === "physical_inspection",
    );
  } else if (s === "verifying" || s.includes("finance")) {
    currentStep = steps.find(
      (st) => String(st.status || "").toLowerCase() === "verifying",
    );
  } else if (s.includes("treasury")) {
    currentStep = steps.find(
      (st) => String(st.status || "").toLowerCase() === "treasury",
    );
  } else if (s.includes("captain") || s === "captain_approval") {
    currentStep = steps.find(
      (st) =>
        String(st.status || "").toLowerCase() === "captain_approval" ||
        String(st.name || "").toLowerCase().includes("captain") ||
        String(st.name || "").toLowerCase().includes("chairman"),
    );
  } else if (s.includes("secretary")) {
    currentStep = steps.find(
      (st) => String(st.status || "").toLowerCase() === "secretary_approval",
    );
  } else if (s.includes("oic_review")) {
    currentStep = steps.find(
      (st) =>
        String(st.status || "").toLowerCase() === "oic_review" &&
        !String(st.name || "").toLowerCase().includes("releasing"),
    );
  }

  if (!currentStep) return false;
  return (currentStep.assignedUsers || []).some(
    (id) => String(id) === currentUserId,
  );
}

export function isAssignmentStale(assignment, cert) {
  const stepName = (assignment.step_name || "").toLowerCase();
  const certStatus = cert.status || "";

  if (stepName.includes("review request") || stepName.includes("staff")) {
    return !["staff_review", "pending", "submitted", "returned"].includes(
      certStatus,
    );
  }
  if (stepName.includes("secretary")) {
    return !["processing", "secretary_approval"].includes(certStatus);
  }
  if (stepName.includes("inspection")) {
    return certStatus !== "physical_inspection";
  }
  if (stepName.includes("finance") || stepName.includes("verifying")) {
    return String(certStatus).toLowerCase() !== "verifying";
  }
  if (
    stepName.includes("captain") ||
    stepName.includes("chairman") ||
    stepName.includes("punong")
  ) {
    const statusKey = String(certStatus).toLowerCase();
    return !(
      statusKey === "captain_approval" ||
      statusKey.includes("captain") ||
      statusKey.includes("chairman") ||
      statusKey.includes("punong")
    );
  }
  if (stepName.includes("treasury") || stepName.includes("or prep")) {
    return certStatus !== "Treasury";
  }
  if (stepName.includes("releasing") || stepName.includes("oic")) {
    const isBpPrep =
      cert.certificate_type === "business_permit" &&
      !stepName.includes("releasing");
    if (isBpPrep) {
      return certStatus !== "oic_review";
    }
    return true;
  }
  return false;
}

export function pickPendingWorkflowAssignment(assignments) {
  const list = assignments || [];
  const pending = list
    .filter((a) => a.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  return pending[0] || null;
}

export function computeStaffNavCounts({
  activeUser,
  wfMap,
  myAssignmentRows,
  openCertificates,
  pickupCertificates,
  releasingStepByType,
  releasingAssignmentsByRequestId,
}) {
  const myAssigned = [];
  for (const row of myAssignmentRows || []) {
    const cert = row.certificate_requests;
    if (!cert) continue;
    if (isAssignmentStale(row, cert)) continue;
    myAssigned.push({
      id: cert.id,
      status: cert.status,
      certificate_type: cert.certificate_type,
      workflow_assignment: {
        step_name: row.step_name,
        assigned_user_id: row.assigned_user_id,
      },
    });
  }

  for (const cert of pickupCertificates || []) {
    const relStep = releasingStepByType?.[cert.certificate_type];
    const stepUsers = (relStep?.assignedUsers || []).map((u) => String(u));
    const reqAssigns = releasingAssignmentsByRequestId?.[cert.id] || [];
    const assignUsers = reqAssigns
      .map((a) => String(a.assigned_user_id || ""))
      .filter(Boolean);
    cert.releasing_user_ids = [...new Set([...assignUsers, ...stepUsers])];
  }

  const combined = [...myAssigned];
  let pickupCount = 0;

  for (const cert of openCertificates || []) {
    const pending = pickPendingWorkflowAssignment(cert.workflow_assignments);
    const shaped = {
      id: cert.id,
      status: cert.status,
      certificate_type: cert.certificate_type,
      workflow_assignment: pending
        ? {
            step_name: pending.step_name,
            assigned_user_id: pending.assigned_user_id,
          }
        : null,
    };

    if (
      !combined.some((c) => c.id === shaped.id) &&
      isRequestAssignedToUser(shaped, wfMap, activeUser)
    ) {
      combined.push(shaped);
    }
  }

  for (const cert of pickupCertificates || []) {
    if (isCertReadyForPickup(cert, wfMap, activeUser)) {
      pickupCount += 1;
    }
  }

  return {
    certificateRequests: combined.length,
    pickupManagement: pickupCount,
  };
}

export function buildReleasingStepByType(wfConfigs) {
  const releasingStepByType = {};
  for (const cfg of wfConfigs || []) {
    const steps = cfg.workflow_config?.steps || [];
    const relStep =
      steps.find((s) =>
        String(s.name || "").toLowerCase().includes("releasing"),
      ) ||
      steps.find(
        (s) =>
          String(s.status || "").toLowerCase() === "oic_review" &&
          !String(s.name || "").toLowerCase().includes("preparation"),
      ) ||
      steps.find((s) =>
        ["ready", "ready_for_pickup", "released"].includes(
          String(s.status || "").toLowerCase(),
        ),
      );
    if (relStep) {
      releasingStepByType[cfg.certificate_type] = relStep;
    }
  }
  return releasingStepByType;
}

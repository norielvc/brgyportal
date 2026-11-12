import {
  alignBusinessPermitCertificateStatus,
  isPhysicalInspectionTeamStep,
  normalizeWorkflowStepsForSave,
  resolveBusinessPermitCaptainStep,
  resolveWorkflowStepIndex,
} from "./workflowStatus";

/**
 * Fix business permits whose DB status/assignments lag behind workflow history
 * (e.g. inspection done but still submitted or on Verify step).
 */
export async function realignBusinessPermitRequest(supabase, tenantId, requestId) {
  const { data: request, error: reqErr } = await supabase
    .from("certificate_requests")
    .select("id, status, certificate_type")
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .single();

  if (reqErr || !request || request.certificate_type !== "business_permit") {
    return { changed: false, status: request?.status };
  }

  const { data: wfRow } = await supabase
    .from("workflow_configurations")
    .select("workflow_config")
    .eq("certificate_type", "business_permit")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const steps = normalizeWorkflowStepsForSave(
    wfRow?.workflow_config?.steps,
    "business_permit",
  );
  if (!steps?.length) return { changed: false, status: request.status };

  const { data: history } = await supabase
    .from("workflow_history")
    .select("action, step_name, previous_status, new_status, created_at")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(40);

  const requestForRouting = {
    ...request,
    workflow_history: history || [],
  };

  const alignedStatus = alignBusinessPermitCertificateStatus(
    steps,
    requestForRouting,
  );

  let statusChanged = false;
  let effectiveStatus = request.status;

  if (alignedStatus && alignedStatus !== request.status) {
    const { error: upErr } = await supabase
      .from("certificate_requests")
      .update({
        status: alignedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("tenant_id", tenantId);
    if (!upErr) {
      statusChanged = true;
      effectiveStatus = alignedStatus;
      requestForRouting.status = alignedStatus;
    }
  }

  const terminal = ["released", "rejected", "cancelled"];
  if (terminal.includes(String(effectiveStatus || "").toLowerCase())) {
    return { changed: statusChanged, status: effectiveStatus };
  }

  let currentStep = null;
  const stepIndex = resolveWorkflowStepIndex(steps, requestForRouting);
  if (stepIndex !== -1) currentStep = steps[stepIndex];

  if (!currentStep) {
    const s = effectiveStatus;
    if (s === "physical_inspection") {
      currentStep =
        steps.find(isPhysicalInspectionTeamStep) ||
        steps.find((st) => st.status === "physical_inspection");
    } else if (s === "captain_approval") {
      currentStep = resolveBusinessPermitCaptainStep(steps, requestForRouting);
    } else if (s === "verifying") {
      currentStep =
        steps.find((st) => String(st.status || "").toLowerCase() === "verifying") ||
        steps.find((st) => String(st.name || "").toLowerCase().includes("finance"));
    } else {
      currentStep = steps.find(
        (st) =>
          String(st.status || "").toLowerCase() ===
          String(s || "").toLowerCase(),
      );
    }
  }

  if (!currentStep?.assignedUsers?.length) {
    return { changed: statusChanged, status: effectiveStatus };
  }

  const { data: pendingRows } = await supabase
    .from("workflow_assignments")
    .select("id, step_id, step_name, assigned_user_id")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  const expectedStepId = String(currentStep.id);
  const correctPending = (pendingRows || []).filter(
    (row) => String(row.step_id) === expectedStepId,
  );
  const needsAssignmentFix =
    correctPending.length === 0 ||
    (pendingRows || []).some((row) => String(row.step_id) !== expectedStepId);

  if (!needsAssignmentFix) {
    return { changed: statusChanged, status: effectiveStatus };
  }

  await supabase
    .from("workflow_assignments")
    .delete()
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId);

  const userIds = new Set((users || []).map((u) => String(u.id)));
  let assignmentsCreated = 0;

  for (const userId of currentStep.assignedUsers) {
    if (!userIds.has(String(userId))) continue;
    const { error } = await supabase.from("workflow_assignments").insert([
      {
        request_id: requestId,
        tenant_id: tenantId,
        request_type: "business_permit",
        step_id: expectedStepId,
        step_name: currentStep.name,
        assigned_user_id: userId,
        status: "pending",
      },
    ]);
    if (!error) assignmentsCreated += 1;
  }

  return {
    changed: statusChanged || assignmentsCreated > 0,
    status: effectiveStatus,
    stepName: currentStep.name,
    assignmentsCreated,
  };
}

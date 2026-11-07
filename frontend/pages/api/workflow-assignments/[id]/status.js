import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import {
  clearCaptainSignatureDetails,
  mergeCaptainSignatureDetails,
} from "../../../../src/lib/captainSignatureDetails";
import {
  certificateStatusForStep,
  normalizeCertificateStatus,
  normalizeStepStatusKey,
  resolveBusinessPermitApproveTarget,
  resolveBusinessPermitCaptainStep,
  workflowStatusesMatch,
} from "../../../../src/lib/workflowStatus";

function mergeFinanceVerificationDetails(
  existingDetails,
  signatureData,
  certStatus,
  stepName,
  employeeCode,
) {
  const statusOk = String(certStatus || "").toLowerCase() === "verifying";
  const stepOk = String(stepName || "").toLowerCase().includes("finance");
  if (!statusOk && !stepOk) return null;
  let details = existingDetails;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }
  if (!details || typeof details !== "object") details = {};
  const patch = { ...details };
  if (signatureData) {
    patch.finance_signature = signatureData;
    patch.finance_signed_at = new Date().toISOString();
  }
  if (employeeCode) {
    patch.finance_employee_code = employeeCode;
  }
  if (!signatureData && !employeeCode) return null;
  return patch;
}

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res.status(403).json({ success: false, message: "Tenant context required" });

  const { id } = req.query;
  const { action, comments, comment, signatureData } = req.body;
  const note = comments || comment || "";

  console.log(`[WORKFLOW-ASSIGNMENT] Processing action: ${action} for assignment ID: ${id}`);

  // 1. Fetch the assignment being acted on
  const { data: assignment, error: fetchErr } = await supabase
    .from("workflow_assignments")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !assignment)
    return res.status(404).json({ success: false, message: "Assignment not found" });

  const requestId = assignment.request_id;
  const certType = assignment.request_type;

  // 2. Fetch the certificate to get current status
  const { data: cert } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .single();

  if (!cert)
    return res.status(404).json({ success: false, message: "Certificate not found" });

  console.log(`[WORKFLOW-ASSIGNMENT] Certificate found: ${cert.reference_number}, Current status: ${cert.status}, Type: ${certType}`);

  const { data: currentWfConfigEarly } = await supabase
    .from("workflow_configurations")
    .select("workflow_config")
    .eq("certificate_type", certType)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const currentStepsListEarly =
    currentWfConfigEarly?.workflow_config?.steps || [];
  const activeStepEarly = currentStepsListEarly.find(
    (s) => s.id.toString() === assignment.step_id.toString(),
  );

  const mutatingActions = [
    "approve",
    "reject",
    "return",
    "send_back_to_start",
    "physical_inspection",
  ];
  if (mutatingActions.includes(action) && assignment.status !== "pending") {
    return res.status(409).json({
      success: false,
      code: "ASSIGNMENT_ALREADY_PROCESSED",
      message: "This workflow task was already completed.",
    });
  }

  if (action === "approve" && activeStepEarly) {
    const expectedStatus = certificateStatusForStep(
      activeStepEarly,
      certType || cert.certificate_type,
    );
    const currentKey = normalizeStepStatusKey(cert.status);
    const expectedKey = normalizeStepStatusKey(expectedStatus);
    const statusAligned =
      workflowStatusesMatch(expectedStatus, cert.status) ||
      (expectedKey === "witness_verification" && currentKey === "processing");
    if (expectedStatus && cert.status && !statusAligned) {
      return res.status(409).json({
        success: false,
        code: "WORKFLOW_STEP_MISMATCH",
        message: `Request is at "${cert.status}" and cannot be approved for "${assignment.step_name}".`,
      });
    }
  }

  const closedAssignmentStatus =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : action === "physical_inspection"
          ? "completed"
          : action;

  // 3. Mark ALL pending assignments for this request as completed
  await supabase
    .from("workflow_assignments")
    .update({ status: closedAssignmentStatus, updated_at: new Date().toISOString(), ...(action === "physical_inspection" ? { completed_at: new Date().toISOString() } : {}) })
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  // 4. Determine next certificate status via workflow configuration
  const { data: currentWfConfig } = await supabase
    .from("workflow_configurations")
    .select("workflow_config")
    .eq("certificate_type", certType)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const currentStepsList = currentWfConfig?.workflow_config?.steps || [];
  const activeStep = currentStepsList.find(
    (s) => s.id.toString() === assignment.step_id.toString()
  );
  const currentStepIdx = currentStepsList.findIndex(
    (s) => s.id.toString() === assignment.step_id.toString()
  );

  const statusFlow = {
    staff_review: "secretary_approval",
    pending: "secretary_approval",
    submitted: "secretary_approval",
    returned: "secretary_approval",
    processing: "secretary_approval",
    secretary_approval: "captain_approval",
    physical_inspection: "verifying",
    verifying: "captain_approval",
    captain_approval: "ready",
    Treasury: "oic_review",
    oic_review: "ready",
    ready: "released",
    ready_for_pickup: "released",
  };

  let newCertStatus = cert.status;
  let inspectionNextStep = null;
  if (action === "approve") {
    const isBusinessPermit = (certType || cert.certificate_type) === "business_permit";
    if (isBusinessPermit) {
      const permitSteps = currentStepsList;
      const { data: priorHistory } = await supabase
        .from("workflow_history")
        .select("action, step_name, previous_status, new_status")
        .eq("request_id", requestId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(30);
      const target = resolveBusinessPermitApproveTarget(permitSteps, {
        status: cert.status,
        assignmentStepId: assignment.step_id,
        history: priorHistory || [],
      });
      if (target?.status) {
        newCertStatus = target.status;
        inspectionNextStep = target.next || null;
      }
    } else if (currentStepIdx !== -1 && currentStepsList[currentStepIdx + 1]) {
      const nextStepCandidate = currentStepsList[currentStepIdx + 1];
      inspectionNextStep = nextStepCandidate;
      const nextStepStatus = String(nextStepCandidate.status || "").toLowerCase();
      const nextStepName = String(nextStepCandidate.name || "").toLowerCase();

      if (nextStepStatus.includes("witness") || nextStepName.includes("witness")) {
        newCertStatus = "witness_verification";
      } else if (nextStepCandidate.status) {
        newCertStatus = normalizeCertificateStatus(nextStepCandidate.status, {
          stepName: nextStepCandidate.name,
          certificateType: certType || cert.certificate_type,
        });
      } else {
        newCertStatus = statusFlow[cert.status] || cert.status;
      }
    } else {
      newCertStatus = statusFlow[cert.status] || statusFlow[String(cert.status || "").toLowerCase()] || cert.status;
    }
    console.log(`[WORKFLOW-ASSIGNMENT] Status flow: ${cert.status} -> ${newCertStatus}, nextStep: ${inspectionNextStep?.name}`);
  } else if (action === "reject") {
    newCertStatus = "rejected";
  } else if (action === "return") {
    newCertStatus = "returned";
  } else if (action === "send_back_to_start") {
    newCertStatus = "staff_review";
  } else if (action === "physical_inspection") {
    newCertStatus = "physical_inspection";
    if ((certType || cert.certificate_type) === "business_permit") {
      const inspectionSteps = currentStepsList;
      const currentIndex = currentStepIdx;
      if (currentIndex !== -1 && currentIndex < inspectionSteps.length - 1) {
        inspectionNextStep = inspectionSteps[currentIndex + 1];
        newCertStatus =
          normalizeCertificateStatus(inspectionNextStep.status, {
            stepName: inspectionNextStep.name,
            certificateType: certType || cert.certificate_type,
          }) || "physical_inspection";
      }
    }
  }

  // 5. Update certificate status
  const dbStatusForCert = (newCertStatus === "witness_verification" || newCertStatus === "Witness Verification")
    ? "processing"
    : newCertStatus;

  await supabase
    .from("certificate_requests")
    .update({ status: dbStatusForCert, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("tenant_id", tenantId);

  // 6. Log to workflow history
  await supabase.from("workflow_history").insert([{
    tenant_id: tenantId,
    request_id: requestId,
    request_type: certType,
    step_id: assignment.step_id,
    step_name: assignment.step_name,
    action,
    performed_by: user._id,
    comments: note,
    signature_data: signatureData || null,
    official_role: activeStep?.officialRole || null,
    previous_status: cert.status,
    new_status: newCertStatus,
  }]);

  let detailsPatch = null;
  if (action === "return" || action === "send_back_to_start") {
    detailsPatch = clearCaptainSignatureDetails(cert.details);
  } else {
    const mergedCaptainDetails = mergeCaptainSignatureDetails(
      cert.details,
      signatureData,
      cert.status,
      assignment.step_name,
      activeStep?.officialRole,
    );
    const { data: performerRow } = await supabase
      .from("users")
      .select("employee_code")
      .eq("id", user._id)
      .maybeSingle();
    const mergedFinanceDetails = mergeFinanceVerificationDetails(
      mergedCaptainDetails || cert.details,
      signatureData,
      cert.status,
      assignment.step_name,
      performerRow?.employee_code || null,
    );
    detailsPatch = mergedFinanceDetails || mergedCaptainDetails;
  }
  if (detailsPatch) {
    await supabase
      .from("certificate_requests")
      .update({ details: detailsPatch, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("tenant_id", tenantId);
  }

  // 7. If approved, create next-step assignments from workflow config (including Releasing Team assignments for ready/ready_for_pickup)
  if (action === "approve" && !["released", "rejected", "cancelled"].includes(newCertStatus)) {
    const { data: wfConfig } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("certificate_type", certType)
      .eq("tenant_id", tenantId)
      .single();

    const steps = wfConfig?.workflow_config?.steps || [];

    console.log(`[WORKFLOW-ASSIGNMENT] Looking for next step with status: ${newCertStatus}`);
    console.log(`[WORKFLOW-ASSIGNMENT] Available steps:`, steps.map(s => ({ name: s.name, status: s.status, users: s.assignedUsers?.length || 0 })));

    const isBusinessPermit = (certType || cert.certificate_type) === "business_permit";
    let nextStep = inspectionNextStep;
    if (!nextStep && ["ready", "ready_for_pickup"].includes(newCertStatus)) {
      nextStep =
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
        ) ||
        null;
    }
    if (!nextStep) {
      const currentIdx = steps.findIndex(
        (s) => String(s.id) === String(assignment.step_id),
      );
      if (currentIdx !== -1 && steps[currentIdx + 1]) {
        nextStep = steps[currentIdx + 1];
      }
    }
    if (!nextStep && isBusinessPermit) {
      const afterIdx = steps.findIndex(
        (s) => String(s.id) === String(assignment.step_id),
      );
      if (
        afterIdx !== -1 &&
        workflowStatusesMatch(newCertStatus, "captain_approval")
      ) {
        nextStep =
          steps
            .slice(afterIdx + 1)
            .find(
              (s) =>
                workflowStatusesMatch(s.status, "captain_approval") ||
                String(s.name || "")
                  .toLowerCase()
                  .includes("captain"),
            ) || null;
      }
      if (!nextStep && workflowStatusesMatch(newCertStatus, "captain_approval")) {
        nextStep = resolveBusinessPermitCaptainStep(steps, {
          workflow_assignment: { previous_status: cert.status },
          workflow_history: [
            { action: "approve", previous_status: cert.status },
          ],
        });
      }
    }
    if (!nextStep) {
      const statusMatches = steps.filter((s) =>
        workflowStatusesMatch(s.status, newCertStatus),
      );
      if (
        isBusinessPermit &&
        statusMatches.length > 1 &&
        workflowStatusesMatch(newCertStatus, "captain_approval")
      ) {
        nextStep = resolveBusinessPermitCaptainStep(steps, {
          workflow_assignment: assignment,
        });
      } else if (statusMatches.length === 1) {
        nextStep = statusMatches[0];
      } else if (statusMatches.length > 1) {
        const afterIdx = steps.findIndex(
          (s) => String(s.id) === String(assignment.step_id),
        );
        nextStep =
          afterIdx !== -1
            ? statusMatches.find(
                (s) =>
                  steps.findIndex((st) => st.id === s.id) > afterIdx,
              ) || statusMatches[0]
            : statusMatches[0];
      }
    }
    if (!nextStep && !isBusinessPermit) {
      nextStep = steps.find(
        (s) => s.requiresApproval && s.status !== cert.status,
      );
    }

    console.log(`[WORKFLOW-ASSIGNMENT] Next step found:`, nextStep ? { name: nextStep.name, status: nextStep.status, users: nextStep.assignedUsers?.length || 0 } : 'NONE');

    let assignedNextUsers = nextStep?.assignedUsers || [];
    if (!assignedNextUsers.length && workflowStatusesMatch(newCertStatus, "captain_approval")) {
      try {
        const { fetchBarangayCaptainUsers } = await import("@/lib/requestNotificationHelper");
        const captainUsers = await fetchBarangayCaptainUsers(supabase, tenantId, certType);
        assignedNextUsers = captainUsers.map((u) => u.id);
      } catch (capErr) {
        console.warn("[WORKFLOW-ASSIGNMENT] Fallback captain lookup failed:", capErr.message);
      }
    }

    if (nextStep && assignedNextUsers.length) {
      console.log(`[WORKFLOW-ASSIGNMENT] Creating ${assignedNextUsers.length} assignments for step: ${nextStep.name}`);
      for (const userId of assignedNextUsers) {
        await supabase.from("workflow_assignments").insert([{
          request_id: requestId,
          tenant_id: tenantId,
          request_type: certType,
          step_id: nextStep.id.toString(),
          step_name: nextStep.name,
          assigned_user_id: userId,
          status: "pending",
        }]);
      }
    } else {
      console.warn(`[WORKFLOW-ASSIGNMENT] No next step found or no users assigned for status: ${newCertStatus}`);
    }
  }

  if (action === "physical_inspection" && inspectionNextStep?.assignedUsers?.length) {
    for (const userId of inspectionNextStep.assignedUsers) {
      await supabase.from("workflow_assignments").insert([{
        request_id: requestId,
        tenant_id: tenantId,
        request_type: certType,
        step_id: inspectionNextStep.id.toString(),
        step_name: inspectionNextStep.name,
        assigned_user_id: userId,
        status: "pending",
      }]);
    }
  }

  // 8. If returned/send_back_to_start, reassign to Step 1
  if (action === "return" || action === "send_back_to_start") {
    const { data: wfConfig } = await supabase
      .from("workflow_configurations")
      .select("workflow_config")
      .eq("certificate_type", certType)
      .eq("tenant_id", tenantId)
      .single();

    const steps = wfConfig?.workflow_config?.steps || [];
    const firstStep = steps.find(s => s.requiresApproval);
    if (firstStep?.assignedUsers?.length) {
      for (const userId of firstStep.assignedUsers) {
        await supabase.from("workflow_assignments").insert([{
          request_id: requestId,
          tenant_id: tenantId,
          request_type: certType,
          step_id: firstStep.id.toString(),
          step_name: firstStep.name,
          assigned_user_id: userId,
          status: "pending",
        }]);
      }
    }
  }

  // 9. Send Email Notifications & In-App Notifications
  try {
    // Get resident/applicant info
    const { data: resident } = await supabase
      .from('residents')
      .select('email, first_name, last_name')
      .eq('id', cert.resident_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const applicantEmail = resident?.email || cert.email;
    const applicantName = resident 
      ? `${resident.first_name} ${resident.last_name}`.trim()
      : cert.full_name;

    // Helper function to send email
    const sendEmail = async (emailData) => {
      try {
        const { sendProcessNotification } = await import("@/lib/mailer");
        const result = await sendProcessNotification(emailData);
        if (result.success) {
          console.log(`📧 Email sent to ${emailData.recipientEmail}: ${emailData.eventType}`);
        } else {
          console.warn(`⚠️ Email failed to ${emailData.recipientEmail}:`, result.error);
        }
        return result;
      } catch (error) {
        console.error(`❌ Email error for ${emailData.recipientEmail}:`, error.message);
        return { success: false, error: error.message };
      }
    };

    // Helper function to create in-app notification
    const createNotification = async (notifData) => {
      try {
        const { data: notif, error } = await supabase
          .from('notifications')
          .insert([{
            tenant_id: tenantId,
            user_id: notifData.userId,
            title: notifData.title,
            message: notifData.message,
            type: notifData.type,
            category: notifData.category,
            reference_number: cert.reference_number,
            request_id: requestId,
            link: notifData.link || `/requests?id=${requestId}`,
            read: false,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (!error) {
          console.log(`🔔 Notification created for user ${notifData.userId}`);
        }
        return { success: !error, data: notif };
      } catch (error) {
        console.error(`❌ Notification error:`, error.message);
        return { success: false, error: error.message };
      }
    };

    // Determine email notifications based on action
    if (action === 'approve') {
      if (['ready', 'ready_for_pickup', 'released'].includes(newCertStatus)) {
        // Ready-for-pickup email is manual only (Pickup Management / send-email API).
        // In-app notification for applicant (if they have a user account)
        if (cert.resident_id) {
          const { data: residentUser } = await supabase
            .from('users')
            .select('id')
            .eq('resident_id', cert.resident_id)
            .eq('tenant_id', tenantId)
            .maybeSingle();
          
          if (residentUser) {
            await createNotification({
              userId: residentUser.id,
              title: 'Certificate Ready!',
              message: `Your certificate ${cert.reference_number} is ready for pickup at the Barangay Hall.`,
              type: 'success',
              category: 'request_ready',
              link: `/track/${cert.reference_number}`
            });
          }
        }
      } else {
        // Approved to next step - notify next approvers
        const { data: nextAssignments } = await supabase
          .from('workflow_assignments')
          .select('assigned_user_id')
          .eq('request_id', requestId)
          .eq('tenant_id', tenantId)
          .eq('status', 'pending');

        const userIds = nextAssignments?.length > 0
          ? [...new Set(nextAssignments.map(a => a.assigned_user_id))]
          : [];

        if (userIds.length > 0) {
          const { data: nextUsers } = await supabase
            .from('users')
            .select('id, email, first_name, last_name')
            .in('id', userIds)
            .eq('tenant_id', tenantId);

          for (const nextUser of nextUsers || []) {
            await createNotification({
              userId: nextUser.id,
              title: 'Request Waiting for You',
              message: `Request ${cert.reference_number} from ${applicantName} requires your approval.`,
              type: 'info',
              category: 'assignment',
              link: `/requests?id=${requestId}`,
            });
          }
        }

        // Send email notification ONLY when the request reaches the Barangay Captain step
        if (
          workflowStatusesMatch(newCertStatus, 'captain_approval') ||
          String(newCertStatus || '').toLowerCase().includes('captain')
        ) {
          try {
            const { notifyBarangayCaptainStep } = await import('@/lib/requestNotificationHelper');
            await notifyBarangayCaptainStep({
              supabase,
              tenantId,
              requestId,
              referenceNumber: cert.reference_number,
              certificateType: certType,
              applicantName,
              comments: note,
              captainUserIds: userIds,
            });
          } catch (capEmailErr) {
            console.error('❌ Captain step email notification error:', capEmailErr.message);
          }
        }
      }
    } else if (action === 'reject') {
      // Send rejection notification email to resident applicant if an email exists
      if (applicantEmail) {
        try {
          const { isEmailNotificationsEnabled } = await import(
            "@/lib/requestNotificationHelper"
          );
          const emailEnabled = await isEmailNotificationsEnabled(supabase);
          if (emailEnabled) {
            await sendEmail({
              recipientEmail: applicantEmail,
              recipientName: applicantName || "Valued Resident",
              eventType: "REJECTED",
              certificateType: cert.certificate_type,
              referenceNumber: cert.reference_number,
              applicantName: applicantName || "Valued Resident",
              comments:
                note ||
                "Your application was reviewed by the barangay and could not be approved at this time.",
              requestId,
              tenantId,
            });
            console.log(
              `📧 Rejection email sent to resident: ${applicantEmail} for ${cert.reference_number}`,
            );
          }
        } catch (rejectMailErr) {
          console.error("❌ Rejection email error:", rejectMailErr.message);
        }
      }

      // In-app notification for applicant
      if (cert.resident_id) {
        const { data: residentUser } = await supabase
          .from('users')
          .select('id')
          .eq('resident_id', cert.resident_id)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (residentUser) {
          await createNotification({
            userId: residentUser.id,
            title: 'Request Rejected',
            message: `Your request ${cert.reference_number} has been rejected. ${note ? `Reason: ${note}` : ''}`,
            type: 'error',
            category: 'request_rejected',
            link: `/track/${cert.reference_number}`
          });
        }
      }
      
      // Also notify the staff who rejected (confirmation)
      const { data: rejector } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', user._id)
        .eq('tenant_id', tenantId)
        .single();
      
      if (rejector?.email && rejector.email !== applicantEmail) {
        console.log(`📧 Sending rejection confirmation to ${rejector.email}`);
      }
      
    } else if (action === 'return' || action === 'send_back_to_start') {
      // In-app notification for applicant. Return email is disabled.
      if (cert.resident_id) {
        const { data: residentUser } = await supabase
          .from('users')
          .select('id')
          .eq('resident_id', cert.resident_id)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (residentUser) {
          await createNotification({
            userId: residentUser.id,
            title: 'Corrections Needed',
            message: `Your request ${cert.reference_number} needs corrections. ${note ? `Comments: ${note}` : ''}`,
            type: 'warning',
            category: 'request_returned',
            link: `/track/${cert.reference_number}`
          });
        }
      }
      
      // Notify staff who will handle the resubmission
      if (action === 'return' || action === 'send_back_to_start') {
        const { data: reassignedStaff } = await supabase
          .from('workflow_assignments')
          .select('assigned_user_id')
          .eq('request_id', requestId)
          .eq('tenant_id', tenantId)
          .eq('status', 'pending');

        if (reassignedStaff?.length > 0) {
          const userIds = [...new Set(reassignedStaff.map(a => a.assigned_user_id))];
          const { data: staffUsers } = await supabase
            .from('users')
            .select('id, email, first_name, last_name')
            .in('id', userIds)
            .eq('tenant_id', tenantId);

          for (const staff of staffUsers || []) {
            // In-app only. Resubmit email is disabled.
            await createNotification({
              userId: staff.id,
              title: 'Request Resubmitted',
              message: `Request ${cert.reference_number} from ${applicantName} has been sent back for review.`,
              type: 'info',
              category: 'assignment',
              link: `/requests?id=${requestId}`,
            });
          }
        }
      }
    }

    console.log(`✅ Email notifications processed for ${cert.reference_number}`);
  } catch (emailError) {
    console.error('❌ Email notification error:', emailError);
    // Don't fail the workflow if email fails
  }

  return res.json({ success: true, data: { ...assignment, status: action }, newStatus: newCertStatus });
}

import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

function shouldPersistCaptainSignature({
  certStatus,
  stepName,
  officialRole,
  signatureData,
}) {
  if (!signatureData) return false;
  if (certStatus === "captain_approval") return true;
  const step = (stepName || "").toLowerCase();
  const role = (officialRole || "").toLowerCase();
  return (
    step.includes("captain") ||
    step.includes("chairman") ||
    step.includes("punong") ||
    role.includes("captain") ||
    role.includes("chairman") ||
    role.includes("punong")
  );
}

function mergeCaptainSignatureDetails(
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

function clearCaptainSignatureDetails(existingDetails) {
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

  // 4. Determine next certificate status
  const statusFlow = {
    staff_review: "secretary_approval",  // After staff review, goes to secretary
    pending: "secretary_approval",
    submitted: "secretary_approval",
    returned: "secretary_approval",
    processing: "secretary_approval",  // Legacy: processing = waiting for secretary
    secretary_approval: "captain_approval",
    captain_approval: "oic_review",
    Treasury: "oic_review",
    oic_review: "ready",
    ready: "released",
    ready_for_pickup: "released",
  };

  let newCertStatus = cert.status;
  let inspectionNextStep = null;
  if (action === "approve") {
    newCertStatus = statusFlow[cert.status] || cert.status;
    console.log(`[WORKFLOW-ASSIGNMENT] Status flow: ${cert.status} -> ${newCertStatus}`);
  } else if (action === "reject") {
    newCertStatus = "rejected";
  } else if (action === "return") {
    newCertStatus = "returned"; // stays in returned, but Step 1 gets reassigned
  } else if (action === "send_back_to_start") {
    newCertStatus = "staff_review";
  } else if (action === "physical_inspection") {
    newCertStatus = "physical_inspection";
    if ((certType || cert.certificate_type) === "business_permit") {
      const { data: inspectionWf } = await supabase
        .from("workflow_configurations")
        .select("workflow_config")
        .eq("certificate_type", certType)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      const inspectionSteps = inspectionWf?.workflow_config?.steps || [];
      const currentIndex = inspectionSteps.findIndex(
        (step) => String(step.id) === String(assignment.step_id),
      );
      if (currentIndex !== -1 && currentIndex < inspectionSteps.length - 1) {
        inspectionNextStep = inspectionSteps[currentIndex + 1];
        newCertStatus = inspectionNextStep.status || "physical_inspection";
      }
    }
  }

  // 5. Update certificate status
  await supabase
    .from("certificate_requests")
    .update({ status: newCertStatus, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("tenant_id", tenantId);

  // 5.5 Fetch config to get current step role
  const { data: currentWfConfig } = await supabase
    .from("workflow_configurations")
    .select("workflow_config")
    .eq("certificate_type", certType)
    .eq("tenant_id", tenantId)
    .single();

  const currentStepsList = currentWfConfig?.workflow_config?.steps || [];
  const activeStep = currentStepsList.find(s => s.id.toString() === assignment.step_id.toString());

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
    if (mergedCaptainDetails) detailsPatch = mergedCaptainDetails;
  }
  if (detailsPatch) {
    await supabase
      .from("certificate_requests")
      .update({ details: detailsPatch, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("tenant_id", tenantId);
  }

  // 7. If approved, create next-step assignments from workflow config
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

    // Find the step matching the new certificate status
    const nextStep = steps.find(s => s.status === newCertStatus)
      || steps.find(s => s.requiresApproval && s.status !== cert.status);

    console.log(`[WORKFLOW-ASSIGNMENT] Next step found:`, nextStep ? { name: nextStep.name, status: nextStep.status, users: nextStep.assignedUsers?.length || 0 } : 'NONE');

    if (nextStep?.assignedUsers?.length) {
      console.log(`[WORKFLOW-ASSIGNMENT] Creating ${nextStep.assignedUsers.length} assignments for step: ${nextStep.name}`);
      for (const userId of nextStep.assignedUsers) {
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
            link: notifData.link || `/requests/${requestId}`,
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
      if (newCertStatus === 'released') {
        // Final approval - notify applicant that certificate is ready
        if (applicantEmail) {
          await sendEmail({
            recipientEmail: applicantEmail,
            recipientName: applicantName,
            eventType: 'READY_FOR_PICKUP',
            certificateType: certType,
            referenceNumber: cert.reference_number,
            applicantName: applicantName,
            comments: note,
            requestId: requestId
          });
        }
        
        // In-app notification for applicant (if they have a user account)
        if (cert.resident_id) {
          const { data: residentUser } = await supabase
            .from('users')
            .select('_id')
            .eq('resident_id', cert.resident_id)
            .eq('tenant_id', tenantId)
            .maybeSingle();
          
          if (residentUser) {
            await createNotification({
              userId: residentUser._id,
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

        if (nextAssignments?.length > 0) {
          const userIds = [...new Set(nextAssignments.map(a => a.assigned_user_id))];
          const { data: nextUsers } = await supabase
            .from('users')
            .select('_id, email, first_name, last_name')
            .in('_id', userIds)
            .eq('tenant_id', tenantId);

          for (const nextUser of nextUsers || []) {
            // Send email
            if (nextUser.email) {
              await sendEmail({
                recipientEmail: nextUser.email,
                recipientName: `${nextUser.first_name} ${nextUser.last_name}`,
                eventType: 'APPROVED_STEP',
                certificateType: certType,
                referenceNumber: cert.reference_number,
                applicantName: applicantName,
                comments: note,
                requestId: requestId
              });
            }
            
            // Create in-app notification
            await createNotification({
              userId: nextUser._id,
              title: 'Request Waiting for You',
              message: `Request ${cert.reference_number} from ${applicantName} requires your approval.`,
              type: 'info',
              category: 'assignment',
              link: `/requests/${requestId}`
            });
          }
        }
      }
    } else if (action === 'reject') {
      // Rejected - notify applicant
      if (applicantEmail) {
        await sendEmail({
          recipientEmail: applicantEmail,
          recipientName: applicantName,
          eventType: 'REJECTED',
          certificateType: certType,
          referenceNumber: cert.reference_number,
          applicantName: applicantName,
          comments: note,
          requestId: requestId
        });
      }
      
      // In-app notification for applicant
      if (cert.resident_id) {
        const { data: residentUser } = await supabase
          .from('users')
          .select('_id')
          .eq('resident_id', cert.resident_id)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (residentUser) {
          await createNotification({
            userId: residentUser._id,
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
        .eq('_id', user._id)
        .eq('tenant_id', tenantId)
        .single();
      
      if (rejector?.email && rejector.email !== applicantEmail) {
        console.log(`📧 Sending rejection confirmation to ${rejector.email}`);
      }
      
    } else if (action === 'return' || action === 'send_back_to_start') {
      // Returned for corrections - notify applicant
      if (applicantEmail) {
        await sendEmail({
          recipientEmail: applicantEmail,
          recipientName: applicantName,
          eventType: 'RETURNED',
          certificateType: certType,
          referenceNumber: cert.reference_number,
          applicantName: applicantName,
          comments: note,
          requestId: requestId
        });
      }
      
      // In-app notification for applicant
      if (cert.resident_id) {
        const { data: residentUser } = await supabase
          .from('users')
          .select('_id')
          .eq('resident_id', cert.resident_id)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (residentUser) {
          await createNotification({
            userId: residentUser._id,
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
            .select('_id, email, first_name, last_name')
            .in('_id', userIds)
            .eq('tenant_id', tenantId);

          for (const staff of staffUsers || []) {
            // Send email
            if (staff.email) {
              await sendEmail({
                recipientEmail: staff.email,
                recipientName: `${staff.first_name} ${staff.last_name}`,
                eventType: 'RESUBMITTED',
                certificateType: certType,
                referenceNumber: cert.reference_number,
                applicantName: applicantName,
                comments: `Request was sent back with comments: ${note}`,
                requestId: requestId
              });
            }
            
            // Create in-app notification
            await createNotification({
              userId: staff._id,
              title: 'Request Resubmitted',
              message: `Request ${cert.reference_number} from ${applicantName} has been sent back for review.`,
              type: 'info',
              category: 'assignment',
              link: `/requests/${requestId}`
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

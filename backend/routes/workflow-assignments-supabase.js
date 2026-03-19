const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');
const certificateGenerationService = require('../services/certificateGenerationService');
const qrCodeService = require('../services/qrCodeService');
const workflowService = require('../services/workflowService');
const { sendWorkflowNotifications, sendProcessNotification } = require('../services/emailService');

// Get active assignment for a request (helps if not attached to request object)
router.get('/active-assignment/:requestId', authenticateToken, async (req, res) => {
  console.log(`[BACKEND] Active assignment lookup for Request: ${req.params.requestId}`);
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    if (!requestId || requestId === '.') {
      return res.status(400).json({ success: false, message: 'Invalid Request ID' });
    }

    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    // 1. First, check for existing pending assignments
    let { data: assignments, error } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // 2. If NO pending assignment found, check for recently completed assignments (for physical_inspection action)
    if ((!assignments || assignments.length === 0)) {
      console.log(`[FALLBACK] No pending assignments found. Checking for recently completed assignments...`);

      const { data: completedAssignments, error: completedError } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', requestId)
        .eq('status', 'completed')
        .eq('tenant_id', tenantId)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (!completedError && completedAssignments && completedAssignments.length > 0) {
        const recentCompleted = completedAssignments[0];
        console.log(`[FALLBACK] Found recently completed assignment: ${recentCompleted.id}`);
        // Use the recently completed assignment for physical_inspection action
        assignments = [recentCompleted];
      }
    }

    // 3. If still NO assignment found, and user is an Admin, try to "Self-Heal" (Create one)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'Admin' || req.user.role === 'ADMIN';
    if ((!assignments || assignments.length === 0) && isAdmin) {
      console.log(`[SELF-HEAL] No assignment found for request ${requestId}. Admin ${userId} auto-provisioning...`);

      // Fetch request details to know the type
      const { data: request } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .eq('tenant_id', tenantId)
        .single();

      if (request) {
        // Create a default assignment for the admin so they can proceed
        const { data: newAssignment, error: insertError } = await supabase
          .from('workflow_assignments')
          .insert([{
            tenant_id: tenantId,
            request_id: requestId,
            request_type: request.certificate_type || 'business_permit',
            step_id: '111', // Default Review Request step ID
            step_name: 'Review Request Team',
            assigned_user_id: userId,
            status: 'pending'
          }])
          .select()
          .single();

        if (!insertError && newAssignment) {
          return res.json({ success: true, assignment: newAssignment, selfHealed: true });
        }
      }
    }

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ success: false, message: 'No active assignment found' });
    }

    // Try to find one for current user
    let best = assignments.find(a => String(a.assigned_user_id) === String(userId));

    // Fallback to any if admin (admins can act on any assignment)
    console.log(`[DEBUG] User role: ${req.user.role}, isAdmin: ${isAdmin}`);

    if (!best && isAdmin) {
      best = assignments[0];
      console.log(`[ADMIN-OVERRIDE] Admin ${userId} using assignment from user ${best.assigned_user_id}`);
    }

    if (!best) {
      // If still no assignment and user is admin, create one as last resort
      if (isAdmin) {
        console.log(`[ADMIN-CREATE] Creating assignment for admin ${userId} on request ${requestId}`);
        const { data: request } = await supabase
          .from('certificate_requests')
          .select('*')
          .eq('id', requestId)
          .eq('tenant_id', tenantId)
          .single();

        if (request) {
          const { data: newAssignment, error: insertError } = await supabase
            .from('workflow_assignments')
            .insert([{
              tenant_id: tenantId,
              request_id: requestId,
              request_type: request.certificate_type || 'business_permit',
              step_id: '111',
              step_name: 'Review Request Team',
              assigned_user_id: userId,
              status: 'pending'
            }])
            .select()
            .single();

          if (!insertError && newAssignment) {
            return res.json({ success: true, assignment: newAssignment, created: true });
          }
        }
      }
      return res.status(403).json({ success: false, message: 'Not assigned to this request' });
    }

    res.json({ success: true, assignment: best });
  } catch (error) {
    console.error('Error in active-assignment route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper to handle Supabase errors gracefully
const handleSupabaseError = (res, error, context) => {
  console.error(`❌ DB Error [${context}]:`, error);
  return res.status(500).json({
    success: false,
    message: error.message || 'Database error occurred',
    details: error.details,
    hint: error.hint
  });
};

// Get workflow assignments for a specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { userId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          id,
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at,
          contact_number,
          purpose,
          date_of_death,
          cause_of_death,
          covid_related,
          requestor_name,
          guardian_name,
          guardian_relationship,
          guardian_id,
          partner_full_name,
          partner_age,
          partner_sex,
          partner_date_of_birth,
          partner_address,
          partner_civil_status,
          no_of_children,
          living_together_years,
          living_together_months,
          date_of_examination,
          usaping_barangay,
          date_of_hearing,
          details
        )
      `)
      .eq('assigned_user_id', userId)
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return handleSupabaseError(res, error, 'fetch-user-assignments');

    res.json({
      success: true,
      assignments: data || []
    });
  } catch (error) {
    console.error('Error fetching workflow assignments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all requests assigned to a user (for "My Assignments" view)
router.get('/my-assignments', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const userId = req.user._id;
    const { status = 'pending' } = req.query;

    const { data: rawAssignments, error } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests (*)
      `)
      .eq('assigned_user_id', userId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    console.log(`[MY-ASSIGNMENTS] Querying for UserID: ${userId}. Found ${rawAssignments?.length || 0} total assignments in DB.`);

    if (error) return handleSupabaseError(res, error, 'fetch-my-assignments');

    // Transform and map to the frontend format
    const requestsList = (rawAssignments || []).reduce((acc, assignment) => {
      const request = assignment.certificate_requests;

      // Safety: skip if join failed to return the request object
      if (!request) {
        console.log(`[MY-ASSIGNMENTS] Skipping assignment ${assignment.id}: Join failed but assignment exists. ID: ${assignment.request_id}`);
        return acc;
      }

      // We perform filtering in JS to be more case-insensitive and flexible.
      const assignmentStatus = (assignment.status || '').toLowerCase();
      const searchStatus = (status || 'pending').toLowerCase();

      if (assignmentStatus !== searchStatus) {
        return acc;
      }

      // We trust the assignment table - if you're assigned and it's active, we show it.
      // We only filter out entries if the certificate itself is already finalized/closed
      const finalStatuses = ['released', 'cancelled', 'rejected'];
      const reqStatus = (request.status || '').toLowerCase();

      if (finalStatuses.includes(reqStatus)) {
        return acc;
      }

      // Match the frontend's expected certificate object structure
      acc.push({
        ...request,
        workflow_assignment: {
          id: assignment.id,
          step_id: assignment.step_id,
          step_name: assignment.step_name,
          assigned_user_id: assignment.assigned_user_id,
          assigned_at: assignment.assigned_at,
          status: assignment.status
        }
      });
      return acc;
    }, []);

    // Sort by latest activity
    requestsList.sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeB - timeA;
    });

    res.json({
      success: true,
      certificates: requestsList,
      count: requestsList.length
    });
  } catch (error) {
    console.error('Error in my-assignments route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update workflow assignment status (approve, reject, etc.)
router.put('/:assignmentId/status', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { assignmentId } = req.params;
    const { action, comment, signatureData } = req.body;
    const userId = req.user._id;

    const { data: assignment, error: fetchError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (*)
      `)
      .eq('id', assignmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) throw fetchError;
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (assignment.assigned_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let newStatus = 'completed';
    let newRequestStatus = assignment.certificate_requests.status;

    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', assignment.request_type)
      .eq('tenant_id', tenantId)
      .single();

    let steps = workflowService.getWorkflowSteps(assignment.request_type, workflowConfig?.workflow_config?.steps);
    const currentStepIndex = steps.findIndex(s => s.id.toString() === assignment.step_id.toString());
    const currentStep = steps[currentStepIndex];
    let nextStep = null;

    console.log(`[STATUS-UPDATE] requestId: ${assignment.request_id}, action: ${action}, currentStatus: ${assignment.certificate_requests.status}`);
    console.log(`[STATUS-UPDATE] stepId: ${assignment.step_id}, currentStepIndex: ${currentStepIndex}, totalSteps: ${steps.length}`);
    if (currentStep) console.log(`[STATUS-UPDATE] currentStepName: ${currentStep.name}, currentStepStatus: ${currentStep.status}`);

    if (action === 'approve') {
      if (currentStep && currentStep.status === 'oic_review') {
        if (assignment.certificate_requests.status !== 'ready') {
          newStatus = 'pending';
          newRequestStatus = 'ready';
          setImmediate(async () => {
            try { await processPostApprovalWorkflow(assignment.request_id, assignment.certificate_requests); }
            catch (e) { console.error('Post-approval error:', e); }
          });
        } else {
          newStatus = 'completed';
          newRequestStatus = 'released';
        }
      } else if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
        newStatus = 'completed';
        nextStep = steps[currentStepIndex + 1];
        newRequestStatus = nextStep.status;
      } else {
        // Fallback for final steps or undefined steps
        newStatus = 'completed';
        // If it's already oic_review or the last step, it goes to ready
        if (currentStep?.status === 'oic_review' || (currentStepIndex !== -1 && currentStepIndex === steps.length - 1)) {
          newRequestStatus = 'ready';
        } else {
          // Otherwise, stay at current request status to avoid jumping steps
          newRequestStatus = assignment.certificate_requests.status;
        }
      }
    } else if (action === 'reject') {
      newStatus = 'completed';
      newRequestStatus = 'rejected';
    } else if (action === 'return') {
      newStatus = 'completed';
      newRequestStatus = 'returned';
      nextStep = steps.find(s => s.id === 1 || s.status === 'staff_review' || s.id === 111);
    } else if (action === 'send_back_to_start') {
      newStatus = 'completed';
      newRequestStatus = 'staff_review';
      // Always target the very first step in the workflow
      nextStep = steps[0];
      
      // Reset specific fields to null when sending back to start
      await supabase
        .from('certificate_requests')
        .update({
          approved_at: null,
          certificate_file_path: null,
          certificate_generated_at: null,
          ready_at: null
        })
        .eq('id', assignment.request_id);
    } else if (action === 'physical_inspection') {
      // For business permits, physical_inspection should forward to next approver
      if (assignment.request_type === 'business_permit') {
        newStatus = 'completed'; // Complete current assignment
        if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
          nextStep = steps[currentStepIndex + 1];
          newRequestStatus = nextStep.status;
        } else {
          newRequestStatus = 'physical_inspection';
        }
      } else {
        // For other certificate types, stay at current step
        newStatus = 'pending';
        newRequestStatus = 'physical_inspection';
      }
    }

    const { error: updateError } = await supabase
      .from('workflow_assignments')
      .update({ status: newStatus, completed_at: new Date().toISOString() })
      .eq('id', assignmentId)
      .eq('tenant_id', tenantId);

    if (updateError) throw updateError;

    // Mark all other pending assignments for this request as completed
    // This ensures users from previous steps don't see the request anymore
    if (newStatus === 'completed') {
      const { error: otherAssignmentsError } = await supabase
        .from('workflow_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('request_id', assignment.request_id)
        .eq('status', 'pending')
        .eq('tenant_id', tenantId)
        .neq('id', assignmentId); // Don't update the current assignment again

      if (otherAssignmentsError) {
        console.error('Error updating other assignments:', otherAssignmentsError);
        // Don't throw error here as the main action succeeded
      }
    }

    const { error: requestUpdateError } = await supabase
      .from('certificate_requests')
      .update({ status: newRequestStatus, updated_at: new Date().toISOString() })
      .eq('id', assignment.request_id)
      .eq('tenant_id', tenantId);

    if (requestUpdateError) throw requestUpdateError;

    if ((action === 'approve' || action === 'return' || (action === 'physical_inspection' && assignment.request_type === 'business_permit')) && nextStep) {
      const nextStepAssignments = nextStep.assignedUsers || [];
      for (const nextUserId of nextStepAssignments) {
        const { data: existing } = await supabase
          .from('workflow_assignments')
          .select('id').eq('request_id', assignment.request_id).eq('step_id', nextStep.id.toString()).eq('assigned_user_id', nextUserId).eq('status', 'pending').eq('tenant_id', tenantId).single();

        if (!existing) {
          await supabase.from('workflow_assignments').insert([{
            tenant_id: tenantId,
            request_id: assignment.request_id,
            request_type: assignment.request_type,
            step_id: nextStep.id.toString(),
            step_name: nextStep.name,
            assigned_user_id: nextUserId,
            status: 'pending'
          }]);
        }
      }
    }

    const historyRequestType = ['barangay_guardianship', 'certification_same_person'].includes(assignment.request_type) ? 'note' : assignment.request_type;
    console.log(`[HISTORY] Saving history entry for request ${assignment.request_id}, action: ${action}, comment: "${comment}"`);

    const { error: historyError } = await supabase.from('workflow_history').insert([{
      tenant_id: tenantId,
      request_id: assignment.request_id,
      request_type: historyRequestType,
      step_id: assignment.step_id,
      step_name: assignment.step_name,
      action: action,
      performed_by: userId,
      previous_status: assignment.certificate_requests.status,
      new_status: newRequestStatus,
      comments: comment,
      signature_data: signatureData,
      official_role: currentStep?.officialRole
    }]);

    if (historyError) {
      console.error(`[HISTORY-ERROR] Failed to save history:`, historyError);
    } else {
      console.log(`[HISTORY] ✅ History saved successfully`);
    }

    res.json({ success: true, message: `Request ${action}d successfully`, newStatus: newRequestStatus });

    // --- ASYNC EMAIL NOTIFICATIONS ---
    setImmediate(async () => {
      try {
        const certReq = assignment.certificate_requests;
        const applicantName = certReq.full_name;
        const refNum = certReq.reference_number;
        const certType = certReq.certificate_type;

        console.log(`[Workflow Email Debug] Action: ${action}, Status: ${newRequestStatus}, RequestId: ${certReq.id}`);
        console.log(`[Workflow Email Debug] CertEmail: ${certReq.email}, ResidentId: ${certReq.resident_id}`);

        // 1. Notify Applicant of Rejection or Return
        if (action === 'reject' || action === 'return') {
          let recipientEmail = certReq.email;
          let recipientName = certReq.requestor_name || certReq.full_name;

          // Find applicant's email (check direct email first, then user link)
          if (!recipientEmail && certReq.resident_id) {
            const { data: applicantUser } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('id', certReq.resident_id)
              .single();

            if (applicantUser) {
              recipientEmail = applicantUser.email;
              recipientName = `${applicantUser.first_name} ${applicantUser.last_name}`;
            }
          }

          if (recipientEmail) {
            sendProcessNotification({
              recipientEmail: recipientEmail,
              recipientName: recipientName,
              eventType: action === 'reject' ? 'REJECTED' : 'RETURNED',
              certificateType: certType,
              referenceNumber: refNum,
              applicantName: applicantName,
              comments: comment,
              requestId: certReq.id
            }).catch(err => console.error('Background email error:', err));
          }
        }

        // 2. Notify Next Approvers
        if (action === 'approve' && nextStep) {
          const nextStepAssignments = nextStep.assignedUsers || [];
          if (nextStepAssignments.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .in('id', nextStepAssignments);

            if (users && users.length > 0) {
              const recipients = users.map(u => ({
                email: u.email,
                name: `${u.first_name} ${u.last_name}`
              }));

              sendWorkflowNotifications({
                recipients,
                eventType: 'APPROVED_STEP',
                certificateType: certType,
                referenceNumber: refNum,
                applicantName: applicantName,
                requestId: certReq.id,
                comments: `Moved to ${nextStep.name}`
              }).catch(err => console.error('Background email error:', err));
            }
          }
        }

        // 3. Notify Applicant if Ready for Pickup
        if ((newRequestStatus === 'ready' || newRequestStatus === 'ready_for_pickup') && action === 'approve') {
          let recipientEmail = certReq.email;
          let recipientName = certReq.requestor_name || certReq.full_name;

          // Find applicant's email (check direct email first, then user link)
          if (!recipientEmail && certReq.resident_id) {
            const { data: applicantUser } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('id', certReq.resident_id)
              .single();

            if (applicantUser) {
              recipientEmail = applicantUser.email;
              recipientName = `${applicantUser.first_name} ${applicantUser.last_name}`;
            }
          }

          if (recipientEmail) {
            sendProcessNotification({
              recipientEmail: recipientEmail,
              recipientName: recipientName,
              eventType: 'READY_FOR_PICKUP',
              certificateType: certType,
              referenceNumber: refNum,
              applicantName: applicantName,
              requestId: certReq.id
            }).catch(err => console.error('Background email error:', err));
          }
        }
      } catch (err) {
        console.error('Workflow email notification error:', err);
      }
    });
  } catch (error) {
    console.error('Error updating workflow assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add an internal note to a request
router.post('/add-note', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { requestId, requestType, comment, stepId, stepName } = req.body;
    const userId = req.user._id;

    if (!requestId || !comment) return res.status(400).json({ success: false, message: 'ID and comment required' });

    const historyRequestType = requestType === 'barangay_guardianship' ? 'note' : requestType;
    await supabase.from('workflow_history').insert([{
      tenant_id: tenantId,
      request_id: requestId,
      request_type: historyRequestType,
      step_id: stepId || 'note',
      step_name: stepName || 'Internal Note',
      action: 'note',
      performed_by: userId,
      comments: comment,
      new_status: 'note'
    }]);

    res.json({ success: true, message: 'Note added successfully' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get workflow history for a request (Public for tracking)
router.get('/history/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data: historyData, error: historyError } = await supabase
      .from('workflow_history')
      .select('*, users:performed_by (first_name, last_name, email, employee_code)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('workflow_assignments')
      .select('*, users:assigned_user_id (first_name, last_name, email)')
      .eq('request_id', requestId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (assignmentError) throw assignmentError;

    const existingStepIds = new Set((historyData || []).map(h => String(h.step_id)));
    const legacyEntries = (assignmentData || []).filter(a => !existingStepIds.has(String(a.step_id))).map(a => ({
      id: a.id,
      request_id: a.request_id,
      step_id: a.step_id,
      step_name: a.step_name,
      action: 'completed',
      performed_by: a.assigned_user_id,
      users: a.users,
      created_at: a.completed_at || a.updated_at || a.assigned_at,
      comments: a.comments || a.comment || a.remarks || a.note || 'Action Completed',
      is_legacy: true
    }));

    const combinedHistory = [...(historyData || []), ...legacyEntries].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );

    res.json({ success: true, history: combinedHistory });
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🎯 POST-APPROVAL WORKFLOW FUNCTION
async function processPostApprovalWorkflow(requestId, requestData) {
  console.log(`🚀 Starting post-approval workflow for ${requestData.reference_number}`);
  try {
    // Generate Real Certificate (not a preview)
    const certificateResult = await certificateGenerationService.generateCertificate(requestId, false);
    const qrResult = await qrCodeService.generateQRCodeForCertificate(requestId, requestData.reference_number);

    await supabase.from('certificate_requests').update({
      certificate_file_path: certificateResult.filePath,
      certificate_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', requestId);

    // Create releasing team assignment
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', requestData.certificate_type)
      .single();

    const steps = workflowConfig?.workflow_config?.steps || [];
    const releasingStep = steps.find(s =>
      s.status === 'oic_review' ||
      s.status === 'ready' ||
      s.name?.toLowerCase().includes('releasing') ||
      s.id === 999
    );

    if (releasingStep && releasingStep.assignedUsers) {
      for (const userId of releasingStep.assignedUsers) {
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('workflow_assignments')
          .select('id')
          .eq('request_id', requestId)
          .eq('step_id', releasingStep.id.toString())
          .eq('assigned_user_id', userId)
          .eq('status', 'pending')
          .single();

        if (!existing) {
          await supabase.from('workflow_assignments').insert([{
            request_id: requestId,
            request_type: requestData.certificate_type,
            step_id: releasingStep.id.toString(),
            step_name: releasingStep.name,
            assigned_user_id: userId,
            status: 'pending'
          }]);
          console.log(`✅ Created releasing team assignment for user: ${userId}`);
        }
      }
    }

    await supabase.from('workflow_history').insert([{
      request_id: requestId,
      request_type: requestData.certificate_type,
      step_id: 999,
      step_name: 'System Processing',
      action: 'generate_files',
      performed_by: 'system',
      previous_status: 'ready',
      new_status: 'ready',
      comments: `Certificate generated and QR code created. Ready for pickup.`
    }]);

    console.log(`🎉 Post-approval workflow completed for ${requestData.reference_number}`);
    return { success: true, certificate: certificateResult, qrCode: qrResult };
  } catch (error) {
    console.error(`❌ Post-approval workflow failed:`, error);
    await supabase.from('workflow_history').insert([{
      request_id: requestId, request_type: requestData.certificate_type, step_id: 4, step_name: 'Post-Approval Processing', action: 'failed', performed_by: 'system', previous_status: 'ready', new_status: 'ready', comments: `Post-approval workflow failed: ${error.message}`
    }]);
    return { success: false, error: error.message };
  }
}

module.exports = router;
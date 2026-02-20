const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { sendWorkflowNotifications, sendProcessNotification } = require('../services/emailService');
const workflowService = require('../services/workflowService');

// Helper function to send workflow notifications
const notifyNextStepApprovers = async (certificateType, referenceNumber, applicantName, requestId, applicantEmail = null) => {
  try {
    // 1. Send confirmation to applicant if email is provided
    if (applicantEmail) {
      await sendProcessNotification({
        recipientEmail: applicantEmail,
        recipientName: applicantName,
        eventType: 'RECEIVED',
        certificateType,
        referenceNumber,
        applicantName,
        requestId
      });
      console.log(`✅ Confirmation email sent to applicant: ${applicantEmail}`);
    }

    // 2. Notify staff approvers
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', certificateType)
      .single();

    let approverIds = [];
    let stepTitle = 'Initial Review';

    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      const firstStep = workflowConfig.workflow_config.steps.find(s => s.requiresApproval === true);
      if (firstStep) {
        approverIds = firstStep.assignedUsers || [];
        stepTitle = firstStep.name;
      }
    }

    // Fallback approvers if none found
    if (approverIds.length === 0) {
      approverIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Noriel Cruz
    }

    const { data: users } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .in('id', approverIds);

    if (users && users.length > 0) {
      const recipients = users.map(u => ({
        email: u.email,
        name: `${u.first_name} ${u.last_name}`
      }));

      await sendWorkflowNotifications({
        recipients,
        eventType: 'SUBMITTED',
        certificateType,
        referenceNumber,
        applicantName,
        requestId
      });
      console.log(`✅ Notifications sent to ${recipients.length} approvers for step: ${stepTitle}`);
    }
  } catch (error) {
    console.error('Error sending workflow notifications:', error);
  }
};

// Get next reference number for a certificate type
router.get('/next-reference/:type', async (req, res) => {
  try {
    const { type } = req.params;

    // Map type to prefix
    const prefixMap = {
      'barangay_clearance': 'BC',
      'certificate_of_indigency': 'CI',
      'barangay_residency': 'BR',
      'natural_death': 'ND',
      'barangay_guardianship': 'GD',
      'medico_legal': 'ML'
    };

    const prefix = prefixMap[type] || 'REF';
    const year = new Date().getFullYear();

    // Get ALL records of this type for this year, ordered by reference_number descending
    const { data: records, error } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', type)
      .order('reference_number', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      throw error;
    }

    let nextNumber = 1;

    // Find the highest number from existing records for this year
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const referenceNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;

    console.log(`Next reference for ${type}: ${referenceNumber} (found ${records?.length || 0} records)`);

    res.json({
      success: true,
      referenceNumber,
      nextNumber
    });
  } catch (error) {
    console.error('Error getting next reference:', error);
    // Fallback to 00001 if error
    const { type } = req.params;
    const prefixMap = {
      'barangay_clearance': 'BC',
      'certificate_of_indigency': 'CI',
      'barangay_residency': 'BR',
      'natural_death': 'ND',
      'barangay_guardianship': 'GD',
      'barangay_cohabitation': 'CH'
    };
    const prefix = prefixMap[type] || 'REF';
    const year = new Date().getFullYear();
    const referenceNumber = `${prefix}-${year}-00001`;

    res.json({
      success: true,
      referenceNumber,
      nextNumber: 1
    });
  }
});

// Get all certificate requests (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    console.log('Fetching certificates with filters:', { type, status });

    let query = supabase
      .from('certificate_requests')
      .select(`
        *,
        residents:resident_id (
          *
        )
      `);

    // Only apply valid filters
    if (type && type !== 'all') query = query.eq('certificate_type', type);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching certificates:', error);
      return res.status(500).json({ success: false, message: error.message, details: error.details });
    }

    res.json({ success: true, certificates: data || [] });
  } catch (error) {
    console.error('❌ Unexpected error fetching certificates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single certificate request
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        residents:resident_id (
          *
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Certificate not found' });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get certificate by reference number
router.get('/reference/:refNumber', async (req, res) => {
  try {
    const { refNumber } = req.params;
    const { data, error } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        residents:resident_id (
          *
        )
      `)
      .eq('reference_number', refNumber.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return res.status(404).json({ success: false, message: 'Reference number not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching certificate by ref:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Barangay Clearance)
router.post('/clearance', async (req, res) => {
  try {
    const {
      fullName, first_name, middle_name, last_name, suffix,
      age, sex, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose, residentId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'BC';

    // Get ALL barangay_clearance records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_clearance')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating clearance with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_clearance',
        full_name: fullName?.toUpperCase() || '',
        first_name: first_name?.toUpperCase() || '',
        middle_name: middle_name?.toUpperCase() || '',
        last_name: last_name?.toUpperCase() || '',
        suffix: suffix?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        email: req.body.email || '',
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        resident_id: residentId,
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Note: Automatic resident update disabled. Staff must verify and sync manually.

    // Create initial workflow assignments based on configuration
    // Fetch workflow config for this type
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'barangay_clearance')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      const steps = workflowConfig.workflow_config.steps;

      // Find the first step that requires approval (First 2nd Approver, etc sequence)
      // We look for the first step in the array that is actionable
      const firstActionableStep = steps.find(s => s.requiresApproval === true);

      if (firstActionableStep && firstActionableStep.assignedUsers && firstActionableStep.assignedUsers.length > 0) {
        staffUserIds = firstActionableStep.assignedUsers;
        initialStepId = firstActionableStep.id;
        initialStepName = firstActionableStep.name;
        console.log(`Starting clearance workflow at step: ${initialStepName} (ID: ${initialStepId})`);
      } else {
        // Fallback: If no actionable step found, use the very first assigned one or legacy
        console.warn('No actionable first step found in config, trying legacy fallback');
        const fallbackStep = steps.find(s => s.status === 'staff_review' || s.id === 111 || s.id === 2);
        if (fallbackStep) {
          staffUserIds = fallbackStep.assignedUsers || [];
          initialStepId = fallbackStep.id;
          initialStepName = fallbackStep.name;
        }
      }
    }

    // Fallback if no config found (Legacy hardcoded)
    if (staffUserIds.length === 0) {
      console.log('Using fallback hardcoded staff assignment');
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Noriel Cruz
    }

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_clearance',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'barangay_clearance',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: residentId || null, // Use resident ID if available
      comments: 'Barangay Clearance request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    // Send email notifications to next step approvers
    await notifyNextStepApprovers('barangay_clearance', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Barangay Clearance request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating clearance request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Certificate of Indigency)
router.post('/indigency', async (req, res) => {
  try {
    console.log('--- INDIGENCY REQUEST START ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const {
      fullName, first_name, middle_name, last_name, suffix,
      age, gender, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose, residentId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'CI';

    // Get ALL certificate_of_indigency records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'certificate_of_indigency')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating indigency with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'certificate_of_indigency',
        full_name: fullName?.toUpperCase() || '',
        first_name: first_name?.toUpperCase() || '',
        middle_name: middle_name?.toUpperCase() || '',
        last_name: last_name?.toUpperCase() || '',
        suffix: suffix?.toUpperCase() || '',
        age: parseInt(age) || null,
        sex: gender?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        email: req.body.email || '',
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        resident_id: residentId,
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Note: Automatic resident update disabled. Staff must verify and sync manually.

    // Create initial workflow assignments based on configuration
    // Fetch workflow config for this type
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'certificate_of_indigency')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      const steps = workflowConfig.workflow_config.steps;

      // Find the first step that requires approval
      const firstActionableStep = steps.find(s => s.requiresApproval === true);

      if (firstActionableStep && firstActionableStep.assignedUsers && firstActionableStep.assignedUsers.length > 0) {
        staffUserIds = firstActionableStep.assignedUsers;
        initialStepId = firstActionableStep.id;
        initialStepName = firstActionableStep.name;
        console.log(`Starting indigency workflow at step: ${initialStepName} (ID: ${initialStepId})`);
      } else {
        console.warn('No actionable first step found in config, trying legacy fallback');
        const fallbackStep = steps.find(s => s.status === 'staff_review' || s.id === 111 || s.id === 2);
        if (fallbackStep) {
          staffUserIds = fallbackStep.assignedUsers || [];
          initialStepId = fallbackStep.id;
          initialStepName = fallbackStep.name;
        }
      }
    }

    // Fallback if no config found (Legacy hardcoded)
    if (staffUserIds.length === 0) {
      console.log('Using fallback hardcoded staff assignment for indigency');
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Noriel Cruz
    }

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'certificate_of_indigency',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Send email notifications to next step approvers
    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'certificate_of_indigency',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: residentId || null,
      comments: 'Certificate of Indigency request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    notifyNextStepApprovers('certificate_of_indigency', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Certificate of Indigency request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating indigency request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Barangay Residency)
router.post('/residency', async (req, res) => {
  try {
    const {
      fullName, first_name, middle_name, last_name, suffix,
      age, sex, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose, residentId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'BR';

    // Get ALL barangay_residency records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_residency')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating residency with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_residency',
        full_name: fullName?.toUpperCase() || '',
        first_name: first_name?.toUpperCase() || '',
        middle_name: middle_name?.toUpperCase() || '',
        last_name: last_name?.toUpperCase() || '',
        suffix: suffix?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        email: req.body.email || '',
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        resident_id: residentId,
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Note: Automatic resident update disabled. Staff must verify and sync manually.

    // Create initial workflow assignments based on configuration
    // Fetch workflow config for this type
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'barangay_residency')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    const steps = workflowService.getWorkflowSteps('barangay_residency', workflowConfig?.workflow_config?.steps);
    const firstActionableStep = steps.find(s => s.requiresApproval === true);

    if (firstActionableStep) {
      staffUserIds = firstActionableStep.assignedUsers || [];
      initialStepId = firstActionableStep.id;
      initialStepName = firstActionableStep.name;
    }

    // Fallback if no config found (Legacy hardcoded)
    if (staffUserIds.length === 0) {
      console.log('Using fallback hardcoded staff assignment for residency');
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Noriel Cruz
    }

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_residency',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Send email notifications to next step approvers
    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'barangay_residency',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: residentId || null,
      comments: 'Barangay Residency Certificate request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    await notifyNextStepApprovers('barangay_residency', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Barangay Residency Certificate request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating residency request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Natural Death Certificate)
router.post('/natural-death', async (req, res) => {
  try {
    const {
      fullName, age, sex, civilStatus, address, contactNumber,
      dateOfDeath, causeOfDeath, covidRelated, requestorName, residentId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'ND';

    // Get ALL natural_death records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'natural_death')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating natural death certificate with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'natural_death',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        email: req.body.email || '',
        date_of_death: dateOfDeath,
        cause_of_death: causeOfDeath?.toUpperCase() || '',
        covid_related: covidRelated === 'Yes',
        requestor_name: requestorName?.toUpperCase() || '',
        resident_id: residentId,
        purpose: 'NATURAL DEATH CERTIFICATE',
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments based on configuration
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'natural_death')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    const steps = workflowService.getWorkflowSteps('natural_death', workflowConfig?.workflow_config?.steps);
    const firstActionableStep = steps.find(s => s.requiresApproval === true);
    if (firstActionableStep) {
      staffUserIds = firstActionableStep.assignedUsers || [];
      initialStepId = firstActionableStep.id;
      initialStepName = firstActionableStep.name;
    }

    if (staffUserIds.length === 0) {
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Fallback
    }

    for (const staffUserId of staffUserIds) {
      await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'natural_death',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);
    }

    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'natural_death',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: residentId || null,
      comments: 'Natural Death Certification request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    notifyNextStepApprovers('natural_death', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Natural Death Certificate request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating natural death request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Medico Legal Request)
router.post('/medico-legal', async (req, res) => {
  try {
    const {
      fullName, age, sex, civilStatus, address, contactNumber, dateOfBirth,
      dateOfExamination, usapingBarangay, dateOfHearing, residentId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'ML';

    // Get ALL medico_legal records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'medico_legal')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating medico legal request with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'medico_legal',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age) || 0,
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber || '',
        email: req.body.email || '',
        date_of_birth: dateOfBirth,
        date_of_examination: dateOfExamination,
        usaping_barangay: usapingBarangay?.toUpperCase() || '',
        date_of_hearing: dateOfHearing,
        resident_id: residentId,
        purpose: 'MEDICO LEGAL REQUEST',
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'medico_legal')
      .single();

    let staffUserIds = [];
    let initialStepId = 1;
    let initialStepName = 'Review Request Team';

    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      const steps = workflowConfig.workflow_config.steps;
      const firstActionableStep = steps.find(s => s.requiresApproval === true);
      if (firstActionableStep) {
        staffUserIds = firstActionableStep.assignedUsers || [];
        initialStepId = firstActionableStep.id;
        initialStepName = firstActionableStep.name;
      }
    }

    if (staffUserIds.length === 0) {
      // Default to Luffy Dono and Noriel Cruz
      staffUserIds = ['1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae', '9550a8b2-9e32-4f52-a260-52766afb49b1'];
    }

    for (const staffUserId of staffUserIds) {
      await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'medico_legal',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);
    }

    // Workflow history
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'medico_legal',
      action: 'submitted',
      step_id: 0,
      step_name: 'Request Submission',
      comments: 'Medico Legal request submitted via online portal.',
      new_status: 'staff_review'
    }]);

    notifyNextStepApprovers('medico_legal', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Medico Legal request submitted successfully',
      referenceNumber: refNumber,
      data
    });
  } catch (error) {
    console.error('Error creating medico legal request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Guardianship Certificate)
router.post('/guardianship', async (req, res) => {
  try {
    const {
      fullName, age, sex, civilStatus, address, contactNumber,
      dateOfBirth, guardianName, guardianRelationship, purpose, residentId, guardianId
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'GD';

    // Get ALL guardianship records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_guardianship')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating guardianship certificate with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_guardianship',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        email: req.body.email || '',
        date_of_birth: dateOfBirth,
        guardian_name: guardianName?.toUpperCase() || '',
        guardian_relationship: guardianRelationship?.toUpperCase() || '',
        resident_id: residentId,
        guardian_id: guardianId,
        purpose: purpose?.toUpperCase() || 'GUARDIANSHIP CERTIFICATE',
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Note: Automatic resident update disabled. Staff must verify and sync manually.

    // Create initial workflow assignments based on configuration
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'barangay_guardianship')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    const steps = workflowService.getWorkflowSteps('barangay_guardianship', workflowConfig?.workflow_config?.steps);
    const firstActionableStep = steps.find(s => s.requiresApproval === true);

    if (firstActionableStep) {
      staffUserIds = firstActionableStep.assignedUsers || [];
      initialStepId = firstActionableStep.id;
      initialStepName = firstActionableStep.name;
    }

    if (staffUserIds.length === 0) {
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Fallback
    }

    for (const staffUserId of staffUserIds) {
      await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_guardianship',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);
    }

    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'barangay_guardianship',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: residentId || null,
      comments: 'Barangay Guardianship Certificate request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    notifyNextStepApprovers('barangay_guardianship', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Guardianship Certificate request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating guardianship request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Co-habitation Certificate)
router.post('/cohabitation', async (req, res) => {
  try {
    const {
      fullName, age, gender, dateOfBirth, residentId,
      partnerFullName, partnerAge, partnerGender, partnerDateOfBirth, partnerResidentId,
      address, noOfChildren, livingTogetherYears, livingTogetherMonths,
      purpose, contactNumber, partnerAddress, partnerCivilStatus
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'CH';

    // Get ALL cohabitation records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_cohabitation')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating cohabitation certificate with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_cohabitation',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age) || 0,
        sex: gender?.toUpperCase() || '',
        date_of_birth: dateOfBirth,
        resident_id: residentId,
        partner_full_name: partnerFullName?.toUpperCase() || '',
        partner_age: parseInt(partnerAge) || 0,
        partner_sex: partnerGender?.toUpperCase() || '',
        partner_date_of_birth: partnerDateOfBirth,
        // partner_resident_id: partnerResidentId,
        civil_status: 'COHABITATION',
        address: address?.toUpperCase() || '',
        partner_address: (partnerAddress || address)?.toUpperCase() || '',
        partner_civil_status: partnerCivilStatus?.toUpperCase() || 'CO-HABITING',
        no_of_children: parseInt(noOfChildren) || 0,
        living_together_years: parseInt(livingTogetherYears) || 0,
        living_together_months: parseInt(livingTogetherMonths) || 0,
        purpose: purpose?.toUpperCase() || 'CO-HABITATION CERTIFICATE',
        contact_number: contactNumber || '',
        email: req.body.email || '',
        status: 'staff_review',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments based on configuration
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'barangay_cohabitation')
      .single();

    let staffUserIds = [];
    let initialStepId = 111;
    let initialStepName = 'Review Request';

    const steps = workflowService.getWorkflowSteps('barangay_cohabitation', workflowConfig?.workflow_config?.steps);
    const firstActionableStep = steps.find(s => s.requiresApproval === true);

    if (firstActionableStep) {
      staffUserIds = firstActionableStep.assignedUsers || [];
      initialStepId = firstActionableStep.id;
      initialStepName = firstActionableStep.name;
    }

    if (staffUserIds.length === 0) {
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Fallback
    }

    for (const staffUserId of staffUserIds) {
      await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_cohabitation',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);
    }

    // Create initial history entry
    await supabase.from('workflow_history').insert([{
      request_id: data.id,
      request_type: 'barangay_cohabitation',
      step_id: 0,
      step_name: 'Request Submission',
      action: 'submitted',
      performed_by: null, // Public submission
      comments: 'Barangay Co-habitation Certificate request submitted and queued for review.',
      new_status: 'staff_review'
    }]);

    notifyNextStepApprovers('barangay_cohabitation', refNumber, fullName, data.id, req.body.email);

    res.status(201).json({
      success: true,
      message: 'Co-habitation Certificate request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating cohabitation request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update certificate status (for admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, comment, action } = req.body;
    console.log(`Updating status for request ${req.params.id}:`, { status, action, comment });

    const validStatuses = [
      'pending', 'submitted', 'processing', 'under_review',
      'approved', 'rejected', 'returned', 'ready',
      'ready_for_pickup', 'released', 'cancelled',
      'staff_review', 'captain_approval', 'oic_review', 'completed'
    ];

    if (status && !validStatuses.includes(status)) {
      console.error('Invalid status received:', status);
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    // Map status to allowed database values if necessary
    let finalStatus = status;
    if (status === 'approved') finalStatus = 'ready';
    if (status === 'rejected') finalStatus = 'cancelled';

    // Build update object - only include fields that exist in the table
    const updateData = {
      status: finalStatus,
      updated_at: new Date().toISOString()
    };

    // Try to update with all fields first, if it fails, update without optional fields
    try {
      // Add comment/reason if provided
      if (comment) {
        updateData.admin_comment = comment;
      }

      // Track action history
      if (action) {
        updateData.last_action = action;
        updateData.last_action_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      // NEW: Check if this is a Natural Death certificate being marked as completed
      // If so, update the residents table to mark as deceased
      if (req.params.id && (status === 'completed' || finalStatus === 'completed')) {
        try {
          // Fetch the request details to verify type and get resident_id
          const { data: requestDetails, error: fetchError } = await supabase
            .from('certificate_requests')
            .select('certificate_type, resident_id, date_of_death, cause_of_death, covid_related')
            .eq('id', req.params.id)
            .single();

          if (!fetchError && requestDetails && requestDetails.certificate_type === 'natural_death' && requestDetails.resident_id) {
            console.log(`[Status Update] Natural Death certificate completed for resident ${requestDetails.resident_id}. Updating resident status...`);

            // Verify columns exist first to avoid errors if migration didn't run
            const { data: columnsCheck } = await supabase
              .from('residents')
              .select('is_deceased, date_of_death') // Check specific columns
              .limit(1);

            const residentUpdates = {
              is_deceased: true,
              date_of_death: requestDetails.date_of_death,
              cause_of_death: requestDetails.cause_of_death,
              covid_related: requestDetails.covid_related
            };

            const { error: residentUpdateError } = await supabase
              .from('residents')
              .update(residentUpdates)
              .eq('id', requestDetails.resident_id);

            if (residentUpdateError) {
              console.error('[Status Update] Failed to update resident death status:', residentUpdateError);
              if (residentUpdateError.message.includes('column')) {
                console.warn('[Status Update] Columns likely missing in residents table. Skipping update.');
              }
            } else {
              console.log(`[Status Update] ✅ successfully marked resident ${requestDetails.resident_id} as deceased.`);
            }
          }
        } catch (innerCheckError) {
          console.error('[Status Update] Error checking for natural death logic:', innerCheckError);
        }
      }

      res.json({ success: true, message: 'Status updated successfully', data });
    } catch (innerError) {
      // If error is about missing column, try without optional fields
      if (innerError.message && innerError.message.includes('column')) {
        console.log('Retrying without optional columns...');
        const basicUpdateData = {
          status,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('certificate_requests')
          .update(basicUpdateData)
          .eq('id', req.params.id)
          .select()
          .single();

        if (error) throw error;

        // NEW: Check if this is a Natural Death certificate being marked as completed
        // If so, update the residents table to mark as deceased
        if (req.params.id && (status === 'completed' || finalStatus === 'completed')) {
          try {
            // Fetch the request details to verify type and get resident_id
            const { data: requestDetails, error: fetchError } = await supabase
              .from('certificate_requests')
              .select('certificate_type, resident_id, date_of_death, cause_of_death, covid_related')
              .eq('id', req.params.id)
              .single();

            if (!fetchError && requestDetails && requestDetails.certificate_type === 'natural_death' && requestDetails.resident_id) {
              console.log(`[Status Update] Natural Death certificate completed for resident ${requestDetails.resident_id}. Updating resident status...`);

              // Verify columns exist first to avoid errors if migration didn't run
              const { data: columnsCheck } = await supabase
                .from('residents')
                .select('is_deceased, date_of_death') // Check specific columns
                .limit(1);

              // If we didn't get an error about missing columns (or implicit error handling via keys check), proceed
              // Note: The select above might throw error if column doesn't exist, so this try-catch wraps it.

              const residentUpdates = {
                is_deceased: true,
                date_of_death: requestDetails.date_of_death,
                cause_of_death: requestDetails.cause_of_death,
                covid_related: requestDetails.covid_related
              };

              const { error: residentUpdateError } = await supabase
                .from('residents')
                .update(residentUpdates)
                .eq('id', requestDetails.resident_id);

              if (residentUpdateError) {
                console.error('[Status Update] Failed to update resident death status:', residentUpdateError);
                if (residentUpdateError.message.includes('column')) {
                  console.warn('[Status Update] Columns likely missing in residents table. Skipping update.');
                }
              } else {
                console.log(`[Status Update] ✅ successfully marked resident ${requestDetails.resident_id} as deceased.`);
              }
            }
          } catch (innerCheckError) {
            console.error('[Status Update] Error checking for natural death logic:', innerCheckError);
          }
        }

        res.json({ success: true, message: 'Status updated successfully', data });
      } else {
        throw innerError;
      }
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update certificate details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove protected fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.reference_number;
    delete updateData.residents; // Don't try to update joined data

    // Convert strings to uppercase if they exist in updateData
    const uppercaseFields = [
      'full_name', 'first_name', 'middle_name', 'last_name', 'suffix',
      'sex', 'civil_status', 'address', 'place_of_birth', 'purpose',
      'guardian_name', 'guardian_relationship',
      'partner_full_name', 'partner_sex', 'partner_address', 'partner_civil_status',
      'usaping_barangay'
    ];
    uppercaseFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = updateData[field].toUpperCase();
      }
    });

    updateData.updated_at = new Date().toISOString();

    const { data: updatedCert, error: certError } = await supabase
      .from('certificate_requests')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        residents:resident_id (
          id,
          pending_case,
          case_record_history,
          is_deceased,
          date_of_death,
          cause_of_death,
          covid_related
        )
      `)
      .single();

    if (certError) throw certError;

    // Note: Automatic synchronization removed to ensure staff explicitly verify changes via the 'Sync' action.

    res.json({ success: true, message: 'Certificate and resident updated successfully', data: updatedCert });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete certificate request
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('certificate_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Certificate request deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sync certificate request data to resident profile
router.post('/:id/sync-resident', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    // Fetch the request details
    const { data: cert, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !cert) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!cert.resident_id) {
      return res.status(400).json({ success: false, message: 'Request is not linked to a resident profile' });
    }

    // Prepare the update data for the residents table
    // Only include fields that are actually provided in the certificate to avoid overwriting with nulls
    const residentUpdates = {
      updated_at: new Date().toISOString()
    };

    if (cert.first_name) residentUpdates.first_name = cert.first_name;
    if (cert.middle_name) residentUpdates.middle_name = cert.middle_name;
    if (cert.last_name) residentUpdates.last_name = cert.last_name;
    if (cert.suffix) residentUpdates.suffix = cert.suffix;
    if (cert.age) residentUpdates.age = parseInt(cert.age);
    if (cert.sex) residentUpdates.gender = cert.sex;
    if (cert.civil_status) residentUpdates.civil_status = cert.civil_status;
    if (cert.date_of_birth) residentUpdates.date_of_birth = cert.date_of_birth;
    if (cert.place_of_birth) residentUpdates.place_of_birth = cert.place_of_birth;
    if (cert.address) residentUpdates.residential_address = cert.address;
    if (cert.contact_number) residentUpdates.contact_number = cert.contact_number;

    // Additional fields for natural death if applicable
    if (cert.certificate_type === 'natural_death') {
      residentUpdates.is_deceased = true;
      if (cert.date_of_death) residentUpdates.date_of_death = cert.date_of_death;
      if (cert.cause_of_death) residentUpdates.cause_of_death = cert.cause_of_death;
      if (cert.covid_related !== null && cert.covid_related !== undefined) {
        residentUpdates.covid_related = cert.covid_related;
      }
    }

    // Additional fields for same person if applicable
    if (cert.certificate_type === 'certification_same_person' && cert.details) {
      try {
        const details = typeof cert.details === 'string' ? JSON.parse(cert.details) : cert.details;
        const secondName = details.fullName2 || details.name_2 || details.name2;
        if (secondName) {
          residentUpdates.second_name = secondName.toUpperCase();
        }
      } catch (e) {
        console.error('Error parsing details for sync:', e);
      }
    }

    // Additional fields for guardianship if applicable
    if (cert.certificate_type === 'barangay_guardianship') {
      if (cert.guardian_name) residentUpdates.guardian_name = cert.guardian_name;
      if (cert.guardian_relationship) residentUpdates.guardian_relationship = cert.guardian_relationship;
    }

    const { error: updateError } = await supabase
      .from('residents')
      .update(residentUpdates)
      .eq('id', cert.resident_id);

    if (updateError) throw updateError;

    // Record this action in the history
    await supabase.from('workflow_history').insert([{
      request_id: id,
      request_type: cert.certificate_type,
      step_id: 999,
      step_name: 'Database Sync',
      action: 'synced',
      performed_by: adminId || null,
      comments: 'Resident profile information manually synchronized with verified request data.',
      new_status: cert.status
    }]);

    res.json({ success: true, message: 'Resident profile successfully synchronized' });
  } catch (error) {
    console.error('Error syncing resident data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: all, error: allError } = await supabase
      .from('certificate_requests')
      .select('certificate_type, status');

    if (allError) throw allError;

    const stats = {
      total: all.length,
      byType: {
        barangay_clearance: all.filter(c => c.certificate_type === 'barangay_clearance').length,
        certificate_of_indigency: all.filter(c => c.certificate_type === 'certificate_of_indigency').length,
        barangay_cohabitation: all.filter(c => c.certificate_type === 'barangay_cohabitation').length
      },
      byStatus: {
        pending: all.filter(c => c.status === 'pending').length,
        processing: all.filter(c => c.status === 'processing').length,
        ready: all.filter(c => c.status === 'ready').length,
        released: all.filter(c => c.status === 'released').length
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generic create endpoint for new certificate types
router.post('/create', async (req, res) => {
  try {
    const { certificate_type } = req.body;

    if (certificate_type === 'certification_same_person') {
      const {
        full_name, firstName, lastName,
        age, sex, civilStatus, address, contactNumber,
        dateOfBirth, residentId, details
      } = req.body;

      const year = new Date().getFullYear();
      const prefix = 'SP'; // Same Person

      // Get ALL records of this type to find the highest number
      const { data: records } = await supabase
        .from('certificate_requests')
        .select('reference_number')
        .eq('certificate_type', 'certification_same_person')
        .order('reference_number', { ascending: false });

      let nextNumber = 1;
      if (records && records.length > 0) {
        let maxNumber = 0;
        for (const record of records) {
          if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
            const parts = record.reference_number.split('-');
            if (parts.length === 3) {
              const num = parseInt(parts[2], 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        }
        nextNumber = maxNumber + 1;
      }

      const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
      console.log(`Creating Same Person Certification with reference: ${refNumber}`);

      const { data, error } = await supabase
        .from('certificate_requests')
        .insert([{
          reference_number: refNumber,
          certificate_type: 'certification_same_person',
          full_name: full_name?.toUpperCase() || '',
          first_name: firstName?.toUpperCase() || '',
          last_name: lastName?.toUpperCase() || '',
          age: parseInt(age),
          sex: sex?.toUpperCase() || '',
          civil_status: civilStatus?.toUpperCase() || '',
          address: address?.toUpperCase() || '',
          contact_number: contactNumber,
          email: req.body.email || '',
          date_of_birth: dateOfBirth,
          purpose: 'CERTIFICATION OF SAME PERSON',
          details: details,
          resident_id: residentId,
          status: 'staff_review',
          date_issued: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create workflow assignments based on configuration
      const { data: workflowConfig } = await supabase
        .from('workflow_configurations')
        .select('workflow_config')
        .eq('certificate_type', 'certification_same_person')
        .single();

      let staffUserIds = [];
      let initialStepId = 111;
      let initialStepName = 'Review Request';

      const steps = workflowService.getWorkflowSteps('certification_same_person', workflowConfig?.workflow_config?.steps);
      const firstActionableStep = steps.find(s => s.requiresApproval === true);

      if (firstActionableStep) {
        staffUserIds = firstActionableStep.assignedUsers || [];
        initialStepId = firstActionableStep.id;
        initialStepName = firstActionableStep.name;
      }

      // Fallback staff assignment if no config exists or no users assigned
      if (staffUserIds.length === 0) {
        staffUserIds = ['1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae']; // Luffy Dono (Review Team)
      }

      for (const staffUserId of staffUserIds) {
        await supabase
          .from('workflow_assignments')
          .insert([{
            request_id: data.id,
            request_type: 'certification_same_person',
            step_id: initialStepId,
            step_name: initialStepName,
            assigned_user_id: staffUserId,
            status: 'pending'
          }]);
      }

      // Create initial history entry
      await supabase.from('workflow_history').insert([{
        request_id: data.id,
        request_type: 'note', // Use 'note' for certification_same_person compatibility
        step_id: 0,
        step_name: 'Request Submission',
        action: 'submitted',
        performed_by: residentId || null,
        comments: 'Same Person Certification request submitted and queued for review.',
        new_status: 'staff_review'
      }]);

      notifyNextStepApprovers('certification_same_person', refNumber, full_name, data.id, req.body.email);

      return res.status(201).json({
        success: true,
        message: 'Same Person Certification request submitted successfully',
        data,
        referenceNumber: refNumber
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid or unsupported certificate type' });
  } catch (error) {
    console.error('Error creating certificate request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

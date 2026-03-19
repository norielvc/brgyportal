const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');
const officialReceiptService = require('../services/officialReceiptService');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Generate Official Receipt and mark request as paid
router.post('/generate/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { amount = 100 } = req.body;
    const userId = req.user._id;

    console.log(`Generating OR for request ${requestId}, amount: ${amount}`);

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if request is in Treasury status
    if (request.status !== 'Treasury') {
      return res.status(400).json({
        success: false,
        message: 'Request is not in Treasury status'
      });
    }

    // Check if OR already exists for this request
    const { data: existingOR, error: existingError } = await supabase
      .from('official_receipts')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (existingOR) {
      // OR already exists! Let's just regenerate the file content for updated styling
      const newOrResult = await officialReceiptService.generateOfficialReceipt(requestId, amount);

      // Update the file path just in case
      await supabase
        .from('official_receipts')
        .update({ file_path: newOrResult.filePath })
        .eq('id', existingOR.id);

      return res.json({
        success: true,
        message: 'Official Receipt retrieved successfully',
        orNumber: existingOR.or_number,
        filePath: newOrResult.filePath,
        orRecord: existingOR
      });
    }

    // Generate the Official Receipt
    const orResult = await officialReceiptService.generateOfficialReceipt(requestId, amount);

    if (!orResult.success) {
      return res.status(500).json({
        success: false,
        message: orResult.error
      });
    }

    // Parse business details
    let businessDetails = {};
    try {
      if (typeof request.details === 'string') {
        businessDetails = JSON.parse(request.details);
      } else if (typeof request.details === 'object') {
        businessDetails = request.details || {};
      }
    } catch (e) {
      console.error('Error parsing business details:', e);
    }

    // Save OR record to database
    const { data: orRecord, error: orError } = await supabase
      .from('official_receipts')
      .insert([{
        or_number: orResult.orNumber,
        request_id: requestId,
        amount: amount,
        payment_method: 'CASH',
        payment_for: 'BUSINESS PERMIT PROCESSING FEE',
        payor_name: request.full_name || request.applicant_name || '',
        payor_address: request.address || '',
        business_name: businessDetails.businessName || '',
        nature_of_business: businessDetails.natureOfBusiness || '',
        reference_number: request.reference_number,
        issued_by: userId,
        file_path: orResult.filePath
      }])
      .select()
      .single();

    if (orError) {
      console.error('Error saving OR record:', orError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save OR record'
      });
    }

    // Don't automatically forward the request - just generate the OR
    // The forwarding will be handled separately when user closes the OR preview

    res.json({
      success: true,
      message: 'Official Receipt generated successfully',
      orNumber: orResult.orNumber,
      filePath: orResult.filePath,
      orRecord: orRecord
    });

  } catch (error) {
    console.error('Error generating Official Receipt:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Official Receipt by request ID
router.get('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { data, error } = await supabase
      .from('official_receipts')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      data: data || null
    });

  } catch (error) {
    console.error('Error fetching OR:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all Official Receipts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('official_receipts')
      .select(`
        *,
        certificate_requests!inner(reference_number, full_name, certificate_type)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching ORs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Forward request to releasing team after OR generation
router.post('/forward/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    console.log(`Forwarding request ${requestId} to releasing team after OR generation`);

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if request is still in Treasury status
    if (request.status !== 'Treasury') {
      return res.status(400).json({
        success: false,
        message: 'Request is not in Treasury status'
      });
    }

    // Check if OR exists for this request
    const { data: orRecord, error: orError } = await supabase
      .from('official_receipts')
      .select('or_number')
      .eq('request_id', requestId)
      .single();

    if (orError || !orRecord) {
      return res.status(400).json({
        success: false,
        message: 'No Official Receipt found for this request'
      });
    }

    // Update request status to next step (oic_review - Releasing Team)
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        status: 'oic_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update request status'
      });
    }

    // Create workflow assignment for releasing team
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'business_permit')
      .single();

    let releasingTeamUsers = [];
    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      const releasingStep = workflowConfig.workflow_config.steps.find(s => s.status === 'oic_review');
      if (releasingStep) {
        releasingTeamUsers = releasingStep.assignedUsers || [];
      }
    }

    // Fallback if no users found
    if (releasingTeamUsers.length === 0) {
      releasingTeamUsers = ['1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae']; // Luffy Dono
    }

    // Create workflow assignments for releasing team
    for (const assignedUserId of releasingTeamUsers) {
      await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: requestId,
          request_type: 'business_permit',
          step_id: 999,
          step_name: 'Releasing Team',
          assigned_user_id: assignedUserId,
          status: 'pending'
        }]);
    }

    // Add workflow history entry
    await supabase.from('workflow_history').insert([{
      request_id: requestId,
      request_type: 'business_permit',
      step_id: 1772696381251,
      step_name: 'OR Preparation',
      action: 'approve',
      performed_by: userId,
      comments: `Payment processed. Official Receipt ${orRecord.or_number} confirmed. Request forwarded to Releasing Team.`,
      new_status: 'oic_review'
    }]);

    res.json({
      success: true,
      message: 'Request forwarded to Releasing Team successfully'
    });

  } catch (error) {
    console.error('Error forwarding request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
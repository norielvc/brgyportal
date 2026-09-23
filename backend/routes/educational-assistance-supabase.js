const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { sendProcessNotification, sendWorkflowNotifications } = require('../services/emailService');

// Get all educational assistance applications
router.get('/', async (req, res) => {
  try {
    console.log('Fetching educational assistance applications...');

    const { status, year_grade, limit = 50, offset = 0 } = req.query;

    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });

    let query = supabase
      .from('educational_assistance')
      .select('*')
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .order('submitted_at', { ascending: false });

    // Apply filters if provided
    if (status) {
      query = query.eq('application_status', status);
    }

    if (year_grade) {
      query = query.eq('year_grade', year_grade);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: error.message
      });
    }

    console.log(`Found ${applications?.length || 0} applications`);

    res.json({
      success: true,
      data: applications || [],
      count: applications?.length || 0
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Create new educational assistance application
router.post('/', async (req, res) => {
  try {
    console.log('Creating new educational assistance application...');

    const {
      firstName,
      middleName,
      lastName,
      age,
      gender,
      civilStatus,
      purok,
      houseNumber,
      phaseNumber,
      blockNumber,
      lotNumber,
      fullAddress,
      cellphoneNumber,
      yearGrade,
      schoolToAttend,
      schoolAttending,
      academicAwards,
      gwa,
      residentId
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !age || !gender || !civilStatus || !purok ||
      !cellphoneNumber || !yearGrade || !schoolToAttend || !gwa) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate age range
    if (age < 12 || age > 30) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 12 and 30'
      });
    }

    // Validate GWA range
    if (gwa < 1.00 || gwa > 5.00) {
      return res.status(400).json({
        success: false,
        message: 'GWA must be between 1.00 and 5.00'
      });
    }

    // Validate address based on purok
    const isPhaseBlockLot = ['NV9', 'NORTH VILLE 9', 'CREEKSTONE'].includes(purok?.toUpperCase());
    if (isPhaseBlockLot) {
      if (!phaseNumber || !blockNumber || !lotNumber) {
        return res.status(400).json({
          success: false,
          message: `Phase, Block, and Lot numbers are required for ${purok}`
        });
      }
    } else {
      if (!houseNumber) {
        return res.status(400).json({
          success: false,
          message: 'House number is required'
        });
      }
    }

    const applicationData = {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      age: parseInt(age),
      gender,
      civil_status: civilStatus,
      purok,
      house_number: houseNumber || null,
      phase_number: phaseNumber || null,
      block_number: blockNumber || null,
      lot_number: lotNumber || null,
      full_address: fullAddress,
      cellphone_number: cellphoneNumber,
      year_grade: yearGrade,
      school_to_attend: schoolToAttend,
      school_attending: schoolAttending || null,
      academic_awards: academicAwards || null,
      gwa: parseFloat(gwa),
      application_status: 'pending'
    };

    const { data: application, error } = await supabase
      .from('educational_assistance')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create application',
        error: error.message
      });
    }

    // Update resident contact number if residentId is provided
    if (residentId && cellphoneNumber) {
      await supabase
        .from('residents')
        .update({ contact_number: cellphoneNumber })
        .eq('id', residentId);
    }

    console.log('Application created successfully:', application.reference_number);

    // --- ASYNC EMAIL NOTIFICATIONS ---
    setImmediate(async () => {
      try {
        const applicantName = `${firstName} ${lastName}`;
        const refNumber = application.reference_number;

        // 1. Notify Applicant
        if (req.body.email) {
          await sendProcessNotification({
            recipientEmail: req.body.email,
            recipientName: applicantName,
            eventType: 'RECEIVED',
            certificateType: 'Educational Assistance',
            referenceNumber: refNumber,
            applicantName: applicantName,
            requestId: application.id
          });
        }

        // 2. Notify Staff Approvers
        // Fetch Review Request Team members
        const { data: users } = await supabase
          .from('users')
          .select('email, first_name, last_name')
          .eq('role', 'admin'); // Fallback to all admins or specific team

        if (users && users.length > 0) {
          const recipients = users.map(u => ({
            email: u.email,
            name: `${u.first_name} ${u.last_name}`
          }));

          await sendWorkflowNotifications({
            recipients,
            eventType: 'SUBMITTED',
            certificateType: 'Educational Assistance',
            referenceNumber: refNumber,
            applicantName: applicantName,
            requestId: application.id
          });
        }
      } catch (err) {
        console.error('Educational assistance email error:', err);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        reference_number: application.reference_number,
        application_status: application.application_status,
        submitted_at: application.submitted_at
      }
    });

  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single application by ID or reference number
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`Fetching application: ${identifier}`);

    let query = supabase
      .from('educational_assistance')
      .select('*');

    // Check if identifier is UUID or reference number
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('reference_number', identifier);
    }

    const { data: application, error } = await query.single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update application status (for admin use)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, reviewedBy } = req.body;

    console.log(`Updating application status: ${id} -> ${status}`);

    const validStatuses = ['pending', 'under_review', 'qualified', 'not_qualified', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = {
      application_status: status,
      qualification_notes: notes || null,
      reviewed_by: reviewedBy || null,
      reviewed_at: new Date().toISOString()
    };

    const { data: application, error } = await supabase
      .from('educational_assistance')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update application',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get application statistics
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('Fetching application statistics...');
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });

    const { data: stats, error } = await supabase
      .from('educational_assistance')
      .select('application_status, year_grade')
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }

    // Calculate statistics
    const summary = {
      total: stats.length,
      by_status: {},
      by_grade: {},
      recent_applications: 0
    };

    // Count by status
    stats.forEach(app => {
      summary.by_status[app.application_status] = (summary.by_status[app.application_status] || 0) + 1;
      summary.by_grade[app.year_grade] = (summary.by_grade[app.year_grade] || 0) + 1;
    });

    // Count recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCount } = await supabase
      .from('educational_assistance')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', thirtyDaysAgo.toISOString());

    summary.recent_applications = recentCount || 0;

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
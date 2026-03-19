const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

// Get physical inspection report by request ID
router.get('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get the main inspection report
    const { data: report, error: reportError } = await supabase
      .from('physical_inspection_reports')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (reportError && reportError.code !== 'PGRST116') {
      throw reportError;
    }

    let inspectionData = {
      areas: {},
      visitDateTime: '',
      ownerRepresentative: '',
      recommendations: {}
    };

    if (report) {
      // Get area findings
      const { data: areaFindings, error: areaError } = await supabase
        .from('inspection_area_findings')
        .select('*')
        .eq('inspection_report_id', report.id);

      if (areaError) throw areaError;

      // Get committee recommendations
      const { data: committeeRecs, error: committeeError } = await supabase
        .from('committee_recommendations')
        .select('*')
        .eq('inspection_report_id', report.id);

      if (committeeError) throw committeeError;

      // Format area findings
      areaFindings.forEach(area => {
        inspectionData.areas[area.area_name] = {
          findings: area.findings || '',
          date: area.inspection_date || '',
          remarks: area.remarks || ''
        };
      });

      // Format committee recommendations
      committeeRecs.forEach(committee => {
        inspectionData.recommendations[committee.committee_name] = {
          name: committee.signatory_name || '',
          date: committee.recommendation_date || ''
        };
      });

      // Set visit info
      inspectionData.visitDateTime = report.visit_datetime ? 
        new Date(report.visit_datetime).toISOString().slice(0, 16) : '';
      inspectionData.ownerRepresentative = report.owner_representative || '';
    } else {
      // Return default structure if no report exists yet
      const defaultAreas = [
        'HEALTH AND SAFETY', 'SANITATION', 'HEALTH HAZARD', 'BUILDING PERMIT',
        'FIRE EXIT / HAZARD', 'ENVIRONMENT', 'WASTE MANAGEMENT', 'HAZARDOUS WASTE',
        'OTHERS', 'COMPLAINTS, ETC.'
      ];

      const defaultCommittees = ['HEALTH', 'ENVIRONMENT', 'INFRASTRUCTURE', 'PEACE & ORDER'];

      defaultAreas.forEach(area => {
        inspectionData.areas[area] = { findings: '', date: '', remarks: '' };
      });

      defaultCommittees.forEach(committee => {
        inspectionData.recommendations[committee] = { name: '', date: '' };
      });
    }

    res.json({
      success: true,
      data: inspectionData,
      reportId: report?.id || null
    });

  } catch (error) {
    console.error('Error fetching inspection report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create or update physical inspection report
router.post('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { inspectionData } = req.body;
    const userId = req.user._id;

    // Check if report already exists
    const { data: existingReport, error: checkError } = await supabase
      .from('physical_inspection_reports')
      .select('id')
      .eq('request_id', requestId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let reportId;

    if (existingReport) {
      // Update existing report
      reportId = existingReport.id;
      
      const { error: updateError } = await supabase
        .from('physical_inspection_reports')
        .update({
          visit_datetime: inspectionData.visitDateTime || null,
          owner_representative: inspectionData.ownerRepresentative || null,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;
    } else {
      // Create new report
      const { data: newReport, error: createError } = await supabase
        .from('physical_inspection_reports')
        .insert([{
          request_id: requestId,
          visit_datetime: inspectionData.visitDateTime || null,
          owner_representative: inspectionData.ownerRepresentative || null,
          created_by: userId,
          updated_by: userId
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      reportId = newReport.id;
    }

    // Update area findings
    if (inspectionData.areas) {
      for (const [areaName, areaData] of Object.entries(inspectionData.areas)) {
        const { error: areaError } = await supabase
          .from('inspection_area_findings')
          .upsert({
            inspection_report_id: reportId,
            area_name: areaName,
            findings: areaData.findings || '',
            inspection_date: areaData.date || null,
            remarks: areaData.remarks || ''
          }, {
            onConflict: 'inspection_report_id,area_name'
          });

        if (areaError) throw areaError;
      }
    }

    // Update committee recommendations
    if (inspectionData.recommendations) {
      for (const [committeeName, committeeData] of Object.entries(inspectionData.recommendations)) {
        const { error: committeeError } = await supabase
          .from('committee_recommendations')
          .upsert({
            inspection_report_id: reportId,
            committee_name: committeeName,
            signatory_name: committeeData.name || '',
            recommendation_date: committeeData.date || null
          }, {
            onConflict: 'inspection_report_id,committee_name'
          });

        if (committeeError) throw committeeError;
      }
    }

    res.json({
      success: true,
      message: 'Inspection report saved successfully',
      reportId: reportId
    });

  } catch (error) {
    console.error('Error saving inspection report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete physical inspection report
router.delete('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    const { error } = await supabase
      .from('physical_inspection_reports')
      .delete()
      .eq('request_id', requestId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Inspection report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting inspection report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get inspection report summary for dashboard
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { data: summary, error } = await supabase
      .from('physical_inspection_reports')
      .select(`
        id,
        request_id,
        inspection_status,
        overall_recommendation,
        created_at,
        certificate_requests!inner(reference_number, full_name, status)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching inspection summary:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { sendProcessNotification } = require('../services/emailService');

/**
 * POST /api/email/send-notification
 * Send workflow notification email
 */
router.post('/send-notification', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      eventType,
      certificateType,
      referenceNumber,
      applicantName,
      comments,
      requestId
    } = req.body;

    console.log(`[EMAIL-API] Sending ${eventType} notification to ${recipientEmail}`);

    const result = await sendProcessNotification({
      recipientEmail,
      recipientName,
      eventType,
      certificateType,
      referenceNumber,
      applicantName,
      comments: comments || '',
      requestId
    });

    if (result.success) {
      console.log(`[EMAIL-API] ✅ Email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`[EMAIL-API] ❌ Email failed:`, result.error);
    }

    res.json(result);
  } catch (error) {
    console.error('[EMAIL-API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/email/test
 * Test email configuration
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address required' });
    }

    const result = await sendProcessNotification({
      recipientEmail: email,
      recipientName: 'Test User',
      eventType: 'RECEIVED',
      certificateType: 'barangay_clearance',
      referenceNumber: 'TEST-' + Date.now(),
      applicantName: 'Test Applicant',
      comments: 'This is a test email from BrgyDesk',
      requestId: 'test-123'
    });

    res.json(result);
  } catch (error) {
    console.error('[EMAIL-API] Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

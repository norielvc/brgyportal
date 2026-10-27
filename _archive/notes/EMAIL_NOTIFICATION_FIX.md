# Email Notification System - Diagnostic & Fix

## Problem Identified

Email notifications are NOT being sent because:
1. ✅ Email service exists (`backend/services/emailService.js`)
2. ✅ Workflow steps have `sendEmail: true` configured
3. ❌ **The workflow status API never calls the email service**
4. ❌ SMTP credentials may not be configured

## Root Cause

The file `frontend/pages/api/workflow-assignments/[id]/status.js` handles workflow approvals but does NOT include any code to send email notifications.

## Solution Overview

We need to:
1. Add SMTP credentials to environment variables
2. Import and call the email service in the workflow status API
3. Send emails to the right people at the right time

## Step 1: Configure SMTP Credentials

### Option A: Using Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "BrgyDesk"
   - Copy the 16-character password

3. **Add to backend/.env**:
```env
# Email Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FRONTEND_URL=http://localhost:3000
```

### Option B: Using Other SMTP Services

**SendGrid:**
```env
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

**Mailgun:**
```env
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
```

## Step 2: Update Email Service (if needed)

The email service at `backend/services/emailService.js` is already well-implemented with:
- ✅ Bilingual templates (English + Tagalog)
- ✅ Professional HTML design
- ✅ Multiple event types (SUBMITTED, RECEIVED, REJECTED, RETURNED, etc.)
- ✅ Error handling

**No changes needed to email service.**

## Step 3: Fix Workflow Status API

The workflow status API needs to be updated to send emails. Since this is a Next.js API route (frontend), we have two options:

### Option A: Create a Backend Email API Endpoint (Recommended)

Create `backend/routes/email.js`:

\`\`\`javascript
const express = require('express');
const router = express.Router();
const { sendProcessNotification } = require('../services/emailService');

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

    const result = await sendProcessNotification({
      recipientEmail,
      recipientName,
      eventType,
      certificateType,
      referenceNumber,
      applicantName,
      comments,
      requestId
    });

    res.json(result);
  } catch (error) {
    console.error('Email API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
\`\`\`

Then register it in `backend/server.js`:
\`\`\`javascript
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);
\`\`\`

### Option B: Call Backend Email API from Frontend

Update `frontend/pages/api/workflow-assignments/[id]/status.js` to call the backend email API.

## Step 4: Implement Email Notifications in Workflow

Here's the complete implementation for the workflow status API:

\`\`\`javascript
// Add this helper function at the top of the file
async function sendEmailNotification({ eventType, recipientEmail, recipientName, certificateType, referenceNumber, applicantName, comments, requestId }) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(\`\${backendUrl}/api/email/send-notification\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail,
        recipientName,
        eventType,
        certificateType,
        referenceNumber,
        applicantName,
        comments,
        requestId
      })
    });
    const result = await response.json();
    console.log(\`📧 Email sent to \${recipientEmail}:\`, result);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// Then in the main handler, after updating the certificate status:

// 7.5 Send email notifications
try {
  // Get applicant email
  const { data: resident } = await supabase
    .from('residents')
    .select('email, first_name, last_name')
    .eq('id', cert.resident_id)
    .eq('tenant_id', tenantId)
    .single();

  const applicantEmail = resident?.email;
  const applicantName = \`\${resident?.first_name || ''} \${resident?.last_name || ''}\`.trim();

  // Determine event type based on action and new status
  let eventType = null;
  let recipientEmail = null;
  let recipientName = null;

  if (action === 'approve') {
    if (newCertStatus === 'released') {
      // Notify applicant: certificate is ready
      eventType = 'READY_FOR_PICKUP';
      recipientEmail = applicantEmail;
      recipientName = applicantName;
    } else {
      // Notify next approver: new assignment
      eventType = 'APPROVED_STEP';
      // Get next step users
      const { data: nextAssignments } = await supabase
        .from('workflow_assignments')
        .select('assigned_user_id')
        .eq('request_id', requestId)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending');

      if (nextAssignments?.length > 0) {
        // Send to all assigned users
        for (const assignment of nextAssignments) {
          const { data: assignedUser } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .eq('_id', assignment.assigned_user_id)
            .eq('tenant_id', tenantId)
            .single();

          if (assignedUser?.email) {
            await sendEmailNotification({
              eventType: 'APPROVED_STEP',
              recipientEmail: assignedUser.email,
              recipientName: \`\${assignedUser.first_name} \${assignedUser.last_name}\`,
              certificateType: certType,
              referenceNumber: cert.reference_number,
              applicantName,
              comments: note,
              requestId
            });
          }
        }
      }
    }
  } else if (action === 'reject') {
    // Notify applicant: request rejected
    eventType = 'REJECTED';
    recipientEmail = applicantEmail;
    recipientName = applicantName;
  } else if (action === 'return' || action === 'send_back_to_start') {
    // Notify applicant: corrections needed
    eventType = 'RETURNED';
    recipientEmail = applicantEmail;
    recipientName = applicantName;
  }

  // Send email if we have a recipient
  if (eventType && recipientEmail) {
    await sendEmailNotification({
      eventType,
      recipientEmail,
      recipientName,
      certificateType: certType,
      referenceNumber: cert.reference_number,
      applicantName,
      comments: note,
      requestId
    });
  }
} catch (emailError) {
  console.error('Email notification error:', emailError);
  // Don't fail the request if email fails
}
\`\`\`

## Step 5: Test Email Notifications

### Test Checklist

1. **Configure SMTP credentials** in `backend/.env`
2. **Restart backend server**: `cd backend && npm start`
3. **Submit a test certificate request** from portal
4. **Check backend console** for email logs:
   ```
   📧 Attempting to send email: RECEIVED to user@example.com
   ```
5. **Check email inbox** (including spam folder)
6. **Approve the request** as staff
7. **Check if secretary receives email**
8. **Continue through workflow** and verify emails at each step

### Expected Email Flow

| Action | Who Gets Email | Event Type |
|--------|---------------|------------|
| Portal submission | Applicant | RECEIVED |
| Staff approves | Secretary | APPROVED_STEP |
| Secretary approves | Captain | APPROVED_STEP |
| Captain approves | Releasing Team | APPROVED_STEP |
| Releasing marks ready | Applicant | READY_FOR_PICKUP |
| Any step rejects | Applicant | REJECTED |
| Any step returns | Applicant | RETURNED |

## Troubleshooting

### Issue: "SMTP credentials not configured"

**Solution:** Add SMTP_USER and SMTP_PASS to `backend/.env`

### Issue: "Invalid login" or "Authentication failed"

**Solutions:**
1. For Gmail: Use App Password, not regular password
2. Enable "Less secure app access" (not recommended)
3. Check if 2FA is enabled (required for App Passwords)

### Issue: Emails go to spam

**Solutions:**
1. Add sender to contacts
2. Mark as "Not Spam"
3. Use a custom domain with SPF/DKIM records (production)

### Issue: Emails not sending but no error

**Solutions:**
1. Check backend console for logs
2. Verify SMTP credentials are correct
3. Test with a simple script:
   ```javascript
   const { sendProcessNotification } = require('./backend/services/emailService');
   sendProcessNotification({
     recipientEmail: 'test@example.com',
     recipientName: 'Test User',
     eventType: 'RECEIVED',
     certificateType: 'barangay_clearance',
     referenceNumber: 'TEST-001',
     applicantName: 'John Doe',
     comments: '',
     requestId: '123'
   }).then(console.log);
   ```

### Issue: Backend URL not accessible from frontend

**Solution:** Add to `frontend/.env.local`:
```env
BACKEND_URL=http://localhost:5000
```

## Quick Fix Implementation

If you want a quick fix without creating a new backend route, you can use the email service directly in the Next.js API:

1. Copy `backend/services/emailService.js` to `frontend/src/lib/emailService.js`
2. Install nodemailer in frontend: `cd frontend && npm install nodemailer`
3. Import and use directly in the workflow status API

**Note:** This is not recommended for production as it exposes SMTP credentials to the frontend build.

## Production Considerations

1. **Use environment variables** for all credentials
2. **Implement email queue** (Bull, BeeQueue) for reliability
3. **Add retry logic** for failed emails
4. **Log all email attempts** to database
5. **Use transactional email service** (SendGrid, Mailgun, AWS SES)
6. **Implement email templates** in database for easy editing
7. **Add unsubscribe functionality** for compliance
8. **Monitor email delivery rates** and bounces

## Files to Modify

1. `backend/.env` - Add SMTP credentials
2. `backend/routes/email.js` - Create email API endpoint (new file)
3. `backend/server.js` - Register email routes
4. `frontend/pages/api/workflow-assignments/[id]/status.js` - Add email calls
5. `frontend/.env.local` - Add BACKEND_URL (new file)

## Related Files

- `backend/services/emailService.js` - Email service implementation
- `frontend/pages/workflows.js` - Workflow configuration UI
- `frontend/pages/requests.js` - Request management UI

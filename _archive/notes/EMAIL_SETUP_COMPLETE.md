# Email Notification Setup - COMPLETE ✅

## What I Did

1. ✅ Updated `backend/.env` with your SMTP credentials
2. ✅ Created `backend/routes/email.js` - Email API endpoint
3. ✅ Registered email routes in `backend/server.js`
4. ✅ Created `backend/test-email.js` - Test script

## Your SMTP Configuration

```
Email: nnvc9295@gmail.com
App Password: vyut dsyh tqip bhlx (configured)
```

## Next Steps

### 1. Restart Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on port 5005
📊 Environment: development
🔗 API URL: http://0.0.0.0:5005/api
```

### 2. Test Email Configuration

Run the test script:

```bash
cd backend
node test-email.js
```

Expected output:
```
🧪 Testing email configuration...

📧 SMTP Configuration:
   User: nnvc9295@gmail.com
   Pass: vyut****
   Frontend URL: http://localhost:3000

📤 Sending test email...

✅ Email sent successfully!
   Message ID: <some-id@gmail.com>

📬 Check your inbox: nnvc9295@gmail.com
   (Don't forget to check spam folder)
```

### 3. Check Your Email

1. Open Gmail: nnvc9295@gmail.com
2. Look for email from "Barangay Iba O Este"
3. Subject: "Request Received / Natanggap ang Request"
4. Check spam folder if not in inbox

### 4. Test via API (Optional)

```bash
curl -X POST http://localhost:5005/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"nnvc9295@gmail.com"}'
```

## Email API Endpoints

### Send Notification
```
POST http://localhost:5005/api/email/send-notification

Body:
{
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "eventType": "RECEIVED",
  "certificateType": "barangay_clearance",
  "referenceNumber": "BC-2024-001",
  "applicantName": "Juan Dela Cruz",
  "comments": "Optional comments",
  "requestId": "123"
}
```

### Test Email
```
POST http://localhost:5005/api/email/test

Body:
{
  "email": "test@example.com"
}
```

## Event Types Available

| Event Type | When to Use | Who Gets It |
|------------|-------------|-------------|
| `RECEIVED` | After portal submission | Applicant |
| `SUBMITTED` | New assignment created | Staff/Approver |
| `APPROVED_STEP` | Request moves to next step | Next approver |
| `REJECTED` | Request is rejected | Applicant |
| `RETURNED` | Request sent back for corrections | Applicant |
| `READY_FOR_PICKUP` | Certificate is ready | Applicant |

## Email Template Preview

The emails are bilingual (English + Tagalog) with:
- Professional header with gradient
- Clear action buttons
- Request details table
- Comments section (if provided)
- Responsive design

## Still Need to Do

The email API is ready, but you still need to integrate it into the workflow. This means updating:

`frontend/pages/api/workflow-assignments/[id]/status.js`

To add email sending when:
- Request is approved → notify next approver
- Request is rejected → notify applicant
- Request is returned → notify applicant
- Request is ready → notify applicant

See `EMAIL_NOTIFICATION_FIX.md` for the complete integration code.

## Troubleshooting

### "SMTP credentials not configured"
✅ Already fixed - credentials are in backend/.env

### "Invalid login" or "Authentication failed"
- Verify app password is correct: `vyutdsyhtqipbhlx` (no spaces)
- Make sure 2FA is enabled on Gmail account
- Try regenerating app password if needed

### Emails go to spam
- Add "Barangay Iba O Este" to contacts
- Mark test email as "Not Spam"
- Future emails should go to inbox

### Port already in use
If port 5005 is busy:
```bash
# Find process using port 5005
lsof -i :5005

# Kill it
kill -9 <PID>

# Or change port in backend/.env
PORT=5006
```

## Files Modified/Created

1. ✅ `backend/.env` - Added SMTP credentials
2. ✅ `backend/routes/email.js` - Email API endpoint (NEW)
3. ✅ `backend/server.js` - Registered email routes
4. ✅ `backend/test-email.js` - Test script (NEW)
5. ✅ `EMAIL_SETUP_COMPLETE.md` - This guide (NEW)

## Quick Test Commands

```bash
# 1. Restart backend
cd backend && npm start

# 2. In another terminal, test email
cd backend && node test-email.js

# 3. Check email inbox
# Open: https://mail.google.com
# Login: nnvc9295@gmail.com
```

## Success Indicators

✅ Backend starts without errors
✅ Test script sends email successfully
✅ Email appears in inbox (or spam)
✅ Email has proper formatting and content
✅ API endpoint responds to curl/Postman

## Next: Integrate with Workflow

Once emails are working, you need to add email sending to the workflow approval process. The email API is ready - it just needs to be called when actions happen.

See `EMAIL_NOTIFICATION_FIX.md` for step-by-step integration guide.

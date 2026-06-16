# Email Notification Testing Guide

## What I Added

Email notifications are now integrated into the certificate submission process:

1. ✅ **Applicant Email**: Sent immediately after successful submission (RECEIVED event)
2. ✅ **Staff Email**: Sent to all assigned staff members (SUBMITTED event)

## Changes Made

### 1. Portal Submission API
**File:** `frontend/pages/api/portal/submit.js`

Added two email notifications:
- Confirmation email to applicant
- Assignment email to staff members

### 2. Frontend Environment
**File:** `frontend/.env.local`

Added:
```env
BACKEND_URL=http://localhost:5005
```

## Testing Steps

### Step 1: Ensure Backend is Running

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on port 5005
📊 Environment: development
```

### Step 2: Test Email Configuration

```bash
cd backend
node test-email.js
```

Expected output:
```
✅ Email sent successfully!
📬 Check your inbox: nnvc9295@gmail.com
```

Check your email (nnvc9295@gmail.com) - you should receive a test email.

### Step 3: Restart Frontend Server

The frontend needs to be restarted to pick up the new BACKEND_URL environment variable:

```bash
cd frontend
npm run dev
```

### Step 4: Submit a Certificate Request

1. **Open Portal**: `http://localhost:3000/demo`
2. **Scroll to Certificate Forms**
3. **Click "Request Certificate"** on any certificate
4. **Fill out the form** with:
   - Your name
   - **Email: nnvc9295@gmail.com** (or any email you want to test)
   - Other required fields
5. **Click "Submit Request"**

### Step 5: Check Backend Console

You should see logs like:
```
📡 Cloud Submit [certificate_of_indigency] for tenant: demo
✅ LIVE Request stored: CI-2024-12345
📧 Confirmation email sent to nnvc9295@gmail.com
✅ Workflow assignments created for CI-2024-12345 (2 staff)
📧 Assignment email sent to staff1@example.com
📧 Assignment email sent to staff2@example.com
```

### Step 6: Check Email Inbox

**Applicant Email (nnvc9295@gmail.com):**
- Subject: "Request Received / Natanggap ang Request"
- Content: Confirmation that request was received
- Reference number displayed
- Bilingual (English + Tagalog)

**Staff Email (if you have staff users with emails):**
- Subject: "New Request Submitted / Bagong Request ay Isinumite"
- Content: New assignment notification
- Reference number displayed
- Link to review request

## Email Flow

```
Portal Submission
       ↓
   [SUCCESS]
       ↓
   ┌───────────────────────┐
   │                       │
   ↓                       ↓
Applicant Email      Staff Email(s)
"RECEIVED"          "SUBMITTED"
```

## Troubleshooting

### No Emails Received

**Check 1: Backend Running?**
```bash
# Check if backend is running on port 5005
curl http://localhost:5005/api/health
```

**Check 2: SMTP Credentials Configured?**
```bash
# Check backend/.env
cat backend/.env | grep SMTP
```

Should show:
```
SMTP_USER=nnvc9295@gmail.com
SMTP_PASS=vyutdsyhtqipbhlx
```

**Check 3: Frontend Environment Variable?**
```bash
# Check frontend/.env.local
cat frontend/.env.local | grep BACKEND_URL
```

Should show:
```
BACKEND_URL=http://localhost:5005
```

**Check 4: Backend Console Logs**

Look for:
```
📧 Confirmation email sent to...
```

If you see:
```
⚠️ Email failed: ...
```

Then check the error message.

### Emails Go to Spam

1. Check spam/junk folder
2. Add "Barangay Iba O Este" to contacts
3. Mark as "Not Spam"

### Backend Not Accessible

**Error:** `fetch failed` or `ECONNREFUSED`

**Solution:**
1. Verify backend is running: `curl http://localhost:5005/api/health`
2. Check port in backend/.env: `PORT=5005`
3. Check BACKEND_URL in frontend/.env.local: `BACKEND_URL=http://localhost:5005`

### Staff Not Receiving Emails

**Possible Causes:**
1. Staff users don't have email addresses in database
2. Staff users not assigned to workflow

**Check Staff Emails:**
```sql
SELECT _id, email, first_name, last_name, role 
FROM users 
WHERE tenant_id = 'demo' 
AND role IN ('admin', 'staff', 'secretary', 'captain');
```

**Add Email to Staff:**
```sql
UPDATE users 
SET email = 'staff@example.com' 
WHERE _id = 'staff-user-id';
```

## Email Templates

### RECEIVED (Applicant Confirmation)
```
Subject: Request Received / Natanggap ang Request

Dear [Applicant Name],

Your request has been successfully received and is currently 
being processed by the Barangay Staff.

Reference Number: BC-2024-12345
Certificate: Barangay Clearance

[View Details Button]
```

### SUBMITTED (Staff Assignment)
```
Subject: New Request Submitted / Bagong Request ay Isinumite

Dear [Staff Name],

A new request has been submitted and is waiting for your review.

Reference Number: BC-2024-12345
Applicant: Juan Dela Cruz
Certificate: Barangay Clearance

[View Request Button]
```

## Testing Different Scenarios

### Test 1: Applicant with Email
```
Email: nnvc9295@gmail.com
Expected: Applicant receives RECEIVED email
```

### Test 2: Applicant without Email
```
Email: (leave blank)
Expected: No applicant email, but submission succeeds
```

### Test 3: Multiple Staff Members
```
Expected: Each staff member receives SUBMITTED email
```

### Test 4: No Staff Assigned
```
Expected: No staff emails, but submission succeeds
```

## Next Steps

Once portal submission emails are working, you can add email notifications to the workflow approval process:

1. **Staff Approves** → Secretary receives email
2. **Secretary Approves** → Captain receives email
3. **Captain Approves** → Releasing Team receives email
4. **Mark Ready** → Applicant receives READY_FOR_PICKUP email
5. **Reject** → Applicant receives REJECTED email
6. **Return** → Applicant receives RETURNED email

See `EMAIL_NOTIFICATION_FIX.md` for workflow integration code.

## Quick Test Command

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Test email
cd backend && node test-email.js

# Terminal 3: Start frontend
cd frontend && npm run dev

# Browser: Submit certificate request
# Open: http://localhost:3000/demo
```

## Success Indicators

✅ Backend starts without errors
✅ Test email script succeeds
✅ Frontend restarts successfully
✅ Certificate submission succeeds
✅ Backend console shows email logs
✅ Applicant receives confirmation email
✅ Staff receives assignment email (if configured)

## Common Issues

| Issue | Solution |
|-------|----------|
| Backend not running | `cd backend && npm start` |
| Frontend not restarted | `cd frontend && npm run dev` |
| BACKEND_URL not set | Add to `frontend/.env.local` |
| SMTP credentials missing | Add to `backend/.env` |
| Emails in spam | Mark as "Not Spam" |
| Staff no email | Update users table with emails |

## Files Modified

1. ✅ `frontend/pages/api/portal/submit.js` - Added email notifications
2. ✅ `frontend/.env.local` - Added BACKEND_URL
3. ✅ `backend/routes/email.js` - Email API endpoint (already created)
4. ✅ `backend/server.js` - Email routes registered (already done)
5. ✅ `backend/.env` - SMTP credentials (already configured)

## Production Considerations

1. **Environment Variables**: Use production URLs in production
2. **Error Handling**: Email failures don't block submissions
3. **Rate Limiting**: Consider email rate limits
4. **Monitoring**: Log all email attempts
5. **Retry Logic**: Implement retry for failed emails
6. **Queue System**: Use email queue for reliability (Bull, BeeQueue)

# Complete Email Notification System - ACTIVATED ✅

## Overview

The complete email notification system is now activated for the entire certificate request workflow. Every action triggers appropriate email notifications to the right people.

## Email Notification Flow

```
Portal Submission
       ↓
   [RECEIVED]
       ↓
   ┌─────────────────────────────┐
   │                             │
   ↓                             ↓
Applicant Email            Staff Email(s)
"Request Received"    "New Request Submitted"
       
       ↓
       
Staff Approves
       ↓
   [APPROVED_STEP]
       ↓
Secretary Email(s)
"Request Waiting for You"

       ↓
       
Secretary Approves
       ↓
   [APPROVED_STEP]
       ↓
Captain Email(s)
"Request Waiting for You"

       ↓
       
Captain Approves
       ↓
   [APPROVED_STEP]
       ↓
Releasing Team Email(s)
"Request Waiting for You"

       ↓
       
Mark as Ready
       ↓
   [READY_FOR_PICKUP]
       ↓
Applicant Email
"Certificate Ready!"

       ↓
       
Confirm Pickup
       ↓
   [RELEASED]
       ↓
Process Complete
```

## Email Events by Action

### 1. Portal Submission
**Trigger:** User submits certificate request from portal

**Emails Sent:**
- ✅ **Applicant**: RECEIVED event
  - Subject: "Request Received / Natanggap ang Request"
  - Message: Confirmation that request was received
  
- ✅ **Assigned Staff**: SUBMITTED event
  - Subject: "New Request Submitted / Bagong Request ay Isinumite"
  - Message: New request needs review

### 2. Staff Approves
**Trigger:** Staff clicks "Verify & Forward"

**Emails Sent:**
- ✅ **Next Approver (Secretary)**: APPROVED_STEP event
  - Subject: "Action Required: Next Approval"
  - Message: Request moved to your stage

### 3. Secretary Approves
**Trigger:** Secretary clicks "Forward to Next"

**Emails Sent:**
- ✅ **Next Approver (Captain)**: APPROVED_STEP event
  - Subject: "Action Required: Next Approval"
  - Message: Request needs your approval

### 4. Captain Approves
**Trigger:** Captain clicks "Official Approval"

**Emails Sent:**
- ✅ **Releasing Team**: APPROVED_STEP event
  - Subject: "Action Required: Next Approval"
  - Message: Request ready for release

### 5. Mark as Ready
**Trigger:** Releasing team clicks "Set as Ready"

**Emails Sent:**
- ✅ **Applicant**: READY_FOR_PICKUP event
  - Subject: "Request Ready for Pickup"
  - Message: Certificate is ready at Barangay Hall

### 6. Request Rejected
**Trigger:** Any approver clicks "Reject"

**Emails Sent:**
- ✅ **Applicant**: REJECTED event
  - Subject: "Request Rejected"
  - Message: Request was rejected with reason

### 7. Request Returned
**Trigger:** Any approver clicks "Send Back" or "Send Back to Start"

**Emails Sent:**
- ✅ **Applicant**: RETURNED event
  - Subject: "Action Required: Request Sent Back"
  - Message: Corrections needed, please review comments

## Email Template Features

All emails include:
- ✅ Bilingual content (English + Tagalog)
- ✅ Professional design with gradient header
- ✅ Reference number
- ✅ Applicant name
- ✅ Certificate type
- ✅ Comments/remarks (if provided)
- ✅ Action buttons with links
- ✅ Request details table
- ✅ Responsive design

## Files Modified

### 1. Portal Submission
**File:** `frontend/pages/api/portal/submit.js`
- Added applicant confirmation email (RECEIVED)
- Added staff assignment emails (SUBMITTED)

### 2. Workflow Approval
**File:** `frontend/pages/api/workflow-assignments/[id]/status.js`
- Added next approver emails (APPROVED_STEP)
- Added applicant notification for ready (READY_FOR_PICKUP)
- Added applicant notification for rejected (REJECTED)
- Added applicant notification for returned (RETURNED)

### 3. Backend Email Service
**File:** `backend/routes/email.js`
- Email API endpoint for sending notifications

### 4. Backend Server
**File:** `backend/server.js`
- Registered email routes

### 5. Environment Configuration
**Files:** `backend/.env`, `frontend/.env.local`
- SMTP credentials configured
- Backend URL configured

## Testing the Complete Flow

### Prerequisites
1. ✅ Backend running on port 5005
2. ✅ Frontend running on port 3000
3. ✅ SMTP credentials configured
4. ✅ Test email: nnvc9295@gmail.com

### Test Steps

#### Step 1: Submit Request
```
1. Go to: http://localhost:3000/demo
2. Click "Request Certificate" on Barangay Clearance
3. Fill form with email: nnvc9295@gmail.com
4. Submit
5. Check email: Should receive "Request Received"
```

#### Step 2: Staff Review
```
1. Login as staff user
2. Go to "My Assignments"
3. Click on the request
4. Click "Verify & Forward"
5. Check secretary email: Should receive "Request Waiting for You"
```

#### Step 3: Secretary Approval
```
1. Login as secretary
2. Go to "My Assignments"
3. Click on the request
4. Click "Forward to Next"
5. Check captain email: Should receive "Request Waiting for You"
```

#### Step 4: Captain Approval
```
1. Login as captain
2. Go to "My Assignments"
3. Click on the request
4. Click "Official Approval"
5. Check releasing team email: Should receive "Request Waiting for You"
```

#### Step 5: Mark Ready
```
1. Login as releasing team
2. Go to "My Assignments"
3. Click on the request
4. Click "Set as Ready"
5. Check applicant email: Should receive "Certificate Ready!"
```

#### Step 6: Test Rejection
```
1. Submit new request
2. Login as staff
3. Click "Mark as Ineligible"
4. Add comment: "Missing requirements"
5. Check applicant email: Should receive "Request Rejected"
```

#### Step 7: Test Return
```
1. Submit new request
2. Login as secretary
3. Click "Send Back"
4. Add comment: "Please correct address"
5. Check applicant email: Should receive "Request Sent Back"
```

## Email Logs

Check backend console for email logs:

```
📧 Email sent to applicant@example.com: RECEIVED
📧 Email sent to staff@example.com: SUBMITTED
📧 Email sent to secretary@example.com: APPROVED_STEP
📧 Email sent to captain@example.com: APPROVED_STEP
📧 Email sent to releasing@example.com: APPROVED_STEP
📧 Email sent to applicant@example.com: READY_FOR_PICKUP
```

## Troubleshooting

### No Emails Received

**Check 1: Backend Running?**
```bash
curl http://localhost:5005/api/health
```

**Check 2: Email Logs in Console?**
Look for:
```
📧 Email sent to...
```

If you see:
```
⚠️ Email failed: ...
```
Check the error message.

**Check 3: SMTP Credentials?**
```bash
cat backend/.env | grep SMTP
```

**Check 4: User Has Email?**
```sql
SELECT email FROM users WHERE _id = 'user-id';
SELECT email FROM residents WHERE id = 'resident-id';
```

### Emails Go to Spam

1. Check spam/junk folder
2. Add "Barangay Iba O Este" to contacts
3. Mark as "Not Spam"
4. Future emails should go to inbox

### Staff Not Receiving Emails

**Problem:** Staff users don't have email addresses

**Solution:**
```sql
UPDATE users 
SET email = 'staff@example.com' 
WHERE _id = 'staff-user-id';
```

### Applicant Not Receiving Emails

**Problem:** Resident record has no email

**Solution 1:** Add email to resident record
```sql
UPDATE residents 
SET email = 'resident@example.com' 
WHERE id = 'resident-id';
```

**Solution 2:** Collect email during portal submission
- Email field is already in the form
- Stored in `certificate_requests.email`

## Email Event Reference

| Event Type | Recipient | Trigger | Subject |
|------------|-----------|---------|---------|
| RECEIVED | Applicant | Portal submission | Request Received |
| SUBMITTED | Staff | Portal submission | New Request Submitted |
| APPROVED_STEP | Next Approver | Approval action | Action Required: Next Approval |
| READY_FOR_PICKUP | Applicant | Mark as ready | Request Ready for Pickup |
| REJECTED | Applicant | Reject action | Request Rejected |
| RETURNED | Applicant | Return action | Action Required: Request Sent Back |

## Configuration

### SMTP Settings (backend/.env)
```env
SMTP_USER=nnvc9295@gmail.com
SMTP_PASS=vyutdsyhtqipbhlx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FRONTEND_URL=http://localhost:3000
```

### Backend URL (frontend/.env.local)
```env
BACKEND_URL=http://localhost:5005
```

## Production Deployment

### Environment Variables

**Backend (.env):**
```env
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://your-domain.com
```

**Frontend (.env.local):**
```env
BACKEND_URL=https://your-backend-domain.com
```

### Recommendations

1. **Use Transactional Email Service**
   - SendGrid, Mailgun, AWS SES
   - Better deliverability
   - Email analytics
   - Higher sending limits

2. **Implement Email Queue**
   - Bull, BeeQueue, or similar
   - Retry failed emails
   - Rate limiting
   - Background processing

3. **Add Email Logging**
   - Store all email attempts in database
   - Track delivery status
   - Monitor bounce rates

4. **Implement Unsubscribe**
   - Add unsubscribe link
   - Respect user preferences
   - Compliance with email laws

5. **Monitor Email Metrics**
   - Delivery rate
   - Open rate
   - Bounce rate
   - Spam complaints

## Success Indicators

✅ Backend starts without errors
✅ Frontend restarts successfully
✅ Portal submission sends 2 emails (applicant + staff)
✅ Staff approval sends email to secretary
✅ Secretary approval sends email to captain
✅ Captain approval sends email to releasing team
✅ Mark ready sends email to applicant
✅ Reject sends email to applicant
✅ Return sends email to applicant
✅ All emails have proper formatting
✅ All emails are bilingual
✅ Backend console shows email logs

## Quick Start

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Start frontend
cd frontend && npm run dev

# Browser: Test complete flow
# 1. Submit request from portal
# 2. Login as staff and approve
# 3. Login as secretary and approve
# 4. Login as captain and approve
# 5. Login as releasing and mark ready
# 6. Check emails at each step
```

## Summary

The complete email notification system is now active and will send emails at every step of the workflow:

1. ✅ Portal submission → Applicant + Staff
2. ✅ Staff approval → Secretary
3. ✅ Secretary approval → Captain
4. ✅ Captain approval → Releasing Team
5. ✅ Mark ready → Applicant
6. ✅ Reject → Applicant
7. ✅ Return → Applicant

All emails are bilingual (English + Tagalog) with professional design and include all relevant request details.

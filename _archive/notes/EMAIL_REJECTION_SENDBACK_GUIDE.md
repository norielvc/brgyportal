# Email Notifications for Rejection & Send Back - Complete Guide

## Overview

Email notifications are now fully activated for rejection and send back actions. Both the applicant and relevant staff members receive notifications.

## Rejection Flow

### When Any Approver Clicks "Reject"

**Emails Sent:**

1. ✅ **Applicant Email** (REJECTED event)
   - **To:** Applicant's email address
   - **Subject:** "Request Rejected / Tinanggihan ang Request"
   - **Content:**
     - Notification that request was rejected
     - Reference number
     - Certificate type
     - Reason for rejection (from comments)
     - Bilingual (English + Tagalog)

**Example Email:**
```
Subject: Request Rejected / Tinanggihan ang Request

Dear Juan Dela Cruz,

Unfortunately, your request has been rejected for the following reason:

Reference Number: BC-2024-12345
Certificate: Barangay Clearance

Remarks: "Missing valid ID. Please resubmit with proper identification."

---

Paumanhin, ang iyong request ay tinanggihan dahil sa sumusunod na dahilan:

[Same details in Tagalog]
```

## Send Back Flow

### When Any Approver Clicks "Send Back" or "Send Back to Start"

**Emails Sent:**

1. ✅ **Applicant Email** (RETURNED event)
   - **To:** Applicant's email address
   - **Subject:** "Action Required: Request Sent Back / Kailangan ng Aksyon: Ibinalik ang Request"
   - **Content:**
     - Notification that corrections are needed
     - Reference number
     - Certificate type
     - Comments explaining what needs to be fixed
     - Bilingual (English + Tagalog)

2. ✅ **Reassigned Staff Email** (RESUBMITTED event)
   - **To:** Staff members who will handle the resubmission
   - **Subject:** "Request Resubmitted / Muling Isinumite ang Request"
   - **Content:**
     - Notification that request was sent back
     - Reference number
     - Applicant name
     - Comments from the person who sent it back
     - Action required: Review again

**Example Applicant Email:**
```
Subject: Action Required: Request Sent Back

Dear Juan Dela Cruz,

Your request has been sent back for corrections. Please review 
the comments and resubmit.

Reference Number: BC-2024-12345
Certificate: Barangay Clearance

Remarks: "Please correct your address. Current address is incomplete."

---

Mahal na Juan Dela Cruz,

Ang iyong request ay ibinalik para sa mga pagtatama...

[Same details in Tagalog]
```

**Example Staff Email:**
```
Subject: Request Resubmitted / Muling Isinumite ang Request

Dear Maria Santos,

An applicant has resubmitted their request with the requested changes.

Reference Number: BC-2024-12345
Applicant: Juan Dela Cruz
Certificate: Barangay Clearance

Previous Comments: "Please correct your address. Current address is incomplete."

[View Request Button]
```

## Testing Rejection

### Test Case 1: Staff Rejects Request

**Steps:**
1. Submit a certificate request from portal
   - Email: nnvc9295@gmail.com
   - Name: Test Applicant

2. Login as staff user
3. Go to "My Assignments"
4. Click on the request
5. Click "Mark as Ineligible" (Reject button)
6. Add comment: "Missing valid ID"
7. Click "Confirm"

**Expected Results:**
- ✅ Request status changes to "rejected"
- ✅ Backend console shows: `📧 Email sent to nnvc9295@gmail.com: REJECTED`
- ✅ Applicant receives rejection email
- ✅ Email includes the comment "Missing valid ID"

### Test Case 2: Secretary Rejects Request

**Steps:**
1. Submit and approve through staff
2. Login as secretary
3. Go to "My Assignments"
4. Click on the request
5. Click "Reject"
6. Add comment: "Incomplete documents"
7. Click "Confirm"

**Expected Results:**
- ✅ Request status changes to "rejected"
- ✅ Applicant receives rejection email
- ✅ Email includes the comment "Incomplete documents"

### Test Case 3: Captain Rejects Request

**Steps:**
1. Submit and approve through staff and secretary
2. Login as captain
3. Go to "My Assignments"
4. Click on the request
5. Click "Reject"
6. Add comment: "Does not meet requirements"
7. Click "Confirm"

**Expected Results:**
- ✅ Request status changes to "rejected"
- ✅ Applicant receives rejection email
- ✅ Email includes the comment "Does not meet requirements"

## Testing Send Back

### Test Case 4: Secretary Sends Back to Staff

**Steps:**
1. Submit a certificate request from portal
   - Email: nnvc9295@gmail.com
   - Name: Test Applicant

2. Login as staff and approve

3. Login as secretary
4. Go to "My Assignments"
5. Click on the request
6. Click "Send Back"
7. Add comment: "Please verify the address"
8. Click "Confirm"

**Expected Results:**
- ✅ Request status changes to "returned"
- ✅ Backend console shows: `📧 Email sent to nnvc9295@gmail.com: RETURNED`
- ✅ Backend console shows: `📧 Email sent to staff@example.com: RESUBMITTED`
- ✅ Applicant receives "Request Sent Back" email
- ✅ Staff receives "Request Resubmitted" email
- ✅ Request appears in staff's "My Assignments" again

### Test Case 5: Captain Sends Back to Start

**Steps:**
1. Submit and approve through staff and secretary
2. Login as captain
3. Go to "My Assignments"
4. Click on the request
5. Click "Send Back to Start"
6. Add comment: "Needs complete review"
7. Click "Confirm"

**Expected Results:**
- ✅ Request status changes to "staff_review"
- ✅ Applicant receives "Request Sent Back" email
- ✅ Staff receives "Request Resubmitted" email
- ✅ Request appears in staff's "My Assignments"

### Test Case 6: Releasing Team Sends Back

**Steps:**
1. Submit and approve through all steps to releasing
2. Login as releasing team
3. Go to "My Assignments"
4. Click on the request
5. Click "Send Back to Start"
6. Add comment: "Missing signature"
7. Click "Confirm"

**Expected Results:**
- ✅ Request goes back to staff review
- ✅ Applicant receives "Request Sent Back" email
- ✅ Staff receives "Request Resubmitted" email

## Email Content Details

### REJECTED Email Template

**English Section:**
```
Update on Your Request

Unfortunately, your request has been rejected for the following reason:

[Comments from approver]

Reference Number: [REF-NUMBER]
Name: [APPLICANT-NAME]
Certificate: [CERTIFICATE-TYPE]
```

**Tagalog Section:**
```
Balita tungkol sa Iyong Request

Paumanhin, ang iyong request ay tinanggihan dahil sa sumusunod na dahilan:

[Comments in original language]

Reference Number: [REF-NUMBER]
Pangalan: [APPLICANT-NAME]
Sertipiko: [CERTIFICATE-TYPE]
```

### RETURNED Email Template

**English Section:**
```
Correction Needed

Your request has been sent back for corrections. Please review 
the comments and resubmit.

[Comments from approver]

Reference Number: [REF-NUMBER]
Name: [APPLICANT-NAME]
Certificate: [CERTIFICATE-TYPE]
```

**Tagalog Section:**
```
Kailangang Itama

Ang iyong request ay ibinalik para sa mga pagtatama. Pakisuyong 
basahin ang mga komento at isumite itong muli.

[Comments in original language]

Reference Number: [REF-NUMBER]
Pangalan: [APPLICANT-NAME]
Sertipiko: [CERTIFICATE-TYPE]
```

### RESUBMITTED Email Template (Staff)

**English Section:**
```
Updated Request Received

An applicant has resubmitted their request with the requested changes.

Reference Number: [REF-NUMBER]
Applicant: [APPLICANT-NAME]
Certificate: [CERTIFICATE-TYPE]

Previous Comments: [COMMENTS]
```

**Tagalog Section:**
```
Natanggap ang Na-update na Request

Muling isinumite ng aplikante ang kanilang request na may mga 
hinihinging pagbabago.

Reference Number: [REF-NUMBER]
Aplikante: [APPLICANT-NAME]
Sertipiko: [CERTIFICATE-TYPE]

Nakaraang Komento: [COMMENTS]
```

## Backend Console Logs

When rejection or send back happens, you should see:

**For Rejection:**
```
[WORKFLOW-ASSIGNMENT] Processing action: reject for assignment ID: 123
[WORKFLOW-ASSIGNMENT] Certificate found: BC-2024-12345, Current status: secretary_approval
📧 Email sent to applicant@example.com: REJECTED
✅ Email notifications processed for BC-2024-12345
```

**For Send Back:**
```
[WORKFLOW-ASSIGNMENT] Processing action: return for assignment ID: 123
[WORKFLOW-ASSIGNMENT] Certificate found: BC-2024-12345, Current status: secretary_approval
📧 Email sent to applicant@example.com: RETURNED
📧 Email sent to staff@example.com: RESUBMITTED
✅ Email notifications processed for BC-2024-12345
```

## Troubleshooting

### Applicant Not Receiving Rejection Email

**Check 1: Applicant Has Email?**
```sql
SELECT email FROM certificate_requests WHERE id = 'request-id';
SELECT email FROM residents WHERE id = 'resident-id';
```

**Check 2: Backend Logs?**
Look for:
```
📧 Email sent to applicant@example.com: REJECTED
```

If you see:
```
⚠️ Email failed: ...
```
Check the error message.

### Staff Not Receiving Resubmission Email

**Check 1: Staff Assigned?**
```sql
SELECT * FROM workflow_assignments 
WHERE request_id = 'request-id' 
AND status = 'pending';
```

**Check 2: Staff Has Email?**
```sql
SELECT email FROM users WHERE _id = 'staff-user-id';
```

**Check 3: Backend Logs?**
Look for:
```
📧 Email sent to staff@example.com: RESUBMITTED
```

### Comments Not Showing in Email

**Problem:** Comments field is empty

**Solution:** Always add comments when rejecting or sending back:
1. Click "Reject" or "Send Back"
2. Type reason in the comments box
3. Click "Confirm"

The comments will be included in the email.

## Email Notification Summary

| Action | Applicant Email | Staff Email | Event Type |
|--------|----------------|-------------|------------|
| **Reject** | ✅ Yes | ❌ No | REJECTED |
| **Send Back** | ✅ Yes | ✅ Yes | RETURNED + RESUBMITTED |
| **Send Back to Start** | ✅ Yes | ✅ Yes | RETURNED + RESUBMITTED |

## Complete Workflow Email Map

```
Submit → Applicant (RECEIVED) + Staff (SUBMITTED)
   ↓
Approve → Next Approver (APPROVED_STEP)
   ↓
Approve → Next Approver (APPROVED_STEP)
   ↓
Approve → Next Approver (APPROVED_STEP)
   ↓
Ready → Applicant (READY_FOR_PICKUP)

Alternative Paths:
   ↓
Reject → Applicant (REJECTED)
   ↓
Send Back → Applicant (RETURNED) + Staff (RESUBMITTED)
```

## Quick Test Commands

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser: Test rejection
1. Submit request with email: nnvc9295@gmail.com
2. Login as staff
3. Reject with comment: "Test rejection"
4. Check email inbox

# Browser: Test send back
1. Submit request with email: nnvc9295@gmail.com
2. Login as staff and approve
3. Login as secretary
4. Send back with comment: "Test send back"
5. Check email inbox (applicant + staff)
```

## Success Indicators

✅ Rejection sends email to applicant
✅ Rejection email includes comments
✅ Send back sends email to applicant
✅ Send back sends email to reassigned staff
✅ Send back email includes comments
✅ Backend console shows email logs
✅ Emails have proper formatting
✅ Emails are bilingual
✅ Request status updates correctly

## Files Modified

1. ✅ `frontend/pages/api/workflow-assignments/[id]/status.js` - Enhanced rejection and send back notifications

## Related Documentation

- `EMAIL_NOTIFICATIONS_COMPLETE.md` - Complete email system overview
- `EMAIL_NOTIFICATION_TESTING.md` - General testing guide
- `EMAIL_SETUP_COMPLETE.md` - Initial setup guide

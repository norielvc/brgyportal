# In-App Notifications - Verification Checklist ✅

## Implementation Status: COMPLETE

All code has been written and is ready for testing. Use this checklist to verify everything works.

---

## Pre-Testing Setup

### ☐ Step 1: Create Database Table
```sql
-- Run this in Supabase SQL Editor
-- Copy entire content from CREATE_NOTIFICATIONS_TABLE.sql
```

**Verify:**
```sql
SELECT * FROM notifications LIMIT 1;
-- Should return empty result (no error)
```

### ☐ Step 2: Restart Frontend Server
```bash
cd frontend
# Stop current server (Ctrl+C)
npm run dev
```

**Verify:**
- Server starts without errors
- No console errors about notifications

### ☐ Step 3: Verify Backend Running
```bash
# Backend should be running on port 5005
curl http://localhost:5005/api/health
```

---

## Testing Checklist

### Test 1: Portal Submission Notifications

#### ☐ Submit Certificate Request
1. Go to: `http://localhost:3000/demo`
2. Click "Request Certificate" on Barangay Clearance
3. Fill form with valid data
4. Submit request

#### ☐ Verify Staff Notification
1. Login as staff user
2. Look at notification bell (top right)
3. **Expected:** Red dot or number badge showing unread count
4. Click bell icon
5. **Expected:** See "New Request Assigned" notification
6. **Verify:**
   - ✅ Title: "New Request Assigned"
   - ✅ Message includes reference number
   - ✅ Message includes applicant name
   - ✅ Blue dot on left (unread indicator)
   - ✅ Time ago display ("Just now")
   - ✅ Icon: 📢

#### ☐ Verify Notification Click
1. Click on the notification
2. **Expected:**
   - ✅ Navigates to requests page
   - ✅ Blue dot disappears (marked as read)
   - ✅ Unread count decreases

#### ☐ Verify Database Entry
```sql
SELECT * FROM notifications 
WHERE category = 'assignment'
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** Recent notification with correct data

---

### Test 2: Staff Approval Notifications

#### ☐ Staff Approves Request
1. Login as staff
2. Go to "My Assignments"
3. Click on a request
4. Click "Verify & Forward"

#### ☐ Verify Secretary Notification
1. Login as secretary
2. Check notification bell
3. **Expected:** Unread count increased
4. Click bell
5. **Expected:** See "Request Waiting for You" notification
6. **Verify:**
   - ✅ Title: "Request Waiting for You"
   - ✅ Message includes reference number
   - ✅ Message includes applicant name
   - ✅ Blue dot (unread)
   - ✅ Icon: 📢

---

### Test 3: Secretary Approval Notifications

#### ☐ Secretary Approves Request
1. Login as secretary
2. Approve the request

#### ☐ Verify Captain Notification
1. Login as captain
2. Check notification bell
3. **Expected:** See "Request Waiting for You" notification

---

### Test 4: Captain Approval Notifications

#### ☐ Captain Approves Request
1. Login as captain
2. Approve the request

#### ☐ Verify Releasing Team Notification
1. Login as releasing team user
2. Check notification bell
3. **Expected:** See "Request Waiting for You" notification

---

### Test 5: Ready for Pickup Notifications

#### ☐ Mark Request as Ready
1. Login as releasing team
2. Click "Set as Ready"

#### ☐ Verify Applicant Notification (if applicable)
1. If applicant has user account, login as applicant
2. Check notification bell
3. **Expected:** See "Certificate Ready!" notification
4. **Verify:**
   - ✅ Title: "Certificate Ready!"
   - ✅ Message includes reference number
   - ✅ Green checkmark icon: ✅
   - ✅ Type: success (green background)

---

### Test 6: Rejection Notifications

#### ☐ Reject a Request
1. Submit new request
2. Login as staff
3. Click "Mark as Ineligible"
4. Add comment: "Missing valid ID"
5. Submit

#### ☐ Verify Applicant Notification (if applicable)
1. If applicant has user account, login as applicant
2. Check notification bell
3. **Expected:** See "Request Rejected" notification
4. **Verify:**
   - ✅ Title: "Request Rejected"
   - ✅ Message includes reference number
   - ✅ Message includes reason
   - ✅ Red X icon: ❌
   - ✅ Type: error (red background)

---

### Test 7: Send Back Notifications

#### ☐ Send Back a Request
1. Submit new request
2. Approve as staff
3. Login as secretary
4. Click "Send Back"
5. Add comment: "Please correct address"
6. Submit

#### ☐ Verify Applicant Notification (if applicable)
1. If applicant has user account, login as applicant
2. Check notification bell
3. **Expected:** See "Corrections Needed" notification
4. **Verify:**
   - ✅ Title: "Corrections Needed"
   - ✅ Message includes reference number
   - ✅ Message includes comments
   - ✅ Warning icon: ⚠️
   - ✅ Type: warning (yellow background)

#### ☐ Verify Staff Notification
1. Login as staff
2. Check notification bell
3. **Expected:** See "Request Resubmitted" notification

---

### Test 8: Mark All as Read

#### ☐ Test Mark All as Read
1. Login as user with multiple unread notifications
2. Click notification bell
3. Click "Mark all read" button
4. **Expected:**
   - ✅ All blue dots disappear
   - ✅ Unread count becomes 0
   - ✅ Notifications stay in list but marked as read

---

### Test 9: Auto-Refresh

#### ☐ Test Auto-Refresh
1. Login as staff user
2. Keep dashboard open
3. In another browser/incognito, submit a new request
4. Wait 30 seconds
5. **Expected:**
   - ✅ Unread count updates automatically
   - ✅ New notification appears in dropdown

---

### Test 10: Console Logs

#### ☐ Verify Console Logs
Check backend console for these logs:

**Portal Submission:**
```
📧 Confirmation email sent to applicant@example.com
📧 Assignment email sent to staff@example.com
🔔 In-app notification created for staff staff-user-id
🔔 In-app notification created for applicant applicant-user-id
```

**Workflow Actions:**
```
📧 Email sent to next-approver@example.com: APPROVED_STEP
🔔 Notification created for user next-approver-user-id
```

**Rejection:**
```
📧 Email sent to applicant@example.com: REJECTED
🔔 Notification created for user applicant-user-id
```

**Send Back:**
```
📧 Email sent to applicant@example.com: RETURNED
🔔 Notification created for user applicant-user-id
📧 Email sent to staff@example.com: RESUBMITTED
🔔 Notification created for user staff-user-id
```

---

## Database Verification

### ☐ Check Notifications Created
```sql
SELECT 
  id,
  title,
  message,
  type,
  category,
  reference_number,
  read,
  created_at
FROM notifications
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 20;
```

**Expected:** See all notifications created during testing

### ☐ Check Unread Counts
```sql
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE tenant_id = 'your-tenant-id'
  AND read = false
GROUP BY user_id;
```

**Expected:** Correct unread counts per user

### ☐ Check Categories
```sql
SELECT 
  category,
  COUNT(*) as count
FROM notifications
WHERE tenant_id = 'your-tenant-id'
GROUP BY category;
```

**Expected Categories:**
- `assignment` - Staff assignments
- `request_submitted` - Portal submissions
- `request_ready` - Ready for pickup
- `request_rejected` - Rejections
- `request_returned` - Send backs

---

## Common Issues & Solutions

### Issue: No notifications showing
**Solution:**
1. Check table exists: `SELECT * FROM notifications LIMIT 1;`
2. Restart frontend server
3. Check browser console for errors
4. Verify user is logged in

### Issue: Notifications not creating
**Solution:**
1. Check backend logs for errors
2. Verify user IDs are correct
3. Check database permissions (RLS policies)
4. Verify tenant_id is correct

### Issue: Unread count not updating
**Solution:**
1. Refresh page
2. Wait 30 seconds for auto-refresh
3. Check browser console for API errors

### Issue: Click not navigating
**Solution:**
1. Check notification has valid `link` field
2. Check browser console for navigation errors

---

## Success Criteria

All tests pass when:

✅ Notifications appear in bell dropdown
✅ Unread count badge shows correct number
✅ Click notification navigates to correct page
✅ Click notification marks as read
✅ Mark all as read works
✅ Auto-refresh works (30 seconds)
✅ Icons and colors are correct
✅ Time ago displays correctly
✅ Reference numbers show correctly
✅ Database entries are correct
✅ Console logs show notification creation
✅ Both email and in-app notifications sent

---

## Files to Review

If issues occur, check these files:

1. `CREATE_NOTIFICATIONS_TABLE.sql` - Database schema
2. `frontend/pages/api/notifications/index.js` - Fetch/create API
3. `frontend/pages/api/notifications/[id]/read.js` - Mark as read
4. `frontend/pages/api/notifications/all/read.js` - Mark all as read
5. `frontend/src/components/Layout/Header.js` - UI component
6. `frontend/pages/api/workflow-assignments/[id]/status.js` - Workflow notifications
7. `frontend/pages/api/portal/submit.js` - Portal submission notifications

---

## Next Steps After Testing

Once all tests pass:

1. ☐ Document any issues found
2. ☐ Test with real users
3. ☐ Monitor notification creation in production
4. ☐ Consider adding notification preferences
5. ☐ Consider adding push notifications
6. ☐ Set up notification cleanup (delete old read notifications)

---

## Summary

The in-app notification system is complete and ready for testing. Follow this checklist to verify all functionality works correctly. If any test fails, refer to the troubleshooting section or check the relevant files.

**Status:** ✅ READY FOR TESTING
**Last Updated:** April 15, 2026

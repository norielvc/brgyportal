# In-App Notifications System - ACTIVATED ✅

## Overview

The in-app notification system is now fully activated and works alongside email notifications. Users receive real-time notifications in the dashboard for all workflow activities.

## Features

✅ Real-time in-app notifications
✅ Unread count badge
✅ Auto-refresh every 30 seconds
✅ Mark as read functionality
✅ Mark all as read
✅ Click to navigate to request
✅ Visual indicators (icons, colors)
✅ Time ago display
✅ Reference number display
✅ Notification categories

## Database Setup

### Step 1: Create Notifications Table

Run this SQL in your Supabase SQL editor:

```sql
-- See CREATE_NOTIFICATIONS_TABLE.sql for complete schema
```

Or run:
```bash
# Copy the SQL file content and execute in Supabase
cat CREATE_NOTIFICATIONS_TABLE.sql
```

## Notification Flow

```
Portal Submission
       ↓
   [RECEIVED]
       ↓
   ┌─────────────────────────────────┐
   │                                 │
   ↓                                 ↓
Applicant Notification        Staff Notification
"Request Received"       "New Request Assigned"
       
       ↓
       
Staff Approves
       ↓
   [APPROVED_STEP]
       ↓
Secretary Notification
"Request Waiting for You"

       ↓
       
Secretary Approves
       ↓
   [APPROVED_STEP]
       ↓
Captain Notification
"Request Waiting for You"

       ↓
       
Captain Approves
       ↓
   [APPROVED_STEP]
       ↓
Releasing Team Notification
"Request Waiting for You"

       ↓
       
Mark as Ready
       ↓
   [READY_FOR_PICKUP]
       ↓
Applicant Notification
"Certificate Ready!"

Alternative Paths:
       ↓
Reject → Applicant Notification
"Request Rejected"
       ↓
Send Back → Applicant + Staff Notifications
"Corrections Needed" + "Request Resubmitted"
```

## Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `info` | 📢 | Blue | Assignments, updates |
| `success` | ✅ | Green | Approvals, ready |
| `warning` | ⚠️ | Yellow | Corrections needed |
| `error` | ❌ | Red | Rejections |

## Notification Categories

| Category | Description |
|----------|-------------|
| `request_submitted` | New request submitted |
| `assignment` | New assignment or task |
| `request_approved` | Request approved |
| `request_rejected` | Request rejected |
| `request_returned` | Request sent back |
| `request_ready` | Certificate ready |

## API Endpoints

### GET /api/notifications
Get user's notifications

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 50)
- `unreadOnly` (optional): true/false

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Request Waiting for You",
      "message": "Request BC-2024-12345 from Juan Dela Cruz requires your approval.",
      "type": "info",
      "category": "assignment",
      "reference_number": "BC-2024-12345",
      "request_id": "request-uuid",
      "link": "/requests/request-uuid",
      "read": false,
      "created_at": "2024-04-15T10:30:00Z"
    }
  ],
  "unreadCount": 5
}
```

### POST /api/notifications
Create a notification (system use)

**Body:**
```json
{
  "targetUserId": "user-id",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "category": "assignment",
  "referenceNumber": "BC-2024-12345",
  "requestId": "request-uuid",
  "link": "/requests/request-uuid"
}
```

### PUT /api/notifications/[id]/read
Mark notification as read

### PUT /api/notifications/all/read
Mark all notifications as read

## UI Components

### Header Notification Bell
- Shows unread count badge
- Dropdown with latest 10 notifications
- Auto-refreshes every 30 seconds
- Click notification to navigate
- Mark as read on click
- Mark all as read button

### Notification Item
- Icon based on type
- Title and message
- Reference number (if applicable)
- Time ago display
- Unread indicator (blue dot)
- Click to navigate and mark as read

## Testing

### Step 1: Create Notifications Table
```sql
-- Run CREATE_NOTIFICATIONS_TABLE.sql in Supabase
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Workflow
1. **Submit Request:**
   - Go to portal
   - Submit certificate request
   - Login as staff
   - Check notification bell (should have 1 unread)
   - Click notification → navigates to request

2. **Approve Request:**
   - Click "Verify & Forward"
   - Login as secretary
   - Check notification bell (should have 1 unread)
   - Click notification → navigates to request

3. **Continue Workflow:**
   - Approve as secretary
   - Login as captain
   - Check notification bell
   - Continue through workflow

4. **Test Rejection:**
   - Submit new request
   - Login as staff
   - Reject with comment
   - Check applicant notification (if they have account)

5. **Test Send Back:**
   - Submit new request
   - Approve as staff
   - Login as secretary
   - Send back with comment
   - Check applicant notification
   - Check staff notification

## Notification Examples

### Assignment Notification
```
Title: Request Waiting for You
Message: Request BC-2024-12345 from Juan Dela Cruz requires your approval.
Type: info
Icon: 📢
Reference: BC-2024-12345
Link: /requests/request-uuid
```

### Ready Notification
```
Title: Certificate Ready!
Message: Your certificate BC-2024-12345 is ready for pickup at the Barangay Hall.
Type: success
Icon: ✅
Reference: BC-2024-12345
Link: /track/BC-2024-12345
```

### Rejection Notification
```
Title: Request Rejected
Message: Your request BC-2024-12345 has been rejected. Reason: Missing valid ID
Type: error
Icon: ❌
Reference: BC-2024-12345
Link: /track/BC-2024-12345
```

### Return Notification
```
Title: Corrections Needed
Message: Your request BC-2024-12345 needs corrections. Comments: Please correct address
Type: warning
Icon: ⚠️
Reference: BC-2024-12345
Link: /track/BC-2024-12345
```

## Files Created/Modified

### New Files
1. ✅ `CREATE_NOTIFICATIONS_TABLE.sql` - Database schema
2. ✅ `frontend/pages/api/notifications/index.js` - Notifications API
3. ✅ `frontend/pages/api/notifications/[id]/read.js` - Mark as read API
4. ✅ `frontend/src/lib/notificationHelper.js` - Helper functions

### Modified Files
1. ✅ `frontend/src/components/Layout/Header.js` - Real notification fetching
2. ✅ `frontend/pages/api/workflow-assignments/[id]/status.js` - Create notifications on workflow actions

## Troubleshooting

### No Notifications Showing

**Check 1: Table Exists?**
```sql
SELECT * FROM notifications LIMIT 1;
```

**Check 2: API Working?**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/notifications
```

**Check 3: Browser Console**
Look for errors in browser console (F12)

### Notifications Not Creating

**Check 1: Backend Logs**
Look for:
```
🔔 Notification created for user user-id
```

**Check 2: Database Permissions**
Verify RLS policies allow inserts

**Check 3: User ID Correct?**
```sql
SELECT _id FROM users WHERE email = 'user@example.com';
```

### Unread Count Not Updating

**Solution:** Refresh page or wait 30 seconds for auto-refresh

### Click Not Navigating

**Check:** Notification has valid `link` field
```sql
SELECT id, link FROM notifications WHERE id = 'notification-id';
```

## Auto-Refresh

Notifications auto-refresh every 30 seconds:
```javascript
useEffect(() => {
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

To change refresh interval, modify the `30000` (milliseconds).

## Notification vs Email

| Feature | In-App Notification | Email |
|---------|-------------------|-------|
| **Delivery** | Instant (when logged in) | Instant (always) |
| **Persistence** | Stored in database | Stored in email inbox |
| **Read Status** | Tracked | Not tracked |
| **Navigation** | Click to navigate | Click link in email |
| **Offline** | Not received | Received |
| **Bilingual** | No | Yes |

## Best Practices

1. **Always create both** email and in-app notifications
2. **Use appropriate types** (info, success, warning, error)
3. **Include reference numbers** for tracking
4. **Provide navigation links** for quick access
5. **Keep messages concise** (under 100 characters)
6. **Use consistent categories** for filtering

## Production Considerations

1. **Notification Cleanup**: Delete old read notifications after 30 days
2. **Rate Limiting**: Prevent notification spam
3. **Push Notifications**: Consider adding browser push notifications
4. **Mobile App**: Extend to mobile push notifications
5. **Notification Preferences**: Allow users to configure notification types
6. **Batch Notifications**: Group similar notifications
7. **Real-time Updates**: Consider WebSocket for instant updates

## Summary

The in-app notification system is now fully functional and works alongside email notifications. Users receive real-time updates in the dashboard for all workflow activities:

✅ Portal submission → Staff notified
✅ Approval → Next approver notified
✅ Ready → Applicant notified
✅ Rejection → Applicant notified
✅ Send back → Applicant + Staff notified

All notifications are stored in the database, tracked for read status, and auto-refresh every 30 seconds.

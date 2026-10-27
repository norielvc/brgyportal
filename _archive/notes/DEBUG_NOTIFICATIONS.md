# Debug: Staff Not Receiving In-App Notifications

## Issue
Staff in review team are not receiving in-app notifications when a certificate request is submitted from the portal.

## Changes Made

1. ✅ Fixed user ID field name in fallback query (`id` → `_id`)
2. ✅ Added detailed console logging to track notification creation
3. ✅ Added error handling and logging for notification inserts

## How to Debug

### Step 1: Check Backend Console Logs

When you submit a certificate request, watch the frontend console (where `npm run dev` is running) for these logs:

```
📋 Staff User IDs to notify: ['user-id-1', 'user-id-2']
👥 Found 2 staff users to notify
📤 Notifying staff: John Doe (user-id-1)
📧 Assignment email sent to john@example.com
🔔 Creating notification for user user-id-1: { tenant_id: '...', user_id: '...', ... }
✅ In-app notification created for staff user-id-1
```

**If you see:**
- `👥 Found 0 staff users to notify` → Staff user IDs don't match users in database
- `❌ Error querying staff users:` → Database query error
- `❌ In-app notification failed for user-id:` → Notification insert error

### Step 2: Verify Notifications Table Exists

Run this in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT * FROM notifications LIMIT 1;
```

**Expected:** Empty result or existing notifications (no error)
**If error:** Run `CREATE_NOTIFICATIONS_TABLE.sql` first

### Step 3: Check Staff User IDs

Run this in Supabase SQL Editor:

```sql
-- Get staff users for your tenant
SELECT _id, email, first_name, last_name, role, tenant_id
FROM users
WHERE tenant_id = 'YOUR_TENANT_ID'
  AND role IN ('admin', 'staff', 'secretary', 'captain')
ORDER BY role, first_name;
```

**Expected:** List of staff users with their `_id` values

### Step 4: Check Workflow Configuration

Run this in Supabase SQL Editor:

```sql
-- Check workflow config for barangay_clearance
SELECT 
  certificate_type,
  workflow_config->'steps'->0->'assignedUsers' as first_step_users
FROM workflow_configurations
WHERE tenant_id = 'YOUR_TENANT_ID'
  AND certificate_type = 'barangay_clearance';
```

**Expected:** Array of user IDs like `["user-id-1", "user-id-2"]`

**If empty or null:** The workflow config doesn't have assigned users, so it will use the fallback (all admin/staff users)

### Step 5: Manually Test Notification Insert

Run this in Supabase SQL Editor:

```sql
-- Insert a test notification
INSERT INTO notifications (
  tenant_id,
  user_id,
  title,
  message,
  type,
  category,
  reference_number,
  link,
  read
) VALUES (
  'YOUR_TENANT_ID',
  'YOUR_USER_ID',  -- Use your own user ID from Step 3
  'Test Notification',
  'This is a test notification',
  'info',
  'assignment',
  'TEST-2026-12345',
  '/requests',
  false
);

-- Check if it was inserted
SELECT * FROM notifications 
WHERE reference_number = 'TEST-2026-12345';
```

**Expected:** Notification inserted successfully

**If error:** Check the error message for clues (foreign key constraint, RLS policy, etc.)

### Step 6: Check RLS Policies

Run this in Supabase SQL Editor:

```sql
-- Check RLS policies on notifications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications';
```

**Expected:** Should see policies including "System can insert notifications" with `with_check = true`

### Step 7: Test with Service Role Key

The portal API uses the service role key which should bypass RLS. Verify this in `frontend/.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**If missing:** Add the service role key from Supabase Dashboard → Settings → API

## Common Issues & Solutions

### Issue 1: Staff User IDs Don't Match

**Symptom:** `👥 Found 0 staff users to notify`

**Cause:** Workflow config has user IDs that don't exist in users table

**Solution:**
```sql
-- Update workflow config with correct user IDs
UPDATE workflow_configurations
SET workflow_config = jsonb_set(
  workflow_config,
  '{steps,0,assignedUsers}',
  '["correct-user-id-1", "correct-user-id-2"]'::jsonb
)
WHERE tenant_id = 'YOUR_TENANT_ID'
  AND certificate_type = 'barangay_clearance';
```

### Issue 2: Notifications Table Doesn't Exist

**Symptom:** `relation "notifications" does not exist`

**Solution:** Run `CREATE_NOTIFICATIONS_TABLE.sql` in Supabase SQL Editor

### Issue 3: RLS Policy Blocking Inserts

**Symptom:** `new row violates row-level security policy`

**Solution:** The service role key should bypass RLS, but if not:
```sql
-- Drop and recreate the insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);
```

### Issue 4: Foreign Key Constraint Error

**Symptom:** `violates foreign key constraint "notifications_tenant_id_fkey"`

**Solution:** The tenant_id doesn't exist in tenants table. Check:
```sql
SELECT id, name FROM tenants WHERE id = 'YOUR_TENANT_ID';
```

### Issue 5: User ID Field Mismatch

**Symptom:** Notifications created but not showing for user

**Cause:** `user_id` in notification doesn't match `_id` in users table

**Solution:** Already fixed in the code update. Restart frontend server.

## Testing After Fixes

1. **Restart Frontend Server**
   ```bash
   cd frontend
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Submit Test Request**
   - Go to portal: `http://localhost:3000/demo`
   - Submit a certificate request
   - Watch console logs

3. **Check Staff Notification**
   - Login as staff user
   - Look at notification bell (should have red dot/count)
   - Click bell to see notification

4. **Verify in Database**
   ```sql
   SELECT * FROM notifications 
   WHERE tenant_id = 'YOUR_TENANT_ID'
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## Still Not Working?

If notifications still don't appear after following all steps:

1. **Check browser console** (F12) for JavaScript errors
2. **Check frontend server console** for the detailed logs we added
3. **Check Supabase logs** in Dashboard → Logs
4. **Verify Header component** is fetching notifications:
   ```javascript
   // Should see this in browser console
   console.log('Fetching notifications...');
   ```

5. **Test the API directly**:
   ```bash
   # Get auth token from browser localStorage
   # Then test API
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/notifications
   ```

## Summary of Code Changes

### File: `frontend/pages/api/portal/submit.js`

1. Changed `u.id` to `u._id` in fallback query
2. Added detailed console logging
3. Added error handling for notification inserts
4. Added `.select()` to notification insert to get result

These changes will help identify exactly where the notification creation is failing.

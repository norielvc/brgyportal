# Standard Plan Feature Lock Verification Guide

## Current Implementation Status

### ✅ Code Implementation (VERIFIED)

The code is correctly implemented across all files:

#### 1. Subscription API (`/api/subscription/usage`)
- Returns `planId` from `barangay_subscriptions.plan_id` column
- Fallback to 'starter' if no subscription exists
- Returns subscription data including plan details

#### 2. Sidebar Lock Logic (`Sidebar.js`)
```javascript
// Pro Plan Check (QR Scanner)
const isProPlan = subscription?.planId === "pro" || subscription?.requests?.total === -1;

// Starter Plan Check (Facilities/Programs/Achievements)
const isStarterPlan = subscription?.planId === "starter";

// Standard+ Access Check
const canAccessStarterLocked = subscription?.planId === "standard" || isProPlan;
```

**Lock Behavior:**
- QR Scanner: Locked if `!isProPlan` (requires Pro)
- Facilities/Programs/Achievements: Locked if `!canAccessStarterLocked` (requires Standard or Pro)

#### 3. Page-Level Protection
All three pages (facilities.js, programs.js, achievements.js) have:
```javascript
const isStarterPlan = json.data.planId === "starter";
if (isStarterPlan) {
  window.location.href = "/dashboard?upgrade=<feature>";
}
```

## How to Verify Standard Plan is Working

### Step 1: Check Database Subscription Record

Run this query in your Supabase SQL editor:

```sql
SELECT 
  bs.barangay_id,
  bs.plan_id,
  bs.status,
  t.name as tenant_name
FROM barangay_subscriptions bs
LEFT JOIN tenants t ON t.id = bs.barangay_id
WHERE bs.barangay_id = 'demo';
```

**Expected Result for "Demo Barangay":**
- `plan_id` should be `'standard'` (lowercase)
- `status` should be `'active'`

**If plan_id is NOT 'standard'**, update it:
```sql
UPDATE barangay_subscriptions
SET plan_id = 'standard'
WHERE barangay_id = 'demo';
```

### Step 2: Test in Browser

1. **Login as Demo Barangay user** (Standard plan)

2. **Open Browser DevTools** (F12)

3. **Check Subscription API Response:**
   - Go to Network tab
   - Navigate to any page in the dashboard
   - Find the request to `/api/subscription/usage`
   - Check the response:
   ```json
   {
     "success": true,
     "data": {
       "planName": "Standard",
       "planId": "standard",  // ← MUST be "standard"
       "requests": { "used": X, "total": 2000 },
       "staff": { "used": Y, "total": 9 }
     }
   }
   ```

4. **Test Sidebar Access:**
   - QR Scanner menu items should show 🔒 lock icon (Pro only)
   - Facilities, Programs, Achievements should NOT show lock icon
   - Click on Facilities → should load the page (no redirect)
   - Click on Programs → should load the page (no redirect)
   - Click on Achievements → should load the page (no redirect)
   - Click on QR Scanner → should show upgrade modal

5. **Test Direct URL Access:**
   - Navigate to: `/facilities`
   - Should load successfully (no redirect to dashboard)
   - Navigate to: `/programs`
   - Should load successfully (no redirect to dashboard)
   - Navigate to: `/achievements`
   - Should load successfully (no redirect to dashboard)
   - Navigate to: `/mobile-qr-scanner`
   - Should redirect to dashboard with upgrade message

### Step 3: Test with Starter Plan

To verify the lock is working for Starter plan:

1. **Temporarily change Demo Barangay to Starter:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'starter'
WHERE barangay_id = 'demo';
```

2. **Refresh browser and test:**
   - Facilities, Programs, Achievements should show 🔒 lock icon in sidebar
   - Clicking them should show upgrade modal
   - Direct URL access should redirect to dashboard
   - QR Scanner should also show lock icon

3. **Change back to Standard:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'standard'
WHERE barangay_id = 'demo';
```

## Common Issues & Solutions

### Issue 1: Features Still Locked on Standard Plan

**Possible Causes:**
1. Database `plan_id` is not 'standard' (check with SQL query above)
2. Subscription API is returning wrong planId
3. Browser cache is showing old data

**Solutions:**
1. Verify database: `SELECT plan_id FROM barangay_subscriptions WHERE barangay_id = 'demo'`
2. Clear browser cache and localStorage
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check Network tab for actual API response

### Issue 2: Subscription API Returns 'starter' Instead of 'standard'

**Cause:** Database has wrong value or no record exists

**Solution:**
```sql
-- Check if record exists
SELECT * FROM barangay_subscriptions WHERE barangay_id = 'demo';

-- If exists, update it
UPDATE barangay_subscriptions
SET plan_id = 'standard', status = 'active'
WHERE barangay_id = 'demo';

-- If doesn't exist, insert it
INSERT INTO barangay_subscriptions (barangay_id, plan_id, status, current_period_start, current_period_end)
VALUES (
  'demo',
  'standard',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
);
```

### Issue 3: Sidebar Shows Lock Icon for Standard Features

**Cause:** `canAccessStarterLocked` logic is not evaluating correctly

**Debug Steps:**
1. Add console.log in Sidebar.js:
```javascript
console.log('Subscription:', subscription);
console.log('Plan ID:', subscription?.planId);
console.log('Is Starter:', isStarterPlan);
console.log('Can Access Starter Locked:', canAccessStarterLocked);
```

2. Check browser console for these values
3. Verify `subscription?.planId === "standard"` returns true

## Feature Lock Summary

| Feature | Starter | Standard | Pro |
|---------|---------|----------|-----|
| QR Scanner | 🔒 Locked | 🔒 Locked | ✅ Unlocked |
| Facilities | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Programs | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Achievements | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |

## Implementation Files

1. **Subscription API:** `frontend/pages/api/subscription/usage.js`
2. **Sidebar Logic:** `frontend/src/components/Layout/Sidebar.js`
3. **Page Protection:**
   - `frontend/pages/facilities.js`
   - `frontend/pages/programs.js`
   - `frontend/pages/achievements.js`
4. **QR Scanner Pages:**
   - `frontend/pages/mobile-qr-scanner.js`
   - `frontend/pages/qr-scan-history.js`

## Next Steps

1. Run the SQL query to check Demo Barangay's plan_id
2. Update to 'standard' if needed
3. Test in browser following Step 2 above
4. Verify all features are accessible
5. Report back with results

If Standard plan is still not working after these steps, provide:
- Screenshot of SQL query result
- Screenshot of `/api/subscription/usage` response from Network tab
- Screenshot of browser console logs
- Description of what happens when you click Facilities/Programs/Achievements

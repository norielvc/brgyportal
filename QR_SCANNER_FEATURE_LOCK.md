# QR Scanner Feature Lock Implementation

## Overview
QR Scanner feature is now locked for Starter and Standard subscription plans. Only Pro plan users can access this feature.

---

## Changes Made

### 1. Sidebar Menu Lock ✅
**File:** `frontend/src/components/Layout/Sidebar.js`

**Changes:**
- Added `Lock` icon import from lucide-react
- Added `proOnly: true` flag to QR Scanner menu items
- Added subscription state fetching on component mount
- Added `isProPlan` check based on subscription data
- Modified child menu rendering to:
  - Show lock icon (🔒) for pro-only features
  - Disable click for locked features
  - Show alert message when clicked
  - Gray out locked menu items

**Visual Changes:**
- QR Scanner menu items show lock icon
- Locked items are grayed out (opacity 50%)
- Clicking shows: "This feature is only available in the Pro plan. Please upgrade to access QR Scanner features."

### 2. Mobile QR Scanner Page Protection ✅
**File:** `frontend/pages/mobile-qr-scanner.js`

**Changes:**
- Added subscription state and checking
- Added `checkSubscription()` function on page load
- Redirects to dashboard if not Pro plan
- Redirect URL: `/dashboard?upgrade=qr-scanner`

**Behavior:**
- Non-Pro users are immediately redirected
- Cannot access page even with direct URL
- Shows loading state while checking subscription

### 3. QR Scan History Page Protection ✅
**File:** `frontend/pages/qr-scan-history.js`

**Changes:**
- Added subscription state and checking
- Added subscription check in useEffect on mount
- Redirects to dashboard if not Pro plan
- Redirect URL: `/dashboard?upgrade=qr-scanner`

**Behavior:**
- Non-Pro users are immediately redirected
- Cannot access page even with direct URL
- Shows loading state while checking subscription

---

## How It Works

### Subscription Check Logic:
```javascript
// Fetch subscription data
const res = await fetch("/api/subscription/usage", {
  headers: { Authorization: `Bearer ${token}` },
});

// Check if Pro plan
const isProPlan = subscription.planId === "pro" || subscription.requests?.total === -1;

// Lock feature if not Pro
if (!isProPlan) {
  // Show lock icon or redirect
}
```

### Plan Detection:
- **Pro Plan:** `planId === "pro"` OR `requests.total === -1` (unlimited)
- **Starter/Standard:** Any other planId

---

## User Experience

### For Starter/Standard Plan Users:

**In Sidebar:**
- See "QR Scanner" menu with lock icon 🔒
- Menu items are grayed out
- Clicking shows upgrade message
- Cannot navigate to QR scanner pages

**Direct URL Access:**
- Typing `/mobile-qr-scanner` → Redirected to `/dashboard?upgrade=qr-scanner`
- Typing `/qr-scan-history` → Redirected to `/dashboard?upgrade=qr-scanner`

**Alert Message:**
```
This feature is only available in the Pro plan. 
Please upgrade to access QR Scanner features.
```

### For Pro Plan Users:

**In Sidebar:**
- See "QR Scanner" menu without lock icon
- Menu items are fully enabled
- Can click and navigate normally

**Page Access:**
- Full access to `/mobile-qr-scanner`
- Full access to `/qr-scan-history`
- All QR scanner features work normally

---

## Testing

### Test as Starter/Standard User:
1. Login with Starter or Standard plan account
2. Check sidebar - QR Scanner should show lock icon
3. Click QR Scanner menu items - should show alert
4. Try accessing `/mobile-qr-scanner` - should redirect to dashboard
5. Try accessing `/qr-scan-history` - should redirect to dashboard

### Test as Pro User:
1. Login with Pro plan account
2. Check sidebar - QR Scanner should NOT show lock icon
3. Click QR Scanner menu items - should navigate normally
4. Access `/mobile-qr-scanner` - should load page
5. Access `/qr-scan-history` - should load page
6. All QR scanner features should work

### Test Subscription API:
```bash
# Get subscription data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscription/usage

# Response should include:
{
  "success": true,
  "data": {
    "planId": "starter" | "standard" | "pro",
    "requests": {
      "total": 500 | 1000 | -1
    }
  }
}
```

---

## Database Setup

Ensure subscription plans are configured correctly:

```sql
-- Check subscription plans table
SELECT * FROM subscription_plans;

-- Expected plans:
-- starter: max_requests = 500
-- standard: max_requests = 1000  
-- pro: max_requests = -1 (unlimited)

-- Check barangay subscriptions
SELECT 
  bs.barangay_id,
  bs.plan_id,
  sp.name as plan_name,
  sp.max_requests
FROM barangay_subscriptions bs
JOIN subscription_plans sp ON bs.plan_id = sp.id
WHERE bs.status = 'active';
```

---

## Upgrade Flow (Future Enhancement)

When user clicks locked feature, they see alert. Future enhancement could:

1. Show upgrade modal instead of alert
2. Display plan comparison
3. Provide "Upgrade Now" button
4. Link to pricing page or contact admin

**Suggested Implementation:**
```javascript
// Instead of alert, show modal
if (isLocked) {
  e.preventDefault();
  setShowUpgradeModal(true);
  setLockedFeature("QR Scanner");
  return;
}
```

---

## API Endpoints Protected

The QR Scanner feature uses these API endpoints:

1. `/api/qr-scans` - GET (list scans), POST (create scan), DELETE (clear scans)
2. `/api/qr-scans/[id]` - DELETE (delete single scan)
3. `/api/qr-scans/stats` - GET (scan statistics)
4. `/api/qr-scans/duplicates` - GET (duplicate scans)
5. `/api/scan-events` - GET (list events), POST (create event)

**Note:** These API endpoints are NOT currently protected. Users could theoretically call them directly. For complete security, add subscription checks to these endpoints as well.

**Recommended API Protection:**
```javascript
// In each QR scan API endpoint
const { data: subscription } = await supabase
  .from('barangay_subscriptions')
  .select('*, plan:subscription_plans(*)')
  .eq('barangay_id', tenantId)
  .eq('status', 'active')
  .single();

const isProPlan = subscription?.plan?.id === 'pro' || subscription?.plan?.max_requests === -1;

if (!isProPlan) {
  return res.status(403).json({
    success: false,
    message: "QR Scanner feature requires Pro plan",
    code: "FEATURE_LOCKED"
  });
}
```

---

## Pricing Page Reference

The pricing page already lists QR Scanner as a Pro feature:

**File:** `frontend/pages/pricing.js`

**Pro Plan Features:**
- ✅ QR code scanner feature
- ✅ Analytics dashboard
- ✅ Bulk data export
- ✅ Custom domain
- ✅ Unlimited requests/month

**Starter/Standard Plans:**
- ❌ QR code scanner feature (not included)

---

## Summary

✅ **QR Scanner feature is now locked for Starter and Standard plans**

**Protection Levels:**
1. ✅ Sidebar menu shows lock icon
2. ✅ Menu items disabled with alert
3. ✅ Page-level redirects for direct URL access
4. ⚠️ API endpoints not yet protected (recommended)

**Affected Pages:**
- `/mobile-qr-scanner` - Locked
- `/qr-scan-history` - Locked

**Only accessible by:**
- Pro plan users
- Users with unlimited requests (requests.total === -1)

**User Experience:**
- Clear visual indication (lock icon)
- Helpful error message
- Automatic redirect to dashboard
- No broken pages or errors

---

**Status:** ✅ COMPLETE
**Files Modified:** 3
**Feature Lock:** Active
**Plan Required:** Pro

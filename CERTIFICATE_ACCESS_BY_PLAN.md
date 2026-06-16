# Certificate Access by Subscription Plan

## Implementation Summary

Updated the portal to ensure the 3 basic certificates AND portal sections (Facilities, Programs, Achievements) are accessible in Standard plan.

### Changes Made

**File:** `frontend/src/components/Portal/PortalPageContent.js`

**Updated Function:** `isFeatureLocked()`

```javascript
const isFeatureLocked = (featureKey) => {
  if (!subscription) return false; // Still loading
  
  // Pro plan bypass - all features unlocked
  if (subscription.planId === 'pro' || subscription.requests?.total === -1) {
    return false;
  }
  
  // Standard plan - basic 3 certificates + portal sections always unlocked
  const basicCertificates = ['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'];
  const standardFeatures = ['facilities', 'programs', 'achievements'];
  
  if (subscription.planId === 'standard') {
    if (basicCertificates.includes(featureKey) || standardFeatures.includes(featureKey)) {
      return false;
    }
  }
  
  // Check if featureKey is in the allowed list from database
  return subscription.features && !subscription.features.includes(featureKey);
};
```

## Portal Section Visibility Matrix

| Portal Section | Starter Plan | Standard Plan | Pro Plan |
|---------------|--------------|---------------|----------|
| **Facilities** | 🔒 Hidden | ✅ Visible | ✅ Visible |
| **Programs** | 🔒 Hidden | ✅ Visible | ✅ Visible |
| **Achievements** | 🔒 Hidden | ✅ Visible | ✅ Visible |
| News & Events | ✅ Visible | ✅ Visible | ✅ Visible |
| Officials | ✅ Visible | ✅ Visible | ✅ Visible |
| Contact Info | ✅ Visible | ✅ Visible | ✅ Visible |

## Certificate Access Matrix

| Certificate Type | Starter Plan | Standard Plan | Pro Plan |
|-----------------|--------------|---------------|----------|
| **Barangay Clearance** | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| **Certificate of Indigency** | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| **Barangay Residency** | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Business Permit | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Natural Death | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Barangay Guardianship | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Barangay Cohabitation | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Medico Legal | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Certification Same Person | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Educational Assistance | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| Good Moral | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |

## How It Works

### 1. Subscription Check
When a user visits the portal, the system fetches subscription data:
```javascript
const res = await fetch(`/api/subscription/usage?tenantId=${tenantId}`);
```

This returns:
```json
{
  "success": true,
  "data": {
    "planId": "standard",
    "planName": "Standard",
    "features": [...],
    "requests": { "used": 0, "total": 2000 }
  }
}
```

### 2. Feature Lock Check
For each certificate, the `isFeatureLocked()` function checks:

1. **Pro Plan**: All certificates unlocked (bypass all checks)
2. **Standard Plan**: Basic 3 certificates always unlocked
3. **Other Plans**: Check against `subscription.features` array from database

### 3. UI Rendering
Based on the lock status:
- **Unlocked**: Shows "Request Certificate" button with primary color
- **Locked**: Shows "Locked (Upgrade Needed)" button (grayed out, disabled)

## Testing Instructions

### Test with Standard Plan

1. **Ensure Demo Barangay has Standard plan:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'standard'
WHERE barangay_id = 'demo';
```

2. **Visit Portal:**
   - Navigate to: `http://localhost:3000/demo`
   - Scroll through the entire page

3. **Verify Portal Sections:**
   - ✅ Facilities section should be visible
   - ✅ Programs section should be visible
   - ✅ Achievements section should be visible
   - ✅ News & Events section should be visible (always visible)
   - ✅ Officials section should be visible (always visible)

4. **Verify Certificates:**
   - Scroll to "Barangay Smart Forms" section
   - ✅ Barangay Clearance should show "Request Certificate" (unlocked)
   - ✅ Certificate of Indigency should show "Request Certificate" (unlocked)
   - ✅ Barangay Residency should show "Request Certificate" (unlocked)
   - All other certificates should also be unlocked (Standard includes all 11 certificates)

4. **Click Certificate:**
   - Should open the request modal
   - Should NOT show upgrade modal

5. **Verify Portal Sections Are Visible:**
   - Scroll through the page
   - Facilities section should be rendered with facility cards
   - Programs section should be rendered with program cards
   - Achievements section should be rendered with achievement cards

### Test with Starter Plan

1. **Change to Starter plan:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'starter'
WHERE barangay_id = 'demo';
```

2. **Visit Portal:**
   - Navigate to: `http://localhost:3000/demo`
   - Scroll through the entire page

3. **Verify Portal Sections:**
   - 🔒 Facilities section should be HIDDEN (not rendered)
   - 🔒 Programs section should be HIDDEN (not rendered)
   - 🔒 Achievements section should be HIDDEN (not rendered)
   - ✅ News & Events section should still be visible
   - ✅ Officials section should still be visible

4. **Verify Certificates:**
   - Scroll to "Barangay Smart Forms" section
   - 🔒 Barangay Clearance should show "Locked (Upgrade Needed)" (grayed out)
   - 🔒 Certificate of Indigency should show "Locked (Upgrade Needed)" (grayed out)
   - 🔒 Barangay Residency should show "Locked (Upgrade Needed)" (grayed out)

4. **Click Certificate:**
   - Should show upgrade modal
   - Should NOT open request modal

5. **Verify Portal Sections Are Hidden:**
   - Scroll through the page
   - Facilities section should NOT be rendered at all
   - Programs section should NOT be rendered at all
   - Achievements section should NOT be rendered at all

### Test with Pro Plan

1. **Change to Pro plan:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'pro'
WHERE barangay_id = 'demo';
```

2. **Visit Portal:**
   - All certificates should be unlocked
   - All should show "Request Certificate"
   - All portal sections should be visible (Facilities, Programs, Achievements)

## Standard Plan Features (from Pricing Page)

According to your specification, Standard plan includes:

### Requests & Staff
- 2,000 requests/month
- 8 staff + 1 admin

### Support & Training
- Email support (1-2 days)
- 2 training calls

### Features
- ✅ Everything in Starter
- ✅ Facilities section with image gallery
- ✅ Barangay Programs section
- ✅ Achievements & Awards section
- ✅ All 11 certificate & document types
- ✅ Business Permit + Physical Inspection
- ✅ Full multi-step workflow
- ✅ Configurable workflow per certificate
- ✅ Approve / Reject / Return / Send Back
- ✅ Email notifications at every step
- ✅ Official Receipt (OR) + PDF download
- ✅ Pickup verification + digital signature
- ✅ Request history & audit trail
- ✅ Resident database lookup

### Not Included (Pro Only)
- ❌ Custom domain
- ❌ QR scanner
- ❌ Analytics dashboard
- ❌ Bulk export

## Implementation Notes

### Why This Approach?

1. **Hardcoded Basic Certificates**: The 3 basic certificates are hardcoded in the portal logic to ensure they're always available in Standard plan, regardless of database configuration.

2. **Database Features Array**: Other certificates can still be controlled via the `subscription_plans.features` array in the database.

3. **Pro Plan Bypass**: Pro plan bypasses all checks and unlocks everything.

### Future Enhancements

If you want to make certificate access fully database-driven:

1. Update `subscription_plans` table to include a `features` JSON column
2. Add all certificate types to Standard plan's features array:
```sql
UPDATE subscription_plans
SET features = [
  'barangay_clearance',
  'certificate_of_indigency', 
  'barangay_residency',
  'business_permit',
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'educational_assistance',
  'good_moral'
]
WHERE id = 'standard';
```

3. Remove the hardcoded check from portal (keep only database check)

## Files Modified

1. `frontend/src/components/Portal/PortalPageContent.js` - Added Standard plan check for basic certificates

## Related Documentation

- `STANDARD_PLAN_VERIFICATION.md` - How to verify Standard plan is working
- `FEATURE_LOCKS_SUMMARY.md` - Complete feature lock implementation
- `QR_SCANNER_FEATURE_LOCK.md` - QR Scanner Pro-only lock
- `FALLBACK_DATA_REMOVED.md` - Portal fallback data removal

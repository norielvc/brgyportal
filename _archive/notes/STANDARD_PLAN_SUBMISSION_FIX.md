# Standard Plan Certificate Submission Fix

## Problem Identified

When trying to submit a certificate request on the portal with a Standard plan, users were getting:

```
Submission Failed
Your current plan does not support certificate of indigency requests.
Please contact your barangay admin to upgrade.
```

## Root Cause

The portal submission API (`frontend/pages/api/portal/submit.js`) was checking if the certificate type exists in the `subscription.plan.features` array from the database. 

For Standard plan, if the features array was empty or didn't include the certificate type, it would block the submission - even though Standard plan should allow all 11 certificate types.

## Solution

Updated the subscription enforcement logic to:

1. **Pro Plan**: Bypass all checks (unlimited)
2. **Standard Plan**: Allow ALL certificate submissions (no feature array check)
3. **Starter Plan**: Check features array (block if not included)

### Code Changes

**File:** `frontend/pages/api/portal/submit.js`

**Before:**
```javascript
// Feature Gate (Bypass if Pro/Unlimited)
if (sub.plan.max_requests !== -1 && sub.plan.features && sub.plan.features.length > 0 && !sub.plan.features.includes(canonicalType)) {
  return res.status(403).json({
    success: false,
    message: `Your current plan does not support ${canonicalType.replace(/_/g, ' ')} requests...`,
    code: 'PLAN_RESTRICTED'
  });
}
```

**After:**
```javascript
// Pro plan bypass - all certificates allowed
const isProPlan = sub.plan.max_requests === -1;

// Standard plan - all 11 certificates always allowed
const isStandardPlan = sub.plan_id === 'standard';

// Feature Gate (Bypass if Pro/Unlimited or Standard plan)
if (!isProPlan && !isStandardPlan) {
  // Starter plan - check features array
  if (sub.plan.features && sub.plan.features.length > 0 && !sub.plan.features.includes(canonicalType)) {
    return res.status(403).json({
      success: false,
      message: `Your current plan does not support ${canonicalType.replace(/_/g, ' ')} requests...`,
      code: 'PLAN_RESTRICTED'
    });
  }
}
```

## How It Works Now

### Starter Plan
- Checks `subscription.plan.features` array
- Blocks certificates not in the array
- Shows upgrade message

### Standard Plan
- Skips feature array check completely
- Allows all 11 certificate types
- Only checks monthly request limit (2,000/month)

### Pro Plan
- Skips all checks
- Unlimited certificates
- Unlimited requests

## Testing

### Test Standard Plan Submission

1. **Verify Database:**
```sql
SELECT barangay_id, plan_id, status 
FROM barangay_subscriptions 
WHERE barangay_id = 'demo';
```
Should show: `plan_id = 'standard'`

2. **Visit Portal:**
   - Go to: `http://localhost:3000/demo`
   - Scroll to certificate forms

3. **Submit Certificate:**
   - Click "Request Certificate" on any certificate
   - Fill out the form
   - Click "Submit Request"
   - Should succeed with reference number

4. **Verify Success:**
   - Should see success message
   - Should get reference number (e.g., CI-2024-12345)
   - Should NOT see "plan does not support" error

### Test Starter Plan (Should Block)

1. **Change to Starter:**
```sql
UPDATE barangay_subscriptions
SET plan_id = 'starter'
WHERE barangay_id = 'demo';
```

2. **Try to Submit:**
   - Should see "Submission Failed"
   - Should see upgrade message
   - Should NOT create request

## Certificate Types Supported

All 11 certificate types are now accessible in Standard plan:

1. ✅ Barangay Clearance
2. ✅ Certificate of Indigency
3. ✅ Barangay Residency
4. ✅ Business Permit
5. ✅ Natural Death Certificate
6. ✅ Barangay Guardianship
7. ✅ Barangay Cohabitation
8. ✅ Medico Legal
9. ✅ Certification Same Person
10. ✅ Educational Assistance
11. ✅ Good Moral Certificate

## Request Limits

| Plan | Monthly Limit | Enforcement |
|------|--------------|-------------|
| Starter | 500 | ✅ Enforced |
| Standard | 2,000 | ✅ Enforced |
| Pro | Unlimited | ❌ No limit |

## Related Fixes

This fix complements the earlier portal visibility fix:

1. ✅ Portal sections (Facilities, Programs, Achievements) visible in Standard
2. ✅ Certificate forms unlocked in Standard
3. ✅ Certificate submission allowed in Standard (THIS FIX)

## Files Modified

1. `frontend/pages/api/portal/submit.js` - Subscription enforcement logic

## Verification Checklist

- [ ] Database has `plan_id = 'standard'` for test tenant
- [ ] Portal shows certificates as unlocked (no lock icon)
- [ ] Clicking certificate opens form (not upgrade modal)
- [ ] Submitting form succeeds with reference number
- [ ] No "plan does not support" error
- [ ] Request appears in dashboard
- [ ] Staff can see and process the request

## Common Issues

### Still Getting "Plan Does Not Support" Error

**Solutions:**
1. Clear browser cache and reload
2. Verify database: `SELECT plan_id FROM barangay_subscriptions WHERE barangay_id = 'demo'`
3. Check if plan_id is exactly 'standard' (lowercase)
4. Restart frontend dev server

### Submission Works But Request Not Visible

**Solutions:**
1. Check workflow assignments were created
2. Verify staff users exist for the tenant
3. Check workflow configuration for certificate type

### Monthly Limit Reached

**Solutions:**
1. Check current usage: `SELECT COUNT(*) FROM certificate_requests WHERE tenant_id = 'demo' AND created_at >= date_trunc('month', NOW())`
2. Wait for next month or upgrade to Pro
3. For testing, delete old requests or reset period dates

## Production Considerations

1. **Database Features Array**: Consider populating the `subscription_plans.features` array with all certificate types for Standard plan
2. **Plan Migration**: When upgrading from Starter to Standard, ensure plan_id is updated correctly
3. **Monitoring**: Track submission failures by plan type to identify issues
4. **Documentation**: Update user-facing docs to reflect Standard plan capabilities

## Summary

Standard plan users can now successfully submit all 11 certificate types through the portal. The fix ensures that Standard plan bypasses the feature array check while still enforcing the 2,000 requests/month limit.

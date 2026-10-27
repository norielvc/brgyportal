# Standard Plan Portal Features - Complete Implementation

## Summary of Changes

Updated the portal to ensure Standard plan users can:
1. ✅ Request 3 basic certificates (Barangay Clearance, Certificate of Indigency, Barangay Residency)
2. ✅ View Facilities section on portal website
3. ✅ View Programs section on portal website
4. ✅ View Achievements section on portal website

## Implementation Details

### File Modified
`frontend/src/components/Portal/PortalPageContent.js`

### Function Updated
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

## What This Does

### For Standard Plan Users:
1. **Certificate Requests**: Can request the 3 basic certificates
2. **Portal Sections**: Can see Facilities, Programs, and Achievements sections
3. **Public Access**: Anyone visiting the portal can see these sections (no login required)

### For Starter Plan Users:
1. **Certificate Requests**: All certificates are locked (show "Locked (Upgrade Needed)")
2. **Portal Sections**: Facilities, Programs, and Achievements sections are completely hidden
3. **Public Access**: Visitors see a limited portal without these sections

### For Pro Plan Users:
1. **Certificate Requests**: All certificates unlocked
2. **Portal Sections**: All sections visible
3. **Additional Features**: QR Scanner, Analytics, etc.

## Portal Section Rendering Logic

The portal uses conditional rendering to show/hide sections:

```javascript
{/* Facilities Section */}
{!isFeatureLocked('facilities') && (
  <section id="directory">
    {/* Facilities content */}
  </section>
)}

{/* Programs Section */}
{!isFeatureLocked('programs') && (
  <section>
    {/* Programs content */}
  </section>
)}

{/* Achievements Section */}
{!isFeatureLocked('achievements') && (
  <section id="achievements">
    {/* Achievements content */}
  </section>
)}
```

## Visual Comparison

### Starter Plan Portal
```
┌─────────────────────────────┐
│ Hero Section                │
├─────────────────────────────┤
│ News & Events               │
├─────────────────────────────┤
│ Officials Directory         │
├─────────────────────────────┤
│ Certificate Forms (LOCKED)  │
├─────────────────────────────┤
│ Contact Information         │
└─────────────────────────────┘
```

### Standard Plan Portal
```
┌─────────────────────────────┐
│ Hero Section                │
├─────────────────────────────┤
│ News & Events               │
├─────────────────────────────┤
│ Officials Directory         │
├─────────────────────────────┤
│ Facilities Section ✅       │
├─────────────────────────────┤
│ Programs Section ✅         │
├─────────────────────────────┤
│ Achievements Section ✅     │
├─────────────────────────────┤
│ Certificate Forms (3 OPEN)  │
├─────────────────────────────┤
│ Contact Information         │
└─────────────────────────────┘
```

### Pro Plan Portal
```
┌─────────────────────────────┐
│ Hero Section                │
├─────────────────────────────┤
│ News & Events               │
├─────────────────────────────┤
│ Officials Directory         │
├─────────────────────────────┤
│ Facilities Section ✅       │
├─────────────────────────────┤
│ Programs Section ✅         │
├─────────────────────────────┤
│ Achievements Section ✅     │
├─────────────────────────────┤
│ Certificate Forms (ALL OPEN)│
├─────────────────────────────┤
│ Contact Information         │
└─────────────────────────────┘
```

## Testing Checklist

### Standard Plan Testing

- [ ] Database has `plan_id = 'standard'` for test tenant
- [ ] Visit portal homepage (e.g., `localhost:3000/demo`)
- [ ] Scroll through entire page
- [ ] Verify Facilities section is visible with facility cards
- [ ] Verify Programs section is visible with program cards
- [ ] Verify Achievements section is visible with achievement cards
- [ ] Scroll to Certificate Forms section
- [ ] Verify Barangay Clearance shows "Request Certificate" (not locked)
- [ ] Verify Certificate of Indigency shows "Request Certificate" (not locked)
- [ ] Verify Barangay Residency shows "Request Certificate" (not locked)
- [ ] Click on Barangay Clearance → should open request modal
- [ ] Click on Certificate of Indigency → should open request modal
- [ ] Click on Barangay Residency → should open request modal

### Starter Plan Testing

- [ ] Change database to `plan_id = 'starter'`
- [ ] Refresh portal homepage
- [ ] Scroll through entire page
- [ ] Verify Facilities section is NOT visible (completely hidden)
- [ ] Verify Programs section is NOT visible (completely hidden)
- [ ] Verify Achievements section is NOT visible (completely hidden)
- [ ] Scroll to Certificate Forms section
- [ ] Verify all certificates show "Locked (Upgrade Needed)"
- [ ] Click on any certificate → should show upgrade modal

## Database Setup

Ensure your test tenant has the correct plan:

```sql
-- Check current plan
SELECT barangay_id, plan_id, status 
FROM barangay_subscriptions 
WHERE barangay_id = 'demo';

-- Set to Standard plan
UPDATE barangay_subscriptions
SET plan_id = 'standard', status = 'active'
WHERE barangay_id = 'demo';

-- Set to Starter plan (for testing)
UPDATE barangay_subscriptions
SET plan_id = 'starter', status = 'active'
WHERE barangay_id = 'demo';

-- Set to Pro plan (for testing)
UPDATE barangay_subscriptions
SET plan_id = 'pro', status = 'active'
WHERE barangay_id = 'demo';
```

## Feature Matrix

| Feature | Starter | Standard | Pro |
|---------|---------|----------|-----|
| **Portal Sections** | | | |
| News & Events | ✅ | ✅ | ✅ |
| Officials Directory | ✅ | ✅ | ✅ |
| Facilities | ❌ | ✅ | ✅ |
| Programs | ❌ | ✅ | ✅ |
| Achievements | ❌ | ✅ | ✅ |
| Contact Info | ✅ | ✅ | ✅ |
| **Certificates** | | | |
| Barangay Clearance | ❌ | ✅ | ✅ |
| Certificate of Indigency | ❌ | ✅ | ✅ |
| Barangay Residency | ❌ | ✅ | ✅ |
| Business Permit | ❌ | ✅ | ✅ |
| All Other Certificates | ❌ | ✅ | ✅ |
| **Dashboard Features** | | | |
| Facilities Management | ❌ | ✅ | ✅ |
| Programs Management | ❌ | ✅ | ✅ |
| Achievements Management | ❌ | ✅ | ✅ |
| QR Scanner | ❌ | ❌ | ✅ |
| Analytics Dashboard | ❌ | ❌ | ✅ |

## Important Notes

1. **Public Portal**: The portal is publicly accessible (no login required). The subscription check happens on page load to determine what sections to show.

2. **Dashboard vs Portal**: 
   - Dashboard features (Facilities/Programs/Achievements management) are locked in Starter plan
   - Portal sections (viewing Facilities/Programs/Achievements) are also locked in Starter plan
   - Both are unlocked in Standard and Pro plans

3. **Consistent Experience**: The locking is consistent across:
   - Portal website (public view)
   - Dashboard management pages (admin view)
   - Sidebar navigation (admin view)

4. **No Fallback Data**: If sections are visible but no data exists, they show empty states (no fake/fallback data).

## Related Files

1. `frontend/src/components/Portal/PortalPageContent.js` - Portal rendering and feature locks
2. `frontend/src/components/Layout/Sidebar.js` - Dashboard sidebar locks
3. `frontend/pages/facilities.js` - Facilities management page lock
4. `frontend/pages/programs.js` - Programs management page lock
5. `frontend/pages/achievements.js` - Achievements management page lock
6. `frontend/pages/api/subscription/usage.js` - Subscription data API

## Related Documentation

- `CERTIFICATE_ACCESS_BY_PLAN.md` - Complete certificate access matrix
- `STANDARD_PLAN_VERIFICATION.md` - How to verify Standard plan
- `FEATURE_LOCKS_SUMMARY.md` - All feature locks overview

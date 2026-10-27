# Certificate Status Constraint Fix

## Problem
The system was trying to set certificate request status to `'ready_for_pickup'`, but the database constraint only allowed:
- `'pending'`
- `'processing'` 
- `'ready'`
- `'released'`
- `'cancelled'`

This caused a constraint violation error when approving certificates.

## Solution
Instead of modifying the database constraint, we changed the code to use `'ready'` instead of `'ready_for_pickup'` since `'ready'` was already allowed.

## Files Modified

### Backend Files:
1. **backend/services/certificateGenerationService.js**
   - Changed `status: 'ready_for_pickup'` to `status: 'ready'`

2. **backend/routes/workflow-assignments-supabase.js**
   - Changed `new_status: 'ready_for_pickup'` to `new_status: 'ready'`

3. **backend/routes/certificates-supabase.js**
   - Updated validStatuses array to use `'ready'` instead of `'ready_for_pickup'`

### Frontend Files:
1. **frontend/pages/pickup-management.js**
   - Updated all references from `'ready_for_pickup'` to `'ready'`
   - Updated status filters, colors, and conditions

2. **frontend/pages/requests.js**
   - Updated all references from `'ready_for_pickup'` to `'ready'`
   - Updated status filters, colors, and conditions

## Status Flow
The certificate approval workflow now follows this status progression:
1. `'pending'` → Initial submission
2. `'processing'` → Staff review
3. `'approved'` → Captain approval
4. `'ready'` → Certificate generated, ready for pickup
5. `'released'` → Certificate picked up

## Testing
After these changes, the certificate approval workflow should work without constraint violations. The system will:
1. Generate certificates automatically after captain approval
2. Set status to `'ready'` 
3. Create pickup QR codes
4. Allow pickup management through the UI

## Next Steps
- Restart the backend server to apply changes
- Test the approval workflow
- Verify pickup management works correctly
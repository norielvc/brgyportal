# OR Modal Fix Summary

## Problem
The OR (Official Receipt) was being generated successfully, but the modal wasn't showing because the request was being forwarded immediately after OR generation, causing the user to lose access to the request before they could see the OR preview.

## Root Cause
The OR generation API (`POST /api/official-receipts/generate/:requestId`) was doing two things at once:
1. Generating the OR
2. Automatically forwarding the request to the releasing team

This meant the request status changed from "Treasury" to "oic_review" immediately, removing it from the user's assignments before they could see the OR preview modal.

## Solution
Split the OR generation and request forwarding into two separate operations:

### Backend Changes (`backend/routes/official-receipts-supabase.js`)

1. **Modified OR Generation Endpoint**: Removed automatic request forwarding
   - OR is generated and saved to database
   - Request status remains "Treasury" 
   - No workflow assignments created yet
   - Returns OR details for preview

2. **Added New Forward Endpoint**: `POST /api/official-receipts/forward/:requestId`
   - Validates OR exists for the request
   - Updates request status to "oic_review"
   - Creates workflow assignments for releasing team
   - Adds workflow history entry

### Frontend Changes (`frontend/pages/requests.js`)

1. **Updated ORGenerationModal**:
   - Changed button text from "Generate OR & Forward" to "Generate OR"
   - Updated description to clarify the two-step process
   - Added `handleCloseORPreview()` function to handle forwarding

2. **Modified OR Preview Modal**:
   - Close button now says "Close & Forward"
   - Closing the modal calls the new forward endpoint
   - Only calls `onSuccess()` after successful forwarding

## New Flow

1. **User clicks "Generate OR"**
   - OR is generated via `POST /api/official-receipts/generate/:requestId`
   - Request stays in "Treasury" status
   - OR preview modal opens

2. **User reviews OR in modal**
   - Can print or download the OR
   - Request is still accessible in their assignments
   - Modal shows "Close & Forward" button

3. **User clicks "Close & Forward"**
   - Calls `POST /api/official-receipts/forward/:requestId`
   - Request status changes to "oic_review"
   - Workflow assignments created for releasing team
   - Modal closes and data refreshes
   - Request disappears from user's assignments

## Benefits

- ✅ User can see OR preview before request is forwarded
- ✅ Request remains accessible until user confirms forwarding
- ✅ Clear separation between OR generation and request forwarding
- ✅ Better user experience with explicit "Close & Forward" action
- ✅ Maintains all existing functionality while fixing the modal issue

## Files Modified

- `backend/routes/official-receipts-supabase.js` - Split OR generation and forwarding
- `frontend/pages/requests.js` - Updated OR modal logic and UI text
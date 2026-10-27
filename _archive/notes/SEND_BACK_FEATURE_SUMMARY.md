# Send Back Feature - All Stages

## Overview
Added "Send Back" button to all workflow stages (except staff_review which has no previous stage) to allow users to return requests to the previous stage for corrections or revisions.

## Stages with Send Back Feature

### 1. Physical Inspection Stage
- **Button**: "Send Back to Staff" (orange)
- **Position**: Between "Reject Application" and "Submit & Forward to Captain"
- **Action**: Returns request to staff_review stage
- **Use Case**: Inspector needs staff to make corrections before proceeding

### 2. Captain Approval Stage
- **Button**: "Send Back" (amber)
- **Position**: Before the main action button
- **Action**: Returns request to previous stage (physical_inspection or staff_review)
- **Use Case**: Captain needs more information or corrections

### 3. Treasury Stage
- **Button**: "Send Back" (amber)
- **Position**: Before "Mark as Paid & Generate OR"
- **Action**: Returns request to previous stage
- **Use Case**: Treasury staff needs to verify information before payment processing

### 4. Releasing Team (OIC Review) Stage
- **Button**: "Send Back" (amber)
- **Position**: Before "Set as Ready"
- **Action**: Returns request to previous stage
- **Use Case**: Releasing team needs to verify OR or other details

### 5. Staff Review Stage
- **No Send Back**: Staff review is the first stage, so no previous stage to send back to

## Button Styling
- **Color**: Amber/Orange (border and text)
- **Icon**: RotateCcw (arrow pointing back)
- **Label**: "Send Back" or "Send Back to Staff"
- **Behavior**: Disabled when editing, enabled otherwise

## Backend Action
All send back buttons use the `'return'` action which:
- Moves request to the previous workflow stage
- Creates workflow history entry
- Reassigns to appropriate team
- Maintains all request data

## User Experience
1. User reviews request at current stage
2. If corrections needed, clicks "Send Back"
3. Request returns to previous stage
4. Previous stage team receives notification
5. They can make corrections and resubmit

## Files Modified
- `frontend/pages/requests.js` - Added send back buttons to all stages
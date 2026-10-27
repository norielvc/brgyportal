# Workflow History Constraint Fix

## Problem
Comments are not being saved to the database because the `workflow_history` table has a check constraint that doesn't allow `business_permit` as a request_type.

## Error Message
```
new row for relation "workflow_history" violates check constraint "chk_history_request_type"
```

## Solution
Run the following SQL in your Supabase SQL Editor to fix the constraint:

```sql
-- Fix workflow_history constraint to allow business_permit
ALTER TABLE workflow_history 
DROP CONSTRAINT IF EXISTS chk_history_request_type;

ALTER TABLE workflow_history 
ADD CONSTRAINT chk_history_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit',
  'note'
));

-- Also fix workflow_assignments constraint
ALTER TABLE workflow_assignments 
DROP CONSTRAINT IF EXISTS chk_request_type;

ALTER TABLE workflow_assignments 
ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit'
));

-- Fix certificate_requests constraint
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS chk_certificate_type;

ALTER TABLE certificate_requests 
ADD CONSTRAINT chk_certificate_type 
CHECK (certificate_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit'
));

-- Fix workflow_configurations constraint
ALTER TABLE workflow_configurations 
DROP CONSTRAINT IF EXISTS chk_config_certificate_type;

ALTER TABLE workflow_configurations 
ADD CONSTRAINT chk_config_certificate_type 
CHECK (certificate_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit'
));
```

## Steps to Apply
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the SQL above
5. Click **Run** or press `Ctrl+Enter`

## After Applying
Once the constraints are updated:
- ✅ Comments will be saved correctly to workflow_history
- ✅ Custom comments from users will appear in the History tab
- ✅ Business permit workflows will work properly

## Verification
After running the SQL, test by:
1. Opening a business permit request
2. Clicking "Send Back"
3. Entering a custom comment
4. Submitting
5. Check the History tab - your custom comment should now appear!

-- Fix certificate_requests status constraint for business permit workflow
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';

-- Step 2: Drop the existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- Step 3: Create new constraint with all required status values including business permit workflow
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check CHECK (
  status IN (
    'pending',
    'submitted',
    'staff_review',
    'processing',
    'secretary_approval',
    'captain_approval',
    'physical_inspection',
    'verifying',
    'Treasury',
    'oic_review',
    'approved',
    'ready',
    'ready_for_pickup',
    'released',
    'rejected',
    'returned',
    'completed',
    'cancelled'
  )
);

-- Step 4: Verify the constraint was created successfully
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';

-- Step 5: Check current business permit requests
SELECT id, reference_number, status, certificate_type 
FROM certificate_requests 
WHERE certificate_type = 'business_permit'
ORDER BY created_at DESC;
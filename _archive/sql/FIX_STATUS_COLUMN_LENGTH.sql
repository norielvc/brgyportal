-- Fix: Update CHECK constraint to allow new status values
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing check constraint
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- Step 2: Add a new check constraint with all allowed status values
ALTER TABLE certificate_requests 
ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN (
  'pending',
  'submitted', 
  'staff_review',
  'processing',
  'secretary_approval',
  'captain_approval',
  'oic_review',
  'approved',
  'rejected',
  'returned',
  'completed',
  'ready_for_pickup',
  'picked_up',
  'cancelled'
));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';

-- Update certificate_requests status constraint to include specific workflow statuses
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- 2. Add updated constraint with all possible workflow statuses
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN (
    'pending', 
    'submitted', 
    'staff_review', 
    'captain_approval', 
    'oic_review', 
    'processing', 
    'ready', 
    'ready_for_pickup', 
    'released', 
    'cancelled',
    'returned'
));

-- 3. Verify the updated constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'certificate_requests'::regclass 
AND conname = 'certificate_requests_status_check';

-- Comprehensive fix for certificate_requests status constraint
-- This includes all status values used in both frontend and backend code
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop the existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- 2. Add the updated constraint with all necessary statuses
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN (
    'pending', 
    'submitted', 
    'processing', 
    'under_review',
    'approved', 
    'rejected', 
    'returned',
    'ready', 
    'ready_for_pickup', 
    'released', 
    'cancelled'
));

-- 3. Verify the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'certificate_requests'::regclass 
AND conname = 'certificate_requests_status_check';

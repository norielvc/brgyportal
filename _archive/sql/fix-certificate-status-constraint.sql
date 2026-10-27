-- Fix certificate_requests status constraint to include 'ready_for_pickup'
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- Add the updated constraint with 'ready_for_pickup' included
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN ('pending', 'processing', 'ready', 'ready_for_pickup', 'released', 'cancelled'));

-- Verify the constraint was updated (works with newer PostgreSQL versions)
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'certificate_requests'::regclass 
AND conname = 'certificate_requests_status_check';
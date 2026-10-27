-- Check current constraint on certificate_requests table
-- Run this in Supabase SQL Editor to see what constraints exist

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'certificate_requests'::regclass 
AND contype = 'c'  -- Check constraints only
ORDER BY conname;
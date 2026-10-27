-- ULTIMATE WORKFLOW DATABASE FIX
-- This script ensures the database is fully compatible with the multi-step workflow system.
-- Run this in your Supabase SQL Editor.

-- 1. Fix the certificate_requests status constraint to include ALL workflow steps
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN (
    'pending', 
    'submitted', 
    'staff_review', 
    'secretary_approval', 
    'captain_approval', 
    'oic_review', 
    'processing', 
    'approved', 
    'ready', 
    'ready_for_pickup', 
    'released', 
    'cancelled',
    'rejected',
    'returned',
    'completed'
));

-- 2. Ensure status column is long enough
ALTER TABLE certificate_requests ALTER COLUMN status TYPE VARCHAR(50);

-- 3. Ensure workflow_history action constraint is flexible
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_action;

-- 4. Check if we need to link existing requests without assignments
-- (This query helps identify "lost" requests)
SELECT id, reference_number, status, created_at 
FROM certificate_requests 
WHERE id NOT IN (SELECT request_id FROM workflow_assignments)
AND status NOT IN ('released', 'cancelled')
ORDER BY created_at DESC;

-- 5. Verification: Show enabled statuses
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'certificate_requests'::regclass 
AND conname = 'certificate_requests_status_check';

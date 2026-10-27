-- COMPLETE FIX: All SQL fixes needed for workflow functionality
-- Run all these commands in Supabase SQL Editor

-- ============================================
-- STEP 1: Fix status column constraint
-- ============================================
ALTER TABLE certificate_requests 
DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

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
  'released',
  'rejected',
  'returned',
  'completed',
  'ready_for_pickup',
  'ready',
  'picked_up',
  'cancelled'
));

-- ============================================
-- STEP 2: Expand status column length (if needed)
-- ============================================
ALTER TABLE certificate_requests 
ALTER COLUMN status TYPE VARCHAR(50);

-- ============================================
-- STEP 3: Add position column to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- ============================================
-- STEP 4: Verify workflow_configurations table exists
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type VARCHAR(100) UNIQUE NOT NULL,
  workflow_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Check current workflow configurations
-- ============================================
SELECT 
  certificate_type, 
  jsonb_array_length(workflow_config->'steps') as step_count,
  workflow_config->'steps'->0->>'name' as first_step,
  workflow_config->'steps'->1->>'name' as second_step
FROM workflow_configurations;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check status constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'certificate_requests_status_check';

-- Check current request statuses
SELECT DISTINCT status, COUNT(*) as count 
FROM certificate_requests 
GROUP BY status;

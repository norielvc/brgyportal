-- Simple fix for certificate_requests status constraint
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

-- Add the updated constraint with 'ready_for_pickup' included
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check 
CHECK (status IN ('pending', 'processing', 'ready', 'ready_for_pickup', 'released', 'cancelled'));
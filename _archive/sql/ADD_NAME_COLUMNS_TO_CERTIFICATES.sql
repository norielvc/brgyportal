-- Add separate name columns to certificate_requests table to follow residents database pattern
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE certificate_requests 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS suffix VARCHAR(50);

-- Optional: Populate new columns from full_name (very rough estimation)
-- This is just a best-effort backfill. Manual correction may be needed.
UPDATE certificate_requests 
SET first_name = split_part(full_name, ' ', 1),
    last_name = split_part(full_name, ' ', 2)
WHERE (first_name IS NULL OR first_name = '') AND full_name IS NOT NULL AND full_name != '';

-- Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';

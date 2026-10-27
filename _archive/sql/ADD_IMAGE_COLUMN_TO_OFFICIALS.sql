-- Add image_url column to barangay_officials table
-- Copy and paste this SQL into your Supabase SQL Editor

ALTER TABLE barangay_officials ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to certificate_requests table
-- Run this SQL in your Supabase SQL Editor

-- Add certificate file path column
ALTER TABLE certificate_requests 
ADD COLUMN IF NOT EXISTS certificate_file_path TEXT;

-- Add certificate generated timestamp column
ALTER TABLE certificate_requests 
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN certificate_requests.certificate_file_path IS 'Path to the generated certificate file';
COMMENT ON COLUMN certificate_requests.certificate_generated_at IS 'Timestamp when the certificate was generated';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'certificate_requests' 
AND column_name IN ('certificate_file_path', 'certificate_generated_at');
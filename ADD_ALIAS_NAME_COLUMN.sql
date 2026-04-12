-- Add alias_name column to certificate_requests table for Same Person certificates
-- This stores the second name / other name used by the same person

ALTER TABLE certificate_requests 
ADD COLUMN IF NOT EXISTS alias_name VARCHAR(255);

-- Add comment to document the column
COMMENT ON COLUMN certificate_requests.alias_name IS 'Second name or other name used (for Same Person certificates)';

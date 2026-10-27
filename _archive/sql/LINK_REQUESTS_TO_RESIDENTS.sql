-- Add resident_id column to certificate_requests table to link with residents database
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_certificate_requests_resident_id ON certificate_requests(resident_id);

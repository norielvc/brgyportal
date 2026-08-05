-- Add columns needed for pickup method and medico-legal certificates
-- Run this in Supabase SQL Editor

ALTER TABLE certificate_requests
  ADD COLUMN IF NOT EXISTS pickup_method VARCHAR(20) DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS date_of_examination DATE,
  ADD COLUMN IF NOT EXISTS usaping_barangay VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_of_hearing DATE;

COMMENT ON COLUMN certificate_requests.pickup_method IS 'How requestor receives certificate: pickup (default) or online (email)';
COMMENT ON COLUMN certificate_requests.date_of_examination IS 'Medico-legal date of examination';
COMMENT ON COLUMN certificate_requests.usaping_barangay IS 'Medico-legal usaping barangay case number';
COMMENT ON COLUMN certificate_requests.date_of_hearing IS 'Medico-legal date of hearing';

-- Link Brgy Assistance inquiries to verified census residents (portal submissions)
ALTER TABLE assistance_inquiries
  ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id);

CREATE INDEX IF NOT EXISTS idx_assistance_inquiries_resident_id
  ON assistance_inquiries(resident_id);

COMMENT ON COLUMN assistance_inquiries.resident_id IS
  'Verified barangay census record for portal Brgy Assistance submissions';

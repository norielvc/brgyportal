-- Staff replies to Brgy Assistance (Makipag-ugnayan) inquiries
ALTER TABLE assistance_inquiries
  ADD COLUMN IF NOT EXISTS staff_response TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

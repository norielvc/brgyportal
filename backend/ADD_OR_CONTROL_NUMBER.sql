-- Optional: BC control number on official receipt records (Business Clearance payment block)
ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS control_number VARCHAR(50);

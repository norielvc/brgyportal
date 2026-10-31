-- E-Sumbong verification: usaping barangay number & hearing date
ALTER TABLE blotter_reports
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usaping_barangay_number TEXT,
  ADD COLUMN IF NOT EXISTS petsa_ng_paghaharap DATE;

CREATE INDEX IF NOT EXISTS idx_blotter_reports_usaping
  ON blotter_reports (tenant_id, usaping_barangay_number)
  WHERE usaping_barangay_number IS NOT NULL;

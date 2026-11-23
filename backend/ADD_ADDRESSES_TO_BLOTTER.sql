-- E-Sumbong: Add complainant_address and respondent_address for Lupong Tagapamayapa / Paanyaya sa Paghaharap
ALTER TABLE blotter_reports
  ADD COLUMN IF NOT EXISTS complainant_address TEXT,
  ADD COLUMN IF NOT EXISTS respondent_address TEXT;

COMMENT ON COLUMN blotter_reports.complainant_address IS 'Tirahan ng Nagsusumbong (Complainant Address)';
COMMENT ON COLUMN blotter_reports.respondent_address IS 'Tirahan ng Ipinagsusumbong (Respondent Address)';

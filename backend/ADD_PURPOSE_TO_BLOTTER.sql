-- E-Sumbong: Magdagdag ng column na "purpose" (Para sa:) para sa Lupong Tagapamayapa document
ALTER TABLE blotter_reports
  ADD COLUMN IF NOT EXISTS purpose TEXT;

COMMENT ON COLUMN blotter_reports.purpose IS 'Layunin o paksa ng sumbong (Para sa: ...) para sa Lupong Tagapamayapa';

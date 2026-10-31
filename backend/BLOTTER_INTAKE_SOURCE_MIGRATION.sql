-- Track whether E-Sumbong came from the public portal or Help Desk walk-in intake
ALTER TABLE blotter_reports
  ADD COLUMN IF NOT EXISTS intake_source TEXT NOT NULL DEFAULT 'portal';

ALTER TABLE blotter_reports
  DROP CONSTRAINT IF EXISTS blotter_reports_intake_source_check;

ALTER TABLE blotter_reports
  ADD CONSTRAINT blotter_reports_intake_source_check
  CHECK (intake_source IN ('portal', 'walk_in'));

CREATE INDEX IF NOT EXISTS idx_blotter_reports_intake_source
  ON blotter_reports (tenant_id, intake_source);

-- Allow under_review after E-Sumbong verify (older tables may omit this value).
ALTER TABLE blotter_reports
  DROP CONSTRAINT IF EXISTS blotter_reports_status_check;

ALTER TABLE blotter_reports
  ADD CONSTRAINT blotter_reports_status_check
  CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed'));

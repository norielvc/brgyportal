-- CORRECT constraint fix for workflow_history
-- The constraint name is chk_workflow_history_request_type (not chk_history_request_type)

ALTER TABLE workflow_history 
DROP CONSTRAINT IF EXISTS chk_workflow_history_request_type;

ALTER TABLE workflow_history 
ADD CONSTRAINT chk_workflow_history_request_type 
CHECK (request_type IN (
  'barangay_clearance', 
  'certificate_of_indigency', 
  'barangay_residency', 
  'natural_death',
  'barangay_guardianship',
  'barangay_cohabitation',
  'medico_legal',
  'certification_same_person',
  'business_permit',
  'note'
));

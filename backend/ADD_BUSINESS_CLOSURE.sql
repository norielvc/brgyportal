-- ==============================================================================
-- ADD "BUSINESS CLOSURE" CERTIFICATE REQUEST TYPE
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to allow 'business_closure'
-- across certificate requests, workflows, assignments, and history.
-- ==============================================================================

-- 1. Certificate Requests Table
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS chk_certificate_type;

ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_certificate_type_check
CHECK (certificate_type IN (
    'barangay_clearance',
    'first_time_job_seeker',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit',
    'business_closure',
    'educational_assistance'
));

-- 2. Workflow Assignments Table
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS workflow_assignments_request_type_check;

ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type
CHECK (request_type IN (
    'barangay_clearance',
    'first_time_job_seeker',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit',
    'business_closure',
    'educational_assistance'
));

-- 3. Workflow History Table
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_workflow_history_request_type;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_request_type;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_request_type_check;

ALTER TABLE workflow_history ADD CONSTRAINT chk_workflow_history_request_type
CHECK (request_type IN (
    'barangay_clearance',
    'first_time_job_seeker',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit',
    'business_closure',
    'educational_assistance',
    'note'
));

-- 4. Workflow Configurations Table
ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS chk_config_certificate_type;
ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS workflow_configurations_certificate_type_check;

ALTER TABLE workflow_configurations ADD CONSTRAINT chk_config_certificate_type
CHECK (certificate_type IN (
    'barangay_clearance',
    'first_time_job_seeker',
    'certificate_of_indigency',
    'barangay_residency',
    'natural_death',
    'medico_legal',
    'barangay_cohabitation',
    'barangay_guardianship',
    'certification_same_person',
    'business_permit',
    'business_closure',
    'educational_assistance'
));

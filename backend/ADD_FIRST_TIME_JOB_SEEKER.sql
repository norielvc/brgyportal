-- ==============================================================================
-- ADD "FIRST TIME JOB SEEKER" CERTIFICATE REQUEST TYPE
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to allow 'first_time_job_seeker'
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
    'educational_assistance'
));

-- 5. Copy workflow configurations from barangay_clearance for all tenants
INSERT INTO workflow_configurations (tenant_id, certificate_type, workflow_config, is_active, created_at, updated_at)
SELECT
    tenant_id,
    'first_time_job_seeker',
    workflow_config,
    true,
    NOW(),
    NOW()
FROM workflow_configurations
WHERE certificate_type = 'barangay_clearance'
ON CONFLICT (tenant_id, certificate_type) DO NOTHING;

-- 6. Verify constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname IN (
    'certificate_requests_certificate_type_check',
    'chk_request_type',
    'chk_workflow_history_request_type',
    'chk_config_certificate_type'
);

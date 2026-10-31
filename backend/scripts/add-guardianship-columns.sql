-- Add columns for Guardianship Certificate to certificate_requests table
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES residents(id);

-- Update the certificate_type constraint to include 'barangay_guardianship'
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_certificate_type_check;
ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_certificate_type_check 
CHECK (certificate_type IN (
    'barangay_clearance',
    'barangay_residency',
    'certificate_of_indigency',
    'natural_death',
    'barangay_guardianship'
));

-- Update the request_type constraint in workflow_assignments to include 'barangay_guardianship'
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;
ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type 
CHECK (request_type IN (
    'barangay_clearance',
    'barangay_residency',
    'certificate_of_indigency',
    'natural_death',
    'barangay_guardianship'
));

-- Update the certificate_type constraint in workflow_configurations to include 'barangay_guardianship'
ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS chk_config_certificate_type;
ALTER TABLE workflow_configurations ADD CONSTRAINT chk_config_certificate_type 
CHECK (certificate_type IN (
    'barangay_clearance',
    'barangay_residency',
    'certificate_of_indigency',
    'natural_death',
    'barangay_guardianship'
));

-- Add Guardianship Workflow Configuration
INSERT INTO workflow_configurations (certificate_type, workflow_config, is_active, created_at, updated_at)
VALUES (
  'barangay_guardianship',
  '{
    "steps": [
      {
        "id": 1,
        "name": "Review Request Team",
        "status": "staff_review",
        "assignedUsers": [
          "1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae",
          "d165bf34-2a6e-4a33-8f13-a2e9868f28f6"
        ],
        "requiresApproval": true
      },
      {
        "id": 2,
        "name": "Brgy. Secretary Approval",
        "status": "secretary_approval",
        "assignedUsers": [
          "ca847635-fd64-4e69-9cc7-01998200ddfe"
        ],
        "requiresApproval": true
      },
      {
        "id": 3,
        "name": "Barangay Chairman Approval",
        "status": "captain_approval",
        "assignedUsers": [
          "9550a8b2-9e32-4f52-a260-52766afb49b1"
        ],
        "requiresApproval": true
      },
      {
        "id": 999,
        "name": "Releasing Team",
        "status": "oic_review",
        "assignedUsers": [
          "379898b5-06e9-43a7-b51d-213aec975825"
        ],
        "requiresApproval": true
      }
    ]
  }'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (certificate_type) 
DO UPDATE SET 
  workflow_config = EXCLUDED.workflow_config,
  updated_at = NOW();

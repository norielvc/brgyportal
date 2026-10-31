-- Add or Update Natural Death Workflow Configuration
-- Run this in the Supabase SQL Editor to fix the missing assignment issue.

INSERT INTO workflow_configurations (certificate_type, workflow_config, is_active, created_at, updated_at)
VALUES (
  'natural_death',
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

-- Verify the insertion
SELECT * FROM workflow_configurations WHERE certificate_type = 'natural_death';

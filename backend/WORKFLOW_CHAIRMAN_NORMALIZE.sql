-- Optional: run in Supabase SQL editor to align stored workflow JSON with
-- Barangay Chairman labels and captain_approval status keys.
-- Safe to run multiple times; review in staging first.

UPDATE workflow_configurations
SET workflow_config = jsonb_set(
  workflow_config,
  '{steps}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN lower(step->>'status') IN ('captain_approval', 'chairman_approval')
          OR lower(step->>'status') LIKE '%chairman%'
          OR lower(step->>'status') LIKE '%captain%'
          OR lower(step->>'name') LIKE '%chairman%'
          OR lower(step->>'name') LIKE '%captain%'
          OR lower(step->>'name') LIKE '%punong%'
          OR lower(COALESCE(step->>'officialRole', '')) LIKE '%chairman%'
          OR lower(COALESCE(step->>'officialRole', '')) LIKE '%captain%'
        THEN step
          || jsonb_build_object('status', 'captain_approval')
          || jsonb_build_object('officialRole', 'Barangay Chairman')
        WHEN lower(COALESCE(step->>'officialRole', '')) IN ('brgy. chairman', 'brgy. captain')
        THEN step || jsonb_build_object('officialRole', 'Barangay Chairman')
        ELSE step
      END
    )
    FROM jsonb_array_elements(workflow_config->'steps') AS step
  ),
  true
),
updated_at = NOW()
WHERE workflow_config ? 'steps'
  AND jsonb_typeof(workflow_config->'steps') = 'array';

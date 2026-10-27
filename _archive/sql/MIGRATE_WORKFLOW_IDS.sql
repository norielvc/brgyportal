-- Update step_id columns to BIGINT to support Date.now() based IDs
ALTER TABLE workflow_assignments ALTER COLUMN step_id TYPE BIGINT;
ALTER TABLE workflow_history ALTER COLUMN step_id TYPE BIGINT;

-- Also update workflow_configurations upsert logic in the backend if needed
-- but first let's ensure the database can store these IDs.

-- Success message
SELECT 'Workflow table columns updated to BIGINT successfully' as status;

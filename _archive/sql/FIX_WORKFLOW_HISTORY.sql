-- 1. Add missing columns (if any)
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS official_role VARCHAR(100);
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS new_status VARCHAR(50);
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50);

-- 2. Drop the restrictive constraint that blocks 'return' actions
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_action;

-- 3. Refresh schema
NOTIFY pgrst, 'reload schema';

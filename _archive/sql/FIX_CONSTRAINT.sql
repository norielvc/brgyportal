-- The error is caused by a constraint restricting what actions can be saved.
-- We need to remove this constraint to allow 'return' and other actions.

ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS chk_history_action;

-- If you really want a constraint, you can uncomment the line below, but best to leave it off for flexibility:
-- ALTER TABLE workflow_history ADD CONSTRAINT chk_history_action CHECK (action IN ('approve', 'reject', 'return', 'completed', 'note'));

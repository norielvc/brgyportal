-- Create workflow_history table for tracking request lifecycle and comments
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES certificate_requests(id) ON DELETE CASCADE,
  request_type VARCHAR(100),
  step_id VARCHAR(50), 
  step_name VARCHAR(100),
  action VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'return', 'completed', etc.
  performed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL, -- User who performed the action
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  comments TEXT,
  signature_data TEXT,
  official_role VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster history lookups by request
CREATE INDEX IF NOT EXISTS idx_workflow_history_request_id ON workflow_history(request_id);

-- Enable RLS
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read/insert/update
CREATE POLICY "Enable all access for authenticated users" ON workflow_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy to allow service role full access
CREATE POLICY "Enable all access for service role" ON workflow_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions explicitly
GRANT ALL ON workflow_history TO authenticated;
GRANT ALL ON workflow_history TO service_role;

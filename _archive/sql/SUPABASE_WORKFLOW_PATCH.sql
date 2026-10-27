-- Missing Tenant IDs Patch
-- Ensures the correct workflow tables have the tenant_id column
ALTER TABLE workflow_configurations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';
ALTER TABLE workflow_configurations DROP CONSTRAINT IF EXISTS workflow_configurations_pkey;
ALTER TABLE workflow_configurations ADD PRIMARY KEY (certificate_type, tenant_id);

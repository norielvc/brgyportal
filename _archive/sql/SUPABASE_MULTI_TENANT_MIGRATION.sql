-- Phase 1: Create the Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY, -- Example: 'ibaoeste' or 'demo'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    plan_tier VARCHAR(50) DEFAULT 'Starter', -- Starter, Standard, Pro
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert our first two tenants (Updating their plans as discussed)
INSERT INTO tenants (id, name, domain, plan_tier) VALUES
('ibaoeste', 'Barangay Iba O'' Este', 'ibaoesteportal.vercel.app', 'Pro'),
('demo', 'Demo System', 'demo.ibaoesteportal.vercel.app', 'Starter')
ON CONFLICT (id) DO NOTHING;


-- Phase 2: Add tenant_id to all major tables and set the default to 'ibaoeste'
-- This ensures that all your existing live data is safely assigned to your live barangay.

-- 1. Residents
ALTER TABLE residents ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';
-- You can run this later to enforce the rule once the backend is updated: 
-- ALTER TABLE residents ADD CONSTRAINT fk_resident_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- 2. Barangay Officials
ALTER TABLE barangay_officials ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';

-- 3. Users (Auth/Staff accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';

-- 4. Certificates (Requests)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';

-- 5. Educational Assistance
ALTER TABLE educational_assistance ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';

-- 6. Workflows and Assignments
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';
ALTER TABLE workflow_assignments ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';


-- Phase 3: The Settings Table
-- Currently, barangay_settings only has 'key' as the primary key. We must drop it and recreate it as a composite key (key + tenant_id).
ALTER TABLE barangay_settings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) DEFAULT 'ibaoeste';
ALTER TABLE barangay_settings DROP CONSTRAINT IF EXISTS barangay_settings_pkey;
ALTER TABLE barangay_settings ADD PRIMARY KEY (key, tenant_id);

-- Excellent! Once you run this script in the Supabase SQL Editor, your database schema is officially Multi-Tenant ready.

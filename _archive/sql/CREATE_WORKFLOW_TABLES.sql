-- =====================================================
-- WORKFLOW SYSTEM TABLES FOR SUPABASE
-- =====================================================
-- This script creates the necessary tables for the workflow system
-- Run this in Supabase SQL Editor

-- 1. WORKFLOW_ASSIGNMENTS TABLE
-- Tracks which users are assigned to which workflow steps for each request
CREATE TABLE IF NOT EXISTS workflow_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'barangay_clearance', 'certificate_of_indigency', etc.
    step_id INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    assigned_user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_workflow_request FOREIGN KEY (request_id) REFERENCES certificate_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_workflow_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'skipped')),
    CONSTRAINT chk_request_type CHECK (request_type IN ('barangay_clearance', 'certificate_of_indigency', 'barangay_residency'))
);

-- 2. WORKFLOW_HISTORY TABLE
-- Tracks all workflow actions and state changes
CREATE TABLE IF NOT EXISTS workflow_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    step_id INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'assigned', 'approved', 'rejected', 'returned', 'completed'
    performed_by UUID NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    comments TEXT,
    metadata JSONB, -- For storing additional data like approval reasons, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES certificate_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_history_action CHECK (action IN ('assigned', 'approved', 'rejected', 'returned', 'completed', 'submitted', 'updated')),
    CONSTRAINT chk_history_request_type CHECK (request_type IN ('barangay_clearance', 'certificate_of_indigency', 'barangay_residency'))
);

-- 3. WORKFLOW_CONFIGURATIONS TABLE
-- Stores workflow configurations (alternative to JSON file)
CREATE TABLE IF NOT EXISTS workflow_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_type VARCHAR(50) NOT NULL UNIQUE,
    workflow_config JSONB NOT NULL, -- Stores the entire workflow configuration
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_workflow_config_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Check constraints
    CONSTRAINT chk_config_certificate_type CHECK (certificate_type IN ('barangay_clearance', 'certificate_of_indigency', 'barangay_residency'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Workflow assignments indexes
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_request_id ON workflow_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_user_id ON workflow_assignments(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_status ON workflow_assignments(status);
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_type_step ON workflow_assignments(request_type, step_id);

-- Workflow history indexes
CREATE INDEX IF NOT EXISTS idx_workflow_history_request_id ON workflow_history(request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_user_id ON workflow_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON workflow_history(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_history_type_action ON workflow_history(request_type, action);

-- Workflow configurations indexes
CREATE INDEX IF NOT EXISTS idx_workflow_config_type ON workflow_configurations(certificate_type);
CREATE INDEX IF NOT EXISTS idx_workflow_config_active ON workflow_configurations(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all workflow tables
ALTER TABLE workflow_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_configurations ENABLE ROW LEVEL SECURITY;

-- Workflow assignments policies
CREATE POLICY "Users can view their own workflow assignments" ON workflow_assignments
    FOR SELECT USING (assigned_user_id = auth.uid());

CREATE POLICY "Admins can view all workflow assignments" ON workflow_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert workflow assignments" ON workflow_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own workflow assignments" ON workflow_assignments
    FOR UPDATE USING (
        assigned_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Workflow history policies
CREATE POLICY "Users can view workflow history for their assignments" ON workflow_history
    FOR SELECT USING (
        performed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workflow_assignments 
            WHERE workflow_assignments.request_id = workflow_history.request_id 
            AND workflow_assignments.assigned_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert workflow history" ON workflow_history
    FOR INSERT WITH CHECK (true);

-- Workflow configurations policies
CREATE POLICY "All authenticated users can view workflow configurations" ON workflow_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify workflow configurations" ON workflow_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_workflow_assignments_updated_at 
    BEFORE UPDATE ON workflow_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_configurations_updated_at 
    BEFORE UPDATE ON workflow_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert default workflow configurations
INSERT INTO workflow_configurations (certificate_type, workflow_config, created_by) VALUES
('barangay_clearance', '{
  "steps": [
    {
      "id": 1,
      "name": "Submitted",
      "description": "Application received",
      "status": "pending",
      "icon": "FileText",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": true
    },
    {
      "id": 2,
      "name": "Under Review",
      "description": "Being reviewed by staff",
      "status": "processing",
      "icon": "Clock",
      "autoApprove": false,
      "assignedUsers": ["9550a8b2-9e32-4f52-a260-52766afb49b1", "f398db9a-1224-42f9-a72f-69dd14fa5064", "379898b5-06e9-43a7-b51d-213aec975825"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 3,
      "name": "Barangay Captain Approval",
      "description": "Approved by authorized personnel",
      "status": "approved",
      "icon": "UserCheck",
      "autoApprove": false,
      "assignedUsers": ["aaa242af-6ef2-4c72-8729-f8e8d68ec1fa", "2a6054aa-d73d-4f52-876f-efa95f77add9"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 4,
      "name": "Ready for Pickup",
      "description": "Certificate is ready",
      "status": "ready",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    },
    {
      "id": 5,
      "name": "Released",
      "description": "Certificate released to applicant",
      "status": "released",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    }
  ]
}', NULL)
ON CONFLICT (certificate_type) DO NOTHING;

INSERT INTO workflow_configurations (certificate_type, workflow_config, created_by) VALUES
('certificate_of_indigency', '{
  "steps": [
    {
      "id": 1,
      "name": "Submitted",
      "description": "Application received",
      "status": "pending",
      "icon": "FileText",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": true
    },
    {
      "id": 2,
      "name": "Under Review",
      "description": "Being reviewed by staff",
      "status": "processing",
      "icon": "Clock",
      "autoApprove": false,
      "assignedUsers": ["9550a8b2-9e32-4f52-a260-52766afb49b1", "f398db9a-1224-42f9-a72f-69dd14fa5064", "379898b5-06e9-43a7-b51d-213aec975825"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 3,
      "name": "Barangay Captain Approval",
      "description": "Approved by authorized personnel",
      "status": "approved",
      "icon": "UserCheck",
      "autoApprove": false,
      "assignedUsers": ["aaa242af-6ef2-4c72-8729-f8e8d68ec1fa", "2a6054aa-d73d-4f52-876f-efa95f77add9"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 4,
      "name": "Ready for Pickup",
      "description": "Certificate is ready",
      "status": "ready",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    },
    {
      "id": 5,
      "name": "Released",
      "description": "Certificate released to applicant",
      "status": "released",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    }
  ]
}', NULL)
ON CONFLICT (certificate_type) DO NOTHING;

INSERT INTO workflow_configurations (certificate_type, workflow_config, created_by) VALUES
('barangay_residency', '{
  "steps": [
    {
      "id": 1,
      "name": "Submitted",
      "description": "Application received",
      "status": "pending",
      "icon": "FileText",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": true
    },
    {
      "id": 2,
      "name": "Under Review",
      "description": "Being reviewed by staff",
      "status": "processing",
      "icon": "Clock",
      "autoApprove": false,
      "assignedUsers": ["9550a8b2-9e32-4f52-a260-52766afb49b1", "f398db9a-1224-42f9-a72f-69dd14fa5064", "379898b5-06e9-43a7-b51d-213aec975825"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 3,
      "name": "Barangay Captain Approval",
      "description": "Approved by authorized personnel",
      "status": "approved",
      "icon": "UserCheck",
      "autoApprove": false,
      "assignedUsers": ["aaa242af-6ef2-4c72-8729-f8e8d68ec1fa", "2a6054aa-d73d-4f52-876f-efa95f77add9"],
      "requiresApproval": true,
      "sendEmail": true
    },
    {
      "id": 4,
      "name": "Ready for Pickup",
      "description": "Certificate is ready",
      "status": "ready",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    },
    {
      "id": 5,
      "name": "Released",
      "description": "Certificate released to applicant",
      "status": "released",
      "icon": "CheckCircle",
      "autoApprove": false,
      "assignedUsers": [],
      "requiresApproval": false,
      "sendEmail": false
    }
  ]
}', NULL)
ON CONFLICT (certificate_type) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workflow_assignments', 'workflow_history', 'workflow_configurations')
ORDER BY tablename;

-- Check if workflow configurations were inserted
SELECT 
    certificate_type,
    is_active,
    created_at
FROM workflow_configurations
ORDER BY certificate_type;

-- Success message
SELECT 'Workflow tables created successfully! You can now use the enhanced workflow system.' as status;
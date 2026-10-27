-- =====================================================
-- SIMPLE WORKFLOW TABLES FOR SUPABASE
-- =====================================================
-- This is a simplified version that creates basic workflow tracking tables
-- Run this in Supabase SQL Editor if you prefer a simpler approach

-- 1. WORKFLOW_ASSIGNMENTS TABLE (Simplified)
-- Tracks current workflow assignments for each request
CREATE TABLE IF NOT EXISTS workflow_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    current_step_name VARCHAR(100) NOT NULL DEFAULT 'Submitted',
    assigned_to UUID[], -- Array of user IDs assigned to current step
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to certificate_requests
    CONSTRAINT fk_workflow_request FOREIGN KEY (request_id) REFERENCES certificate_requests(id) ON DELETE CASCADE
);

-- 2. WORKFLOW_HISTORY TABLE (Simplified)
-- Tracks all workflow actions
CREATE TABLE IF NOT EXISTS workflow_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    from_step INTEGER,
    to_step INTEGER,
    performed_by UUID NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES certificate_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflow_assignments_request ON workflow_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_type ON workflow_assignments(certificate_type);
CREATE INDEX IF NOT EXISTS idx_workflow_assignments_status ON workflow_assignments(status);

CREATE INDEX IF NOT EXISTS idx_workflow_history_request ON workflow_history(request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_user ON workflow_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created ON workflow_history(created_at);

-- =====================================================
-- TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for workflow_assignments
CREATE TRIGGER update_workflow_assignments_updated_at 
    BEFORE UPDATE ON workflow_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO CREATE WORKFLOW ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION create_workflow_assignment(
    p_request_id UUID,
    p_certificate_type VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
    staff_users UUID[];
BEGIN
    -- Get staff user IDs (users who should be assigned to step 2)
    SELECT ARRAY(
        SELECT id FROM users 
        WHERE id IN (
            '9550a8b2-9e32-4f52-a260-52766afb49b1',
            'f398db9a-1224-42f9-a72f-69dd14fa5064', 
            '379898b5-06e9-43a7-b51d-213aec975825'
        )
    ) INTO staff_users;
    
    -- Create workflow assignment starting at step 1
    INSERT INTO workflow_assignments (
        request_id,
        certificate_type,
        current_step,
        current_step_name,
        assigned_to,
        status
    ) VALUES (
        p_request_id,
        p_certificate_type,
        1, -- Start at step 1 (Submitted)
        'Submitted',
        '{}', -- No assignments for step 1
        'pending'
    ) RETURNING id INTO assignment_id;
    
    -- Log the initial creation
    INSERT INTO workflow_history (
        request_id,
        certificate_type,
        action,
        from_step,
        to_step,
        performed_by
    ) VALUES (
        p_request_id,
        p_certificate_type,
        'created',
        NULL,
        1,
        '00000000-0000-0000-0000-000000000000' -- System user
    );
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION TO ADVANCE WORKFLOW
-- =====================================================

CREATE OR REPLACE FUNCTION advance_workflow(
    p_request_id UUID,
    p_action VARCHAR(50),
    p_performed_by UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_assignment RECORD;
    next_step INTEGER;
    next_step_name VARCHAR(100);
    next_assigned_users UUID[];
    admin_users UUID[];
BEGIN
    -- Get current workflow assignment
    SELECT * INTO current_assignment 
    FROM workflow_assignments 
    WHERE request_id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No workflow assignment found for request %', p_request_id;
    END IF;
    
    -- Determine next step based on action
    IF p_action = 'approve' THEN
        next_step := current_assignment.current_step + 1;
        
        -- Define step names and assignments
        CASE next_step
            WHEN 2 THEN 
                next_step_name := 'Under Review';
                SELECT ARRAY[
                    '9550a8b2-9e32-4f52-a260-52766afb49b1',
                    'f398db9a-1224-42f9-a72f-69dd14fa5064', 
                    '379898b5-06e9-43a7-b51d-213aec975825'
                ] INTO next_assigned_users;
            WHEN 3 THEN 
                next_step_name := 'Barangay Captain Approval';
                SELECT ARRAY[
                    'aaa242af-6ef2-4c72-8729-f8e8d68ec1fa',
                    '2a6054aa-d73d-4f52-876f-efa95f77add9'
                ] INTO next_assigned_users;
            WHEN 4 THEN 
                next_step_name := 'Ready for Pickup';
                next_assigned_users := '{}';
            WHEN 5 THEN 
                next_step_name := 'Released';
                next_assigned_users := '{}';
            ELSE
                next_step_name := 'Completed';
                next_assigned_users := '{}';
        END CASE;
        
    ELSIF p_action = 'reject' THEN
        -- Keep same step but mark as rejected
        next_step := current_assignment.current_step;
        next_step_name := current_assignment.current_step_name;
        next_assigned_users := current_assignment.assigned_to;
        
    ELSE
        RAISE EXCEPTION 'Invalid action: %', p_action;
    END IF;
    
    -- Update workflow assignment
    UPDATE workflow_assignments SET
        current_step = next_step,
        current_step_name = next_step_name,
        assigned_to = next_assigned_users,
        status = CASE 
            WHEN p_action = 'reject' THEN 'rejected'
            WHEN next_step >= 5 THEN 'completed'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE request_id = p_request_id;
    
    -- Log the action
    INSERT INTO workflow_history (
        request_id,
        certificate_type,
        action,
        from_step,
        to_step,
        performed_by,
        comments
    ) VALUES (
        p_request_id,
        current_assignment.certificate_type,
        p_action,
        current_assignment.current_step,
        next_step,
        p_performed_by,
        p_comments
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workflow_assignments', 'workflow_history')
ORDER BY tablename;

-- Success message
SELECT 'Simple workflow tables created successfully!' as status;
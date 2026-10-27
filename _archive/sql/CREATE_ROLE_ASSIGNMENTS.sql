-- =====================================================
-- OPTIONAL: ROLE MAPPING TABLE
-- =====================================================
-- While workflow configurations are stored as JSON, 
-- this table helps link specific "Official Roles" to actual system Users.

-- Check if you need this:
-- 1. If you manually assign users in the UI, you DON'T need this.
-- 2. If you want the system to AUTOMATICALLY find "The current Captain" 
--    without you manually selecting their name every time, run this.

CREATE TABLE IF NOT EXISTS official_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Brgy. Captain', 'Brgy. Secretary'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default role slots (you will need to map these to real user IDs in the database)
INSERT INTO official_role_assignments (role_key) VALUES 
('Brgy. Captain'), 
('Brgy. Secretary'), 
('Brgy. Treasurer'),
('Brgy. Clerk'),
('Brgy. Admin'),
('SK Chairman')
ON CONFLICT (role_key) DO NOTHING;

-- INDEX for fast lookups
CREATE INDEX IF NOT EXISTS idx_role_assignments_key ON official_role_assignments(role_key);

SELECT 'Role assignment table created successfully.' as status;

-- Add staff members to barangay_officials table
-- Run this in Supabase SQL Editor to add the staff members

INSERT INTO barangay_officials (name, position, position_type, committee, description, order_index) VALUES
('ROBERT D. SANTOS', 'Administrator', 'staff', NULL, 'Managing daily administrative operations and coordinating barangay services.', 12),
('PERLITA C. DE JESUS', 'Assistant Secretary', 'staff', NULL, 'Assisting with administrative functions and document management.', 13),
('KHINZ JANZL V. BARROGA', 'Assistant Administrator', 'staff', NULL, 'Supporting administrative operations and community programs.', 14),
('EMIL D. ROBLES', 'Barangay Keeper', 'staff', NULL, 'Maintaining barangay facilities and ensuring proper upkeep of community assets.', 15),
('CIELITO B. DE LEON', 'Clerk', 'staff', NULL, 'Processing documents and providing clerical support to barangay operations.', 16)
ON CONFLICT (name) DO NOTHING;
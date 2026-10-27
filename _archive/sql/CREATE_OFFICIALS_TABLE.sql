-- Create barangay_officials table in Supabase
-- Copy and paste this SQL into your Supabase SQL Editor

CREATE TABLE barangay_officials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100) NOT NULL,
  position_type VARCHAR(50) NOT NULL,
  committee VARCHAR(255),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the barangay officials data
INSERT INTO barangay_officials (name, position, position_type, committee, description, order_index) VALUES
('ALEXANDER C. MANIO', 'Punong Barangay', 'captain', NULL, 'Leading the barangay with vision and dedication to community development and public service.', 1),
('ROYCE ANN C. GALVEZ', 'Secretary', 'secretary', NULL, 'Managing administrative functions and maintaining official records of the barangay.', 2),
('MA. LUZ S. REYES', 'Treasurer', 'treasurer', NULL, 'Managing barangay finances and ensuring proper allocation of resources.', 3),
('JOHN RUZZEL C. SANTOS', 'SK Chairman', 'sk_chairman', NULL, 'Leading youth programs and representing the voice of young residents in the barangay.', 4),
('JOELITO C. MANIO', 'Kagawad 1', 'kagawad', 'Committee on Health', 'Overseeing health programs and medical services for the community''s well-being.', 5),
('ENGELBERT M. INDUCTIVO', 'Kagawad 2', 'kagawad', 'Committee on Education', 'Promoting educational programs and youth development initiatives in the barangay.', 6),
('NORMANDO T. SANTOS', 'Kagawad 3', 'kagawad', 'Committee on Peace & Order', 'Ensuring community safety and maintaining peace and order in the barangay.', 7),
('JOPHET M. TURLA', 'Kagawad 4', 'kagawad', 'Committee on Infrastructure', 'Overseeing infrastructure development and public works projects.', 8),
('JOHN BRYAN C. CRUZ', 'Kagawad 5', 'kagawad', 'Committee on Environment', 'Promoting environmental protection and sustainable development programs.', 9),
('ARNEL D. BERNARDINO', 'Kagawad 6', 'kagawad', 'Committee on Agriculture', 'Supporting agricultural programs and livelihood development for farmers.', 10),
('LORENA G. LOPEZ', 'Kagawad 7', 'kagawad', 'Committee on Social Services', 'Managing social welfare programs and community assistance initiatives.', 11),
-- Staff Members
('ROBERT D. SANTOS', 'Administrator', 'staff', NULL, 'Managing daily administrative operations and coordinating barangay services.', 12),
('PERLITA C. DE JESUS', 'Assistant Secretary', 'staff', NULL, 'Assisting with administrative functions and document management.', 13),
('KHINZ JANZL V. BARROGA', 'Assistant Administrator', 'staff', NULL, 'Supporting administrative operations and community programs.', 14),
('EMIL D. ROBLES', 'Barangay Keeper', 'staff', NULL, 'Maintaining barangay facilities and ensuring proper upkeep of community assets.', 15),
('CIELITO B. DE LEON', 'Clerk', 'staff', NULL, 'Processing documents and providing clerical support to barangay operations.', 16);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_officials_position_type ON barangay_officials(position_type);
CREATE INDEX IF NOT EXISTS idx_officials_active ON barangay_officials(is_active);
CREATE INDEX IF NOT EXISTS idx_officials_order ON barangay_officials(order_index);
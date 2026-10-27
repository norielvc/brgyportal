-- Create educational_assistance table in Supabase
-- Copy and paste this SQL into your Supabase SQL Editor

CREATE TABLE educational_assistance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 12 AND age <= 30),
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  civil_status VARCHAR(30) NOT NULL CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  
  -- Address Information
  purok VARCHAR(20) NOT NULL CHECK (purok IN ('Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'NV9')),
  house_number VARCHAR(50), -- For Purok 1-6
  phase_number VARCHAR(10), -- For NV9
  block_number VARCHAR(10), -- For NV9
  lot_number VARCHAR(10),   -- For NV9
  full_address TEXT NOT NULL,
  
  -- Contact Information
  cellphone_number VARCHAR(20) NOT NULL,
  
  -- Academic Information
  year_grade VARCHAR(50) NOT NULL, -- e.g., "Grade 7", "1st Year College", "4th Year College"
  academic_year VARCHAR(20) DEFAULT '2024-2025',
  school_to_attend VARCHAR(200) NOT NULL,
  school_attending VARCHAR(200), -- Current school if transferring
  
  -- Academic Performance
  academic_awards TEXT, -- Dean's Lister, With High Honor, With Honor, etc.
  gwa DECIMAL(4,2) CHECK (gwa >= 1.00 AND gwa <= 5.00), -- General Weighted Average
  
  -- Application Status
  application_status VARCHAR(30) DEFAULT 'pending' CHECK (application_status IN ('pending', 'under_review', 'qualified', 'not_qualified', 'approved', 'rejected')),
  qualification_notes TEXT,
  
  -- Metadata
  reference_number VARCHAR(20) UNIQUE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_educational_assistance_status ON educational_assistance(application_status);
CREATE INDEX IF NOT EXISTS idx_educational_assistance_year_grade ON educational_assistance(year_grade);
CREATE INDEX IF NOT EXISTS idx_educational_assistance_submitted ON educational_assistance(submitted_at);
CREATE INDEX IF NOT EXISTS idx_educational_assistance_reference ON educational_assistance(reference_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_educational_assistance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_educational_assistance_updated_at
    BEFORE UPDATE ON educational_assistance
    FOR EACH ROW
    EXECUTE FUNCTION update_educational_assistance_updated_at();

-- Create function to generate reference number
CREATE OR REPLACE FUNCTION generate_educational_assistance_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix VARCHAR(4);
    sequence_num INTEGER;
    new_reference VARCHAR(20);
BEGIN
    -- Get current year suffix (e.g., 2024 -> 24)
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(RIGHT(reference_number, 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM educational_assistance
    WHERE reference_number LIKE 'EA' || year_suffix || '%';
    
    -- Generate new reference number (e.g., EA240001)
    new_reference := 'EA' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    NEW.reference_number := new_reference;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_educational_assistance_reference
    BEFORE INSERT ON educational_assistance
    FOR EACH ROW
    WHEN (NEW.reference_number IS NULL)
    EXECUTE FUNCTION generate_educational_assistance_reference();

-- Insert sample data for testing
INSERT INTO educational_assistance (
    first_name, middle_name, last_name, age, gender, civil_status,
    purok, house_number, full_address, cellphone_number,
    year_grade, school_to_attend, academic_awards, gwa
) VALUES 
(
    'Juan Carlos', 'Dela', 'Cruz', 18, 'Male', 'Single',
    'Purok 1', '123', 'House #123, Purok 1, Iba O'' Este, Calumpit, Bulacan',
    '09171234567', '1st Year College', 'Bulacan State University',
    'With High Honor', 1.25
),
(
    'Maria', 'Santos', 'Garcia', 16, 'Female', 'Single',
    'NV9', NULL, 'Phase 2, Block 5, Lot 10, NV9, Iba O'' Este, Calumpit, Bulacan',
    '09281234567', 'Grade 11', 'Calumpit National High School',
    'With Honor', 1.50
);

-- Add comments for documentation
COMMENT ON TABLE educational_assistance IS 'Educational Assistance Program applications for Barangay Iba O'' Este';
COMMENT ON COLUMN educational_assistance.reference_number IS 'Auto-generated reference number (e.g., EA240001)';
COMMENT ON COLUMN educational_assistance.purok IS 'Purok location within Iba O'' Este';
COMMENT ON COLUMN educational_assistance.gwa IS 'General Weighted Average (1.00-5.00 scale)';
COMMENT ON COLUMN educational_assistance.application_status IS 'Current status of the application';
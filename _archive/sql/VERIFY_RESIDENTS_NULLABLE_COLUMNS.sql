-- =====================================================
-- VERIFY RESIDENTS TABLE ALLOWS NULL VALUES
-- =====================================================
-- This script checks which columns in residents table allow NULL

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'residents'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- Most columns should show is_nullable = 'YES'
-- Only id, tenant_id, and created_at might be NOT NULL

-- =====================================================
-- IF ANY REQUIRED COLUMNS ARE NOT NULLABLE:
-- =====================================================
-- Run these commands to make them nullable:

-- ALTER TABLE residents ALTER COLUMN middle_name DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN suffix DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN age DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN gender DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN civil_status DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN place_of_birth DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN house_number DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN purok DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN barangay DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN municipality DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN province DROP NOT NULL;
-- ALTER TABLE residents ALTER COLUMN contact_number DROP NOT NULL;


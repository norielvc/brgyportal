-- =====================================================
-- ADDRESS SPLIT - USEFUL SQL QUERIES
-- =====================================================

-- =====================================================
-- 1. VERIFY MIGRATION WAS SUCCESSFUL
-- =====================================================

-- Check if new columns exist
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'residents' 
AND column_name IN ('house_number', 'purok', 'barangay', 'municipality', 'province', 'full_address_computed')
ORDER BY ordinal_position;

-- Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_update_full_address';

-- Check if function exists
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('generate_full_address', 'update_full_address_trigger');

-- =====================================================
-- 2. TEST THE TRIGGER
-- =====================================================

-- Insert a test record to verify trigger works
INSERT INTO residents (
    tenant_id,
    first_name,
    last_name,
    house_number,
    purok,
    barangay,
    municipality,
    province,
    gender,
    civil_status
) VALUES (
    'your-tenant-id',  -- Replace with your actual tenant_id
    'Juan',
    'Dela Cruz',
    '2706',
    'Purok Maharlika',
    'IBA O'' ESTE',
    'CALUMPIT',
    'PROVINCE OF BULACAN',
    'MALE',
    'SINGLE'
) RETURNING id, full_address_computed;

-- Expected output: full_address_computed should be auto-generated
-- "HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN"

-- =====================================================
-- 3. VIEW EXISTING DATA
-- =====================================================

-- View all address fields for existing residents
SELECT 
    id,
    first_name,
    last_name,
    house_number,
    purok,
    barangay,
    municipality,
    province,
    full_address_computed,
    residential_address  -- Old field for comparison
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
LIMIT 10;

-- =====================================================
-- 4. UPDATE BARANGAY SETTINGS (IF MISSING PROVINCE)
-- =====================================================

-- Check current settings
SELECT 
    key,
    value->'headerInfo'->>'barangayName' as barangay,
    value->'headerInfo'->>'municipality' as municipality,
    value->'headerInfo'->>'province' as province
FROM barangay_settings
WHERE key = 'certificate_settings';

-- Add province to settings if missing
UPDATE barangay_settings
SET value = jsonb_set(
    value,
    '{headerInfo,province}',
    '"Province of Bulacan"'::jsonb
)
WHERE key = 'certificate_settings'
AND value->'headerInfo'->>'province' IS NULL;

-- Verify update
SELECT value->'headerInfo' as header_info
FROM barangay_settings
WHERE key = 'certificate_settings';

-- =====================================================
-- 5. MIGRATE EXISTING DATA (OPTIONAL)
-- =====================================================

-- Preview what would be extracted from existing addresses
SELECT 
    id,
    residential_address,
    CASE 
        WHEN residential_address ~* 'HOUSE NO\.\s*([^,]+)' 
        THEN TRIM(REGEXP_REPLACE(residential_address, '.*HOUSE NO\.\s*([^,]+).*', '\1', 'i'))
        ELSE NULL
    END as extracted_house_number,
    CASE 
        WHEN residential_address ~* 'PUROK\s+([^,]+)' 
        THEN TRIM(REGEXP_REPLACE(residential_address, '.*PUROK\s+([^,]+).*', '\1', 'i'))
        ELSE NULL
    END as extracted_purok
FROM residents
WHERE residential_address IS NOT NULL
AND tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
LIMIT 10;

-- Actually migrate existing data (run after previewing)
-- WARNING: Review the preview first!
UPDATE residents
SET 
    house_number = CASE 
        WHEN residential_address ~* 'HOUSE NO\.\s*([^,]+)' 
        THEN TRIM(REGEXP_REPLACE(residential_address, '.*HOUSE NO\.\s*([^,]+).*', '\1', 'i'))
        ELSE NULL
    END,
    purok = CASE 
        WHEN residential_address ~* 'PUROK\s+([^,]+)' 
        THEN TRIM(REGEXP_REPLACE(residential_address, '.*PUROK\s+([^,]+).*', '\1', 'i'))
        ELSE NULL
    END,
    barangay = 'IBA O'' ESTE',  -- Set your barangay name
    municipality = 'CALUMPIT',   -- Set your municipality
    province = 'PROVINCE OF BULACAN'  -- Set your province
WHERE residential_address IS NOT NULL
AND house_number IS NULL  -- Only update if not already set
AND tenant_id = 'your-tenant-id';  -- Replace with your tenant_id

-- =====================================================
-- 6. BULK UPDATE FOR SPECIFIC TENANT
-- =====================================================

-- Set barangay, municipality, province for all residents in a tenant
-- (Use this if you want to populate these fields for existing records)
UPDATE residents
SET 
    barangay = 'IBA O'' ESTE',
    municipality = 'CALUMPIT',
    province = 'PROVINCE OF BULACAN'
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND (barangay IS NULL OR municipality IS NULL OR province IS NULL);

-- =====================================================
-- 7. REPORTING QUERIES
-- =====================================================

-- Count residents per purok
SELECT 
    purok,
    COUNT(*) as resident_count
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND purok IS NOT NULL
GROUP BY purok
ORDER BY resident_count DESC;

-- List all unique puroks
SELECT DISTINCT purok
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND purok IS NOT NULL
ORDER BY purok;

-- Find residents with incomplete address
SELECT 
    id,
    first_name,
    last_name,
    house_number,
    purok,
    barangay,
    municipality,
    province
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND (
    house_number IS NULL 
    OR purok IS NULL 
    OR barangay IS NULL 
    OR municipality IS NULL 
    OR province IS NULL
);

-- =====================================================
-- 8. SEARCH QUERIES
-- =====================================================

-- Search by house number
SELECT 
    first_name,
    last_name,
    house_number,
    purok,
    full_address_computed
FROM residents
WHERE house_number ILIKE '%2706%'
AND tenant_id = 'your-tenant-id';  -- Replace with your tenant_id

-- Search by purok
SELECT 
    first_name,
    last_name,
    house_number,
    purok,
    full_address_computed
FROM residents
WHERE purok = 'Purok 1'
AND tenant_id = 'your-tenant-id';  -- Replace with your tenant_id

-- Search in full address
SELECT 
    first_name,
    last_name,
    full_address_computed
FROM residents
WHERE full_address_computed ILIKE '%maharlika%'
AND tenant_id = 'your-tenant-id';  -- Replace with your tenant_id

-- =====================================================
-- 9. VALIDATION QUERIES
-- =====================================================

-- Check for invalid purok values (not in standard list)
SELECT DISTINCT purok
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND purok IS NOT NULL
AND purok NOT IN (
    'Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6',
    'NV9', 'Purok Maharlika', 'Sitio Banawe'
)
ORDER BY purok;

-- Check for missing full_address_computed
SELECT 
    id,
    first_name,
    last_name,
    house_number,
    purok,
    full_address_computed
FROM residents
WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
AND (house_number IS NOT NULL OR purok IS NOT NULL)
AND full_address_computed IS NULL;

-- =====================================================
-- 10. CLEANUP QUERIES
-- =====================================================

-- Remove test data (if you inserted test records)
DELETE FROM residents
WHERE first_name = 'Juan' 
AND last_name = 'Dela Cruz'
AND house_number = '2706'
AND tenant_id = 'your-tenant-id';  -- Replace with your tenant_id

-- =====================================================
-- 11. ROLLBACK (IF NEEDED)
-- =====================================================

-- Drop the trigger
DROP TRIGGER IF EXISTS trg_update_full_address ON residents;

-- Drop the functions
DROP FUNCTION IF EXISTS update_full_address_trigger();
DROP FUNCTION IF EXISTS generate_full_address(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);

-- Drop the indexes
DROP INDEX IF EXISTS idx_residents_purok;
DROP INDEX IF EXISTS idx_residents_barangay;
DROP INDEX IF EXISTS idx_residents_municipality;

-- Remove the columns (WARNING: This deletes data!)
-- Only run if you need to completely rollback
/*
ALTER TABLE residents 
DROP COLUMN IF EXISTS house_number,
DROP COLUMN IF EXISTS purok,
DROP COLUMN IF EXISTS barangay,
DROP COLUMN IF EXISTS municipality,
DROP COLUMN IF EXISTS province,
DROP COLUMN IF EXISTS full_address_computed;
*/

-- =====================================================
-- 12. PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze table after migration
ANALYZE residents;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'residents'
AND indexname LIKE 'idx_residents_%';

-- =====================================================
-- 13. EXPORT DATA
-- =====================================================

-- Export residents with structured address to CSV
COPY (
    SELECT 
        first_name,
        last_name,
        house_number,
        purok,
        barangay,
        municipality,
        province,
        full_address_computed
    FROM residents
    WHERE tenant_id = 'your-tenant-id'  -- Replace with your tenant_id
    ORDER BY last_name, first_name
) TO '/tmp/residents_addresses.csv' WITH CSV HEADER;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Replace 'your-tenant-id' with your actual tenant ID in all queries
-- 2. Test queries on a small dataset first
-- 3. Always backup before running UPDATE or DELETE queries
-- 4. The trigger automatically updates full_address_computed on INSERT/UPDATE
-- 5. Keep residential_address column for backward compatibility

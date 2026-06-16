-- =====================================================
-- NEXT STEPS AFTER SUCCESSFUL MIGRATION
-- =====================================================
-- Run these queries in order to verify and test

-- =====================================================
-- STEP 1: Verify the trigger was created
-- =====================================================
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_update_full_address';

-- Expected: Should show 1 row with trigger_name = 'trg_update_full_address'

-- =====================================================
-- STEP 2: Verify the functions were created
-- =====================================================
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('generate_full_address', 'update_full_address_trigger')
AND routine_schema = 'public';

-- Expected: Should show 2 rows (both functions)

-- =====================================================
-- STEP 3: Get your tenant_id
-- =====================================================
SELECT DISTINCT tenant_id 
FROM residents 
LIMIT 5;

-- Copy the tenant_id from the result - you'll need it for the next steps

-- =====================================================
-- STEP 4: Check barangay_settings for province
-- =====================================================
SELECT 
    key,
    value->'headerInfo'->>'barangayName' as barangay,
    value->'headerInfo'->>'municipality' as municipality,
    value->'headerInfo'->>'province' as province
FROM barangay_settings
WHERE key = 'certificate_settings';

-- If province is NULL or empty, run this:
UPDATE barangay_settings
SET value = jsonb_set(
    value,
    '{headerInfo,province}',
    '"Province of Bulacan"'::jsonb
)
WHERE key = 'certificate_settings';

-- =====================================================
-- STEP 5: Test the trigger with a sample insert
-- =====================================================
-- IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' with your actual tenant_id from Step 3

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
    civil_status,
    age
) VALUES (
    'YOUR_TENANT_ID_HERE',  -- ← REPLACE THIS WITH YOUR TENANT_ID
    'Juan',
    'TestAddress',
    '2706',
    'Purok Maharlika',
    'IBA O'' ESTE',
    'CALUMPIT',
    'PROVINCE OF BULACAN',
    'MALE',
    'SINGLE',
    25
) RETURNING 
    id, 
    first_name,
    last_name,
    house_number,
    purok,
    barangay,
    municipality,
    province,
    full_address_computed;

-- Expected: full_address_computed should show:
-- "HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN"

-- =====================================================
-- STEP 6: View all residents with new address fields
-- =====================================================
-- IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' with your actual tenant_id

SELECT 
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
WHERE tenant_id = 'YOUR_TENANT_ID_HERE'  -- ← REPLACE THIS
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 7: Test updating a record (trigger should fire)
-- =====================================================
-- Get the ID of the test record you just created
-- Then update it to test the trigger

UPDATE residents
SET house_number = '2706-A'
WHERE first_name = 'Juan' 
AND last_name = 'TestAddress'
RETURNING 
    id,
    house_number,
    full_address_computed;

-- Expected: full_address_computed should update to:
-- "HOUSE NO. 2706-A, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN"

-- =====================================================
-- STEP 8: Clean up test data (optional)
-- =====================================================
-- Remove the test record after verification

DELETE FROM residents
WHERE first_name = 'Juan' 
AND last_name = 'TestAddress';

-- =====================================================
-- STEP 9: Check existing residents (if any)
-- =====================================================
-- See how many residents have the old address format

SELECT 
    COUNT(*) as total_residents,
    COUNT(house_number) as with_house_number,
    COUNT(purok) as with_purok,
    COUNT(residential_address) as with_old_address
FROM residents
WHERE tenant_id = 'YOUR_TENANT_ID_HERE';  -- ← REPLACE THIS

-- =====================================================
-- STEP 10: (Optional) Bulk update existing residents
-- =====================================================
-- If you want to set barangay, municipality, province for all existing residents
-- IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' and adjust the values

UPDATE residents
SET 
    barangay = 'IBA O'' ESTE',
    municipality = 'CALUMPIT',
    province = 'PROVINCE OF BULACAN'
WHERE tenant_id = 'YOUR_TENANT_ID_HERE'  -- ← REPLACE THIS
AND (barangay IS NULL OR municipality IS NULL OR province IS NULL);

-- Check how many were updated
SELECT 
    COUNT(*) as updated_count
FROM residents
WHERE tenant_id = 'YOUR_TENANT_ID_HERE'  -- ← REPLACE THIS
AND barangay IS NOT NULL 
AND municipality IS NOT NULL 
AND province IS NOT NULL;

-- =====================================================
-- VERIFICATION COMPLETE!
-- =====================================================
-- If all steps passed, your database is ready!
-- Next steps:
-- 1. Update your frontend forms (see ADDRESS_QUICK_START.md)
-- 2. Update your API endpoints
-- 3. Test in your application

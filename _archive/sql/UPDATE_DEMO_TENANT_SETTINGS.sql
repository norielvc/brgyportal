-- =====================================================
-- UPDATE DEMO TENANT BARANGAY SETTINGS
-- =====================================================
-- This updates the demo tenant to have simplified address fields

-- 1. Update barangay_settings for demo tenant
UPDATE barangay_settings
SET value = jsonb_set(
    jsonb_set(
        jsonb_set(
            value,
            '{headerInfo,barangayName}',
            '"BARANGAY DEMO"'::jsonb
        ),
        '{headerInfo,municipality}',
        '"DEMO"'::jsonb
    ),
    '{headerInfo,province}',
    '"DEMO"'::jsonb
)
WHERE key = 'certificate_settings'
AND tenant_id = 'demo';

-- 2. Verify the update
SELECT 
    tenant_id,
    key,
    value->'headerInfo'->>'barangayName' as barangay,
    value->'headerInfo'->>'municipality' as municipality,
    value->'headerInfo'->>'province' as province
FROM barangay_settings
WHERE tenant_id = 'demo'
AND key = 'certificate_settings';

-- Expected result:
-- tenant_id | key                    | barangay       | municipality | province
-- demo      | certificate_settings   | BARANGAY DEMO  | DEMO         | DEMO

-- =====================================================
-- OPTIONAL: Update existing demo residents
-- =====================================================
-- If you want to update existing demo residents to use the new address structure

-- Preview what will be updated
SELECT 
    id,
    first_name,
    last_name,
    residential_address,
    house_number,
    purok,
    barangay,
    municipality,
    province
FROM residents
WHERE tenant_id = 'demo'
LIMIT 10;

-- Update all demo residents with the new barangay/municipality/province
UPDATE residents
SET 
    barangay = 'BARANGAY DEMO',
    municipality = 'DEMO',
    province = 'DEMO'
WHERE tenant_id = 'demo'
AND (barangay IS NULL OR municipality IS NULL OR province IS NULL);

-- Verify the update
SELECT 
    COUNT(*) as updated_count,
    barangay,
    municipality,
    province
FROM residents
WHERE tenant_id = 'demo'
GROUP BY barangay, municipality, province;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. The purok dropdown options are defined in frontend/src/lib/addressHelper.js
-- 2. For demo tenant, users can select from Purok 1-5 (already in the dropdown)
-- 3. The barangay, municipality, and province will now auto-fill as "BARANGAY DEMO", "DEMO", "DEMO"
-- 4. After running this, refresh your frontend to see the changes

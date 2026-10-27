-- =====================================================
-- DELETE ALL RESIDENTS FOR IBAOESTE TENANT
-- =====================================================
-- WARNING: This will permanently delete all resident records for ibaoeste tenant
-- Make sure you have a backup before running this!

-- 1. First, check how many residents will be deleted
SELECT 
    COUNT(*) as total_residents_to_delete,
    tenant_id
FROM residents
WHERE tenant_id = 'ibaoeste'
GROUP BY tenant_id;

-- Expected output: Shows the count of residents that will be deleted

-- =====================================================
-- 2. Preview the residents that will be deleted (first 10)
-- =====================================================
SELECT 
    id,
    first_name,
    last_name,
    residential_address,
    house_number,
    purok,
    created_at
FROM residents
WHERE tenant_id = 'ibaoeste'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 3. DELETE ALL RESIDENTS FOR IBAOESTE
-- =====================================================
-- CAUTION: This action cannot be undone!
-- Make sure you're ready to delete before running this

DELETE FROM residents
WHERE tenant_id = 'ibaoeste';

-- =====================================================
-- 4. Verify deletion
-- =====================================================
-- Check that all ibaoeste residents are deleted
SELECT 
    COUNT(*) as remaining_residents
FROM residents
WHERE tenant_id = 'ibaoeste';

-- Expected output: 0 (zero residents remaining)

-- =====================================================
-- 5. Check other tenants are unaffected
-- =====================================================
-- Verify that other tenants' data is still intact
SELECT 
    tenant_id,
    COUNT(*) as resident_count
FROM residents
GROUP BY tenant_id
ORDER BY tenant_id;

-- Expected output: Should show counts for other tenants (demo, etc.) but NOT ibaoeste

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This only deletes residents, not other data (users, settings, etc.)
-- 2. Related records in other tables may be affected if there are foreign keys
-- 3. After deletion, you can bulk upload the new residents with updated address structure
-- 4. The new residents will have the structured address fields (house_number, purok, etc.)

-- =====================================================
-- ROLLBACK (if you made a mistake)
-- =====================================================
-- If you have a backup, you can restore using:
-- COPY residents FROM '/path/to/backup.csv' WITH CSV HEADER;
-- Or restore from your database backup

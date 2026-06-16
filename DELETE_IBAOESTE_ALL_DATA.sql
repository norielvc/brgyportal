-- =====================================================
-- DELETE ALL DATA FOR IBAOESTE TENANT (CORRECT ORDER)
-- =====================================================
-- This deletes in the correct order to avoid foreign key constraint errors

-- =====================================================
-- STEP 1: Check what will be deleted
-- =====================================================

-- Count residents
SELECT 'Residents' as table_name, COUNT(*) as count
FROM residents
WHERE tenant_id = 'ibaoeste'

UNION ALL

-- Count certificate requests
SELECT 'Certificate Requests' as table_name, COUNT(*) as count
FROM certificate_requests
WHERE tenant_id = 'ibaoeste'

UNION ALL

-- Count workflow assignments
SELECT 'Workflow Assignments' as table_name, COUNT(*) as count
FROM workflow_assignments
WHERE tenant_id = 'ibaoeste'

UNION ALL

-- Count workflow history
SELECT 'Workflow History' as table_name, COUNT(*) as count
FROM workflow_history
WHERE tenant_id = 'ibaoeste';

-- =====================================================
-- STEP 2: DELETE IN CORRECT ORDER (to avoid FK errors)
-- =====================================================

-- 2.1 Delete workflow history first (no dependencies)
DELETE FROM workflow_history
WHERE tenant_id = 'ibaoeste';

-- 2.2 Delete workflow assignments
DELETE FROM workflow_assignments
WHERE tenant_id = 'ibaoeste';

-- 2.3 Delete certificate requests (references residents)
DELETE FROM certificate_requests
WHERE tenant_id = 'ibaoeste';

-- 2.4 Finally delete residents
DELETE FROM residents
WHERE tenant_id = 'ibaoeste';

-- =====================================================
-- STEP 3: Verify deletion
-- =====================================================

-- Check all tables are empty for ibaoeste
SELECT 'Residents' as table_name, COUNT(*) as remaining
FROM residents
WHERE tenant_id = 'ibaoeste'

UNION ALL

SELECT 'Certificate Requests' as table_name, COUNT(*) as remaining
FROM certificate_requests
WHERE tenant_id = 'ibaoeste'

UNION ALL

SELECT 'Workflow Assignments' as table_name, COUNT(*) as remaining
FROM workflow_assignments
WHERE tenant_id = 'ibaoeste'

UNION ALL

SELECT 'Workflow History' as table_name, COUNT(*) as remaining
FROM workflow_history
WHERE tenant_id = 'ibaoeste';

-- Expected: All counts should be 0

-- =====================================================
-- STEP 4: Verify other tenants are unaffected
-- =====================================================

SELECT 
    tenant_id,
    COUNT(*) as resident_count
FROM residents
GROUP BY tenant_id
ORDER BY tenant_id;

-- Should show demo and other tenants, but NOT ibaoeste

-- =====================================================
-- ALTERNATIVE: Use CASCADE (if you want automatic deletion)
-- =====================================================
-- If you want to avoid manual ordering in the future, you can just delete residents
-- and let the database cascade delete related records automatically:

/*
DELETE FROM residents
WHERE tenant_id = 'ibaoeste';
*/

-- This will work if your foreign keys have ON DELETE CASCADE
-- But the manual approach above is safer and more explicit

-- =====================================================
-- SUCCESS!
-- =====================================================
-- All ibaoeste data has been deleted
-- You can now bulk upload new residents with the updated address structure

-- =====================================================
-- CHECK RESIDENTS TABLE CONSTRAINTS AND REQUIREMENTS
-- =====================================================

-- 1. Check all constraints on residents table
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'residents'
AND nsp.nspname = 'public'
ORDER BY con.contype;

-- 2. Check which columns are NOT NULL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'residents'
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Check indexes on residents table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'residents'
AND schemaname = 'public';

-- 4. Test insert with minimal data (to identify required fields)
-- Uncomment to test:
/*
INSERT INTO residents (
    tenant_id,
    first_name,
    last_name
) VALUES (
    'ibaoeste',
    'TEST',
    'USER'
) RETURNING *;

-- Clean up test
DELETE FROM residents WHERE first_name = 'TEST' AND last_name = 'USER';
*/

-- 5. Check if there are any triggers that might fail
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'residents'
AND trigger_schema = 'public';

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Required (NOT NULL) columns should be:
-- - id (auto-generated)
-- - tenant_id (provided by API)
-- - created_at (provided by API)
-- 
-- All other columns should allow NULL
-- 
-- Triggers should be:
-- - trg_update_full_address (auto-generates full_address_computed)
-- - Any RLS policies should allow INSERT for authenticated users


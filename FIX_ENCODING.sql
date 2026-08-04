-- =====================================================
-- FIX ENCODING ISSUES IN RESIDENTS TABLE
-- =====================================================
-- Uses CHR(65533) = U+FFFD (Unicode replacement character)
-- to avoid copy-paste encoding issues with the literal character.
-- Run this in Supabase SQL Editor.
-- =====================================================

-- 1. Check how many records have the replacement character
SELECT COUNT(*) as corrupted_records
FROM residents
WHERE 
  first_name LIKE '%' || CHR(65533) || '%' OR
  last_name LIKE '%' || CHR(65533) || '%' OR
  middle_name LIKE '%' || CHR(65533) || '%' OR
  place_of_birth LIKE '%' || CHR(65533) || '%' OR
  barangay LIKE '%' || CHR(65533) || '%' OR
  municipality LIKE '%' || CHR(65533) || '%' OR
  province LIKE '%' || CHR(65533) || '%' OR
  purok LIKE '%' || CHR(65533) || '%';

-- 2. View sample corrupted records
SELECT id, first_name, last_name, middle_name
FROM residents
WHERE 
  first_name LIKE '%' || CHR(65533) || '%' OR
  last_name LIKE '%' || CHR(65533) || '%' OR
  middle_name LIKE '%' || CHR(65533) || '%'
LIMIT 20;

-- 3. Replace CHR(65533) with Ñ (most common in Filipino names)
-- full_name is a GENERATED column — it will auto-update from source columns.

UPDATE residents 
SET 
  first_name = REPLACE(first_name, CHR(65533), 'Ñ'),
  last_name = REPLACE(last_name, CHR(65533), 'Ñ'),
  middle_name = REPLACE(middle_name, CHR(65533), 'Ñ')
WHERE 
  first_name LIKE '%' || CHR(65533) || '%' OR
  last_name LIKE '%' || CHR(65533) || '%' OR
  middle_name LIKE '%' || CHR(65533) || '%';

-- 4. Fix address fields
UPDATE residents
SET
  place_of_birth = REPLACE(place_of_birth, CHR(65533), 'Ñ'),
  barangay = REPLACE(barangay, CHR(65533), 'Ñ'),
  municipality = REPLACE(municipality, CHR(65533), 'Ñ'),
  province = REPLACE(province, CHR(65533), 'Ñ'),
  purok = REPLACE(purok, CHR(65533), 'Ñ')
WHERE
  place_of_birth LIKE '%' || CHR(65533) || '%' OR
  barangay LIKE '%' || CHR(65533) || '%' OR
  municipality LIKE '%' || CHR(65533) || '%' OR
  province LIKE '%' || CHR(65533) || '%' OR
  purok LIKE '%' || CHR(65533) || '%';

-- 5. Verify the fix
SELECT COUNT(*) as remaining_corrupted
FROM residents
WHERE 
  first_name LIKE '%' || CHR(65533) || '%' OR
  last_name LIKE '%' || CHR(65533) || '%' OR
  middle_name LIKE '%' || CHR(65533) || '%';

-- 6. If still corrupted, check the raw hex bytes to identify the actual character
SELECT id, first_name, last_name, 
       encode(first_name::bytea, 'hex') as first_name_hex
FROM residents
WHERE 
  first_name LIKE '%' || CHR(65533) || '%' OR
  last_name LIKE '%' || CHR(65533) || '%'
LIMIT 10;

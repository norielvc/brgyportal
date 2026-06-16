# Step-by-Step SQL Execution Guide

## ⚠️ IMPORTANT: Run in This Exact Order

## Step 1: Run the Migration (REQUIRED FIRST)

Open the file `SPLIT_ADDRESS_COLUMNS.sql` and run it in Supabase SQL Editor.

This will:
- Add the new columns (house_number, purok, barangay, municipality, province, full_address_computed)
- Create the trigger function
- Create indexes

**Copy this entire block and run it:**

```sql
-- =====================================================
-- SPLIT ADDRESS INTO STRUCTURED FIELDS
-- =====================================================

-- 1. Add new address columns to residents table
ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS house_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS purok VARCHAR(100),
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),
ADD COLUMN IF NOT EXISTS municipality VARCHAR(100),
ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Province of Bulacan',
ADD COLUMN IF NOT EXISTS full_address_computed TEXT;

-- 2. Create function to auto-generate full address
CREATE OR REPLACE FUNCTION generate_full_address(
    p_house_number VARCHAR,
    p_purok VARCHAR,
    p_barangay VARCHAR,
    p_municipality VARCHAR,
    p_province VARCHAR
) RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(
        CONCAT_WS(', ',
            NULLIF(CONCAT('HOUSE NO. ', p_house_number), 'HOUSE NO. '),
            NULLIF(p_purok, ''),
            NULLIF(p_barangay, ''),
            NULLIF(p_municipality, ''),
            NULLIF(p_province, '')
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create trigger to auto-update full_address_computed
CREATE OR REPLACE FUNCTION update_full_address_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_address_computed := generate_full_address(
        NEW.house_number,
        NEW.purok,
        NEW.barangay,
        NEW.municipality,
        NEW.province
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_full_address ON residents;
CREATE TRIGGER trg_update_full_address
    BEFORE INSERT OR UPDATE OF house_number, purok, barangay, municipality, province
    ON residents
    FOR EACH ROW
    EXECUTE FUNCTION update_full_address_trigger();

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_residents_purok ON residents(purok);
CREATE INDEX IF NOT EXISTS idx_residents_barangay ON residents(barangay);
CREATE INDEX IF NOT EXISTS idx_residents_municipality ON residents(municipality);

-- 5. Add comments for documentation
COMMENT ON COLUMN residents.house_number IS 'House/Building number (e.g., 2706, 123-A)';
COMMENT ON COLUMN residents.purok IS 'Purok/Sitio name (e.g., Purok 1, Purok Maharlika, NV9)';
COMMENT ON COLUMN residents.barangay IS 'Barangay name - auto-populated from tenant settings';
COMMENT ON COLUMN residents.municipality IS 'Municipality name - auto-populated from tenant settings';
COMMENT ON COLUMN residents.province IS 'Province name - auto-populated from tenant settings (e.g., Province of Bulacan)';
COMMENT ON COLUMN residents.full_address_computed IS 'Auto-generated full address from components';
```

**Expected Result:** "Success. No rows returned"

---

## Step 2: Verify the Migration

After Step 1 succeeds, run this to verify:

```sql
-- Check if new columns exist
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'residents' 
AND column_name IN ('house_number', 'purok', 'barangay', 'municipality', 'province', 'full_address_computed')
ORDER BY column_name;
```

**Expected Result:** Should show 6 rows with the new columns

---

## Step 3: Check Your Tenant ID

Find your tenant_id:

```sql
-- Get your tenant_id
SELECT DISTINCT tenant_id 
FROM residents 
LIMIT 5;
```

**Copy the tenant_id** - you'll need it for the next steps.

---

## Step 4: Update Barangay Settings (Add Province)

Replace `'your-tenant-id'` with your actual tenant_id:

```sql
-- Check current settings
SELECT 
    key,
    value->'headerInfo'->>'barangayName' as barangay,
    value->'headerInfo'->>'municipality' as municipality,
    value->'headerInfo'->>'province' as province
FROM barangay_settings
WHERE key = 'certificate_settings';

-- Add province if missing
UPDATE barangay_settings
SET value = jsonb_set(
    value,
    '{headerInfo,province}',
    '"Province of Bulacan"'::jsonb
)
WHERE key = 'certificate_settings'
AND (value->'headerInfo'->>'province' IS NULL 
     OR value->'headerInfo'->>'province' = '');
```

---

## Step 5: Test with Sample Data

Replace `'your-tenant-id'` with your actual tenant_id:

```sql
-- Insert a test resident
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
    'your-tenant-id',  -- ← REPLACE THIS
    'Juan',
    'Test',
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
    full_address_computed;
```

**Expected Result:** Should show the auto-generated full_address_computed:
```
HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN
```

---

## Step 6: View Your Data

Replace `'your-tenant-id'` with your actual tenant_id:

```sql
-- View all residents with new address fields
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
WHERE tenant_id = 'your-tenant-id'  -- ← REPLACE THIS
ORDER BY last_name, first_name
LIMIT 10;
```

---

## Step 7: Clean Up Test Data (Optional)

If you want to remove the test record:

```sql
-- Delete test record
DELETE FROM residents
WHERE first_name = 'Juan' 
AND last_name = 'Test'
AND house_number = '2706';
```

---

## Common Issues & Solutions

### Issue 1: "column house_number does not exist"
**Solution:** You haven't run Step 1 yet. Run the migration SQL first.

### Issue 2: "relation residents does not exist"
**Solution:** Make sure you're connected to the correct database/project.

### Issue 3: "tenant_id not found"
**Solution:** Run Step 3 to find your actual tenant_id, then replace it in the queries.

### Issue 4: Province is NULL
**Solution:** Run Step 4 to add province to barangay_settings.

### Issue 5: full_address_computed is NULL
**Solution:** The trigger only fires on INSERT/UPDATE. Update the record:
```sql
UPDATE residents 
SET house_number = house_number 
WHERE id = 'your-resident-id';
```

---

## Quick Verification Checklist

After running all steps, verify:

- [ ] New columns exist (Step 2)
- [ ] Trigger function exists
- [ ] Barangay settings include province (Step 4)
- [ ] Test insert works (Step 5)
- [ ] full_address_computed is auto-generated
- [ ] Can view residents with new fields (Step 6)

---

## What to Do Next

After the migration is complete:

1. Update your frontend forms (see `ADDRESS_QUICK_START.md`)
2. Update your API endpoints to handle new fields
3. Test creating/editing residents in your app
4. Optionally migrate existing data (see `ADDRESS_SQL_QUERIES.sql` section 5)

---

## Need Help?

If you encounter errors:
1. Copy the exact error message
2. Note which step you're on
3. Check if you replaced `'your-tenant-id'` with your actual tenant ID
4. Make sure Step 1 (migration) completed successfully

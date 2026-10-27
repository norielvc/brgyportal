-- =====================================================
-- SPLIT ADDRESS INTO STRUCTURED FIELDS
-- =====================================================
-- This migration adds separate address columns to residents table
-- and provides a function to auto-populate barangay and municipality

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

-- 4. Optional: Migrate existing data (parse residential_address)
-- This is a best-effort migration - manual review recommended
-- Uncomment if you want to attempt automatic migration:

/*
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
    END
WHERE residential_address IS NOT NULL;
*/

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_residents_purok ON residents(purok);
CREATE INDEX IF NOT EXISTS idx_residents_barangay ON residents(barangay);
CREATE INDEX IF NOT EXISTS idx_residents_municipality ON residents(municipality);

-- 6. Add comments for documentation
COMMENT ON COLUMN residents.house_number IS 'House/Building number (e.g., 2706, 123-A)';
COMMENT ON COLUMN residents.purok IS 'Purok/Sitio name (e.g., Purok 1, Purok Maharlika, NV9)';
COMMENT ON COLUMN residents.barangay IS 'Barangay name - auto-populated from tenant settings';
COMMENT ON COLUMN residents.municipality IS 'Municipality name - auto-populated from tenant settings';
COMMENT ON COLUMN residents.province IS 'Province name - auto-populated from tenant settings (e.g., Province of Bulacan)';
COMMENT ON COLUMN residents.full_address_computed IS 'Auto-generated full address from components';

-- =====================================================
-- NOTES FOR IMPLEMENTATION:
-- =====================================================
-- 1. Keep residential_address column for backward compatibility
-- 2. New forms should use structured fields (house_number, purok)
-- 3. Barangay and Municipality auto-filled from barangay_settings
-- 4. full_address_computed is auto-generated via trigger
-- 5. Consider adding validation for purok values (Purok 1-6, NV9, etc.)

-- Run in Supabase → SQL Editor (once per project)
-- Adds columns used by Business Permit OR assignment (Preparation step)

-- 1) Table may not exist yet — use CREATE_OFFICIAL_RECEIPTS_TABLE.sql first if needed

ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);

ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS control_number VARCHAR(50);

ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS html_content TEXT;

-- Optional payor columns (some projects use payer_* naming)
ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS payer_name TEXT;

ALTER TABLE official_receipts
  ADD COLUMN IF NOT EXISTS payer_address TEXT;

CREATE INDEX IF NOT EXISTS idx_official_receipts_tenant_id
  ON official_receipts (tenant_id);

CREATE INDEX IF NOT EXISTS idx_official_receipts_file_path
  ON official_receipts (file_path);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'official_receipts'
ORDER BY ordinal_position;

-- Run once in Supabase SQL Editor before import-census-2026.js (--confirm)
-- Stores structured census fields + full row snapshot in census_extras

ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS census_resident_number TEXT,
  ADD COLUMN IF NOT EXISTS subdivision TEXT,
  ADD COLUMN IF NOT EXISTS is_household_head BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_head_of_family BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_solo_parent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_registered_voter BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS residency_type TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS monthly_salary TEXT,
  ADD COLUMN IF NOT EXISTS relation_to_household_head TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT,
  ADD COLUMN IF NOT EXISTS household_head_name TEXT,
  ADD COLUMN IF NOT EXISTS family_number TEXT,
  ADD COLUMN IF NOT EXISTS volunteer TEXT,
  ADD COLUMN IF NOT EXISTS census_notes TEXT,
  ADD COLUMN IF NOT EXISTS ec_card_number TEXT,
  ADD COLUMN IF NOT EXISTS census_extras JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_residents_tenant_census_number
  ON public.residents (tenant_id, census_resident_number)
  WHERE census_resident_number IS NOT NULL AND census_resident_number <> '';

CREATE INDEX IF NOT EXISTS idx_residents_subdivision ON public.residents (tenant_id, subdivision);
CREATE INDEX IF NOT EXISTS idx_residents_family_number ON public.residents (tenant_id, family_number);

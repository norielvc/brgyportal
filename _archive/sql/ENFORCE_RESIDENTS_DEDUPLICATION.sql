-- =====================================================
-- ENFORCE RESIDENT UNIQUE CONSTRAINT & DEDUPLICATION
-- =====================================================

-- 1. Create a unique index on (tenant_id, last_name, first_name, middle_name, suffix, date_of_birth)
-- This guarantees that identical resident records cannot be inserted twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_residents_unique_identity 
ON public.residents (
    tenant_id,
    UPPER(TRIM(last_name)),
    UPPER(TRIM(first_name)),
    UPPER(TRIM(COALESCE(middle_name, ''))),
    UPPER(TRIM(COALESCE(suffix, ''))),
    COALESCE(date_of_birth, '1970-01-01'::DATE)
);

-- 2. Index for rapid token search
CREATE INDEX IF NOT EXISTS idx_residents_search_tokens 
ON public.residents (
    tenant_id,
    last_name,
    first_name
);

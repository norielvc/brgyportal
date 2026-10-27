-- Create residents table adjusted for provided Excel structure
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT DEFAULT '',
    suffix TEXT DEFAULT '',
    age INTEGER,
    gender TEXT,
    civil_status TEXT,
    date_of_birth DATE,
    place_of_birth TEXT,
    residential_address TEXT,
    contact_number TEXT,
    pending_case BOOLEAN DEFAULT FALSE,
    case_record_history TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version 2: Use a more standard concatenation that PostgreSQL considers immutable
-- We use COALESCE to handle nulls safely
ALTER TABLE residents DROP COLUMN IF EXISTS full_name;
ALTER TABLE residents ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
    first_name || ' ' || 
    COALESCE(middle_name || ' ', '') || 
    last_name || 
    COALESCE(' ' || suffix, '')
) STORED;

-- Add index for search performance
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON residents(full_name);
CREATE INDEX IF NOT EXISTS idx_residents_last_name ON residents(last_name);
CREATE INDEX IF NOT EXISTS idx_residents_first_name ON residents(first_name);

-- Enable pg_trgm for fuzzy search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_residents_full_name_trgm ON residents USING gin (full_name gin_trgm_ops);

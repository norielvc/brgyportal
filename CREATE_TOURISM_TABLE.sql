-- Tourism & Lifestyle Destinations Table
-- Run this in Supabase SQL Editor to create (or update) the tourism_destinations table

CREATE TABLE IF NOT EXISTS tourism_destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  directions_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add GPS columns if they do not already exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tourism_destinations' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE tourism_destinations ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tourism_destinations' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE tourism_destinations ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE tourism_destinations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "Public can read tourism" ON tourism_destinations;
DROP POLICY IF EXISTS "Authenticated can manage tourism" ON tourism_destinations;

-- Policy: Anyone can read (public portal)
CREATE POLICY "Public can read tourism" ON tourism_destinations
  FOR SELECT USING (true);

-- Policy: Only authenticated users can manage
CREATE POLICY "Authenticated can manage tourism" ON tourism_destinations
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for tenant queries
CREATE INDEX IF NOT EXISTS idx_tourism_tenant ON tourism_destinations(tenant_id);

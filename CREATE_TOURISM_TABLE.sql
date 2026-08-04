-- Tourism & Lifestyle Destinations Table
-- Run this in Supabase SQL Editor to create the tourism_destinations table

CREATE TABLE IF NOT EXISTS tourism_destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  directions_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tourism_destinations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (public portal)
CREATE POLICY "Public can read tourism" ON tourism_destinations
  FOR SELECT USING (true);

-- Policy: Only authenticated users can manage
CREATE POLICY "Authenticated can manage tourism" ON tourism_destinations
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for tenant queries
CREATE INDEX IF NOT EXISTS idx_tourism_tenant ON tourism_destinations(tenant_id);

-- Add email column to residents table for sync from certificate requests
-- Run this in Supabase SQL Editor

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN residents.email IS 'Resident email address, synced from certificate requests or master DB';

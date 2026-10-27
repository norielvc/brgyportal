-- Run this in Supabase SQL Editor
-- Adds partner_residential_address column to certificate_requests table

ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_residential_address TEXT;

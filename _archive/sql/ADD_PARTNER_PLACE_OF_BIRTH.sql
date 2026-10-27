-- Run this in Supabase SQL Editor
-- Adds partner_place_of_birth column to certificate_requests table

ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_place_of_birth TEXT;

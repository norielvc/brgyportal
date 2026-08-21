-- Alter tenant_id columns from UUID to TEXT to match the app's slug-based tenant identifiers
-- Run this if the blotter/assistance/kapchat tables were already created with UUID tenant_id

ALTER TABLE blotter_reports
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

ALTER TABLE assistance_inquiries
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

ALTER TABLE kapchat_messages
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

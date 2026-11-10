-- Online certificate PDF delivery (secure download links + Supabase Storage).
-- REQUIRED project (local + production env): efwwtftwxhgrvukvjedk
--   https://supabase.com/dashboard/project/efwwtftwxhgrvukvjedk/sql/new
-- Not BiometricSystem / byoqdujctmj — that is a different database.
-- Storage bucket certificate-deliveries: app can auto-create; optional manual private bucket.

CREATE TABLE IF NOT EXISTS certificate_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL,
  certificate_request_id TEXT NOT NULL,
  download_token TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_deliveries_request
  ON certificate_deliveries (certificate_request_id);

CREATE INDEX IF NOT EXISTS idx_certificate_deliveries_tenant
  ON certificate_deliveries (tenant_id);

CREATE INDEX IF NOT EXISTS idx_certificate_deliveries_active
  ON certificate_deliveries (certificate_request_id, tenant_id)
  WHERE revoked_at IS NULL;

ALTER TABLE certificate_deliveries ENABLE ROW LEVEL SECURITY;

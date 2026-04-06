-- 1. Create Relief Events Table
CREATE TABLE IF NOT EXISTS scan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add event_id to qr_scans table
ALTER TABLE qr_scans ADD COLUMN IF NOT EXISTS event_id UUID;

-- 3. You can set the constraint dynamically via Supabase UI or run this:
-- ALTER TABLE qr_scans ADD CONSTRAINT unique_scan_per_event UNIQUE (qr_data, event_id, tenant_id);

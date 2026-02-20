-- Create qr_scans table
CREATE TABLE IF NOT EXISTS qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_data TEXT NOT NULL,
    scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scanner_type TEXT DEFAULT 'mobile',
    device_info JSONB DEFAULT '{}'::jsonb,
    scanned_by UUID REFERENCES public.users(id),
    parsed_household_id TEXT,
    parsed_name TEXT,
    parsed_address TEXT,
    parsed_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS (adjust as needed)
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all scans
CREATE POLICY "Authenticated users can preview scans" ON qr_scans
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own scans
CREATE POLICY "Users can insert their own scans" ON qr_scans
    FOR INSERT WITH CHECK (auth.uid() = scanned_by);

-- Create index for faster scanning and duplicate checks
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_data ON qr_scans(qr_data);
CREATE INDEX IF NOT EXISTS idx_qr_scans_timestamp ON qr_scans(scan_timestamp);

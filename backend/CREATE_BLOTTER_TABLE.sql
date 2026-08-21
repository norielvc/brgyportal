-- Create blotter/esumbong table for barangay complaints
CREATE TABLE IF NOT EXISTS blotter_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  complainant_resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
  complainant_name TEXT NOT NULL,
  respondent_name TEXT NOT NULL,
  details TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME,
  contact_number TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-tenant index
CREATE INDEX IF NOT EXISTS idx_blotter_reports_tenant_id ON blotter_reports(tenant_id);

-- Status index
CREATE INDEX IF NOT EXISTS idx_blotter_reports_status ON blotter_reports(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blotter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blotter_updated_at ON blotter_reports;
CREATE TRIGGER trigger_update_blotter_updated_at
BEFORE UPDATE ON blotter_reports
FOR EACH ROW
EXECUTE FUNCTION update_blotter_updated_at();

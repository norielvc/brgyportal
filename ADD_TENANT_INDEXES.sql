-- Add tenant_id indexes for faster portal data loading
-- These indexes significantly improve query performance when filtering by tenant

-- Events table tenant index
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);

-- Facilities table tenant index
CREATE INDEX IF NOT EXISTS idx_facilities_tenant_id ON facilities(tenant_id);

-- Barangay officials table tenant index
CREATE INDEX IF NOT EXISTS idx_barangay_officials_tenant_id ON barangay_officials(tenant_id);

-- Achievements table tenant index
CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);

-- Programs table tenant index
CREATE INDEX IF NOT EXISTS idx_programs_tenant_id ON programs(tenant_id);

-- Certificate requests table tenant index (if not already exists)
CREATE INDEX IF NOT EXISTS idx_certificate_requests_tenant_id ON certificate_requests(tenant_id);

-- Residents table tenant index (if not already exists)
CREATE INDEX IF NOT EXISTS idx_residents_tenant_id ON residents(tenant_id);

-- Composite index for events (tenant + order for faster sorted queries)
CREATE INDEX IF NOT EXISTS idx_events_tenant_order ON events(tenant_id, order_index);

-- Composite index for facilities (tenant + order for faster sorted queries)
CREATE INDEX IF NOT EXISTS idx_facilities_tenant_order ON facilities(tenant_id, order_index);

-- Composite index for officials (tenant + active status for faster filtered queries)
CREATE INDEX IF NOT EXISTS idx_officials_tenant_active ON barangay_officials(tenant_id, is_active);

-- Composite index for certificate requests (tenant + status for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_cert_requests_tenant_status ON certificate_requests(tenant_id, status);

-- Composite index for certificate requests (tenant + created_at for date range queries)
CREATE INDEX IF NOT EXISTS idx_cert_requests_tenant_date ON certificate_requests(tenant_id, created_at DESC);

COMMENT ON INDEX idx_events_tenant_id IS 'Improves portal events loading by tenant';
COMMENT ON INDEX idx_facilities_tenant_id IS 'Improves portal facilities loading by tenant';
COMMENT ON INDEX idx_barangay_officials_tenant_id IS 'Improves portal officials loading by tenant';
COMMENT ON INDEX idx_achievements_tenant_id IS 'Improves portal achievements loading by tenant';
COMMENT ON INDEX idx_programs_tenant_id IS 'Improves portal programs loading by tenant';

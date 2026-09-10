-- ==============================================================================
-- BARANGAY ID MANAGEMENT SYSTEM SCHEMA
-- Multi-Tenant, strictly linked to Registered Residents Census
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.barangay_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    id_number VARCHAR(100) NOT NULL,
    
    -- Resident Snapshot / Details
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    suffix VARCHAR(20),
    gender VARCHAR(20),
    civil_status VARCHAR(50),
    birth_date DATE,
    age INTEGER,
    blood_type VARCHAR(10),
    
    -- Address
    address TEXT NOT NULL,
    purok VARCHAR(100),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    
    -- Identification & Government Numbers
    precinct_no VARCHAR(100),
    tin_no VARCHAR(100),
    sss_no VARCHAR(100),
    philhealth_no VARCHAR(100),
    contact_number VARCHAR(50),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_relation VARCHAR(100),
    emergency_contact_number VARCHAR(50),
    emergency_contact_address TEXT,
    
    -- Images & Signatures
    photo_url TEXT,
    cardholder_signature_url TEXT,
    captain_signature_url TEXT,
    qr_code_data TEXT,
    
    -- Card Validity & Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'revoked')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    issued_by_name VARCHAR(255),
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_id_number UNIQUE (tenant_id, id_number)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_barangay_ids_tenant ON public.barangay_ids(tenant_id);
CREATE INDEX IF NOT EXISTS idx_barangay_ids_resident ON public.barangay_ids(resident_id);
CREATE INDEX IF NOT EXISTS idx_barangay_ids_status ON public.barangay_ids(status);
CREATE INDEX IF NOT EXISTS idx_barangay_ids_number ON public.barangay_ids(id_number);
CREATE INDEX IF NOT EXISTS idx_barangay_ids_name ON public.barangay_ids(full_name);

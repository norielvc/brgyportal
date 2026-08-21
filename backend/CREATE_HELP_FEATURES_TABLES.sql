-- Create tables for public help features: Brgy Assistance and KapChat

-- Brgy Assistance inquiries
CREATE TABLE IF NOT EXISTS assistance_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistance_inquiries_tenant_id ON assistance_inquiries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistance_inquiries_status ON assistance_inquiries(status);

-- KapChat messages
CREATE TABLE IF NOT EXISTS kapchat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  sender_name TEXT,
  contact TEXT,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kapchat_messages_tenant_id ON kapchat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kapchat_messages_status ON kapchat_messages(status);

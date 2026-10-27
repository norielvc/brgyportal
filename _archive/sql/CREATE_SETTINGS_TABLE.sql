-- Create a table to store key-value settings for the barangay (single row concept or key-based)
CREATE TABLE IF NOT EXISTS barangay_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row if not exists
INSERT INTO barangay_settings (key, value) VALUES 
('certificate_settings', '{
    "contactInfo": {
        "address": "Purok 2 (Sitio Banawe) Barangay Iba O'' Este, Calumpit, Bulacan",
        "contactPerson": "Sec. Royce Ann C. Galvez",
        "telephone": "0967 631 9168",
        "email": "anneseriousme@gmail.com"
    },
    "headerInfo": {
        "country": "Republic of the Philippines",
        "province": "Province of Bulacan",
        "municipality": "Municipality of Calumpit",
        "barangayName": "BARANGAY IBA O'' ESTE",
        "officeName": "Office of the Punong Barangay"
    },
    "logos": {
        "leftLogo": "/iba-o-este.png",
        "rightLogo": "/calumpit.png",
        "logoSize": 80
    },
    "styles": {
        "headerStyle": {"bgColor": "#ffffff", "borderColor": "#1e40af", "fontFamily": "default"},
        "sidebarStyle": {"bgColor": "#1e40af", "gradientEnd": "#1e3a8a", "textColor": "#ffffff"},
        "bodyStyle": {"bgColor": "#ffffff", "textColor": "#1f2937"},
        "footerStyle": {"bgColor": "#f9fafb", "textColor": "#374151"}
    }
}')
ON CONFLICT (key) DO NOTHING;

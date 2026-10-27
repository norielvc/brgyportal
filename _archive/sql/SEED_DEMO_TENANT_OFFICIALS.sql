-- ============================================================
-- Full seed for the 'demo' tenant (run once in Supabase SQL Editor)
-- Covers all data that new tenants now get automatically on creation
-- ============================================================

-- 1. Official position slots
INSERT INTO barangay_officials (name, position, position_type, description, order_index, is_active, tenant_id) VALUES
('', 'Punong Barangay',         'captain',      'Punong Barangay',               1,  true, 'demo'),
('', 'Secretary',               'secretary',    'Barangay Secretary',             2,  true, 'demo'),
('', 'Treasurer',               'treasurer',    'Barangay Treasurer',             3,  true, 'demo'),
('', 'SK Chairman',             'sk_chairman',  'Sangguniang Kabataan Chairman',  4,  true, 'demo'),
('', 'Kagawad 1',               'kagawad',      'Brgy. Kagawad',                  5,  true, 'demo'),
('', 'Kagawad 2',               'kagawad',      'Brgy. Kagawad',                  6,  true, 'demo'),
('', 'Kagawad 3',               'kagawad',      'Brgy. Kagawad',                  7,  true, 'demo'),
('', 'Kagawad 4',               'kagawad',      'Brgy. Kagawad',                  8,  true, 'demo'),
('', 'Kagawad 5',               'kagawad',      'Brgy. Kagawad',                  9,  true, 'demo'),
('', 'Kagawad 6',               'kagawad',      'Brgy. Kagawad',                  10, true, 'demo'),
('', 'Kagawad 7',               'kagawad',      'Brgy. Kagawad',                  11, true, 'demo'),
('', 'Administrator',           'staff',        'Barangay Administrator',         12, true, 'demo'),
('', 'Assistant Secretary',     'staff',        'Assistant Secretary',            13, true, 'demo'),
('', 'Assistant Administrator', 'staff',        'Assistant Administrator',        14, true, 'demo'),
('', 'Barangay Keeper',         'staff',        'Record Keeper',                  15, true, 'demo'),
('', 'Clerk',                   'staff',        'Barangay Clerk',                 16, true, 'demo'),
('', 'SK Secretary',            'sk_secretary', 'SK Secretary',                   17, true, 'demo'),
('', 'SK Treasurer',            'sk_treasurer', 'SK Treasurer',                   18, true, 'demo'),
('', 'SK Kagawad 1',            'sk_kagawad',   'SK Kagawad',                     19, true, 'demo'),
('', 'SK Kagawad 2',            'sk_kagawad',   'SK Kagawad',                     20, true, 'demo'),
('', 'SK Kagawad 3',            'sk_kagawad',   'SK Kagawad',                     21, true, 'demo'),
('', 'SK Kagawad 4',            'sk_kagawad',   'SK Kagawad',                     22, true, 'demo'),
('', 'SK Kagawad 5',            'sk_kagawad',   'SK Kagawad',                     23, true, 'demo'),
('', 'SK Kagawad 6',            'sk_kagawad',   'SK Kagawad',                     24, true, 'demo'),
('', 'SK Kagawad 7',            'sk_kagawad',   'SK Kagawad',                     25, true, 'demo'),
('', 'SK Kagawad 8',            'sk_kagawad',   'SK Kagawad',                     26, true, 'demo')
ON CONFLICT DO NOTHING;


-- 2. Workflow configurations (default 4-step flow, no assigned users)
INSERT INTO workflow_configurations (certificate_type, tenant_id, workflow_config, is_active)
SELECT cert_type, 'demo',
    jsonb_build_object('steps', jsonb_build_array(
        jsonb_build_object('id',1,  'name','Review Request',              'status','staff_review',       'icon','Eye',         'autoApprove',false,'assignedUsers','[]'::jsonb,'requiresApproval',true,'sendEmail',true),
        jsonb_build_object('id',2,  'name','Barangay Secretary Approval', 'status','secretary_approval', 'icon','Clock',       'autoApprove',false,'assignedUsers','[]'::jsonb,'requiresApproval',true,'sendEmail',true,'officialRole','Brgy. Secretary'),
        jsonb_build_object('id',3,  'name','Barangay Captain Approval',   'status','captain_approval',   'icon','UserCheck',   'autoApprove',false,'assignedUsers','[]'::jsonb,'requiresApproval',true,'sendEmail',true,'officialRole','Brgy. Captain'),
        jsonb_build_object('id',999,'name','Releasing Team',              'status','oic_review',         'icon','CheckCircle', 'autoApprove',false,'assignedUsers','[]'::jsonb,'requiresApproval',true,'sendEmail',true)
    )),
    true
FROM unnest(ARRAY[
    'barangay_clearance','certificate_of_indigency','barangay_residency',
    'natural_death','barangay_guardianship','barangay_cohabitation',
    'medico_legal','business_permit','certification_same_person'
]) AS cert_type
ON CONFLICT (certificate_type, tenant_id) DO NOTHING;


-- 3. Barangay settings (blank slate)
INSERT INTO barangay_settings (key, tenant_id, value)
VALUES (
    'certificate_settings',
    'demo',
    '{
        "contactInfo":   {"address":"","contactPerson":"","telephone":"","email":""},
        "headerInfo":    {"country":"Republic of the Philippines","province":"","municipality":"","barangayName":"BARANGAY DEMO","officeName":"Office of the Punong Barangay"},
        "logos":         {"leftLogo":"","rightLogo":"","logoSize":115,"captainImage":""},
        "heroSection":   {"title":"BARANGAY OFFICIALS","subtitle":"Meet our dedicated team","image":""},
        "portalBranding":{"portalName":"DEMO PORTAL","shortName":"Demo","subtitle":"","logoUrl":"/logo.png","primaryColor":"#004700","secondaryColor":"#001a00"},
        "siteContact":   {"address":"","phone":"","email":"","officeHours":"Monday - Friday: 8:00 AM - 5:00 PM","hotlines":[]},
        "missionGoals":  {"barangayMission":"","barangayGoal":"","barangayVision":"","skMission":"","skGoal":"","skVision":""},
        "visibility":    {"section":true,"chairman":true,"secretary":true,"treasurer":true,"skChairman":true,"skSecretary":true,"skTreasurer":true,"skKagawads":[true,true,true,true,true,true,true,true],"councilors":[true,true,true,true,true,true,true],"administrator":true,"assistantSecretary":true,"assistantAdministrator":true,"recordKeeper":true,"clerk":true}
    }'::jsonb
)
ON CONFLICT (key, tenant_id) DO NOTHING;

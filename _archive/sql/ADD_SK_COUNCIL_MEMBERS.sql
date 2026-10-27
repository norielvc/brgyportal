-- Add new SK Council members to barangay_officials table
-- Copy and paste this SQL into your Supabase SQL Editor

-- 1. Insert SK Secretary and SK Treasurer
INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Secretary', 'sk_secretary', 17
WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Secretary');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Treasurer', 'sk_treasurer', 18
WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Treasurer');

-- 2. Insert 8 SK Kagawads
INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 1', 'sk_kagawad', 19 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 1');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 2', 'sk_kagawad', 20 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 2');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 3', 'sk_kagawad', 21 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 3');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 4', 'sk_kagawad', 22 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 4');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 5', 'sk_kagawad', 23 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 5');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 6', 'sk_kagawad', 24 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 6');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 7', 'sk_kagawad', 25 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 7');

INSERT INTO barangay_officials (name, position, position_type, order_index)
SELECT '', 'SK Kagawad 8', 'sk_kagawad', 26 WHERE NOT EXISTS (SELECT 1 FROM barangay_officials WHERE position = 'SK Kagawad 8');

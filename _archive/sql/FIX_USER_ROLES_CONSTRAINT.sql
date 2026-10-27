-- FIX USER ROLES CONSTRAINT
-- Run this SQL in your Supabase SQL Editor to allow all required roles

-- 1. Find the constraint name (it's usually 'users_role_check')
-- We'll try to drop common names or you can find it using Step 3
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add the updated constraint with all roles used in the system
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'admin', 'captain', 'secretary', 'staff', 'user'));

-- 3. Verify the change
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- 4. Also ensure 'position' column exists (just in case)
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- 5. Ensure status constraint is also correct
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

SELECT 'User table constraints updated successfully.' as status;

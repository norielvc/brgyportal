-- Add position column to users table
-- Run this in your Supabase SQL Editor

-- Add position column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN users.position IS 'Job position/title of the employee (e.g., Barangay Secretary, Clerk, etc.)';

-- Update existing users with null position (optional - set default)
-- UPDATE users SET position = 'Staff' WHERE position IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'position';

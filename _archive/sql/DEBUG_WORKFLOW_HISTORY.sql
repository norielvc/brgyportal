-- First, check if workflow_history table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'workflow_history'
) as table_exists;

-- If the table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workflow_history'
ORDER BY ordinal_position;

-- Check if there are any rows
SELECT COUNT(*) as row_count FROM workflow_history;

-- Check for any recent insert errors in the system
-- (This won't work directly, but you can run the first queries above in Supabase SQL Editor)

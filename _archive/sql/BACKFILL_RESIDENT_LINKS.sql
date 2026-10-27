-- ==========================================
-- BACKFILL SCRIPT: Link existing Requests to Residents
-- ==========================================

-- 1. Create a temporary function to normalize names for better matching
-- (This helps match 'DOE, JOHN' with 'John Doe' roughly if needed, 
-- but here we assume the names are stored similarly, just case difference)

UPDATE certificate_requests
SET resident_id = residents.id
FROM residents
WHERE 
    certificate_requests.resident_id IS NULL -- Only update unlinked ones
    AND 
    LOWER(TRIM(certificate_requests.full_name)) = LOWER(TRIM(residents.full_name));

-- Check the results
SELECT count(*) as linked_requests_count 
FROM certificate_requests 
WHERE resident_id IS NOT NULL;

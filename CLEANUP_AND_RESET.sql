-- Clean up partial or duplicated imports for tenant 'iba o este'
BEGIN;

-- 1. Delete all IDs for this tenant so we can cleanly re-import
DELETE FROM public.barangay_ids WHERE tenant_id = 'iba o este';

COMMIT;

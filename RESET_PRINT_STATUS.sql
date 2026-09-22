-- Reset all ID print statuses
UPDATE public.barangay_ids 
SET 
  is_printed = FALSE,
  printed_at = NULL;

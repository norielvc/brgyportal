-- Add columns for tracking printed IDs
ALTER TABLE public.barangay_ids 
ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;

-- Add an index to speed up the "Printed" vs "Not Printed" filter
CREATE INDEX IF NOT EXISTS idx_barangay_ids_printed ON public.barangay_ids(is_printed);

-- Force PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';

-- One-time: pad census resident numbers to 5 digits (1 → 00001).
-- Run in Supabase SQL editor per tenant DB as needed.

UPDATE public.residents r
SET census_resident_number = LPAD(
  regexp_replace(trim(r.census_resident_number), '[^0-9]', '', 'g'),
  5,
  '0'
)
WHERE r.census_resident_number IS NOT NULL
  AND trim(r.census_resident_number) <> ''
  AND regexp_replace(trim(r.census_resident_number), '[^0-9]', '', 'g') ~ '^[0-9]+$'
  AND length(regexp_replace(trim(r.census_resident_number), '[^0-9]', '', 'g')) BETWEEN 1 AND 5
  AND length(regexp_replace(trim(r.census_resident_number), '[^0-9]', '', 'g')) < 5;

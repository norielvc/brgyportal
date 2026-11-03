-- Normalize "North Ville 9" → "NORTHVILLE 9" for Iba O' Este (run in Supabase SQL editor).
-- Adjust tenant_id if needed.

-- Subdivision column
UPDATE public.residents
SET subdivision = 'NORTHVILLE 9'
WHERE subdivision IS NOT NULL
  AND (
    subdivision ILIKE 'north ville 9'
    OR subdivision ILIKE 'northville 9'
    OR subdivision ILIKE 'nv9'
  )
  AND subdivision <> 'NORTHVILLE 9';

-- Full address line (any spacing/casing of North Ville 9)
UPDATE public.residents
SET residential_address = regexp_replace(
  residential_address,
  '\mNorth\s+Ville\s+9\M',
  'NORTHVILLE 9',
  'gi'
)
WHERE residential_address ~* 'north\s+ville\s+9';

-- EC card / ID addresses
UPDATE public.barangay_ids
SET address = regexp_replace(
  address,
  '\mNorth\s+Ville\s+9\M',
  'NORTHVILLE 9',
  'gi'
)
WHERE address ~* 'north\s+ville\s+9';

-- Census extras JSON (subdivision_as_in_sheet and similar)
UPDATE public.residents
SET census_extras = replace(
  census_extras::text,
  'NORTH VILLE 9',
  'NORTHVILLE 9'
)::jsonb
WHERE census_extras IS NOT NULL
  AND census_extras::text ILIKE '%north%ville%9%';

-- Optional: purok field when it was stored as subdivision name
UPDATE public.residents
SET purok = 'NORTHVILLE 9'
WHERE purok ILIKE 'north ville 9';

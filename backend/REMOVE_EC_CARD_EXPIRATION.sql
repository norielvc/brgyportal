-- EC Cards: no expiration policy (run once per tenant DB)
-- Sets a far-future expiry for NOT NULL column and clears expired status.

UPDATE barangay_ids
SET
  expiry_date = '2099-12-31',
  status = CASE WHEN status = 'expired' THEN 'active' ELSE status END,
  updated_at = NOW()
WHERE expiry_date IS DISTINCT FROM '2099-12-31'
   OR status = 'expired';

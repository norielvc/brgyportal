-- Hearing time for Paanyaya sa Paghaharap (optional; default 9:00 AM on verify)
ALTER TABLE blotter_reports
  ADD COLUMN IF NOT EXISTS oras_ng_paghaharap TIME;

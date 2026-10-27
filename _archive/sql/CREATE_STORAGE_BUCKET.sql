-- ============================================================
-- Run this in Supabase SQL Editor
-- Creates the portal-images storage bucket with tenant isolation
-- ============================================================

-- 1. Create the bucket (public so images can be served via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-images', 'portal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload portal images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view portal images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update portal images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete portal images" ON storage.objects;

-- 3. Public read — anyone can view images (needed for portal display)
CREATE POLICY "Public can view portal images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portal-images');

-- 4. Upload — authenticated users can only upload into their own tenant folder
--    File path format: {tenant_id}/{folder}/{filename}
--    e.g. ibaoeste/facilities/1234567890.jpg
CREATE POLICY "Authenticated users can upload portal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portal-images'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 5. Update — authenticated users can only update files in their own tenant folder
CREATE POLICY "Authenticated users can update portal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portal-images'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 6. Delete — authenticated users can only delete files in their own tenant folder
CREATE POLICY "Authenticated users can delete portal images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portal-images'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

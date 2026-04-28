-- Create the storage bucket used for uploaded certificates.
-- The current app stores direct file URLs in `certificates.certificate_url`,
-- so the bucket must exist and be publicly readable for those links to open.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Certificate uploads are public to view" ON storage.objects;
CREATE POLICY "Certificate uploads are public to view"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Owners can update certificate uploads" ON storage.objects;
CREATE POLICY "Owners can update certificate uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'certificates' AND owner = auth.uid())
WITH CHECK (bucket_id = 'certificates' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners can delete certificate uploads" ON storage.objects;
CREATE POLICY "Owners can delete certificate uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'certificates' AND owner = auth.uid());

-- No SELECT policy on storage.objects for recipe-photos: bucket listing/enumeration
-- via the Storage API stays disabled. Individual objects remain reachable by their
-- direct public URL (required for public recipe pages, share links and OG images).

DROP POLICY IF EXISTS "Users upload own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Users update own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own recipe photos" ON storage.objects;

CREATE POLICY "Users upload own recipe photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND name ~* '\.(jpe?g|png|webp|gif|heic|heif|avif)$'
);

CREATE POLICY "Users update own recipe photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND name ~* '\.(jpe?g|png|webp|gif|heic|heif|avif)$'
);

CREATE POLICY "Users delete own recipe photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
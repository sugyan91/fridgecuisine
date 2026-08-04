DROP POLICY IF EXISTS "Recipe photos are publicly readable" ON storage.objects;

CREATE POLICY "Users list own recipe photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
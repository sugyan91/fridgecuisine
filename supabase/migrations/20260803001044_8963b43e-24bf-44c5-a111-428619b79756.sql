DROP POLICY IF EXISTS "Users list own recipe photos" ON storage.objects;

CREATE POLICY "Recipe photos are publicly readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'recipe-photos');
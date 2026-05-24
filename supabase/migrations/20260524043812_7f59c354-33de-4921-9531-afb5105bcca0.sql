-- Scope community comment inserts to authenticated role
DROP POLICY IF EXISTS "Verified users can insert own comment when allowed" ON public.community_recipe_comments;
CREATE POLICY "Verified users can insert own comment when allowed"
ON public.community_recipe_comments
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND can_comment_on_recipe(recipe_id));

-- Scope likes insert/delete/update to authenticated role
DROP POLICY IF EXISTS "Users insert own likes" ON public.community_recipe_likes;
CREATE POLICY "Users insert own likes"
ON public.community_recipe_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own likes" ON public.community_recipe_likes;
CREATE POLICY "Users delete own likes"
ON public.community_recipe_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own vote" ON public.community_recipe_likes;
CREATE POLICY "Users update own vote"
ON public.community_recipe_likes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Restrict listing on recipe-photos to a user's own folder; public URLs still work because the bucket is public
DROP POLICY IF EXISTS "Public read recipe photos" ON storage.objects;
CREATE POLICY "Users list own recipe photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recipe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
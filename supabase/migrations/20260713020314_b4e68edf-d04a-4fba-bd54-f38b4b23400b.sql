-- 1) storefront_views: drop the WITH CHECK (true) INSERT policy; writes go via service role
DROP POLICY IF EXISTS "Anyone can log a storefront view" ON public.storefront_views;
REVOKE INSERT ON public.storefront_views FROM anon, authenticated;

-- 2) community_recipe_likes: replace broad SELECT policy with an owner-scoped one.
-- App-facing aggregate counts and per-recipe reads run through server functions
-- using the service-role client, which bypasses RLS.
DROP POLICY IF EXISTS "Likes read for authenticated on published recipes" ON public.community_recipe_likes;

CREATE POLICY "Users read their own votes"
  ON public.community_recipe_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
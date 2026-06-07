
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Profiles read for authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Likes public read on published recipes" ON public.community_recipe_likes;
CREATE POLICY "Likes read for authenticated on published recipes"
  ON public.community_recipe_likes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_recipes r
    WHERE r.id = community_recipe_likes.recipe_id AND r.is_published = true
  ));

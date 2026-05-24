-- 1) Remove blanket public read on paid_recipes (full content was exposed)
DROP POLICY IF EXISTS "Published paid recipes public read" ON public.paid_recipes;

-- 2) Allow public read of likes on published community recipes (for counts)
CREATE POLICY "Likes public read on published recipes"
  ON public.community_recipe_likes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_recipes r
      WHERE r.id = community_recipe_likes.recipe_id
        AND r.is_published = true
    )
  );
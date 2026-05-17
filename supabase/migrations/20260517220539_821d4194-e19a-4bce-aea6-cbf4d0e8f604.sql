ALTER TABLE public.community_recipes ADD COLUMN IF NOT EXISTS history text;

ALTER TABLE public.community_recipe_likes ADD COLUMN IF NOT EXISTS vote_type text NOT NULL DEFAULT 'up';

ALTER TABLE public.community_recipe_likes DROP CONSTRAINT IF EXISTS community_recipe_likes_vote_type_check;
ALTER TABLE public.community_recipe_likes ADD CONSTRAINT community_recipe_likes_vote_type_check CHECK (vote_type IN ('up','down'));

DROP POLICY IF EXISTS "Users update own vote" ON public.community_recipe_likes;
CREATE POLICY "Users update own vote"
ON public.community_recipe_likes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
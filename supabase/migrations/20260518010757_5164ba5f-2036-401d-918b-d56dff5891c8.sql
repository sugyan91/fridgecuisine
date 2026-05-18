-- Add comments toggle to community_recipes
ALTER TABLE public.community_recipes
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true;

-- Comments table
CREATE TABLE IF NOT EXISTS public.community_recipe_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_recipe_comments_recipe
  ON public.community_recipe_comments (recipe_id, created_at DESC);

ALTER TABLE public.community_recipe_comments ENABLE ROW LEVEL SECURITY;

-- Helper: is current user the owner of the receipe?
CREATE OR REPLACE FUNCTION public.is_recipe_owner(_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_recipes
    WHERE id = _recipe_id AND user_id = auth.uid()
  );
$$;

-- Helper: comments allowed for the receipe?
CREATE OR REPLACE FUNCTION public.can_comment_on_recipe(_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_recipes
    WHERE id = _recipe_id AND comments_enabled = true AND is_published = true
  );
$$;

-- Policies
CREATE POLICY "Comments public read"
  ON public.community_recipe_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Verified users can insert own comment when allowed"
  ON public.community_recipe_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_comment_on_recipe(recipe_id)
  );

CREATE POLICY "Users update own comment"
  ON public.community_recipe_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comment or recipe owner deletes"
  ON public.community_recipe_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_recipe_owner(recipe_id)
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS community_recipe_comments_set_updated_at ON public.community_recipe_comments;
CREATE TRIGGER community_recipe_comments_set_updated_at
  BEFORE UPDATE ON public.community_recipe_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
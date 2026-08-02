ALTER TABLE public.recipe_generations ADD COLUMN endpoint text NOT NULL DEFAULT 'recipes';
CREATE INDEX IF NOT EXISTS idx_recipe_generations_user_endpoint_created ON public.recipe_generations (user_id, endpoint, created_at DESC);
COMMENT ON COLUMN public.recipe_generations.endpoint IS 'AI endpoint bucket that consumed this quota unit (recipes, helpers, etc.)';
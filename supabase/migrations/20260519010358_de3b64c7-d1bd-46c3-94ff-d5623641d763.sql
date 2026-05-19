CREATE TABLE public.saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  cuisine text,
  cook_time_minutes integer,
  recipe jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  cooked_at timestamptz,
  CONSTRAINT saved_recipes_user_title_unique UNIQUE (user_id, title)
);

CREATE INDEX idx_saved_recipes_user_saved_at ON public.saved_recipes (user_id, saved_at DESC);
CREATE INDEX idx_saved_recipes_user_cooked_at ON public.saved_recipes (user_id, cooked_at DESC);

ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved recipes"
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved recipes"
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own saved recipes"
  ON public.saved_recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved recipes"
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);
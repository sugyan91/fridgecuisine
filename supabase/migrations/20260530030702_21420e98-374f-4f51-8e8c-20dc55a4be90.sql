CREATE TABLE public.shared_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  created_by uuid NULL,
  title text NOT NULL,
  cuisine text NULL,
  recipe jsonb NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_recipes_slug ON public.shared_recipes(slug);
CREATE INDEX idx_shared_recipes_created_by ON public.shared_recipes(created_by);

GRANT SELECT ON public.shared_recipes TO anon;
GRANT SELECT, INSERT ON public.shared_recipes TO authenticated;
GRANT ALL ON public.shared_recipes TO service_role;

ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared recipes are publicly readable"
  ON public.shared_recipes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users insert own shared recipes"
  ON public.shared_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
-- 1. recipe_collections
CREATE TABLE public.recipe_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text,
  color text,
  is_public boolean NOT NULL DEFAULT false,
  slug text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_collections_user ON public.recipe_collections(user_id, created_at DESC);
CREATE INDEX idx_recipe_collections_public ON public.recipe_collections(is_public) WHERE is_public = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_collections TO authenticated;
GRANT SELECT ON public.recipe_collections TO anon;
GRANT ALL ON public.recipe_collections TO service_role;

ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own collections"
  ON public.recipe_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public collections readable by anyone"
  ON public.recipe_collections FOR SELECT
  USING (is_public = true);

CREATE TRIGGER trg_recipe_collections_updated_at
  BEFORE UPDATE ON public.recipe_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. collection_items
CREATE TABLE public.collection_items (
  collection_id uuid NOT NULL REFERENCES public.recipe_collections(id) ON DELETE CASCADE,
  saved_recipe_id uuid NOT NULL REFERENCES public.saved_recipes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, saved_recipe_id)
);

CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT ON public.collection_items TO anon;
GRANT ALL ON public.collection_items TO service_role;

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own collection items"
  ON public.collection_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.recipe_collections c
    WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipe_collections c
    WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Public collection items readable"
  ON public.collection_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.recipe_collections c
    WHERE c.id = collection_items.collection_id AND c.is_public = true
  ));

-- 3. meal_plan_entries
CREATE TABLE public.meal_plan_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  meal_slot text NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  saved_recipe_id uuid NOT NULL REFERENCES public.saved_recipes(id) ON DELETE CASCADE,
  servings_override integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_plan_user_date ON public.meal_plan_entries(user_id, plan_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_entries TO authenticated;
GRANT ALL ON public.meal_plan_entries TO service_role;

ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own meal plan"
  ON public.meal_plan_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
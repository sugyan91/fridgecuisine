CREATE TABLE public.storefront_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('storefront','paid_recipe','cookbook')),
  paid_recipe_id uuid REFERENCES public.paid_recipes(id) ON DELETE SET NULL,
  cookbook_id uuid REFERENCES public.cookbooks(id) ON DELETE SET NULL,
  viewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip_hash text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_storefront_views_chef_time ON public.storefront_views (chef_user_id, viewed_at DESC);
CREATE INDEX idx_storefront_views_recipe ON public.storefront_views (paid_recipe_id) WHERE paid_recipe_id IS NOT NULL;
CREATE INDEX idx_storefront_views_cookbook ON public.storefront_views (cookbook_id) WHERE cookbook_id IS NOT NULL;

GRANT INSERT ON public.storefront_views TO anon, authenticated;
GRANT SELECT ON public.storefront_views TO authenticated;
GRANT ALL ON public.storefront_views TO service_role;

ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a storefront view"
  ON public.storefront_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Chefs read their own views"
  ON public.storefront_views FOR SELECT
  TO authenticated
  USING (auth.uid() = chef_user_id OR has_role(auth.uid(), 'admin'::app_role));
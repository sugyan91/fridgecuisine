
-- Drop the public read policy that exposed all columns (including ingredients/steps/tips)
DROP POLICY IF EXISTS "Published paid recipes public read" ON public.paid_recipes;

-- Owner/admin keep full read
CREATE POLICY "Owner or admin read full paid recipe"
ON public.paid_recipes FOR SELECT
USING (auth.uid() = chef_user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Authenticated purchasers can read full row
CREATE POLICY "Purchasers read full paid recipe"
ON public.paid_recipes FOR SELECT
USING (auth.uid() IS NOT NULL AND has_purchased_recipe(auth.uid(), id));

-- Public-safe preview view (no ingredients/steps/tips)
DROP VIEW IF EXISTS public.paid_recipes_preview;
CREATE VIEW public.paid_recipes_preview
WITH (security_invoker = on) AS
SELECT
  id,
  chef_user_id,
  title,
  description,
  cuisine,
  country,
  cover_image_url,
  dietary,
  prep_minutes,
  cook_minutes,
  serves,
  price_cents,
  is_published,
  created_at,
  updated_at
FROM public.paid_recipes
WHERE is_published = true;

GRANT SELECT ON public.paid_recipes_preview TO anon, authenticated;


-- Tighten follows visibility: authenticated users only
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
REVOKE SELECT ON public.follows FROM anon;
CREATE POLICY "Authenticated users can view follows"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

-- Remove public readability of promo codes (validation happens server-side via admin client)
DROP POLICY IF EXISTS "Active promo codes are viewable" ON public.promo_codes;
REVOKE SELECT ON public.promo_codes FROM anon;

-- Remove public readability of shared_recipes (reads go through server functions using service role with slug lookup)
DROP POLICY IF EXISTS "Shared recipes are publicly readable" ON public.shared_recipes;
REVOKE SELECT ON public.shared_recipes FROM anon;
CREATE POLICY "Owners can view their shared recipes"
  ON public.shared_recipes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

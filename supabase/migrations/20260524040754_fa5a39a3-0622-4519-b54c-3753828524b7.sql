
ALTER TABLE public.paid_recipes
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS local_name text;

-- Allow anyone to see the basic listing info. The handler will only project
-- non-sensitive columns to the public; full content stays gated by the
-- existing "Purchasers read full paid recipe" policy.
DROP POLICY IF EXISTS "Published paid recipes public read" ON public.paid_recipes;
CREATE POLICY "Published paid recipes public read"
  ON public.paid_recipes
  FOR SELECT
  USING (is_published = true);

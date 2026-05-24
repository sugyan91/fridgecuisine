-- 1. chef_profiles: replace public-read with owner+admin read
DROP POLICY IF EXISTS "Chef profiles public read" ON public.chef_profiles;

CREATE POLICY "Owners and admins read chef profiles"
ON public.chef_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. community_recipes: scope insert policy to authenticated role explicitly
DROP POLICY IF EXISTS "Users insert own recipes" ON public.community_recipes;

CREATE POLICY "Users insert own recipes"
ON public.community_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. storage.objects: add explicit public SELECT for recipe-photos bucket
CREATE POLICY "Public read recipe photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'recipe-photos');
-- 1) collection_items: remove broad public read of private saved-recipe references
DROP POLICY IF EXISTS "Public collection items readable" ON public.collection_items;
DROP POLICY IF EXISTS "Owners manage own collection items" ON public.collection_items;
CREATE POLICY "Owners manage own collection items"
ON public.collection_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.recipe_collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.recipe_collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid()));
REVOKE ALL ON public.collection_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;

-- 2) Scope owner/admin management policies to authenticated role
DROP POLICY IF EXISTS "Admins manage paid recipes" ON public.paid_recipes;
CREATE POLICY "Admins manage paid recipes" ON public.paid_recipes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Chefs insert own paid recipes" ON public.paid_recipes;
CREATE POLICY "Chefs insert own paid recipes" ON public.paid_recipes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = chef_user_id);
DROP POLICY IF EXISTS "Chefs update own paid recipes" ON public.paid_recipes;
CREATE POLICY "Chefs update own paid recipes" ON public.paid_recipes FOR UPDATE TO authenticated
USING (auth.uid() = chef_user_id) WITH CHECK (auth.uid() = chef_user_id);
DROP POLICY IF EXISTS "Chefs delete own paid recipes" ON public.paid_recipes;
CREATE POLICY "Chefs delete own paid recipes" ON public.paid_recipes FOR DELETE TO authenticated
USING (auth.uid() = chef_user_id);
DROP POLICY IF EXISTS "Owner or admin read full paid recipe" ON public.paid_recipes;
CREATE POLICY "Owner or admin read full paid recipe" ON public.paid_recipes FOR SELECT TO authenticated
USING ((auth.uid() = chef_user_id) OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Purchasers read full paid recipe" ON public.paid_recipes;
CREATE POLICY "Purchasers read full paid recipe" ON public.paid_recipes FOR SELECT TO authenticated
USING (has_purchased_recipe(auth.uid(), id));

DROP POLICY IF EXISTS "Admins manage cookbooks" ON public.cookbooks;
CREATE POLICY "Admins manage cookbooks" ON public.cookbooks FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Chefs insert own cookbooks" ON public.cookbooks;
CREATE POLICY "Chefs insert own cookbooks" ON public.cookbooks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = chef_user_id);
DROP POLICY IF EXISTS "Chefs update own cookbooks" ON public.cookbooks;
CREATE POLICY "Chefs update own cookbooks" ON public.cookbooks FOR UPDATE TO authenticated
USING (auth.uid() = chef_user_id) WITH CHECK (auth.uid() = chef_user_id);
DROP POLICY IF EXISTS "Chefs delete own cookbooks" ON public.cookbooks;
CREATE POLICY "Chefs delete own cookbooks" ON public.cookbooks FOR DELETE TO authenticated
USING (auth.uid() = chef_user_id);

DROP POLICY IF EXISTS "Chefs manage own cookbook recipes" ON public.cookbook_recipes;
CREATE POLICY "Chefs manage own cookbook recipes" ON public.cookbook_recipes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.cookbooks c WHERE c.id = cookbook_recipes.cookbook_id AND c.chef_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cookbooks c WHERE c.id = cookbook_recipes.cookbook_id AND c.chef_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage chef profiles" ON public.chef_profiles;
CREATE POLICY "Admins manage chef profiles" ON public.chef_profiles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users insert own chef profile" ON public.chef_profiles;
CREATE POLICY "Users insert own chef profile" ON public.chef_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own chef profile" ON public.chef_profiles;
CREATE POLICY "Users update own chef profile" ON public.chef_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) storefront_views: writes are server-only (service role); make that explicit
DROP POLICY IF EXISTS "Service role manages storefront views" ON public.storefront_views;
CREATE POLICY "Service role manages storefront views" ON public.storefront_views FOR ALL TO service_role
USING (true) WITH CHECK (true);
REVOKE ALL ON public.storefront_views FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.storefront_views FROM authenticated;
GRANT SELECT ON public.storefront_views TO authenticated;
GRANT ALL ON public.storefront_views TO service_role;
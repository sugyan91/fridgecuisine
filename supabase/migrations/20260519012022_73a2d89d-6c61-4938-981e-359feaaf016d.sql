
-- 1. Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role helper (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. user_roles RLS: users can read their own roles; only admins can write
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Seed master admin
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'sugyansubedi09@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Admin override policies on existing tables

-- profiles: admin read (public read already exists), allow admin update
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- community_recipes: admin delete + update
DROP POLICY IF EXISTS "Admins delete any community recipe" ON public.community_recipes;
CREATE POLICY "Admins delete any community recipe" ON public.community_recipes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update any community recipe" ON public.community_recipes;
CREATE POLICY "Admins update any community recipe" ON public.community_recipes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- community_recipe_comments: admin delete
DROP POLICY IF EXISTS "Admins delete any comment" ON public.community_recipe_comments;
CREATE POLICY "Admins delete any comment" ON public.community_recipe_comments
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- recipe_generations: admin read + delete (reset timer)
DROP POLICY IF EXISTS "Admins read any generations" ON public.recipe_generations;
CREATE POLICY "Admins read any generations" ON public.recipe_generations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete any generations" ON public.recipe_generations;
CREATE POLICY "Admins delete any generations" ON public.recipe_generations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- subscriptions: admin read + insert + update + delete (manage premium)
DROP POLICY IF EXISTS "Admins read any subscription" ON public.subscriptions;
CREATE POLICY "Admins read any subscription" ON public.subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert subscription" ON public.subscriptions;
CREATE POLICY "Admins insert subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update any subscription" ON public.subscriptions;
CREATE POLICY "Admins update any subscription" ON public.subscriptions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete any subscription" ON public.subscriptions;
CREATE POLICY "Admins delete any subscription" ON public.subscriptions
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

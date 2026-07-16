DROP POLICY IF EXISTS "Profiles read for authenticated" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
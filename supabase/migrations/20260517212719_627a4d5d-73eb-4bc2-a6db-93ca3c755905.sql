
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- user_preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_dietary TEXT[] NOT NULL DEFAULT '{}',
  custom_cuisines TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own prefs" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- community_recipes
CREATE TABLE public.community_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  country TEXT,
  cuisine TEXT,
  dietary TEXT[] NOT NULL DEFAULT '{}',
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published recipes public read" ON public.community_recipes
  FOR SELECT USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "Users insert own recipes" ON public.community_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recipes" ON public.community_recipes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recipes" ON public.community_recipes
  FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_community_recipes_published ON public.community_recipes(is_published, created_at DESC);
CREATE INDEX idx_community_recipes_user ON public.community_recipes(user_id);
CREATE TRIGGER trg_community_recipes_updated_at BEFORE UPDATE ON public.community_recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- likes
CREATE TABLE public.community_recipe_likes (
  recipe_id UUID NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, user_id)
);
ALTER TABLE public.community_recipe_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes public read" ON public.community_recipe_likes FOR SELECT USING (true);
CREATE POLICY "Users insert own likes" ON public.community_recipe_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.community_recipe_likes
  FOR DELETE USING (auth.uid() = user_id);

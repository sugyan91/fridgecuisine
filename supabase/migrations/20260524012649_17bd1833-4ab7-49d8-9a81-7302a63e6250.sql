
-- 1. Chef profiles (one per user who wants to sell)
CREATE TABLE public.chef_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  country text,
  avatar_url text,
  stripe_account_id text UNIQUE,
  payouts_enabled boolean NOT NULL DEFAULT false,
  charges_enabled boolean NOT NULL DEFAULT false,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chef_profiles_user_id ON public.chef_profiles(user_id);

ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef profiles public read"
  ON public.chef_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users insert own chef profile"
  ON public.chef_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own chef profile"
  ON public.chef_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage chef profiles"
  ON public.chef_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_chef_profiles_updated_at
BEFORE UPDATE ON public.chef_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Paid recipes
CREATE TABLE public.paid_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cuisine text,
  country text,
  dietary text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  prep_minutes integer,
  cook_minutes integer,
  serves text,
  price_cents integer NOT NULL CHECK (price_cents >= 100),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_paid_recipes_chef ON public.paid_recipes(chef_user_id);
CREATE INDEX idx_paid_recipes_published ON public.paid_recipes(is_published) WHERE is_published = true;

ALTER TABLE public.paid_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published paid recipes public read"
  ON public.paid_recipes FOR SELECT
  USING (is_published = true OR auth.uid() = chef_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Chefs insert own paid recipes"
  ON public.paid_recipes FOR INSERT
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs update own paid recipes"
  ON public.paid_recipes FOR UPDATE
  USING (auth.uid() = chef_user_id)
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs delete own paid recipes"
  ON public.paid_recipes FOR DELETE
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Admins manage paid recipes"
  ON public.paid_recipes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_paid_recipes_updated_at
BEFORE UPDATE ON public.paid_recipes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Cookbooks
CREATE TABLE public.cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  price_cents integer NOT NULL CHECK (price_cents >= 100),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cookbooks_chef ON public.cookbooks(chef_user_id);
CREATE INDEX idx_cookbooks_published ON public.cookbooks(is_published) WHERE is_published = true;

ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published cookbooks public read"
  ON public.cookbooks FOR SELECT
  USING (is_published = true OR auth.uid() = chef_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Chefs insert own cookbooks"
  ON public.cookbooks FOR INSERT
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs update own cookbooks"
  ON public.cookbooks FOR UPDATE
  USING (auth.uid() = chef_user_id)
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs delete own cookbooks"
  ON public.cookbooks FOR DELETE
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Admins manage cookbooks"
  ON public.cookbooks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cookbooks_updated_at
BEFORE UPDATE ON public.cookbooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Cookbook <-> Recipes join
CREATE TABLE public.cookbook_recipes (
  cookbook_id uuid NOT NULL REFERENCES public.cookbooks(id) ON DELETE CASCADE,
  paid_recipe_id uuid NOT NULL REFERENCES public.paid_recipes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (cookbook_id, paid_recipe_id)
);

CREATE INDEX idx_cookbook_recipes_cookbook ON public.cookbook_recipes(cookbook_id);
CREATE INDEX idx_cookbook_recipes_recipe ON public.cookbook_recipes(paid_recipe_id);

ALTER TABLE public.cookbook_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cookbook recipes public read"
  ON public.cookbook_recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cookbooks c
      WHERE c.id = cookbook_recipes.cookbook_id
        AND (c.is_published = true OR c.chef_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Chefs manage own cookbook recipes"
  ON public.cookbook_recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cookbooks c
      WHERE c.id = cookbook_recipes.cookbook_id AND c.chef_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cookbooks c
      WHERE c.id = cookbook_recipes.cookbook_id AND c.chef_user_id = auth.uid()
    )
  );

-- 5. Purchases
CREATE TABLE public.recipe_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paid_recipe_id uuid REFERENCES public.paid_recipes(id) ON DELETE SET NULL,
  cookbook_id uuid REFERENCES public.cookbooks(id) ON DELETE SET NULL,
  chef_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  gross_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  chef_net_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (paid_recipe_id IS NOT NULL OR cookbook_id IS NOT NULL),
  CHECK (status IN ('pending','paid','refunded','failed'))
);

CREATE INDEX idx_recipe_purchases_buyer ON public.recipe_purchases(buyer_user_id);
CREATE INDEX idx_recipe_purchases_chef ON public.recipe_purchases(chef_user_id);
CREATE INDEX idx_recipe_purchases_recipe ON public.recipe_purchases(paid_recipe_id);
CREATE INDEX idx_recipe_purchases_cookbook ON public.recipe_purchases(cookbook_id);

ALTER TABLE public.recipe_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own purchases"
  ON public.recipe_purchases FOR SELECT
  USING (auth.uid() = buyer_user_id);

CREATE POLICY "Chefs read own sales"
  ON public.recipe_purchases FOR SELECT
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Admins read all purchases"
  ON public.recipe_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages purchases"
  ON public.recipe_purchases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_recipe_purchases_updated_at
BEFORE UPDATE ON public.recipe_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper: has the user purchased a specific recipe (directly or via a cookbook)?
CREATE OR REPLACE FUNCTION public.has_purchased_recipe(_user_id uuid, _recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.recipe_purchases
    WHERE buyer_user_id = _user_id
      AND status = 'paid'
      AND paid_recipe_id = _recipe_id
  ) OR EXISTS (
    SELECT 1
    FROM public.recipe_purchases rp
    JOIN public.cookbook_recipes cr ON cr.cookbook_id = rp.cookbook_id
    WHERE rp.buyer_user_id = _user_id
      AND rp.status = 'paid'
      AND cr.paid_recipe_id = _recipe_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_purchased_cookbook(_user_id uuid, _cookbook_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.recipe_purchases
    WHERE buyer_user_id = _user_id
      AND status = 'paid'
      AND cookbook_id = _cookbook_id
  );
$$;

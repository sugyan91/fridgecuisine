
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_percent_range CHECK (
    discount_type <> 'percent' OR (discount_value BETWEEN 1 AND 100)
  ),
  CONSTRAINT promo_codes_chef_code_unique UNIQUE (chef_user_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT SELECT ON public.promo_codes TO anon;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can read active, non-expired codes (needed for buyer-side validation)
CREATE POLICY "Active promo codes are viewable"
  ON public.promo_codes FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Chefs manage their own codes fully (including inactive/expired)
CREATE POLICY "Chefs can view their own promo codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can insert their own promo codes"
  ON public.promo_codes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can update their own promo codes"
  ON public.promo_codes FOR UPDATE TO authenticated
  USING (auth.uid() = chef_user_id)
  WITH CHECK (auth.uid() = chef_user_id);

CREATE POLICY "Chefs can delete their own promo codes"
  ON public.promo_codes FOR DELETE TO authenticated
  USING (auth.uid() = chef_user_id);

CREATE INDEX promo_codes_chef_idx ON public.promo_codes (chef_user_id);
CREATE INDEX promo_codes_lookup_idx ON public.promo_codes (chef_user_id, code) WHERE active = true;

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  chef_user_id uuid NOT NULL,
  message text,
  gross_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  chef_net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tips_chef ON public.tips(chef_user_id);
CREATE INDEX idx_tips_sender ON public.tips(sender_user_id);

GRANT SELECT, INSERT, UPDATE ON public.tips TO authenticated;
GRANT ALL ON public.tips TO service_role;

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their sent tips"
  ON public.tips FOR SELECT TO authenticated
  USING (auth.uid() = sender_user_id);

CREATE POLICY "Chefs see tips they received"
  ON public.tips FOR SELECT TO authenticated
  USING (auth.uid() = chef_user_id);

CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  fingerprint text NULL,
  ip_hash text NULL,
  endpoint text NOT NULL,
  cache_hit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_events_created ON public.ai_usage_events (created_at DESC);
CREATE INDEX idx_ai_usage_events_endpoint_created ON public.ai_usage_events (endpoint, created_at DESC);
CREATE INDEX idx_ai_usage_events_user_created ON public.ai_usage_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_usage_events_fingerprint_created ON public.ai_usage_events (fingerprint, created_at DESC) WHERE fingerprint IS NOT NULL;

GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all ai usage events"
  ON public.ai_usage_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
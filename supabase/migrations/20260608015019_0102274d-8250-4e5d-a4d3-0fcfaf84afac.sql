
-- Extend anonymous_ai_usage with abuse-signal counters
ALTER TABLE public.anonymous_ai_usage
  ADD COLUMN IF NOT EXISTS last_ip_hash text,
  ADD COLUMN IF NOT EXISTS last_user_agent text,
  ADD COLUMN IF NOT EXISTS ip_change_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rapid_request_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_hit_count integer NOT NULL DEFAULT 0;

-- Abuse events log
CREATE TABLE IF NOT EXISTS public.abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'anon_rapid_request',
    'anon_ip_change',
    'anon_quota_hit',
    'user_rapid_request',
    'user_quota_hit'
  )),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','alert')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fingerprint text,
  ip_hash text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abuse_events_created_at_idx ON public.abuse_events (created_at DESC);
CREATE INDEX IF NOT EXISTS abuse_events_event_type_idx ON public.abuse_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS abuse_events_fingerprint_idx ON public.abuse_events (fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS abuse_events_ip_hash_idx ON public.abuse_events (ip_hash, created_at DESC);

GRANT SELECT ON public.abuse_events TO authenticated;
GRANT ALL ON public.abuse_events TO service_role;

ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read abuse events"
  ON public.abuse_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

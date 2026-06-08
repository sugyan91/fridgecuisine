-- Add per-day counter columns to existing per-fingerprint table
ALTER TABLE public.anonymous_ai_usage
  ADD COLUMN IF NOT EXISTS day_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS day_date date NOT NULL DEFAULT current_date;

-- Per-IP daily ceiling (defense-in-depth against cookie clearing)
CREATE TABLE IF NOT EXISTS public.anonymous_ai_usage_by_ip (
  ip_hash text PRIMARY KEY,
  day_count integer NOT NULL DEFAULT 0,
  day_date date NOT NULL DEFAULT current_date,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_count integer NOT NULL DEFAULT 0
);

GRANT SELECT ON public.anonymous_ai_usage_by_ip TO authenticated;
GRANT ALL ON public.anonymous_ai_usage_by_ip TO service_role;

ALTER TABLE public.anonymous_ai_usage_by_ip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read anonymous usage by ip"
  ON public.anonymous_ai_usage_by_ip
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages anonymous usage by ip"
  ON public.anonymous_ai_usage_by_ip
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
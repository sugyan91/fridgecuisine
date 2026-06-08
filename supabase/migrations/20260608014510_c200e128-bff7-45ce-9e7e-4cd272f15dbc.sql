CREATE TABLE public.anonymous_ai_usage (
  fingerprint text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.anonymous_ai_usage TO service_role;

ALTER TABLE public.anonymous_ai_usage ENABLE ROW LEVEL SECURITY;

-- No policies: this table is only readable/writable by service_role
-- (used by server functions via supabaseAdmin). Anonymous fingerprints
-- must never be exposed to client code.

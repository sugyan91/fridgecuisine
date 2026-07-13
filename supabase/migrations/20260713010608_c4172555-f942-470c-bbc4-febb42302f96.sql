CREATE TABLE public.ai_result_cache (
  cache_key text PRIMARY KEY,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  hit_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX ai_result_cache_kind_expires_idx ON public.ai_result_cache(kind, expires_at);
GRANT SELECT, INSERT, UPDATE ON public.ai_result_cache TO service_role;
ALTER TABLE public.ai_result_cache ENABLE ROW LEVEL SECURITY;
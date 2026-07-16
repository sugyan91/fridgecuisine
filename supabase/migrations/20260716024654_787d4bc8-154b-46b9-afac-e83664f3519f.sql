
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);
CREATE INDEX follows_following_idx ON public.follows(following_id, created_at DESC);
CREATE INDEX follows_follower_idx ON public.follows(follower_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);
CREATE POLICY "Users insert own follows" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete own follows" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

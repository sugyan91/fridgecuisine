
CREATE TABLE public.daily_dinner_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  cuisine text,
  key_ingredients text[] NOT NULL DEFAULT '{}',
  signal text NOT NULL CHECK (signal IN ('skip','dislike')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_dinner_feedback_user_created_idx ON public.daily_dinner_feedback (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_dinner_feedback TO authenticated;
GRANT ALL ON public.daily_dinner_feedback TO service_role;
ALTER TABLE public.daily_dinner_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feedback read" ON public.daily_dinner_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own feedback insert" ON public.daily_dinner_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own feedback delete" ON public.daily_dinner_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);

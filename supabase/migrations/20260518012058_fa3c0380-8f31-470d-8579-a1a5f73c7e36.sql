-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text;

-- Format check: 3-20 chars, lowercase letters/digits/underscores, starts with letter
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-z][a-z0-9_]{2,19}$');

-- Case-insensitive unique index (lowercase already enforced by check)
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;

-- Helper: resolve username -> email for sign-in
CREATE OR REPLACE FUNCTION public.email_for_username(_username text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.username = lower(_username)
  LIMIT 1;
$$;

-- Helper: check username availability (public)
CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = lower(_username)
  );
$$;

-- Replace handle_new_user to populate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username text;
  candidate text;
  suffix int := 0;
  reserved text[] := ARRAY['admin','root','support','help','api','auth','login','signup','me','fridgecuisine'];
BEGIN
  -- Try metadata first
  desired_username := lower(coalesce(NEW.raw_user_meta_data->>'username', ''));

  -- Fall back to email prefix sanitized
  IF desired_username = '' OR desired_username !~ '^[a-z][a-z0-9_]{2,19}$' OR desired_username = ANY(reserved) THEN
    desired_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    -- Ensure starts with letter
    IF desired_username !~ '^[a-z]' THEN
      desired_username := 'u' || desired_username;
    END IF;
    desired_username := substring(desired_username, 1, 18);
    IF length(desired_username) < 3 THEN
      desired_username := 'user' || floor(random() * 100000)::int;
    END IF;
  END IF;

  candidate := desired_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := substring(desired_username, 1, 17) || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    candidate
  );
  RETURN NEW;
END; $$;

-- Ensure trigger exists on auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill usernames for existing profiles
DO $$
DECLARE
  r record;
  base text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN SELECT p.id, p.user_id, u.email FROM public.profiles p JOIN auth.users u ON u.id = p.user_id WHERE p.username IS NULL LOOP
    base := lower(regexp_replace(split_part(r.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    IF base !~ '^[a-z]' THEN base := 'u' || base; END IF;
    base := substring(base, 1, 18);
    IF length(base) < 3 THEN base := 'user' || floor(random() * 100000)::int; END IF;
    candidate := base;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
      suffix := suffix + 1;
      candidate := substring(base, 1, 17) || suffix::text;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;
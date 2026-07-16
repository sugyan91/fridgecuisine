
DROP INDEX IF EXISTS public.pantry_items_user_name_idx;
ALTER TABLE public.pantry_items ADD CONSTRAINT pantry_items_user_name_unique UNIQUE (user_id, name);

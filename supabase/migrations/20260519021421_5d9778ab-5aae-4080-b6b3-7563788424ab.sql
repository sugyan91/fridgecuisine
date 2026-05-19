
-- 1. Tighten comments public read: only published recipes
DROP POLICY IF EXISTS "Comments public read" ON public.community_recipe_comments;
CREATE POLICY "Comments public read on published recipes"
ON public.community_recipe_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_recipes r
    WHERE r.id = recipe_id AND r.is_published = true
  )
  OR auth.uid() = user_id
);

-- 2. user_roles: add restrictive policy so only admins can insert/update/delete
CREATE POLICY "Only admins modify roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Drop public storage listing policy (public URLs still serve files)
DROP POLICY IF EXISTS "Recipe photos public read" ON storage.objects;

-- 4. Revoke EXECUTE on internal helpers
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_for_username(text) FROM anon, authenticated;

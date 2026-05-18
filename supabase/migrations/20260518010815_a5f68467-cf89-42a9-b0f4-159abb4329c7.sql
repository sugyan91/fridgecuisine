REVOKE EXECUTE ON FUNCTION public.is_recipe_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_comment_on_recipe(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_recipe_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_comment_on_recipe(uuid) TO authenticated;
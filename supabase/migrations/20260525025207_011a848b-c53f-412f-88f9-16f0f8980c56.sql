
-- Revoke from PUBLIC (covers anon + authenticated default) for all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_for_username(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.username_available(text) FROM PUBLIC, anon, authenticated;

-- RLS-used helpers: revoke from PUBLIC/anon but keep authenticated (needed for policy evaluation)
REVOKE EXECUTE ON FUNCTION public.is_recipe_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_comment_on_recipe(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_purchased_recipe(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_purchased_cookbook(uuid, uuid) FROM PUBLIC, anon;

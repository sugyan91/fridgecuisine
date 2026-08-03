-- Recipe photos are served via public bucket URLs, which bypass RLS entirely.
-- A SELECT policy on storage.objects only enables bucket listing/enumeration,
-- so remove it: uploads/updates/deletes stay owner-scoped, reads go via public URL.
DROP POLICY IF EXISTS "Recipe photos are publicly readable" ON storage.objects;
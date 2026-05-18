
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

create policy "Recipe photos public read"
on storage.objects for select
using (bucket_id = 'recipe-photos');

create policy "Users upload own recipe photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own recipe photos"
on storage.objects for update
to authenticated
using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own recipe photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public bucket for showroom logos. Files are stored under
-- {tenant_id}/{filename} so RLS can scope writes to the owning tenant.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "tenant owner can upload their logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() = 'tenant-owner'
  );

create policy "tenant owner can update their logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() = 'tenant-owner'
  );

create policy "tenant owner can delete their logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_role() = 'tenant-owner'
  );

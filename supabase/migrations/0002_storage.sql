-- ============================================================================
-- Storage buckets for listing media and verification documents.
-- `listing-media` is public-read; `verification-docs` is strictly private.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- Anyone can read listing media; only authenticated users can upload,
-- and only into a folder named after their own user id.
create policy "listing media public read"
  on storage.objects for select
  using (bucket_id = 'listing-media');

create policy "listing media owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing media owner modify"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing media owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verification docs: a user can only read/write their own private folder.
create policy "verification docs owner rw"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

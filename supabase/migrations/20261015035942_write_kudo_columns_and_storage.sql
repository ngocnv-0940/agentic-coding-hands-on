-- Viết Kudo (F007): the kudos columns of the write path, the kudo_images.url guard, and the kudo-images
-- Storage bucket with its storage.objects policies. Additive: F006 rows keep content_doc null and
-- is_anonymous false; title stays nullable at table level (required only through create_kudo, spec Q6).

-- Diacritic folding for search_sunners (called as extensions.unaccent with an explicit dictionary).
create extension if not exists unaccent with schema extensions;

-- content_doc: editor JSON (validated by create_kudo). An alias exists only on an anonymous kudo and is
-- 1..50 characters; create_kudo turns a blank alias into null.
alter table public.kudos
  add column content_doc jsonb,
  add column is_anonymous boolean not null default false,
  add column anonymous_name text,
  add constraint kudos_anonymous_name_check check (
    (is_anonymous or anonymous_name is null)
    and (anonymous_name is null or char_length(anonymous_name) between 1 and 50));

-- Image URLs: static app assets, absolute https, or kudo-images/<name> for uploads (resolved to the public
-- Storage URL by the app). One upload backs at most one image row (create_kudo also checks; this closes
-- the race between two concurrent submits of the same upload).
alter table public.kudo_images
  add constraint kudo_images_url_check check (url ~ '^(/images/|https://|kudo-images/)');
create unique index kudo_images_uploaded_url_key on public.kudo_images (url) where url like 'kudo-images/%';

-- Public-read bucket (unguessable uuid names); the size and MIME limits are enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kudo-images', 'kudo-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- storage.objects policies for authenticated only (anon: none). Object names are neutral (<uuid v4>.<ext>
-- at the bucket root, no uid), so a name never reveals who uploaded it (FR-604); ownership is the
-- owner_id Storage stamps from the JWT. SELECT is limited to one's own rows: upload and remove use
-- RETURNING, and listing the bucket must not expose other users' uploads. No UPDATE policy: an upload
-- is immutable. DELETE only while no kudo_images row references the object.
create policy "kudo images: insert own neutral name" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kudo-images'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and owner_id = (select auth.uid())::text);

create policy "kudo images: select own" on storage.objects
  for select to authenticated
  using (bucket_id = 'kudo-images' and owner_id = (select auth.uid())::text);

create policy "kudo images: delete own unreferenced" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kudo-images'
    and owner_id = (select auth.uid())::text
    and not exists (select 1 from public.kudo_images ki where ki.url like 'kudo-images/%' and ki.url = 'kudo-images/' || objects.name));

-- pgTAP: public.search_sunners (ALG-001 of the write path, BR-008) and the kudo-images bucket with its
-- storage.objects policies (FR-002, phase-03 §Contract). Search: trim, case/diacritic fold (đ -> d),
-- literal substring (% and _ are not wildcards), viewer excluded, byte-order by name, max 10.
-- Storage: own neutral-named inserts only, own-only SELECT, DELETE own unreferenced, no UPDATE, anon nothing.
-- Fixture prefixes: a8 auth users, b8 sunners, d8 department, f8 storage object names. Names start "Zqx".
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

insert into auth.users (id, email) values
  ('a8000000-0000-4000-8000-000000000001', 'pgtap-search-viewer@example.test'),
  ('a8000000-0000-4000-8000-000000000002', 'pgtap-search-other@example.test');
insert into public.departments (id, code, name) values ('d8000000-0000-4000-8000-000000000001', 'PGTAP-S', 'PgTap Search Dept');
insert into public.sunners (id, user_id, full_name, avatar_url, department_id) values
  ('b8000000-0000-4000-8000-000000000001', 'a8000000-0000-4000-8000-000000000001', 'Zqx Viewer Self', null, null),
  ('b8000000-0000-4000-8000-000000000002', 'a8000000-0000-4000-8000-000000000002', 'Zqx Trần Minh Đức', null, null),
  ('b8000000-0000-4000-8000-000000000003', null, 'Zqx 100% Sure', null, null),
  ('b8000000-0000-4000-8000-000000000004', null, 'Zqx a_b', null, null),
  ('b8000000-0000-4000-8000-000000000005', null, 'Zqx Nguyễn B', null, null),
  ('b8000000-0000-4000-8000-000000000006', null, 'Zqx NguyenA', null, null);
insert into public.sunners (id, full_name, avatar_url, department_id)
  select ('b8000000-0000-4000-8000-0000000000' || (10 + n))::uuid, 'Zqx Cap ' || lpad(n::text, 2, '0'),
         case when n = 1 then '/pgtap/cap.png' end, case when n = 1 then 'd8000000-0000-4000-8000-000000000001'::uuid end
  from generate_series(12, 1, -1) n;

create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
create temp table affected (name text primary key, n bigint not null) on commit drop;
grant select, insert on rpc_result, affected to authenticated;
create function pg_temp.names(p_name text) returns text[] language sql as $$
  select coalesce(array_agg(e ->> 'name' order by o), '{}') from rpc_result r, jsonb_array_elements(r.j) with ordinality t(e, o) where r.name = p_name $$;

-- search_sunners hardening (catalog)
select is((select row(p.prosecdef, p.proconfig)::text from pg_proc p where p.oid = 'public.search_sunners(text)'::regprocedure),
  row(false, array['search_path=""'])::text, 'search_sunners is SECURITY INVOKER with an empty search_path');
select is(array[has_function_privilege('authenticated', 'public.search_sunners(text)', 'execute'), has_function_privilege('anon', 'public.search_sunners(text)', 'execute')],
  array[true, false], 'search_sunners: authenticated may execute, anon may not');
select is((select count(*) from pg_proc p, aclexplode(p.proacl) a where p.oid = 'public.search_sunners(text)'::regprocedure and a.grantee = 0), 0::bigint,
  'PUBLIC has no execute grant on search_sunners');
select is((select extnamespace::regnamespace::text from pg_extension where extname = 'unaccent'), 'extensions', 'unaccent lives in the extensions schema');

set local role authenticated;
set local request.jwt.claims = '{"sub":"a8000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into rpc_result values
  ('accented', public.search_sunners('zqx trần minh đức')),
  ('folded', public.search_sunners('ZQX TRAN MINH DUC')),
  ('padded', public.search_sunners(E'  zqx tran \t')),
  ('duc', public.search_sunners('duc')),
  ('percent', public.search_sunners('%')),
  ('percent_word', public.search_sunners('100%')),
  ('underscore', public.search_sunners('_')),
  ('cap', public.search_sunners('zqx cap')),
  ('byte_order', public.search_sunners('zqx nguy')),
  ('self', public.search_sunners('zqx viewer')),
  ('empty', public.search_sunners('')),
  ('blank', public.search_sunners('   ')),
  ('null', public.search_sunners(null)),
  ('too_long', public.search_sunners(repeat('a', 101))),
  ('none', public.search_sunners('@ # $'));
set local request.jwt.claims = '{"sub":"a8000000-0000-4000-8000-000000000002","role":"authenticated"}';
insert into rpc_result values ('self_as_other', public.search_sunners('zqx viewer'));
reset role;

select is(pg_temp.names('accented'), array['Zqx Trần Minh Đức'], 'accented query matches');
select is(pg_temp.names('folded'), array['Zqx Trần Minh Đức'], 'case- and diacritic-insensitive (đ -> d)');
select is(pg_temp.names('padded'), array['Zqx Trần Minh Đức'], 'the query is trimmed');
select ok((select j from rpc_result where name = 'duc') @> '[{"name":"Zqx Trần Minh Đức"}]', '"duc" finds "Đức"');
select is(pg_temp.names('percent'), array['Zqx 100% Sure'], '% is matched literally, not as a wildcard');
select is(pg_temp.names('percent_word'), array['Zqx 100% Sure'], '"100%" matches the literal text');
select is(pg_temp.names('underscore'), array['Zqx a_b'], '_ is matched literally, not as a wildcard');
select is(pg_temp.names('cap'), array(select 'Zqx Cap ' || lpad(n::text, 2, '0') from generate_series(1, 10) n), 'at most 10 results, ordered by name');
select is(pg_temp.names('byte_order'), array['Zqx NguyenA', 'Zqx Nguyễn B'], 'names are ordered by code point (same order as the E2E mock)');
select is(pg_temp.names('self'), '{}'::text[], 'the viewer is never listed');
select is(pg_temp.names('self_as_other'), array['Zqx Viewer Self'], 'another viewer does see that sunner');
select is((select array_agg(j order by name) from rpc_result where name in ('empty', 'blank', 'null', 'too_long', 'none')),
  array['[]', '[]', '[]', '[]', '[]']::jsonb[], 'empty, blank, null, >100 chars and unmatched queries answer []');
select is((select j -> 0 from rpc_result where name = 'cap'),
  '{"id":"b8000000-0000-4000-8000-000000000011","name":"Zqx Cap 01","avatarUrl":"/pgtap/cap.png","department":"PgTap Search Dept"}'::jsonb,
  'option shape is {id, name, avatarUrl, department} (no user_id)');
select is((select j -> 1 -> 'department' from rpc_result where name = 'cap'), 'null'::jsonb, 'a sunner without department has department null');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select public.search_sunners('zqx')$$, '42501', null, 'anon cannot call search_sunners');
reset role;

-- Bucket and policies (catalog)
select is((select row(b.public, b.file_size_limit, b.allowed_mime_types)::text from storage.buckets b where b.id = 'kudo-images'),
  row(true, 5242880::bigint, array['image/jpeg', 'image/png', 'image/webp'])::text, 'kudo-images: public, 5 MiB, jpeg/png/webp');
select is((select array_agg(p.cmd order by p.cmd) from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects'
           and (p.qual like '%kudo-images%' or p.with_check like '%kudo-images%')), array['DELETE', 'INSERT', 'SELECT'],
  'kudo-images has INSERT, SELECT and DELETE policies, no UPDATE');
select is((select count(*) from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects'
           and (p.qual like '%kudo-images%' or p.with_check like '%kudo-images%') and p.roles <> '{authenticated}'::name[]), 0::bigint,
  'every kudo-images policy targets authenticated only');

-- Storage rows: f8..02, 03 owned by A (03 already used by a kudo), f8..04 owned by B; a second bucket for the cross-bucket case
insert into storage.buckets (id, name, public) values ('pgtap-other-bucket', 'pgtap-other-bucket', false);
insert into storage.objects (bucket_id, name, owner_id) values
  ('kudo-images', 'f8000000-0000-4000-8000-000000000002.png', 'a8000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f8000000-0000-4000-8000-000000000003.png', 'a8000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f8000000-0000-4000-8000-000000000004.png', 'a8000000-0000-4000-8000-000000000002');
insert into public.kudos (id, sender_id, receiver_id, content) values
  ('c8000000-0000-4000-8000-000000000001', 'b8000000-0000-4000-8000-000000000001', 'b8000000-0000-4000-8000-000000000003', 'uses f8..03');
insert into public.kudo_images (kudo_id, url, position) values
  ('c8000000-0000-4000-8000-000000000001', 'kudo-images/f8000000-0000-4000-8000-000000000003.png', 1);

set local role authenticated;
set local request.jwt.claims = '{"sub":"a8000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'f8000000-0000-4000-8000-000000000001.png', 'a8000000-0000-4000-8000-000000000001')$$,
  'a user uploads a neutral <uuid>.png they own');
select lives_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'f8000000-0000-4000-8000-000000000005.webp', 'a8000000-0000-4000-8000-000000000001'),
                                                                                ('kudo-images', 'f8000000-0000-4000-8000-000000000006.jpg', 'a8000000-0000-4000-8000-000000000001')$$,
  'webp and jpg names are accepted');
select throws_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'a8000000-0000-4000-8000-000000000001/f8000000-0000-4000-8000-000000000009.png', 'a8000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'a <uid>/ folder path is rejected (names must not carry the uploader)');
select throws_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'f8000000-0000-4000-8000-000000000009.gif', 'a8000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'a disallowed extension is rejected');
select throws_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'avatar.png', 'a8000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'a non-uuid name is rejected');
select throws_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('pgtap-other-bucket', 'f8000000-0000-4000-8000-000000000009.png', 'a8000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'another bucket is not writable');
select throws_ok($$insert into storage.objects (bucket_id, name, owner_id) values ('kudo-images', 'f8000000-0000-4000-8000-000000000009.png', 'a8000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'uploading as another owner is rejected');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('kudo-images', 'f8000000-0000-4000-8000-000000000009.png')$$,
  '42501', null, 'uploading without an owner is rejected');
select is((select array_agg(o.name order by o.name) from storage.objects o where o.name like 'f8%'),
  array['f8000000-0000-4000-8000-000000000001.png', 'f8000000-0000-4000-8000-000000000002.png', 'f8000000-0000-4000-8000-000000000003.png',
        'f8000000-0000-4000-8000-000000000005.webp', 'f8000000-0000-4000-8000-000000000006.jpg'],
  'a user sees only their own objects');
set local storage.allow_delete_query = 'true';
with d as (delete from storage.objects o where o.name = 'f8000000-0000-4000-8000-000000000002.png' returning 1) insert into affected select 'own_unused', count(*) from d;
with d as (delete from storage.objects o where o.name = 'f8000000-0000-4000-8000-000000000003.png' returning 1) insert into affected select 'own_used', count(*) from d;
with d as (delete from storage.objects o where o.name = 'f8000000-0000-4000-8000-000000000004.png' returning 1) insert into affected select 'others', count(*) from d;
with u as (update storage.objects o set name = 'f8000000-0000-4000-8000-000000000008.png' where o.name = 'f8000000-0000-4000-8000-000000000001.png' returning 1)
  insert into affected select 'update_own', count(*) from u;
set local request.jwt.claims = '{"sub":"a8000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select array_agg(o.name order by o.name) from storage.objects o where o.name like 'f8%'), array['f8000000-0000-4000-8000-000000000004.png'],
  'the other user sees only their own object');
reset role;

select is((select n from affected where name = 'own_unused'), 1::bigint, 'a user deletes their own unused upload');
select is((select n from affected where name = 'own_used'), 0::bigint, 'an upload used by a kudo cannot be deleted');
select is((select n from affected where name = 'others'), 0::bigint, 'another user''s upload cannot be deleted');
select is((select n from affected where name = 'update_own'), 0::bigint, 'objects cannot be updated (renamed)');
select is((select count(*) from storage.objects o where o.name like 'f8%'), 5::bigint, 'only the unused own upload is gone');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$insert into storage.objects (bucket_id, name) values ('kudo-images', 'f8000000-0000-4000-8000-000000000009.png')$$,
  '42501', null, 'anon cannot upload');
select is((select count(*) from storage.objects o where o.bucket_id = 'kudo-images'), 0::bigint, 'anon lists no object metadata');
reset role;

select * from finish();
rollback;

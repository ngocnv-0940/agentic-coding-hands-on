-- pgTAP: every Google auth.users row gets exactly one public.sunners row (F006 BR-012, INT-004, ALG-007, SC-012);
-- any other account (email sign-up, no app metadata) gets none. Trigger kudos_private.provision_sunner on
-- auth.users (after insert, and after an update of raw_app_meta_data when GoTrue links Google to an existing
-- account; SECURITY DEFINER) plus the one-time backfill of the migration, both gated by
-- kudos_private.is_google_account and built on kudos_private.sunner_profile_from_auth (name and avatar rule).
-- Fixture prefixes: a4 auth users, b4 sunners, c4 kudo, e4 hashtag. Emails start "pgtap-prov-".
begin;
create extension if not exists pgtap with schema extensions;
select plan(53);

-- Hardening (catalog, as postgres)
select trigger_is('auth', 'users', 'on_auth_user_created_provision_sunner', 'kudos_private', 'provision_sunner',
  'auth.users carries the provisioning trigger');
select is((select t.tgtype::int from pg_trigger t where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created_provision_sunner'),
  21, 'the trigger fires AFTER INSERT OR UPDATE FOR EACH ROW (no DELETE or TRUNCATE)');
select is((select array_agg(a.attname::text order by a.attnum) from pg_trigger t
           join pg_attribute a on a.attrelid = t.tgrelid and a.attnum = any (t.tgattr::int2[])
           where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created_provision_sunner'),
  array['raw_app_meta_data'], 'the UPDATE event is limited to UPDATE OF raw_app_meta_data');
select is((select t.tgenabled from pg_trigger t where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created_provision_sunner'),
  'O'::"char", 'the trigger is enabled');
select is((select row(p.prosecdef, p.proconfig)::text from pg_proc p where p.oid = 'kudos_private.provision_sunner()'::regprocedure),
  row(true, array['search_path=""'])::text, 'provision_sunner is SECURITY DEFINER with an empty search_path');
select is((select row(p.prosecdef, p.provolatile, p.proconfig)::text from pg_proc p
           where p.oid = 'kudos_private.sunner_profile_from_auth(jsonb, text)'::regprocedure),
  row(false, 'i'::"char", array['search_path=""'])::text, 'sunner_profile_from_auth is an immutable SECURITY INVOKER helper with an empty search_path');
select is((select row(p.prosecdef, p.provolatile, p.proconfig)::text from pg_proc p
           where p.oid = 'kudos_private.is_google_account(jsonb)'::regprocedure),
  row(false, 'i'::"char", array['search_path=""'])::text, 'is_google_account is an immutable SECURITY INVOKER helper with an empty search_path');
select is(array[has_function_privilege('anon', 'kudos_private.provision_sunner()', 'execute'),
                has_function_privilege('authenticated', 'kudos_private.provision_sunner()', 'execute')],
  array[false, false], 'neither anon nor authenticated can execute provision_sunner');
select is(array[has_function_privilege('anon', 'kudos_private.sunner_profile_from_auth(jsonb, text)', 'execute'),
                has_function_privilege('authenticated', 'kudos_private.sunner_profile_from_auth(jsonb, text)', 'execute')],
  array[false, false], 'neither anon nor authenticated can execute sunner_profile_from_auth');
select is(array[has_function_privilege('anon', 'kudos_private.is_google_account(jsonb)', 'execute'),
                has_function_privilege('authenticated', 'kudos_private.is_google_account(jsonb)', 'execute')],
  array[false, false], 'neither anon nor authenticated can execute is_google_account');
select is((select count(*) from pg_proc p, aclexplode(p.proacl) a
           where p.oid in ('kudos_private.provision_sunner()'::regprocedure, 'kudos_private.sunner_profile_from_auth(jsonb, text)'::regprocedure,
                           'kudos_private.is_google_account(jsonb)'::regprocedure)
             and a.grantee = 0), 0::bigint, 'PUBLIC has no execute grant on any of the three functions');

-- Seeded rows (user_id null) before any fixture: provisioning must never touch them.
create temp table seeded on commit drop as select id, user_id, full_name, avatar_url, department_id, hero_title from public.sunners;

-- Google accounts (raw_app_meta_data as GoTrue writes it): one row per account, from raw_user_meta_data and email.
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
select v.id::uuid, v.email, v.meta, '{"provider":"google","providers":["google"]}' from (values
  ('a4000000-0000-4000-8000-000000000001', 'pgtap-prov-google@example.test',
   '{"full_name":"  Nguyễn Văn Google  ","name":"Ignored Name","avatar_url":" https://lh3.googleusercontent.com/a/pgtap ","picture":"https://ignored.example/p.png"}'),
  ('a4000000-0000-4000-8000-000000000002', 'pgtap-prov-name@example.test', '{"name":"Name Only","picture":"https://lh3.googleusercontent.com/a/picture"}'),
  ('a4000000-0000-4000-8000-000000000003', 'pgtap-prov-blank@example.test', jsonb_build_object('full_name', E' \t\n ', 'name', E' Fallback Name ', 'avatar_url', '   ', 'picture', 'https://x.example/p.png')),
  ('a4000000-0000-4000-8000-000000000004', 'pgtap-prov.local-part@example.test', '{}'),
  ('a4000000-0000-4000-8000-000000000005', null, null),
  ('a4000000-0000-4000-8000-000000000006', '@example.test', '{"full_name":"","name":"   "}'),
  ('a4000000-0000-4000-8000-000000000007', 'pgtap-prov-long@example.test', jsonb_build_object('full_name', repeat('Đ', 99) || 'XYZ', 'avatar_url', 'http://insecure.example/a.png')),
  ('a4000000-0000-4000-8000-000000000008', 'pgtap-prov-js@example.test', '{"full_name":"Js Avatar","avatar_url":"javascript:alert(1)"}'),
  ('a4000000-0000-4000-8000-000000000009', 'pgtap-prov-2049@example.test', jsonb_build_object('full_name', 'Long Avatar', 'avatar_url', 'https://' || repeat('a', 2041))),
  ('a4000000-0000-4000-8000-000000000010', 'pgtap-prov-2048@example.test', jsonb_build_object('full_name', 'Edge Avatar', 'avatar_url', 'https://' || repeat('a', 2040))),
  ('a4000000-0000-4000-8000-000000000011', 'pgtap-prov-scalar@example.test', '"not an object"'),
  ('a4000000-0000-4000-8000-000000000012', 'pgtap-prov-upper@example.test', '{"full_name":"Upper Scheme","avatar_url":"HTTPS://example.test/a.png","picture":"https://fallback.example/p.png"}'),
  ('a4000000-0000-4000-8000-000000000018', 'pgtap-prov-cut-space@example.test', jsonb_build_object('full_name', repeat('a', 99) || ' b'))
) v (id, email, meta);

-- The provider gate: only Google accounts are provisioned, and no shape of raw_app_meta_data raises.
select lives_ok($$insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  ('a4000000-0000-4000-8000-000000000013', 'pgtap-prov-email@example.test', '{"full_name":"Email Signup"}', '{"provider":"email","providers":["email"]}'),
  ('a4000000-0000-4000-8000-000000000014', 'pgtap-prov-null-app@example.test', '{"full_name":"Null App Meta"}', null),
  ('a4000000-0000-4000-8000-000000000015', 'pgtap-prov-empty-app@example.test', '{"full_name":"Empty App Meta"}', '{}'),
  ('a4000000-0000-4000-8000-000000000016', 'pgtap-prov-linked@example.test', '{"full_name":"Linked Google"}', '{"provider":"email","providers":["email","google"]}'),
  ('a4000000-0000-4000-8000-000000000017', 'pgtap-prov-odd-app@example.test', '{"full_name":"Odd App Meta"}', '["google"]'),
  ('a4000000-0000-4000-8000-000000000019', 'pgtap-prov-provider-only@example.test', '{"full_name":"Provider Only"}', '{"provider":"google"}')$$,
  'non-Google and odd raw_app_meta_data shapes insert without error');

create temp table prov on commit drop as
  select s.user_id, s.id, s.full_name, s.avatar_url, s.department_id, s.hero_title from public.sunners s
  where s.user_id::text like 'a4000000-%';
create or replace function pg_temp.name_of(n int) returns text language sql as
  $$ select full_name from pg_temp.prov where user_id = ('a4000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid $$;
create or replace function pg_temp.avatar_of(n int) returns text language sql as
  $$ select avatar_url from pg_temp.prov where user_id = ('a4000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid $$;

select is((select count(*) from prov), 15::bigint, 'every Google auth user got a sunners row');
select is((select array_agg(right(u.id::text, 2) order by u.id) from auth.users u
           where u.id::text like 'a4000000-%' and not exists (select 1 from public.sunners s where s.user_id = u.id)),
  array['13', '14', '15', '17'], 'no row for provider email, null or empty app metadata, or app metadata that is not an object');
select is(pg_temp.name_of(16), 'Linked Google', 'provider email with google among providers is provisioned');
select is(pg_temp.name_of(19), 'Provider Only', 'provider google without a providers array is provisioned');
select is((select count(*) from (select user_id from prov group by user_id having count(*) > 1) d), 0::bigint, 'exactly one row per user');
select is((select row(full_name, avatar_url, department_id, hero_title)::text from prov where user_id = 'a4000000-0000-4000-8000-000000000001'),
  row('Nguyễn Văn Google', 'https://lh3.googleusercontent.com/a/pgtap', null::uuid, null::text)::text,
  'full_name and avatar_url trimmed from the Google metadata; department and hero title null');
select is(pg_temp.name_of(2), 'Name Only', 'name is used when full_name is missing');
select is(pg_temp.avatar_of(2), 'https://lh3.googleusercontent.com/a/picture', 'picture is used when avatar_url is missing');
select is(pg_temp.name_of(3), 'Fallback Name', 'a whitespace-only full_name counts as missing; NBSP is trimmed');
select is(pg_temp.avatar_of(3), 'https://x.example/p.png', 'a blank avatar_url falls back to picture');
select is(pg_temp.name_of(4), 'pgtap-prov.local-part', 'no name in the metadata: the email local part');
select is(row(pg_temp.name_of(5), pg_temp.avatar_of(5))::text, row('Sunner', null::text)::text, 'null metadata and no email: Sunner, no avatar');
select is(pg_temp.name_of(6), 'Sunner', 'blank names and an empty email local part: Sunner');
select is(pg_temp.name_of(7), repeat('Đ', 99) || 'X', 'a name over 100 characters is cut to its first 100 characters');
select is(pg_temp.avatar_of(7), null, 'an http:// avatar is dropped');
select is(pg_temp.avatar_of(8), null, 'a javascript: avatar is dropped');
select is(pg_temp.avatar_of(9), null, 'an https avatar over 2048 characters is dropped');
select is(char_length(pg_temp.avatar_of(10)), 2048, 'an https avatar of exactly 2048 characters is kept');
select is(row(pg_temp.name_of(11), pg_temp.avatar_of(11))::text, row('pgtap-prov-scalar', null::text)::text,
  'metadata that is not a JSON object falls back to the email');
select is(pg_temp.avatar_of(12), null, 'only a lowercase https:// prefix is accepted, with no fallback to picture');
select is(pg_temp.name_of(18), repeat('a', 99), 'a 100-character cut that ends in whitespace is trimmed again');
select ok((select bool_and(full_name <> '' and char_length(full_name) <= 100) from prov), 'every provisioned name is non-empty and at most 100 characters');
select is((select count(*) from public.sunners s join seeded d on d.id = s.id
           where row(s.user_id, s.full_name, s.avatar_url, s.department_id, s.hero_title) is distinct from row(d.user_id, d.full_name, d.avatar_url, d.department_id, d.hero_title)),
  0::bigint, 'seeded sunners rows are left untouched');

-- Backfill: the migration statement, verbatim, against users that lack a row.
delete from public.sunners where user_id in ('a4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000004');
create temp table backfill_run (run int, inserted bigint) on commit drop;
with ins as (
  insert into public.sunners (user_id, full_name, avatar_url)
  select u.id, p.full_name, p.avatar_url
  from auth.users u
  cross join lateral kudos_private.sunner_profile_from_auth(u.raw_user_meta_data, u.email) p
  where kudos_private.is_google_account(u.raw_app_meta_data)
    and not exists (select 1 from public.sunners s where s.user_id = u.id)
  on conflict (user_id) do nothing
  returning 1)
insert into backfill_run select 1, count(*) from ins;
with ins as (
  insert into public.sunners (user_id, full_name, avatar_url)
  select u.id, p.full_name, p.avatar_url
  from auth.users u
  cross join lateral kudos_private.sunner_profile_from_auth(u.raw_user_meta_data, u.email) p
  where kudos_private.is_google_account(u.raw_app_meta_data)
    and not exists (select 1 from public.sunners s where s.user_id = u.id)
  on conflict (user_id) do nothing
  returning 1)
insert into backfill_run select 2, count(*) from ins;
select is((select array_agg(inserted order by run) from backfill_run), array[2::bigint, 0::bigint],
  'backfill adds the two missing rows; a second run adds none');
select is((select row(full_name, avatar_url)::text from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000001'),
  row('Nguyễn Văn Google', 'https://lh3.googleusercontent.com/a/pgtap')::text, 'backfilled row follows the same name and avatar rule');
select is((select full_name from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000004'), 'pgtap-prov.local-part',
  'backfilled row falls back to the email like the trigger');
select is((select count(*) from public.sunners where user_id::text like 'a4000000-%'), 15::bigint, 'still exactly one row per Google fixture user');
select is((select count(*) from public.sunners where user_id in ('a4000000-0000-4000-8000-000000000013', 'a4000000-0000-4000-8000-000000000014',
             'a4000000-0000-4000-8000-000000000015', 'a4000000-0000-4000-8000-000000000017')), 0::bigint, 'backfill skips non-Google accounts');
select is((select count(*) from public.sunners where user_id is null), (select count(*) from seeded where user_id is null),
  'backfill never links a seeded (user_id null) row');

-- GoTrue links Google to an existing same-email account with an UPDATE of raw_app_meta_data.
update auth.users set raw_app_meta_data = '{"provider":"email","providers":["email","google"]}'
  where id = 'a4000000-0000-4000-8000-000000000013';
select is((select array_agg(full_name) from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000013'), array['Email Signup'],
  'linking Google to an email account provisions exactly one row with the ALG-007 name');
update auth.users set raw_app_meta_data = '{"provider":"google","providers":["google","email"]}',
                      raw_user_meta_data = '{"full_name":"Renamed Later","avatar_url":"https://example.test/new.png"}'
  where id = 'a4000000-0000-4000-8000-000000000001';
select is((select array_agg(row(full_name, avatar_url)::text) from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000001'),
  array[row('Nguyễn Văn Google', 'https://lh3.googleusercontent.com/a/pgtap')::text],
  'a Google user who already has a row: the update keeps one row, name and avatar unchanged');
select lives_ok($$update auth.users set last_sign_in_at = now(), raw_user_meta_data = '{"full_name":"Still Null App"}'
                  where id = 'a4000000-0000-4000-8000-000000000014'$$, 'an unrelated update on a non-Google user raises nothing');
select is((select count(*) from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000014'), 0::bigint,
  'a non-Google user stays without a row after an unrelated update');
-- A Google user whose row was removed: only an update of raw_app_meta_data may provision again.
delete from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000019';
update auth.users set last_sign_in_at = now(), raw_user_meta_data = '{"full_name":"Sign In Again"}'
  where id = 'a4000000-0000-4000-8000-000000000019';
select is((select count(*) from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000019'), 0::bigint,
  'updates of other columns (last_sign_in_at, raw_user_meta_data) do not fire provisioning');

-- A provisioned user can read and write kudos right away (no sunner_not_found).
insert into public.sunners (id, user_id, full_name) values ('b4000000-0000-4000-8000-0000000000ff', null, 'PgTap Prov Receiver');
insert into public.hashtags (id, slug, label) values ('e4000000-0000-4000-8000-000000000001', 'pgtap-prov', '#PgTapProv');
insert into public.kudos (id, sender_id, receiver_id, content) values
  ('c4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-0000000000ff',
   (select id from public.sunners where user_id = 'a4000000-0000-4000-8000-000000000001'), 'pgTAP provisioned like target');
create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
grant select, insert on rpc_result to authenticated;
grant select on prov to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"a4000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(kudos_private.viewer_sunner_id(), (select id from prov where user_id = 'a4000000-0000-4000-8000-000000000002'),
  'viewer_sunner_id resolves the provisioned row');
select throws_ok($$select user_id from public.sunners$$, '42501', null, 'sunners.user_id stays hidden from authenticated');
select throws_ok($$select kudos_private.provision_sunner()$$, '42501', null, 'authenticated cannot call the trigger function');
select throws_ok($$select * from kudos_private.sunner_profile_from_auth('{}', 'x@example.test')$$, '42501', null, 'authenticated cannot call the profile helper');
insert into rpc_result values ('kudo', public.create_kudo('b4000000-0000-4000-8000-0000000000ff', 'Chào mừng', 'Cảm ơn bạn',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Cảm ơn bạn"}]}]}', '{pgtap-prov}', '{}', false, null));
select is(public.toggle_kudo_like('c4000000-0000-4000-8000-000000000001'), '{"liked": true, "likeCount": 1}'::jsonb,
  'a provisioned user can like a kudo');
reset role;
select is((select k.sender_id from public.kudos k, rpc_result r where r.name = 'kudo' and k.id = (r.j ->> 'kudoId')::uuid),
  (select id from prov where user_id = 'a4000000-0000-4000-8000-000000000002'), 'a provisioned user can write a kudo, stored as the sender');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select * from kudos_private.sunner_profile_from_auth('{}', 'x@example.test')$$, '42501', null, 'anon cannot call the profile helper');
reset role;

select * from finish();
rollback;

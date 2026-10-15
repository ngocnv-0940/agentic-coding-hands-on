-- pgTAP: RLS + grants on the 9 Kudos tables, hardening of the 6 RPCs, and the read RPC contract
-- (phase-03 "RPC contract": camelCase keys, ALG-001 order, ALG-004 cursor, sidebar without viewer).
-- Fixture ids use prefix a2/b2/c2/d2/e2; kudos sit in 2090 so they are the newest rows in the DB.
-- RPC results are captured into rpc_result while impersonating, then asserted as postgres.
begin;
create extension if not exists pgtap with schema extensions;
select plan(72);

insert into auth.users (id, email) values
  ('a2000000-0000-4000-8000-000000000001', 'pgtap-reads-viewer@example.test'),
  ('a2000000-0000-4000-8000-000000000002', 'pgtap-reads-no-sunner@example.test');
insert into public.departments (id, code, name) values
  ('d2000000-0000-4000-8000-000000000001', 'PGTAP-A', 'PgTap Dept A'),
  ('d2000000-0000-4000-8000-000000000002', 'PGTAP-B', 'PgTap Dept B');
insert into public.hashtags (id, slug, label) values
  ('e2000000-0000-4000-8000-000000000001', 'pgtap-board', '#PgTapBoard'),
  ('e2000000-0000-4000-8000-000000000002', 'pgtap-alpha', '#PgTapAlpha'),
  ('e2000000-0000-4000-8000-000000000003', 'pgtap-bulk', '#PgTapBulk');
insert into public.sunners (id, user_id, full_name, avatar_url, department_id, hero_title) values
  ('b2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'PgTap Viewer', '/pgtap/viewer.png', 'd2000000-0000-4000-8000-000000000001', 'rising_hero'),
  ('b2000000-0000-4000-8000-000000000002', null, 'PgTap Sender', null, 'd2000000-0000-4000-8000-000000000002', null),
  ('b2000000-0000-4000-8000-000000000003', null, 'PgTap Receiver A', null, 'd2000000-0000-4000-8000-000000000001', null),
  ('b2000000-0000-4000-8000-000000000004', null, 'PgTap Receiver B', null, 'd2000000-0000-4000-8000-000000000002', null),
  ('b2000000-0000-4000-8000-000000000005', null, 'PgTap Liker 5', null, null, null),
  ('b2000000-0000-4000-8000-000000000006', null, 'PgTap Liker 6', null, null, null),
  ('b2000000-0000-4000-8000-000000000007', null, 'PgTap Liker 7', null, null, null),
  ('b2000000-0000-4000-8000-000000000008', null, 'PgTap Bulk Receiver', null, null, null);
-- k5 and k6 share created_at (id breaks the tie); k7 is the oldest and carries 6 images + 2 hashtags
insert into public.kudos (id, sender_id, receiver_id, title, content, created_at) values
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', 'PgTap Title', 'k1', '2090-01-01T00:01:00Z'),
  ('c2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000004', null, 'k2', '2090-01-01T00:02:00Z'),
  ('c2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', null, 'k3', '2090-01-01T00:03:00Z'),
  ('c2000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000003', null, 'k4', '2090-01-01T00:04:00Z'),
  ('c2000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', null, 'k5', '2090-01-01T00:05:00Z'),
  ('c2000000-0000-4000-8000-000000000006', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000004', null, 'k6', '2090-01-01T00:05:00Z'),
  ('c2000000-0000-4000-8000-000000000007', 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', null, 'k7', '2090-01-01T00:00:00Z');
insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select k.id, 'e2000000-0000-4000-8000-000000000001' from public.kudos k where k.id::text like 'c2000000-%';
insert into public.kudo_hashtags (kudo_id, hashtag_id) values
  ('c2000000-0000-4000-8000-000000000007', 'e2000000-0000-4000-8000-000000000002');
insert into public.kudo_images (kudo_id, url, position)
  select 'c2000000-0000-4000-8000-000000000007', '/pgtap/img-' || p || '.jpg', p from generate_series(5, 0, -1) p;
-- like counts: k3=3, k1=2, k2=2, k4=1 (worth 2 hearts), k5=1 (by the viewer), k6=1, k7=0
insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded) values
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000005', 1),
  ('c2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000006', 1),
  ('c2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000005', 1),
  ('c2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000006', 1),
  ('c2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000005', 1),
  ('c2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000006', 1),
  ('c2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000007', 1),
  ('c2000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000005', 2),
  ('c2000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000001', 1),
  ('c2000000-0000-4000-8000-000000000006', 'b2000000-0000-4000-8000-000000000005', 1);
-- 55 bulk kudos (2080) to observe the 50-row limit clamp
insert into public.kudos (sender_id, receiver_id, content, created_at)
  select 'b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000008', 'bulk ' || n, '2080-01-01T00:00:00Z'::timestamptz + n * interval '1 second'
  from generate_series(1, 55) n;
insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select k.id, 'e2000000-0000-4000-8000-000000000003' from public.kudos k where k.receiver_id = 'b2000000-0000-4000-8000-000000000008';
insert into public.secret_boxes (owner_id, opened_at, prize_description) values
  ('b2000000-0000-4000-8000-000000000001', '2099-01-01T00:00:00Z', 'PgTap Prize Old'),
  ('b2000000-0000-4000-8000-000000000001', '2099-01-02T00:00:00Z', 'PgTap Prize New'),
  ('b2000000-0000-4000-8000-000000000001', null, null);

create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
grant select, insert on rpc_result to authenticated;
-- kudo numbers (last two id digits) of a captured array, in order
create function pg_temp.nums(p_name text) returns int[] language sql as $$
  select array_agg(right(e ->> 'id', 2)::int order by o)
  from rpc_result r, jsonb_array_elements(r.j) with ordinality t(e, o) where r.name = p_name $$;
create function pg_temp.card(p_name text, p_num int) returns jsonb language sql as $$
  select e from rpc_result r, jsonb_array_elements(r.j) e
  where r.name = p_name and e ->> 'id' = 'c2000000-0000-4000-8000-0000000000' || lpad(p_num::text, 2, '0') $$;
create function pg_temp.keys(p jsonb) returns text[] language sql as $$
  select array_agg(k order by k) from jsonb_object_keys(p) k $$;
create function pg_temp.got(p_name text) returns jsonb language sql as $$
  select j from rpc_result where name = p_name $$;

-- RLS, policies, grants, function hardening (catalog checks as postgres)
select is((select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relrowsecurity
           and c.relname in ('departments','sunners','hashtags','kudos','kudo_hashtags','kudo_images','kudo_likes','special_days','secret_boxes')),
  9::bigint, 'RLS is enabled on all 9 Kudos tables');
select is((select count(*) from pg_policies where schemaname = 'public' and cmd = 'SELECT' and roles = '{authenticated}'::name[] and qual = 'true'
           and tablename in ('departments','sunners','hashtags','kudos','kudo_hashtags','kudo_images','kudo_likes','special_days','secret_boxes')),
  9::bigint, 'each table has one SELECT policy for authenticated using (true)');
select is((select count(*) from pg_policies where schemaname = 'public'
           and tablename in ('departments','sunners','hashtags','kudos','kudo_hashtags','kudo_images','kudo_likes','special_days','secret_boxes')),
  9::bigint, 'no other policy exists (no insert/update/delete policy)');
select is((select count(*) from unnest(array['anon','authenticated']) r,
             unnest(array['departments','sunners','hashtags','kudos','kudo_hashtags','kudo_images','kudo_likes','special_days','secret_boxes']) t,
             unnest(array['INSERT','UPDATE','DELETE','TRUNCATE']) p
           where has_table_privilege(r, 'public.' || t, p)),
  0::bigint, 'anon and authenticated hold no write privilege on any Kudos table');
select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
           and proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar')),
  0::bigint, 'the 5 read RPCs are SECURITY INVOKER (RLS applies)');
select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace
           and proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','toggle_kudo_like')),
  6::bigint, 'the 6 RPCs exist exactly once each');
select is((select count(*) from pg_proc p where (p.pronamespace = 'kudos_private'::regnamespace
             or p.proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','toggle_kudo_like'))
           and p.proconfig is distinct from array['search_path=""']),
  0::bigint, 'every Kudos function pins search_path to empty');
select is((select count(*) from pg_proc p where (p.pronamespace = 'kudos_private'::regnamespace
             or p.proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','toggle_kudo_like'))
           and has_function_privilege('anon', p.oid, 'execute')),
  0::bigint, 'anon cannot execute any Kudos function');
select is((select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
           and p.proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','toggle_kudo_like')
           and has_function_privilege('authenticated', p.oid, 'execute')),
  6::bigint, 'authenticated can execute the 6 RPCs');
select is((select count(*) from pg_proc p, aclexplode(p.proacl) a where a.grantee = 0 and (p.pronamespace = 'kudos_private'::regnamespace
             or p.proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','toggle_kudo_like'))),
  0::bigint, 'PUBLIC holds no execute grant on any Kudos function');

-- anon: no rows, no RPCs
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is(array[(select count(*) from public.departments), (select count(*) from public.sunners), (select count(*) from public.hashtags),
                 (select count(*) from public.kudos), (select count(*) from public.kudo_hashtags), (select count(*) from public.kudo_images),
                 (select count(*) from public.kudo_likes), (select count(*) from public.special_days), (select count(*) from public.secret_boxes)],
  array[0,0,0,0,0,0,0,0,0]::bigint[], 'anon reads 0 rows from every Kudos table');
select throws_ok($$select public.kudos_filter_options()$$, '42501', null, 'anon cannot call kudos_filter_options');
select throws_ok($$select public.kudos_highlight(null, null)$$, '42501', null, 'anon cannot call kudos_highlight');
select throws_ok($$select public.kudos_feed_page(null, null, null, null, 10)$$, '42501', null, 'anon cannot call kudos_feed_page');
select throws_ok($$select public.kudos_spotlight()$$, '42501', null, 'anon cannot call kudos_spotlight');
select throws_ok($$select public.kudos_sidebar()$$, '42501', null, 'anon cannot call kudos_sidebar');
reset role;

-- capture as the viewer
set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$insert into public.kudos (sender_id, receiver_id, content)
                   values ('b2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000003', 'forged')$$,
  '42501', null, 'authenticated cannot insert kudos');
select cmp_ok((select count(*) from public.kudos), '>=', 62::bigint, 'authenticated reads every kudo through RLS');
insert into rpc_result values
  ('options', public.kudos_filter_options()),
  ('hl_board', public.kudos_highlight('pgtap-board', null)),
  ('hl_board_a', public.kudos_highlight('pgtap-board', 'PGTAP-A')),
  ('hl_b', public.kudos_highlight(null, 'PGTAP-B')),
  ('feed_all', public.kudos_feed_page('pgtap-board', null, null, null, 50)),
  ('feed_p1', public.kudos_feed_page('pgtap-board', null, null, null, 1)),
  ('feed_half_cursor', public.kudos_feed_page('pgtap-board', null, '2090-01-01T00:03:00Z', null, 50)),
  ('feed_blank_tag_b', public.kudos_feed_page('', 'PGTAP-B', null, null, 10)),
  ('feed_unknown', public.kudos_feed_page('no-such-tag', null, null, null, 10)),
  ('feed_limit_0', public.kudos_feed_page('pgtap-board', null, null, null, 0)),
  ('feed_limit_null', public.kudos_feed_page('pgtap-board', null, null, null, null)),
  ('feed_limit_neg', public.kudos_feed_page('pgtap-board', null, null, null, -3)),
  ('feed_bulk_500', public.kudos_feed_page('pgtap-bulk', null, null, null, 500)),
  ('spotlight', public.kudos_spotlight()),
  ('sidebar', public.kudos_sidebar());
insert into rpc_result select 'feed_p2', public.kudos_feed_page('pgtap-board', null, (j -> -1 ->> 'createdAt')::timestamptz, (j -> -1 ->> 'id')::uuid, 3)
  from rpc_result where name = 'feed_p1';
insert into rpc_result select 'feed_p3', public.kudos_feed_page('pgtap-board', null, (j -> -1 ->> 'createdAt')::timestamptz, (j -> -1 ->> 'id')::uuid, 3)
  from rpc_result where name = 'feed_p2';
insert into rpc_result select 'feed_p4', public.kudos_feed_page('pgtap-board', null, (j -> -1 ->> 'createdAt')::timestamptz, (j -> -1 ->> 'id')::uuid, 3)
  from rpc_result where name = 'feed_p3';
-- a signed-in user without a sunners row
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated"}';
insert into rpc_result values
  ('feed_no_sunner', public.kudos_feed_page('pgtap-board', null, null, null, 50)),
  ('sidebar_no_sunner', public.kudos_sidebar());
reset role;

-- kudos_filter_options
select is(pg_temp.keys(pg_temp.got('options')), array['departments','hashtags'], 'filter options keys');
select ok(pg_temp.got('options') -> 'hashtags' @> '[{"slug":"pgtap-board","label":"#PgTapBoard"}]', 'hashtag options are {slug,label}');
select ok(pg_temp.got('options') -> 'departments' @> '[{"code":"PGTAP-A","name":"PgTap Dept A"}]', 'department options are {code,name}');
select is(array(select e ->> 'label' from jsonb_array_elements(pg_temp.got('options') -> 'hashtags') with ordinality t(e, o) order by o),
  array(select label from public.hashtags order by label, slug), 'all hashtags, ordered by label');
select is(array(select e ->> 'name' from jsonb_array_elements(pg_temp.got('options') -> 'departments') with ordinality t(e, o) order by o),
  array(select name from public.departments order by name, code), 'all departments, ordered by name');

-- kudos_highlight (ALG-001: like rows desc, created_at desc, id desc; max 5)
select is(pg_temp.nums('hl_board'), array[3,2,1,6,5], 'highlight: most likes first, ties newer then higher id, capped at 5');
select is(pg_temp.nums('hl_board_a'), array[3,1,5,4,7], 'highlight: hashtag AND receiver department (viewer and receiver A are in dept A)');
select is(pg_temp.nums('hl_b'), array[2,6], 'highlight: department only');

-- kudos_feed_page (ALG-004 keyset cursor)
select is(pg_temp.nums('feed_all'), array[6,5,4,3,2,1,7], 'feed: created_at desc, id desc');
select is(pg_temp.nums('feed_p1'), array[6], 'feed page 1 (limit 1)');
select is(pg_temp.nums('feed_p2'), array[5,4,3], 'feed page 2 starts after the cursor, inside a created_at tie');
select is(pg_temp.nums('feed_p3'), array[2,1,7], 'feed page 3');
select is(pg_temp.got('feed_p4'), '[]'::jsonb, 'feed past the last row is an empty array');
select is(pg_temp.nums('feed_p1') || pg_temp.nums('feed_p2') || pg_temp.nums('feed_p3'), pg_temp.nums('feed_all'), 'pages: no duplicate, no gap');
select is(pg_temp.nums('feed_half_cursor'), pg_temp.nums('feed_all'), 'a half cursor (id missing) is ignored');
select is(pg_temp.nums('feed_blank_tag_b'), array[6,2], 'an empty hashtag string means no hashtag filter');
select is(pg_temp.got('feed_unknown'), '[]'::jsonb, 'an unknown hashtag matches nothing');
select is(jsonb_array_length(pg_temp.got('feed_limit_0')), 1, 'p_limit 0 is clamped to 1');
select is(jsonb_array_length(pg_temp.got('feed_limit_null')), 7, 'p_limit null defaults to 10');
select is(jsonb_array_length(pg_temp.got('feed_limit_neg')), 1, 'a negative p_limit is clamped to 1');
select is(jsonb_array_length(pg_temp.got('feed_bulk_500')), 50, 'p_limit is clamped to 50');

-- KudoCard / Person shape and values
select is(pg_temp.keys(pg_temp.card('feed_all', 5)),
  array['canLike','content','createdAt','hashtags','id','images','likeCount','likedByViewer','receiver','sender','title'], 'KudoCard keys');
select is(pg_temp.keys(pg_temp.card('feed_all', 5) -> 'sender'),
  array['avatarUrl','department','heroTitle','id','name','receivedCount'], 'Person keys');
select is(pg_temp.keys(pg_temp.card('feed_all', 7) -> 'hashtags' -> 0), array['label','slug'], 'hashtag keys');
select is(pg_temp.keys(pg_temp.card('feed_all', 7) -> 'images' -> 0), array['url'], 'image keys');
select is(pg_temp.card('feed_all', 5) -> 'likedByViewer', 'true'::jsonb, 'likedByViewer is true on a kudo the viewer liked');
select is(pg_temp.card('feed_all', 5) -> 'canLike', 'true'::jsonb, 'canLike is true when the viewer is not the sender');
select is(pg_temp.card('feed_all', 4) -> 'canLike', 'false'::jsonb, 'canLike is false on the viewer''s own kudo');
select is(pg_temp.card('feed_all', 4) -> 'likedByViewer', 'false'::jsonb, 'likedByViewer is false when no like row exists');
select is(pg_temp.card('feed_all', 5) -> 'receiver',
  '{"id":"b2000000-0000-4000-8000-000000000001","name":"PgTap Viewer","avatarUrl":"/pgtap/viewer.png","department":"PgTap Dept A","heroTitle":"rising_hero","receivedCount":1}'::jsonb,
  'Person values: department name, hero title, derived receivedCount');
select is(pg_temp.card('feed_all', 3) -> 'likeCount', '3'::jsonb, 'likeCount counts like rows');
select is(pg_temp.card('feed_all', 1) -> 'title', '"PgTap Title"'::jsonb, 'title is returned');
select is(pg_temp.card('feed_all', 2) -> 'title', 'null'::jsonb, 'a missing title is null');
select is(pg_temp.card('feed_all', 7) -> 'images',
  '[{"url":"/pgtap/img-0.jpg"},{"url":"/pgtap/img-1.jpg"},{"url":"/pgtap/img-2.jpg"},{"url":"/pgtap/img-3.jpg"},{"url":"/pgtap/img-4.jpg"}]'::jsonb,
  'images: at most 5, by position');
select is(pg_temp.card('feed_all', 7) -> 'hashtags',
  '[{"slug":"pgtap-alpha","label":"#PgTapAlpha"},{"slug":"pgtap-board","label":"#PgTapBoard"}]'::jsonb, 'hashtags: all, by label');
select is(pg_temp.card('feed_all', 1) -> 'createdAt', '"2090-01-01T00:01:00.000Z"'::jsonb, 'createdAt is ISO 8601 UTC');
select is(pg_temp.card('feed_all', 1) -> 'sender',
  '{"id":"b2000000-0000-4000-8000-000000000002","name":"PgTap Sender","avatarUrl":null,"department":"PgTap Dept B","heroTitle":null,"receivedCount":0}'::jsonb,
  'Person nulls stay null');
select is(jsonb_build_array(pg_temp.card('feed_no_sunner', 5) -> 'canLike', pg_temp.card('feed_no_sunner', 5) -> 'likedByViewer'),
  '[false,false]'::jsonb, 'without a sunners row: canLike and likedByViewer are false');

-- kudos_spotlight
select is(pg_temp.keys(pg_temp.got('spotlight')), array['receivers','recent','total'], 'spotlight keys');
select is((pg_temp.got('spotlight') ->> 'total')::bigint, (select count(*) from public.kudos), 'total = every kudo');
select is(pg_temp.got('spotlight') -> 'receivers' -> 0,
  '{"sunnerId":"b2000000-0000-4000-8000-000000000004","name":"PgTap Receiver B","latestKudoId":"c2000000-0000-4000-8000-000000000006","latestCreatedAt":"2090-01-01T00:05:00.000Z"}'::jsonb,
  'receivers: latest first, keyed by their newest kudo');
select is(jsonb_array_length(pg_temp.got('spotlight') -> 'receivers')::bigint,
  (select least(100, count(distinct receiver_id)) from public.kudos), 'receivers: one per distinct receiver, max 100');
select ok(pg_temp.got('spotlight') -> 'receivers' @> '[{"sunnerId":"b2000000-0000-4000-8000-000000000003","latestKudoId":"c2000000-0000-4000-8000-000000000004"}]',
  'a receiver points at their newest kudo');
select is(pg_temp.got('spotlight') -> 'recent' -> 0,
  '{"kudoId":"c2000000-0000-4000-8000-000000000006","receiverName":"PgTap Receiver B","createdAt":"2090-01-01T00:05:00.000Z"}'::jsonb,
  'recent: newest kudo first');
select is(jsonb_array_length(pg_temp.got('spotlight') -> 'recent'), 5, 'recent: 5 kudos');

-- kudos_sidebar
select is(pg_temp.got('sidebar') - 'latestGifts',
  '{"hasSunner":true,"stats":{"received":1,"sent":1,"hearts":2,"boxesOpened":2,"boxesUnopened":1}}'::jsonb,
  'viewer stats; hearts = stored hearts_awarded on likes of kudos the viewer sent');
select is(pg_temp.got('sidebar') -> 'latestGifts' -> 0,
  '{"sunnerId":"b2000000-0000-4000-8000-000000000001","name":"PgTap Viewer","avatarUrl":"/pgtap/viewer.png","prize":"PgTap Prize New","openedAt":"2099-01-02T00:00:00.000Z"}'::jsonb,
  'latestGifts: newest opened box first');
select is(pg_temp.got('sidebar') -> 'latestGifts' -> 1 ->> 'prize', 'PgTap Prize Old', 'latestGifts: ordered by opened_at desc');
select is(jsonb_array_length(pg_temp.got('sidebar') -> 'latestGifts')::bigint,
  (select least(10, count(*)) from public.secret_boxes where opened_at is not null), 'latestGifts: max 10');
select is((select count(*) from jsonb_array_elements(pg_temp.got('sidebar') -> 'latestGifts') e where e -> 'openedAt' = 'null'::jsonb),
  0::bigint, 'unopened boxes are not gifts');
select is(pg_temp.got('sidebar_no_sunner') - 'latestGifts',
  '{"hasSunner":false,"stats":{"received":0,"sent":0,"hearts":0,"boxesOpened":0,"boxesUnopened":0}}'::jsonb,
  'without a sunners row: hasSunner false and every stat 0');
select is(pg_temp.got('sidebar_no_sunner') -> 'latestGifts', pg_temp.got('sidebar') -> 'latestGifts', 'latestGifts does not depend on the viewer');

-- created_at must be a whole millisecond (the feed cursor is a JS Date): a microsecond value is rejected
select throws_ok(
  $$insert into public.kudos (sender_id, receiver_id, content, created_at)
    values ('b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', 'x', '2090-01-01 00:00:00.123456+00')$$,
  '23514', null, 'a microsecond created_at is rejected');
select lives_ok(
  $$insert into public.kudos (sender_id, receiver_id, content, created_at)
    values ('b2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000003', 'x', '2090-01-01 00:00:00.123+00')$$,
  'a whole-millisecond created_at is accepted');

select * from finish();
rollback;

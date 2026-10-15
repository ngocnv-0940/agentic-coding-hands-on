-- pgTAP: sender masking (FR-604, phase-03 "Masking mechanism"). No authenticated path returns the real sender
-- of an anonymous kudo: column privileges hide kudos.sender_id and sunners.user_id from direct selects,
-- filters, ordering and embeds; the board RPCs return sender null + alias; stats still credit the sender.
-- Fixture prefixes: a9 auth users, b9 sunners, c9 kudos, e9 hashtag; kudos sit in 2095 (newest rows).
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

insert into auth.users (id, email) values
  ('a9000000-0000-4000-8000-000000000001', 'pgtap-mask-sender@example.test'),
  ('a9000000-0000-4000-8000-000000000002', 'pgtap-mask-viewer@example.test');
insert into public.sunners (id, user_id, full_name, avatar_url) values
  ('b9000000-0000-4000-8000-000000000001', 'a9000000-0000-4000-8000-000000000001', 'PgTap Hidden Sender', '/pgtap/hidden.png'),
  ('b9000000-0000-4000-8000-000000000002', 'a9000000-0000-4000-8000-000000000002', 'PgTap Mask Viewer', null),
  ('b9000000-0000-4000-8000-000000000003', null, 'PgTap Mask Receiver', null);
insert into public.hashtags (id, slug, label) values ('e9000000-0000-4000-8000-000000000001', 'pgtap-mask', '#PgTapMask');
-- c9..01 anonymous with alias (most liked -> highlight), c9..02 anonymous without alias, c9..03 named
insert into public.kudos (id, sender_id, receiver_id, content, is_anonymous, anonymous_name, created_at) values
  ('c9000000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000003', 'anon with alias', true, 'Bí ẩn', '2095-01-01T00:01:00Z'),
  ('c9000000-0000-4000-8000-000000000002', 'b9000000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000003', 'anon no alias', true, null, '2095-01-01T00:02:00Z'),
  ('c9000000-0000-4000-8000-000000000003', 'b9000000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000003', 'named', false, null, '2095-01-01T00:03:00Z');
insert into public.kudo_hashtags (kudo_id, hashtag_id) select k.id, 'e9000000-0000-4000-8000-000000000001' from public.kudos k where k.id::text like 'c9000000-%';
insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded) values
  ('c9000000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000002', 2);

create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
grant select, insert on rpc_result to authenticated;
create function pg_temp.card(p_name text, p_num int) returns jsonb language sql as $$
  select e from rpc_result r, jsonb_array_elements(r.j) e
  where r.name = p_name and e ->> 'id' = 'c9000000-0000-4000-8000-00000000000' || p_num $$;
create function pg_temp.keys(p jsonb) returns text[] language sql as $$
  select array_agg(k order by k) from jsonb_object_keys(p) k $$;

-- Column privileges (catalog, as postgres)
select is(has_table_privilege('authenticated', 'public.kudos', 'select'), false, 'authenticated holds no table-wide SELECT on kudos');
select is(has_table_privilege('authenticated', 'public.sunners', 'select'), false, 'authenticated holds no table-wide SELECT on sunners');
select is(has_column_privilege('authenticated', 'public.kudos', 'sender_id', 'select'), false, 'kudos.sender_id is not selectable by authenticated');
select is(has_column_privilege('authenticated', 'public.sunners', 'user_id', 'select'), false, 'sunners.user_id is not selectable by authenticated');
select is((select array_agg(a.attname::text order by a.attname) from pg_attribute a
           where a.attrelid = 'public.kudos'::regclass and a.attnum > 0 and not a.attisdropped
             and has_column_privilege('authenticated', 'public.kudos', a.attname, 'select')),
  array['anonymous_name','content','content_doc','created_at','id','is_anonymous','receiver_id','title'], 'kudos columns readable by authenticated');
select is((select array_agg(a.attname::text order by a.attname) from pg_attribute a
           where a.attrelid = 'public.sunners'::regclass and a.attnum > 0 and not a.attisdropped
             and has_column_privilege('authenticated', 'public.sunners', a.attname, 'select')),
  array['avatar_url','department_id','full_name','hero_title','id'], 'sunners columns readable by authenticated');
select is((select count(*) from pg_attribute a where a.attrelid in ('public.kudos'::regclass, 'public.sunners'::regclass) and a.attnum > 0
           and not a.attisdropped and has_column_privilege('anon', a.attrelid, a.attname, 'select')),
  0::bigint, 'anon can select no column of kudos or sunners');

-- Function security mode (catalog)
select is((select array_agg(p.oid::regprocedure::text order by p.oid::regprocedure::text) from pg_proc p
           where p.prosecdef and (p.pronamespace = 'kudos_private'::regnamespace
             or p.proname in ('kudos_filter_options','kudos_highlight','kudos_feed_page','kudos_spotlight','kudos_sidebar','search_sunners'))),
  array['kudos_private.kudo_cards(uuid[],uuid)', 'kudos_private.provision_sunner()', 'kudos_private.viewer_sunner_id()', 'kudos_sidebar()'],
  'only kudo_cards, viewer_sunner_id and kudos_sidebar read hidden columns as DEFINER; provision_sunner (auth.users trigger, no client EXECUTE) writes user_id');
select is((select count(*) from pg_proc p where (p.pronamespace = 'kudos_private'::regnamespace
             or p.proname in ('search_sunners', 'create_kudo')) and p.proconfig is distinct from array['search_path=""']),
  0::bigint, 'every Kudos helper and the new RPCs pin search_path to empty');
select is((select count(*) from pg_proc p where (p.pronamespace = 'kudos_private'::regnamespace or p.proname in ('search_sunners', 'create_kudo'))
           and has_function_privilege('anon', p.oid, 'execute')), 0::bigint, 'anon cannot execute any Kudos helper or new RPC');

-- Direct table access as another signed-in user (what PostgREST would run)
set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok($$select sender_id from public.kudos$$, '42501', null, 'select kudos.sender_id is denied');
select throws_ok($$select * from public.kudos$$, '42501', null, 'select * on kudos is denied');
select throws_ok($$select id from public.kudos where sender_id = 'b9000000-0000-4000-8000-000000000001'$$, '42501', null, 'filtering on sender_id is denied');
select throws_ok($$select id from public.kudos order by sender_id$$, '42501', null, 'ordering by sender_id is denied');
select throws_ok($$select s.full_name from public.kudos k join public.sunners s on s.id = k.sender_id$$, '42501', null, 'joining (embedding) the sender is denied');
select throws_ok($$select user_id from public.sunners$$, '42501', null, 'select sunners.user_id is denied');
select lives_ok($$select id, receiver_id, title, content, content_doc, is_anonymous, anonymous_name, created_at from public.kudos$$, 'the public kudos columns stay readable');
select lives_ok($$select id, full_name, avatar_url, department_id, hero_title from public.sunners$$, 'the public sunners columns stay readable');
insert into rpc_result values
  ('feed', public.kudos_feed_page('pgtap-mask', null, null, null, 10)),
  ('highlight', public.kudos_highlight('pgtap-mask', null));
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into rpc_result values
  ('feed_as_sender', public.kudos_feed_page('pgtap-mask', null, null, null, 10)),
  ('sidebar_sender', public.kudos_sidebar());
reset role;

-- Board RPC cards
select is(pg_temp.keys(pg_temp.card('feed', 1)),
  array['anonymousName','canLike','content','createdAt','hashtags','id','images','isAnonymous','likeCount','likedByViewer','receiver','sender','title'],
  'KudoCard keys gain isAnonymous and anonymousName');
select is(pg_temp.card('feed', 1) -> 'sender', 'null'::jsonb, 'anonymous card: sender is null');
select is(pg_temp.card('feed', 1) -> 'isAnonymous', 'true'::jsonb, 'anonymous card: isAnonymous true');
select is(pg_temp.card('feed', 1) ->> 'anonymousName', 'Bí ẩn', 'anonymous card: the alias is returned');
select is(pg_temp.card('feed', 2) -> 'anonymousName', 'null'::jsonb, 'anonymous card without alias: anonymousName null (UI shows the default label)');
select is(pg_temp.card('feed', 2) -> 'sender', 'null'::jsonb, 'anonymous card without alias: sender is null');
select is(pg_temp.card('feed', 1) -> 'canLike', 'true'::jsonb, 'another viewer can like an anonymous kudo');
select is((select array[count(*), count(*) filter (where position('b9000000-0000-4000-8000-000000000001' in e::text) > 0
                                   or position('PgTap Hidden Sender' in e::text) > 0 or position('/pgtap/hidden.png' in e::text) > 0)]
           from rpc_result r, jsonb_array_elements(r.j) e where r.name in ('feed', 'highlight', 'feed_as_sender') and e -> 'isAnonymous' = 'true'::jsonb),
  array[6, 0]::bigint[], 'no anonymous card (6 across feed, highlight, sender feed) carries the sender id, name or avatar');
select is(pg_temp.card('feed', 3) -> 'sender' ->> 'id', 'b9000000-0000-4000-8000-000000000001', 'named card: sender unchanged');
select is(jsonb_build_array(pg_temp.card('feed', 3) -> 'isAnonymous', pg_temp.card('feed', 3) -> 'anonymousName'), '[false, null]'::jsonb,
  'named card: isAnonymous false, anonymousName null');
select is((select jsonb_path_query_array(r.j, '$[*] ? (@.isAnonymous == true).sender') from rpc_result r where r.name = 'highlight'),
  '[null, null]'::jsonb, 'kudos_highlight masks anonymous senders too');
select is(pg_temp.card('feed_as_sender', 1) -> 'sender', 'null'::jsonb, 'the sender also sees the alias, not themselves');
select is(pg_temp.card('feed_as_sender', 1) ->> 'anonymousName', 'Bí ẩn', 'the sender sees the alias');
select is(pg_temp.card('feed_as_sender', 1) -> 'canLike', 'false'::jsonb, 'canLike still uses the real sender (no self like)');

-- Stats credit the real sender
select is((select (j -> 'stats') - 'boxesOpened' - 'boxesUnopened' from rpc_result where name = 'sidebar_sender'),
  '{"received":0,"sent":3,"hearts":2}'::jsonb, 'kudos_sidebar credits the real sender: anonymous kudos count as sent, their likes as hearts');

-- anon: no column at all
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select id from public.kudos$$, '42501', null, 'anon cannot read kudos');
select throws_ok($$select id from public.sunners$$, '42501', null, 'anon cannot read sunners');
reset role;

select * from finish();
rollback;

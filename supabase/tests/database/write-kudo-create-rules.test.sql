-- pgTAP: public.create_kudo (phase-03 §Contract, INT-002, BR-001..009): hardening, every error code (in the
-- contract order), the stored rows (real sender even when anonymous, trimmed title/content/alias, image
-- positions 1..N) and atomicity. Table checks on the new kudos / kudo_images columns as well.
-- Fixture prefixes: a7 auth users, b7 sunners, e7 hashtags, f7 storage object names (uuid v4 shaped).
-- Each failing call runs against `base` (one valid argument row) with one argument swapped.
begin;
create extension if not exists pgtap with schema extensions;
select plan(64);

insert into auth.users (id, email) values
  ('a7000000-0000-4000-8000-000000000001', 'pgtap-write-sender@example.test'),
  ('a7000000-0000-4000-8000-000000000002', 'pgtap-write-other@example.test'),
  ('a7000000-0000-4000-8000-000000000003', 'pgtap-write-no-sunner@example.test');
insert into public.sunners (id, user_id, full_name) values
  ('b7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'PgTap Writer'),
  ('b7000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000002', 'PgTap Other Writer'),
  ('b7000000-0000-4000-8000-000000000003', null, 'PgTap Write Receiver');
insert into public.hashtags (id, slug, label)
  select ('e7000000-0000-4000-8000-00000000000' || n)::uuid, 'pgtap-w' || n, '#PgTapW' || n from generate_series(1, 6) n;
-- f7..01-07 and 11 belong to the writer, f7..10 to the other user; 11 is already used by a kudo.
insert into storage.objects (bucket_id, name, owner_id) values
  ('kudo-images', 'f7000000-0000-4000-8000-000000000001.png', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000002.jpg', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000003.webp', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000004.png', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000005.png', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000006.png', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000007.png', 'a7000000-0000-4000-8000-000000000001'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000010.png', 'a7000000-0000-4000-8000-000000000002'),
  ('kudo-images', 'f7000000-0000-4000-8000-000000000011.png', 'a7000000-0000-4000-8000-000000000001');
insert into public.kudos (id, sender_id, receiver_id, content) values
  ('c7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000003', 'existing');
insert into public.kudo_images (kudo_id, url, position) values
  ('c7000000-0000-4000-8000-000000000001', 'kudo-images/f7000000-0000-4000-8000-000000000011.png', 1);

create temp table base (receiver uuid, title text, content text, doc jsonb, tags text[], images text[], anon boolean, alias text) on commit drop;
insert into base values ('b7000000-0000-4000-8000-000000000003', 'Danh hiệu', 'Cảm ơn bạn',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Cảm ơn bạn"}]}]}',
  '{pgtap-w1}', '{}', false, null);
create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
grant select on base to authenticated;
grant select, insert on rpc_result to authenticated;

-- Hardening (catalog, as postgres)
select is((select prosecdef from pg_proc where proname = 'create_kudo' and pronamespace = 'public'::regnamespace), true, 'create_kudo is SECURITY DEFINER');
select is((select proconfig from pg_proc where proname = 'create_kudo' and pronamespace = 'public'::regnamespace), array['search_path=""'], 'create_kudo pins search_path to empty');
select is(has_function_privilege('anon', 'public.create_kudo(uuid, text, text, jsonb, text[], text[], boolean, text)', 'execute'), false, 'anon cannot execute create_kudo');
select is(has_function_privilege('authenticated', 'public.create_kudo(uuid, text, text, jsonb, text[], text[], boolean, text)', 'execute'), true, 'authenticated can execute create_kudo');
select is((select count(*) from pg_proc p, aclexplode(p.proacl) a where p.proname = 'create_kudo' and a.grantee = 0), 0::bigint, 'PUBLIC has no execute grant on create_kudo');

-- Table rules on the new columns (as postgres)
select col_not_null('public', 'kudos', 'is_anonymous', 'kudos.is_anonymous is not null');
select col_default_is('public', 'kudos', 'is_anonymous', 'false', 'kudos.is_anonymous defaults to false');
select throws_ok($$insert into public.kudos (sender_id, receiver_id, content, anonymous_name)
                   values ('b7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000003', 'x', 'Alias')$$,
  '23514', null, 'an alias without is_anonymous is rejected by the table');
select throws_ok($$insert into public.kudos (sender_id, receiver_id, content, is_anonymous, anonymous_name)
                   values ('b7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000003', 'x', true, repeat('a', 51))$$,
  '23514', null, 'an alias over 50 characters is rejected by the table');
select throws_ok($$insert into public.kudos (sender_id, receiver_id, content, is_anonymous, anonymous_name)
                   values ('b7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000003', 'x', true, '')$$,
  '23514', null, 'an empty alias is stored as null, never as an empty string');
select throws_ok($$insert into public.kudo_images (kudo_id, url, position) values ('c7000000-0000-4000-8000-000000000001', 'javascript:alert(1)', 2)$$,
  '23514', null, 'kudo_images.url only accepts /images/, https:// or kudo-images/ values');
select throws_ok($$insert into public.kudo_images (kudo_id, url, position)
                   values ('c7000000-0000-4000-8000-000000000001', 'kudo-images/f7000000-0000-4000-8000-000000000011.png', 2)$$,
  '23505', null, 'an uploaded object can back only one kudo image row');

-- Identity
set local role authenticated;
set local request.jwt.claims = '{"sub":"a7000000-0000-4000-8000-000000000003","role":"authenticated"}';
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'sunner_not_found', 'a user without a sunners row cannot write');
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'sunner_not_found', 'no sub claim raises sunner_not_found');

set local request.jwt.claims = '{"sub":"a7000000-0000-4000-8000-000000000001","role":"authenticated"}';
-- Receiver
select throws_ok($$select public.create_kudo('b7000000-0000-4000-8000-0000000000ff', title, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'receiver_not_found', 'unknown receiver');
select throws_ok($$select public.create_kudo(null, title, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'receiver_not_found', 'null receiver');
select throws_ok($$select public.create_kudo('b7000000-0000-4000-8000-000000000001', title, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'self_kudo', 'a sunner cannot send a kudo to themselves');
-- Title (1..100 after trim)
select throws_ok($$select public.create_kudo(receiver, E'  \n\t ', content, doc, tags, images, anon, alias) from base$$, 'P0001', 'title_invalid', 'whitespace-only title');
select throws_ok($$select public.create_kudo(receiver, null, content, doc, tags, images, anon, alias) from base$$, 'P0001', 'title_invalid', 'null title');
select throws_ok($$select public.create_kudo(receiver, repeat('a', 101), content, doc, tags, images, anon, alias) from base$$, 'P0001', 'title_invalid', 'title over 100 characters');
-- Content (1..2000 after trim)
select throws_ok($$select public.create_kudo(receiver, title, E'\n \t\n', doc, tags, images, anon, alias) from base$$, 'P0001', 'content_invalid', 'newline-only content');
select throws_ok($$select public.create_kudo(receiver, title, repeat('a', 2001), doc, tags, images, anon, alias) from base$$, 'P0001', 'content_invalid', 'content over 2000 characters');
-- content_doc (ALG-002 schema walk)
select throws_ok($$select public.create_kudo(receiver, title, content, null, tags, images, anon, alias) from base$$, 'P0001', 'content_doc_invalid', 'null doc');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"paragraph"}', tags, images, anon, alias) from base$$, 'P0001', 'content_doc_invalid', 'root node is not doc');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"doc","content":[{"type":"heading","content":[{"type":"text","text":"x"}]}]}', tags, images, anon, alias) from base$$,
  'P0001', 'content_doc_invalid', 'a node type outside the whitelist');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"code"}]}]}]}', tags, images, anon, alias) from base$$,
  'P0001', 'content_doc_invalid', 'a mark type outside the whitelist');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}', tags, images, anon, alias) from base$$,
  'P0001', 'content_doc_invalid', 'a javascript: link');
select throws_ok(format($$select public.create_kudo(receiver, title, content, %L, tags, images, anon, alias) from base$$,
    jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text', 'x', 'marks', jsonb_build_array(jsonb_build_object('type', 'link', 'attrs', jsonb_build_object('href', 'https://' || repeat('a', 2041)))))))))),
  'P0001', 'content_doc_invalid', 'a link over 2048 characters');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"mention","attrs":{"id":"b7000000-0000-4000-8000-0000000000ff","label":"Ghost"}}]}]}', tags, images, anon, alias) from base$$,
  'P0001', 'content_doc_invalid', 'a mention of an unknown sunner');
select throws_ok(format($$select public.create_kudo(receiver, title, content, %L, tags, images, anon, alias) from base$$,
    jsonb_build_object('type', 'doc', 'content', jsonb_build_array(jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text', repeat('a', 70000))))))),
  'P0001', 'content_doc_invalid', 'a doc over 64 KiB');
select throws_ok($$select public.create_kudo(receiver, title, content, '{"type":"doc","content":["x"]}', tags, images, anon, alias) from base$$, 'P0001', 'content_doc_invalid', 'a non-object child node');
-- Hashtags (1..5 distinct existing slugs)
select throws_ok($$select public.create_kudo(receiver, title, content, doc, '{}', images, anon, alias) from base$$, 'P0001', 'hashtags_invalid', 'no hashtag');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, '{pgtap-w1,pgtap-w2,pgtap-w3,pgtap-w4,pgtap-w5,pgtap-w6}', images, anon, alias) from base$$, 'P0001', 'hashtags_invalid', 'six hashtags');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, '{pgtap-w1,pgtap-w1}', images, anon, alias) from base$$, 'P0001', 'hashtags_invalid', 'a duplicate hashtag');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, '{pgtap-w1,no-such-tag}', images, anon, alias) from base$$, 'P0001', 'hashtags_invalid', 'an unknown hashtag (no free-text creation)');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, null, images, anon, alias) from base$$, 'P0001', 'hashtags_invalid', 'null hashtags');
-- Images (0..5 distinct neutral names, uploaded by the caller, unused)
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags,
    '{f7000000-0000-4000-8000-000000000001.png,f7000000-0000-4000-8000-000000000002.jpg,f7000000-0000-4000-8000-000000000003.webp,f7000000-0000-4000-8000-000000000004.png,f7000000-0000-4000-8000-000000000005.png,f7000000-0000-4000-8000-000000000006.png}',
    anon, alias) from base$$, 'P0001', 'images_invalid', 'six images');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-000000000001.png,f7000000-0000-4000-8000-000000000001.png}', anon, alias) from base$$,
  'P0001', 'images_invalid', 'a duplicate image');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{a7000000-0000-4000-8000-000000000001/f7000000-0000-4000-8000-000000000001.png}', anon, alias) from base$$,
  'P0001', 'images_invalid', 'a uid folder path is not a neutral name');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-000000000001.gif}', anon, alias) from base$$, 'P0001', 'images_invalid', 'a disallowed extension');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-0000000000ff.png}', anon, alias) from base$$, 'P0001', 'images_invalid', 'a name that was never uploaded');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-000000000010.png}', anon, alias) from base$$, 'P0001', 'images_invalid', 'another user''s upload');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-000000000011.png}', anon, alias) from base$$, 'P0001', 'images_invalid', 'an upload already used by a kudo');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, null, anon, alias) from base$$, 'P0001', 'images_invalid', 'null images');
-- Anonymous alias (only when anonymous, <= 50 after trim)
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, images, false, 'Alias') from base$$, 'P0001', 'anonymous_name_invalid', 'an alias on a named kudo');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, images, false, '') from base$$, 'P0001', 'anonymous_name_invalid', 'an empty alias on a named kudo');
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, images, true, repeat('a', 51)) from base$$, 'P0001', 'anonymous_name_invalid', 'an alias over 50 characters');
-- Order: the first failing rule wins
select throws_ok($$select public.create_kudo(receiver, '', content, doc, '{}', '{bad}', false, 'x') from base$$, 'P0001', 'title_invalid', 'title is checked before hashtags, images and alias');
select throws_ok($$select public.create_kudo(receiver, title, content, '{}', '{}', images, anon, alias) from base$$, 'P0001', 'content_doc_invalid', 'content_doc is checked before hashtags');
reset role;

-- Atomicity: nothing above wrote a row (the image check fails after hashtags were resolved)
select is((select count(*) from public.kudos where sender_id = 'b7000000-0000-4000-8000-000000000001'), 0::bigint, 'failed calls leave no kudo');
select is((select count(*) from public.kudo_images where url like 'kudo-images/f7%'), 1::bigint, 'failed calls leave no image row');
select is((select count(*) from public.kudo_hashtags kh join public.hashtags h on h.id = kh.hashtag_id where h.slug like 'pgtap-w%'), 0::bigint, 'failed calls leave no hashtag row');

-- Success paths
set local role authenticated;
set local request.jwt.claims = '{"sub":"a7000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into rpc_result values ('named', public.create_kudo('b7000000-0000-4000-8000-000000000003', E'  Người truyền lửa \n', E'\n Cảm ơn @PgTap Other Writer  ',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Cảm ơn "},{"type":"mention","attrs":{"id":"b7000000-0000-4000-8000-000000000002","label":"PgTap Other Writer"}},{"type":"text","text":" xem ","marks":[{"type":"bold"},{"type":"italic"},{"type":"strike"}]},{"type":"text","text":"link","marks":[{"type":"link","attrs":{"href":"https://sun-asterisk.com","target":"_blank"}}]}]},{"type":"orderedList","attrs":{"start":1,"type":null},"content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"one"},{"type":"hardBreak"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph"}]}]}',
  '{pgtap-w2,pgtap-w1}', '{f7000000-0000-4000-8000-000000000003.webp,f7000000-0000-4000-8000-000000000001.png}', false, null));
insert into rpc_result select 'anonymous', public.create_kudo(receiver, repeat('x', 100), repeat('y', 2000), doc, '{pgtap-w1,pgtap-w2,pgtap-w3,pgtap-w4,pgtap-w5}',
  '{f7000000-0000-4000-8000-000000000002.jpg,f7000000-0000-4000-8000-000000000004.png,f7000000-0000-4000-8000-000000000005.png,f7000000-0000-4000-8000-000000000006.png,f7000000-0000-4000-8000-000000000007.png}',
  true, '  Bí ẩn  ') from base;
insert into rpc_result select 'anonymous_blank_alias', public.create_kudo(receiver, title, content, doc, tags, '{}', true, '   ') from base;
insert into rpc_result select 'anonymous_alias_50', public.create_kudo(receiver, title, content, doc, tags, '{}', true, repeat('z', 50)) from base;
select throws_ok($$select public.create_kudo(receiver, title, content, doc, tags, '{f7000000-0000-4000-8000-000000000001.png}', anon, alias) from base$$,
  'P0001', 'images_invalid', 'an image used by a just-created kudo cannot be reused');
reset role;

select is((select array_agg(k order by k) from rpc_result r, jsonb_object_keys(r.j) k where r.name = 'named'), array['kudoId'], 'create_kudo returns {kudoId}');
select is((select row(k.sender_id, k.receiver_id, k.title, k.content, k.is_anonymous, k.anonymous_name)::text from public.kudos k, rpc_result r
           where r.name = 'named' and k.id = (r.j ->> 'kudoId')::uuid),
  row('b7000000-0000-4000-8000-000000000001'::uuid, 'b7000000-0000-4000-8000-000000000003'::uuid, 'Người truyền lửa', 'Cảm ơn @PgTap Other Writer', false, null::text)::text,
  'stored row: sender is the caller, title and content trimmed, not anonymous');
select is((select k.content_doc -> 'content' -> 0 -> 'content' -> 1 ->> 'type' from public.kudos k, rpc_result r where r.name = 'named' and k.id = (r.j ->> 'kudoId')::uuid),
  'mention', 'content_doc is stored as sent');
select is((select array_agg(h.slug order by h.slug) from public.kudo_hashtags kh join public.hashtags h on h.id = kh.hashtag_id, rpc_result r
           where r.name = 'named' and kh.kudo_id = (r.j ->> 'kudoId')::uuid), array['pgtap-w1', 'pgtap-w2'], 'hashtag rows are written');
select is((select array_agg(i.url || '@' || i.position order by i.position) from public.kudo_images i, rpc_result r
           where r.name = 'named' and i.kudo_id = (r.j ->> 'kudoId')::uuid),
  array['kudo-images/f7000000-0000-4000-8000-000000000003.webp@1', 'kudo-images/f7000000-0000-4000-8000-000000000001.png@2'],
  'image rows store kudo-images/<name>, position 1..N in array order');
select is((select row(k.sender_id, k.is_anonymous, k.anonymous_name, char_length(k.title), char_length(k.content))::text from public.kudos k, rpc_result r
           where r.name = 'anonymous' and k.id = (r.j ->> 'kudoId')::uuid),
  row('b7000000-0000-4000-8000-000000000001'::uuid, true, 'Bí ẩn', 100, 2000)::text,
  'anonymous kudo keeps the real sender, trims the alias; 100-char title and 2000-char content accepted');
select is((select count(*) from public.kudo_hashtags kh, rpc_result r where r.name = 'anonymous' and kh.kudo_id = (r.j ->> 'kudoId')::uuid), 5::bigint, 'five hashtags accepted');
select is((select count(*) from public.kudo_images i, rpc_result r where r.name = 'anonymous' and i.kudo_id = (r.j ->> 'kudoId')::uuid), 5::bigint, 'five images accepted');
select is((select row(k.is_anonymous, k.anonymous_name)::text from public.kudos k, rpc_result r where r.name = 'anonymous_blank_alias' and k.id = (r.j ->> 'kudoId')::uuid),
  row(true, null::text)::text, 'a blank alias on an anonymous kudo is stored as null');
select is((select k.anonymous_name from public.kudos k, rpc_result r where r.name = 'anonymous_alias_50' and k.id = (r.j ->> 'kudoId')::uuid),
  repeat('z', 50), 'a 50-character alias is accepted');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select public.create_kudo(null, null, null, null, null, null, null, null)$$, '42501', null, 'anon cannot call create_kudo');
reset role;

select * from finish();
rollback;

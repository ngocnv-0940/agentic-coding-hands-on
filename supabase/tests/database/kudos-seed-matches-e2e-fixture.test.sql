-- pgTAP: supabase/seed.sql reproduces the E2E mock fixture (e2e/support/kudos-fixture-ids.ts EXPECT),
-- so the mock and the real SQL cannot drift apart unnoticed. Needs `supabase db reset` (seed applied).
-- The seed leaves sunners.user_id null; this test links the viewer and sender rows to test users.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
  ('a3000000-0000-4000-8000-000000000001', 'pgtap-seed-viewer@example.test'),
  ('a3000000-0000-4000-8000-000000000002', 'pgtap-seed-sender@example.test');
update public.sunners set user_id = 'a3000000-0000-4000-8000-000000000001' where id = '00000000-0000-4000-8000-000000000101';
update public.sunners set user_id = 'a3000000-0000-4000-8000-000000000002' where id = '00000000-0000-4000-8000-000000000102';

create temp table rpc_result (name text primary key, j jsonb not null) on commit drop;
grant select, insert on rpc_result to authenticated;
-- fixture kudo numbers (kudoId(n) ends in the two digits of n), in order
create function pg_temp.nums(p_name text) returns int[] language sql as $$
  select array_agg(right(e ->> 'id', 2)::int order by o)
  from rpc_result r, jsonb_array_elements(r.j) with ordinality t(e, o) where r.name = p_name $$;
create function pg_temp.got(p_name text) returns jsonb language sql as $$
  select j from rpc_result where name = p_name $$;
create function pg_temp.card(p_name text, p_num int) returns jsonb language sql as $$
  select e from rpc_result r, jsonb_array_elements(r.j) e
  where r.name = p_name and e ->> 'id' = '00000000-0000-4000-8000-0000000002' || lpad(p_num::text, 2, '0') $$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into rpc_result values
  ('options', public.kudos_filter_options()),
  ('hl_all', public.kudos_highlight(null, null)),
  ('hl_teamwork', public.kudos_highlight('teamwork', null)),
  ('hl_dedicated', public.kudos_highlight('dedicated', null)),
  ('hl_mkt', public.kudos_highlight(null, 'MKT')),
  ('hl_dedicated_mkt', public.kudos_highlight('dedicated', 'MKT')),
  ('feed_first', public.kudos_feed_page(null, null, null, null, 10)),
  ('feed_all', public.kudos_feed_page(null, null, null, null, 50)),
  ('feed_dedicated', public.kudos_feed_page('dedicated', null, null, null, 50)),
  ('feed_mkt', public.kudos_feed_page(null, 'MKT', null, null, 50)),
  ('spotlight', public.kudos_spotlight()),
  ('sidebar_viewer', public.kudos_sidebar()),
  ('search_nguyen', public.search_sunners('Nguyễn')),
  ('search_an', public.search_sunners('An')),
  ('search_duc', public.search_sunners('duc')),
  ('search_nguyenvana', public.search_sunners('NguyenVanA'));
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000002","role":"authenticated"}';
insert into rpc_result values ('sidebar_sender', public.kudos_sidebar());
reset role;

select is(jsonb_array_length(pg_temp.got('options') -> 'hashtags'), 7, 'seed: 7 hashtags');
select is(jsonb_array_length(pg_temp.got('options') -> 'departments'), 4, 'seed: 4 departments');
select is((pg_temp.got('spotlight') ->> 'total')::int, 25, 'EXPECT.kudoTotal');
select is(pg_temp.nums('hl_all'), array[25,20,18,15,21], 'EXPECT.highlightAll');
select is(pg_temp.nums('hl_teamwork'), array[25,18,15,10,4], 'EXPECT.highlightTeamwork');
select is(pg_temp.nums('hl_dedicated'), array[25,20,15,4,17], 'EXPECT.highlightDedicated');
select is(pg_temp.nums('hl_mkt'), array[25,20,15,10,13], 'EXPECT.highlightMarketing');
select is(pg_temp.nums('hl_dedicated_mkt'), array[25,20,15,5], 'EXPECT.highlightDedicatedMarketing');
select is(pg_temp.nums('feed_first'), array[25,24,23,22,21,20,19,18,17,16], 'EXPECT.feedFirstPage');
select is(jsonb_array_length(pg_temp.got('feed_dedicated')), 8, 'EXPECT.dedicatedKudoCount');
select is(jsonb_array_length(pg_temp.got('feed_mkt')), 6, 'EXPECT.marketingKudoCount');
select is(pg_temp.card('feed_all', 25) -> 'likeCount', '1000'::jsonb, 'EXPECT.thousandLikesKudo has 1000 likes');
select is(jsonb_build_array(pg_temp.card('feed_all', 24) -> 'likeCount', pg_temp.card('feed_all', 23) -> 'likeCount',
                            pg_temp.card('feed_all', 24) -> 'canLike', pg_temp.card('feed_all', 24) -> 'hashtags'),
  '[0, 0, true, [{"slug":"like-target-2026","label":"#LikeTarget2026"}]]'::jsonb, 'like targets A and B start at 0 likes');
select is(jsonb_build_array(jsonb_array_length(pg_temp.card('feed_all', 12) -> 'hashtags'), jsonb_array_length(pg_temp.card('feed_all', 13) -> 'images')),
  '[6, 5]'::jsonb, 'overflow kudos: 6 hashtags kept, 6 images capped to 5');
select is(jsonb_array_length(pg_temp.got('spotlight') -> 'receivers'), 8, 'EXPECT.spotlightReceiverCount');
select is(pg_temp.got('sidebar_viewer') -> 'stats', '{"received":3,"sent":2,"hearts":3,"boxesOpened":2,"boxesUnopened":1}'::jsonb, 'EXPECT.viewerStats');
-- What the mock computes from KUDO_ROWS (sender sends k10 with 7 likes, k22, k23, k24); EXPECT.senderStats matches.
select is(pg_temp.got('sidebar_sender') -> 'stats', '{"received":0,"sent":4,"hearts":7,"boxesOpened":0,"boxesUnopened":0}'::jsonb, 'sender stats as the mock computes them');
select is(jsonb_array_length(pg_temp.got('sidebar_viewer') -> 'latestGifts'), 9, 'EXPECT.giftsShown');
select is(pg_temp.got('sidebar_viewer') -> 'latestGifts' -> 0 ->> 'prize', 'Voucher 500.000 VND', 'EXPECT.firstGiftPrize');

-- Write-kudo fixture (F007): writer + 10 receiver-only sunners, and what the mock's searchSunners answers
-- for the viewer (computed by running e2e/support/mock-kudos-sunner-search.ts on the fixture).
select is((select array_agg(s.full_name || '|' || coalesce(d.code, '-') order by s.id) from public.sunners s left join public.departments d on d.id = s.department_id
           where s.id between '00000000-0000-4000-8000-000000000111' and '00000000-0000-4000-8000-000000000121'),
  array['Vũ Hải Đăng|DEV', 'Nguyễn Văn An|DEV', 'NguyenVanA|HR', 'Nguyễn Thị Bình|DEV', 'Nguyễn Quốc Cường|DEV', 'Nguyễn Đức Dũng|DEV',
        'Nguyễn Thanh Hằng|DEV', 'Nguyễn Minh Hiếu|DEV', 'Nguyễn Thu Hương|DEV', 'Nguyễn Anh Khoa|DEV', 'Nguyễn Ngọc Lan|DEV'],
  'SUNNER.writer..lan rows (NAME, department)');
select is(array(select e ->> 'name' from jsonb_array_elements(pg_temp.got('search_nguyen')) with ordinality t(e, o) order by o),
  array['NguyenVanA', 'Nguyễn Anh Khoa', 'Nguyễn Bá Chúc', 'Nguyễn Hoàng Linh', 'Nguyễn Minh Hiếu', 'Nguyễn Ngọc Lan', 'Nguyễn Quốc Cường',
        'Nguyễn Thanh Hằng', 'Nguyễn Thu Hương', 'Nguyễn Thị Bình'], 'search "Nguyễn": the mock''s 10 names in the mock''s order');
select is(array(select e ->> 'name' from jsonb_array_elements(pg_temp.got('search_an')) with ordinality t(e, o) order by o),
  array['Huỳnh Dương Xuân', 'Huỳnh Dương Xuân Nhật', 'NguyenVanA', 'Nguyễn Anh Khoa', 'Nguyễn Hoàng Linh', 'Nguyễn Ngọc Lan', 'Nguyễn Thanh Hằng',
        'Nguyễn Văn An', 'Nguyễn Văn Quy', 'Trần Minh Đức'], 'search "An" matches the mock');
select is(array(select e ->> 'name' from jsonb_array_elements(pg_temp.got('search_duc')) with ordinality t(e, o) order by o),
  array['Nguyễn Đức Dũng', 'Trần Minh Đức'], 'search "duc" matches the mock');
select is(pg_temp.got('search_nguyenvana'),
  '[{"id":"00000000-0000-4000-8000-000000000113","name":"NguyenVanA","avatarUrl":null,"department":"Human Resources"}]'::jsonb,
  'search option shape matches the mock');
select is(jsonb_build_array(pg_temp.card('feed_all', 4) -> 'isAnonymous', pg_temp.card('feed_all', 4) -> 'anonymousName', pg_temp.card('feed_all', 4) -> 'sender' ->> 'name'),
  '[false, null, "E2E User"]'::jsonb, 'seed kudos are named: isAnonymous false, anonymousName null, sender kept');

select * from finish();
rollback;

-- pgTAP: kudos_sidebar().latestGifts lists the 10 Sunners who most recently opened a box (MoMorph D.3
-- "10 Sunner vừa nhận quà mới nhất"), one row per Sunner carrying their newest opened box.
-- Own fixture rows (prefix a4/b4) opened in 2099 so they sort ahead of the seed's boxes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values
  ('a4000000-0000-4000-8000-000000000001', 'pgtap-gifts-viewer@example.test');
insert into public.sunners (id, user_id, full_name) values
  ('b4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'PgTap Gift Twice'),
  ('b4000000-0000-4000-8000-000000000002', null, 'PgTap Gift Once');
insert into public.secret_boxes (owner_id, opened_at, prize_description) values
  ('b4000000-0000-4000-8000-000000000001', '2099-01-03T00:00:00Z', 'Newest prize'),
  ('b4000000-0000-4000-8000-000000000002', '2099-01-02T00:00:00Z', 'Middle prize'),
  ('b4000000-0000-4000-8000-000000000001', '2099-01-01T00:00:00Z', 'Older prize');

set local role authenticated;
set local request.jwt.claims = '{"sub":"a4000000-0000-4000-8000-000000000001","role":"authenticated"}';
create temp table gifts on commit drop as select public.kudos_sidebar() -> 'latestGifts' as j;

select is((select array[j -> 0 ->> 'name', j -> 0 ->> 'prize', j -> 1 ->> 'name', j -> 1 ->> 'prize'] from gifts),
  array['PgTap Gift Twice', 'Newest prize', 'PgTap Gift Once', 'Middle prize'],
  'newest opener first, each with their newest prize');
select is((select count(*) from gifts, jsonb_array_elements(j) e where e ->> 'sunnerId' = 'b4000000-0000-4000-8000-000000000001'),
  1::bigint, 'a Sunner who opened two boxes appears once');
select is((select count(distinct e ->> 'sunnerId') = count(*) from gifts, jsonb_array_elements(j) e), true,
  'no Sunner is listed twice');
select ok((select jsonb_array_length(j) <= 10 from gifts), 'at most 10 Sunners');

select * from finish();
rollback;

-- pgTAP: public.toggle_kudo_like (ALG-003, BR-002..006) and the client write lock on kudo_likes.
-- Own fixture rows with fixed ids (prefix a1/b1/c1) so the seed never changes the outcome.
-- Impersonation: set local role + request.jwt.claims, which is what auth.uid() reads.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (id, email) values
  ('a1000000-0000-4000-8000-000000000001', 'pgtap-like-sender@example.test'),
  ('a1000000-0000-4000-8000-000000000002', 'pgtap-like-liker-1@example.test'),
  ('a1000000-0000-4000-8000-000000000003', 'pgtap-like-liker-2@example.test'),
  ('a1000000-0000-4000-8000-000000000004', 'pgtap-like-no-sunner@example.test');
insert into public.sunners (id, user_id, full_name) values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'PgTap Sender'),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'PgTap Liker One'),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', 'PgTap Liker Two'),
  ('b1000000-0000-4000-8000-000000000004', null, 'PgTap Receiver');
insert into public.kudos (id, sender_id, receiver_id, content) values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', 'pgTAP like target');

-- Function hardening
select is((select prosecdef from pg_proc where oid = 'public.toggle_kudo_like(uuid)'::regprocedure), true,
  'toggle_kudo_like is SECURITY DEFINER');
select is((select proconfig from pg_proc where oid = 'public.toggle_kudo_like(uuid)'::regprocedure), array['search_path=""'],
  'toggle_kudo_like pins search_path to empty');
select is(has_function_privilege('anon', 'public.toggle_kudo_like(uuid)', 'execute'), false, 'anon cannot execute toggle_kudo_like');
select is(has_function_privilege('authenticated', 'public.toggle_kudo_like(uuid)', 'execute'), true, 'authenticated can execute toggle_kudo_like');
select is((select count(*) from pg_proc p, aclexplode(p.proacl) a
           where p.oid = 'public.toggle_kudo_like(uuid)'::regprocedure and a.grantee = 0), 0::bigint,
  'PUBLIC has no execute grant on toggle_kudo_like');

-- BR-002/003: one like per sunner, two likers count separately, unlike toggles back
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": true, "likeCount": 1}'::jsonb, 'liker one likes');
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": true, "likeCount": 2}'::jsonb, 'liker two likes, count 2');
reset role;
select is((select hearts_awarded from public.kudo_likes
           where kudo_id = 'c1000000-0000-4000-8000-000000000001' and sunner_id = 'b1000000-0000-4000-8000-000000000002'),
  1::smallint, 'a like on a normal day stores 1 heart');

set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": false, "likeCount": 1}'::jsonb, 'liker one unlikes');
reset role;
select is((select count(*) from public.kudo_likes where sunner_id = 'b1000000-0000-4000-8000-000000000002'), 0::bigint,
  'unlike deletes the like row');

-- BR-004/self like, missing sunner, missing kudo
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001')$$, 'P0001', 'self_like',
  'the sender cannot like their own kudo');
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated"}';
select throws_ok($$select public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001')$$, 'P0001', 'sunner_not_found',
  'a user without a sunners row cannot like (no auto-create)');
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok($$select public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001')$$, 'P0001', 'sunner_not_found',
  'no sub claim raises sunner_not_found');
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok($$select public.toggle_kudo_like('c1000000-0000-4000-8000-0000000000ff')$$, 'P0001', 'kudo_not_found',
  'an unknown kudo id raises kudo_not_found');
select throws_ok($$select public.toggle_kudo_like(null)$$, 'P0001', 'kudo_not_found', 'a null kudo id raises kudo_not_found');
reset role;

select throws_ok($$insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded)
                   values ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 1)$$,
  '23505', null, 'unique (kudo_id, sunner_id): a second like row is rejected');
select throws_ok($$insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded)
                   values ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 3)$$,
  '23514', null, 'hearts_awarded only accepts 1 or 2');

-- BR-004/005: special day (Asia/Ho_Chi_Minh) stores 2; unlike revokes the stored 2 after the day ends
insert into public.special_days (day) values ((now() at time zone 'Asia/Ho_Chi_Minh')::date);
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": true, "likeCount": 2}'::jsonb, 'like on a special day');
reset role;
select is((select hearts_awarded from public.kudo_likes
           where kudo_id = 'c1000000-0000-4000-8000-000000000001' and sunner_id = 'b1000000-0000-4000-8000-000000000002'),
  2::smallint, 'a like on a special day stores 2 hearts');
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.kudos_sidebar() -> 'stats' ->> 'hearts')::int, 3, 'sender hearts = 1 (normal) + 2 (special)');
reset role;

delete from public.special_days;
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": false, "likeCount": 1}'::jsonb,
  'unlike after the special day ended');
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((public.kudos_sidebar() -> 'stats' ->> 'hearts')::int, 1, 'unlike revoked exactly the stored 2 hearts');
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001'), '{"liked": true, "likeCount": 2}'::jsonb, 'like again on a normal day');
reset role;
select is((select hearts_awarded from public.kudo_likes
           where kudo_id = 'c1000000-0000-4000-8000-000000000001' and sunner_id = 'b1000000-0000-4000-8000-000000000002'),
  1::smallint, 'the new like is worth 1 heart once the special day is gone');

-- No client writes on kudo_likes: toggle_kudo_like is the only write path
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated"}';
select throws_ok($$insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded)
                   values ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 2)$$,
  '42501', null, 'authenticated cannot insert into kudo_likes');
select throws_ok($$update public.kudo_likes set hearts_awarded = 2$$, '42501', null, 'authenticated cannot update kudo_likes');
select throws_ok($$delete from public.kudo_likes$$, '42501', null, 'authenticated cannot delete from kudo_likes');
reset role;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select public.toggle_kudo_like('c1000000-0000-4000-8000-000000000001')$$, '42501', null,
  'anon cannot call toggle_kudo_like');
reset role;

select * from finish();
rollback;

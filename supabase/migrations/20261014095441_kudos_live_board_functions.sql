-- Sun* Kudos live board (F006): the phase-03 RPC contract (camelCase jsonb). Read RPCs are SECURITY
-- INVOKER (RLS applies); toggle_kudo_like is the only write path, SECURITY DEFINER, identity from auth.uid().
-- All functions pin search_path = ''. Shared helpers live in kudos_private (not exposed by PostgREST).
create schema kudos_private;

-- ISO 8601 UTC with milliseconds, the same text JS Date#toISOString() produces.
create function kudos_private.iso_utc(p_at timestamptz) returns text
language sql stable security invoker set search_path = '' as $$
  select to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

-- The caller's sunners row (null when the signed-in user has none, or there is no JWT).
create function kudos_private.viewer_sunner_id() returns uuid
language sql stable security invoker set search_path = '' as $$
  select s.id from public.sunners s where s.user_id = auth.uid()
$$;

-- Person = {id, name, avatarUrl, department (name), heroTitle, receivedCount}
create function kudos_private.person_json(p_sunner_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id, 'name', s.full_name, 'avatarUrl', s.avatar_url, 'department', d.name, 'heroTitle', s.hero_title,
    'receivedCount', (select count(*) from public.kudos r where r.receiver_id = s.id))
  from public.sunners s left join public.departments d on d.id = s.department_id
  where s.id = p_sunner_id
$$;

-- KudoCard[] for the given ids, in the given order.
create function kudos_private.kudo_cards(p_kudo_ids uuid[], p_viewer_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', k.id,
      'title', k.title,
      'content', k.content,
      'createdAt', kudos_private.iso_utc(k.created_at),
      'likeCount', (select count(*) from public.kudo_likes l where l.kudo_id = k.id),
      'likedByViewer', exists (select 1 from public.kudo_likes l where l.kudo_id = k.id and l.sunner_id = p_viewer_id),
      'canLike', p_viewer_id is not null and p_viewer_id <> k.sender_id,
      'sender', kudos_private.person_json(k.sender_id),
      'receiver', kudos_private.person_json(k.receiver_id),
      'hashtags', coalesce((
        select jsonb_agg(jsonb_build_object('slug', h.slug, 'label', h.label) order by h.label, h.slug)
        from public.kudo_hashtags kh join public.hashtags h on h.id = kh.hashtag_id
        where kh.kudo_id = k.id), '[]'::jsonb),
      'images', coalesce((
        select jsonb_agg(jsonb_build_object('url', i.url) order by i.position)
        from (select ki.url, ki.position from public.kudo_images ki
              where ki.kudo_id = k.id order by ki.position limit 5) i), '[]'::jsonb)
    ) order by ids.ord), '[]'::jsonb)
  from unnest(p_kudo_ids) with ordinality as ids (kudo_id, ord)
  join public.kudos k on k.id = ids.kudo_id
$$;

-- {hashtags: {slug,label}[] by label, departments: {code,name}[] by name}
create function public.kudos_filter_options() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'hashtags', coalesce((select jsonb_agg(jsonb_build_object('slug', h.slug, 'label', h.label) order by h.label, h.slug)
                          from public.hashtags h), '[]'::jsonb),
    'departments', coalesce((select jsonb_agg(jsonb_build_object('code', d.code, 'name', d.name) order by d.name, d.code)
                             from public.departments d), '[]'::jsonb))
$$;

-- Hashtag / department filters (AND): null or '' means no filter, an unknown value matches nothing. They are
-- inlined in both functions on purpose: a helper pinned with set search_path is never inlined by the
-- planner, which would materialise every kudo and lose kudos_created_at_id_idx for the keyset path.
-- ALG-001: top 5 by number of like rows, then newest, then id desc.
create function public.kudos_highlight(p_hashtag text, p_department text) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select kudos_private.kudo_cards(array(
    select k.id from public.kudos k
    where (nullif(p_hashtag, '') is null or exists (
            select 1 from public.kudo_hashtags kh join public.hashtags h on h.id = kh.hashtag_id
            where kh.kudo_id = k.id and h.slug = p_hashtag))
      and (nullif(p_department, '') is null or exists (
            select 1 from public.sunners r join public.departments d on d.id = r.department_id
            where r.id = k.receiver_id and d.code = p_department))
    order by (select count(*) from public.kudo_likes l where l.kudo_id = k.id) desc, k.created_at desc, k.id desc
    limit 5), kudos_private.viewer_sunner_id())
$$;

-- ALG-004 keyset page: rows strictly before (p_before_created_at, p_before_id) when both are set,
-- newest first, p_limit clamped to 1..50 (null -> 10). The caller asks limit + 1 to detect a next page.
-- No cursor compares against (infinity, max uuid) instead of using "is null or": a plain row comparison
-- is what lets the planner turn the cursor into an index bound on kudos_created_at_id_idx.
create function public.kudos_feed_page(p_hashtag text, p_department text, p_before_created_at timestamptz,
                                       p_before_id uuid, p_limit int) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select kudos_private.kudo_cards(array(
    select k.id from public.kudos k
    where (nullif(p_hashtag, '') is null or exists (
            select 1 from public.kudo_hashtags kh join public.hashtags h on h.id = kh.hashtag_id
            where kh.kudo_id = k.id and h.slug = p_hashtag))
      and (nullif(p_department, '') is null or exists (
            select 1 from public.sunners r join public.departments d on d.id = r.department_id
            where r.id = k.receiver_id and d.code = p_department))
      and (k.created_at, k.id) < (
            case when p_before_created_at is not null and p_before_id is not null
                 then p_before_created_at else 'infinity'::timestamptz end,
            case when p_before_created_at is not null and p_before_id is not null
                 then p_before_id else 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid end)
    order by k.created_at desc, k.id desc
    limit least(greatest(coalesce(p_limit, 10), 1), 50)), kudos_private.viewer_sunner_id())
$$;

-- {total, receivers: distinct receivers by their latest kudo (max 100), recent: 5 newest kudos}
create function public.kudos_spotlight() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with latest as (
    select distinct on (k.receiver_id) k.receiver_id, k.id, k.created_at
    from public.kudos k order by k.receiver_id, k.created_at desc, k.id desc
  ), top_receivers as (
    select l.* from latest l order by l.created_at desc, l.id desc limit 100
  ), recent as (
    select k.id, k.receiver_id, k.created_at from public.kudos k order by k.created_at desc, k.id desc limit 5
  )
  select jsonb_build_object(
    'total', (select count(*) from public.kudos),
    'receivers', coalesce((
      select jsonb_agg(jsonb_build_object('sunnerId', t.receiver_id, 'name', s.full_name, 'latestKudoId', t.id,
                                          'latestCreatedAt', kudos_private.iso_utc(t.created_at))
                       order by t.created_at desc, t.id desc)
      from top_receivers t join public.sunners s on s.id = t.receiver_id), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('kudoId', r.id, 'receiverName', s.full_name,
                                          'createdAt', kudos_private.iso_utc(r.created_at))
                       order by r.created_at desc, r.id desc)
      from recent r join public.sunners s on s.id = r.receiver_id), '[]'::jsonb))
$$;

-- {hasSunner, stats (all 0 without a viewer), latestGifts: 10 newest opened boxes (public list)}.
-- hearts (BR-006) = sum of the stored hearts_awarded on likes of kudos the viewer sent.
create function public.kudos_sidebar() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with viewer as (select kudos_private.viewer_sunner_id() as id)
  select jsonb_build_object(
    'hasSunner', v.id is not null,
    'stats', jsonb_build_object(
      'received', (select count(*) from public.kudos k where k.receiver_id = v.id),
      'sent', (select count(*) from public.kudos k where k.sender_id = v.id),
      'hearts', (select coalesce(sum(l.hearts_awarded), 0) from public.kudo_likes l
                 join public.kudos k on k.id = l.kudo_id where k.sender_id = v.id),
      'boxesOpened', (select count(*) from public.secret_boxes b where b.owner_id = v.id and b.opened_at is not null),
      'boxesUnopened', (select count(*) from public.secret_boxes b where b.owner_id = v.id and b.opened_at is null)),
    'latestGifts', coalesce((
      select jsonb_agg(jsonb_build_object('sunnerId', g.owner_id, 'name', s.full_name, 'avatarUrl', s.avatar_url,
                                          'prize', g.prize_description, 'openedAt', kudos_private.iso_utc(g.opened_at))
                       order by g.opened_at desc, g.id desc)
      from (select b.id, b.owner_id, b.prize_description, b.opened_at from public.secret_boxes b
            where b.opened_at is not null order by b.opened_at desc, b.id desc limit 10) g
      join public.sunners s on s.id = g.owner_id), '[]'::jsonb))
  from viewer v
$$;

-- ALG-003: like if absent, unlike if present. Raises P0001 sunner_not_found | kudo_not_found | self_like.
-- A like stores 2 hearts on a special day (Asia/Ho_Chi_Minh date) else 1; an unlike deletes the row,
-- revoking exactly the stored value. on conflict do nothing makes two concurrent likes resolve to
-- one insert; the loser falls through to the delete path, as a second toggle would.
create function public.toggle_kudo_like(p_kudo_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer_id uuid := kudos_private.viewer_sunner_id();
  v_sender_id uuid;
  v_liked boolean;
begin
  if v_viewer_id is null then
    raise exception using errcode = 'P0001', message = 'sunner_not_found';
  end if;
  select k.sender_id into v_sender_id from public.kudos k where k.id = p_kudo_id for share;
  if not found then
    raise exception using errcode = 'P0001', message = 'kudo_not_found';
  end if;
  if v_sender_id = v_viewer_id then
    raise exception using errcode = 'P0001', message = 'self_like';
  end if;

  insert into public.kudo_likes (kudo_id, sunner_id, hearts_awarded)
  values (p_kudo_id, v_viewer_id,
          case when exists (select 1 from public.special_days d
                            where d.day = (now() at time zone 'Asia/Ho_Chi_Minh')::date) then 2 else 1 end)
  on conflict (kudo_id, sunner_id) do nothing;
  v_liked := found;
  if not v_liked then
    delete from public.kudo_likes l where l.kudo_id = p_kudo_id and l.sunner_id = v_viewer_id;
  end if;

  return jsonb_build_object('liked', v_liked,
    'likeCount', (select count(*) from public.kudo_likes l where l.kudo_id = p_kudo_id));
end
$$;

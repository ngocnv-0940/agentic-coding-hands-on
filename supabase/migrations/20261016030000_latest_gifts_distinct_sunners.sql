-- Sun* Kudos sidebar, FR-312 (MoMorph D.3 "10 Sunner vừa nhận quà mới nhất"): latestGifts lists the 10 Sunners
-- who most recently opened a box, one row per Sunner with their newest opened box. Before this, a Sunner who
-- opened several boxes filled several rows. Stats are unchanged. Stays SECURITY DEFINER (write_kudo_sender_masking);
-- create or replace keeps the existing grants.
create or replace function public.kudos_sidebar() returns jsonb
language sql stable security definer set search_path = '' as $$
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
      -- Each owner's newest opened box ("no newer opened box of the same owner"), newest first. Walking
      -- secret_boxes_opened_at_idx in order and stopping at 10 keeps the cost flat as boxes accumulate.
      from (select b.id, b.owner_id, b.prize_description, b.opened_at from public.secret_boxes b
            where b.opened_at is not null
              and not exists (select 1 from public.secret_boxes n
                              where n.owner_id = b.owner_id and n.opened_at is not null
                                and (n.opened_at, n.id) > (b.opened_at, b.id))
            order by b.opened_at desc, b.id desc limit 10) g
      join public.sunners s on s.id = g.owner_id), '[]'::jsonb))
  from viewer v
$$;

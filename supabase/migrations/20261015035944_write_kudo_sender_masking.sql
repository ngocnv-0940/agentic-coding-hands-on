-- Viết Kudo (F007), FR-604: no client path may reveal the real sender of an anonymous kudo.
-- 1. Column privileges: authenticated reads every kudos column except sender_id and every sunners column
--    except user_id; anon reads neither table. PostgREST then cannot select, filter, order or embed by
--    the hidden columns (select=* fails too; the app reads only through RPCs).
-- 2. The functions that need a hidden column become narrow SECURITY DEFINER returning masked data only:
--    viewer_sunner_id (user_id), kudo_cards (sender_id), kudos_sidebar (sender_id). The other board RPCs
--    and person_json read no hidden column and stay SECURITY INVOKER. toggle_kudo_like is DEFINER already.
-- New columns added later are NOT readable by authenticated until granted here explicitly.

revoke select on public.kudos, public.sunners from anon, authenticated;
grant select (id, receiver_id, title, content, content_doc, is_anonymous, anonymous_name, created_at)
  on public.kudos to authenticated;
grant select (id, full_name, avatar_url, department_id, hero_title) on public.sunners to authenticated;

-- Returns only the caller's own sunner id (identity from auth.uid()).
alter function kudos_private.viewer_sunner_id() security definer;

-- Stats are the caller's own; latestGifts is the public list it always was.
alter function public.kudos_sidebar() security definer;

-- KudoCard (additive): + isAnonymous, anonymousName (null unless anonymous). An anonymous card carries
-- sender null (no id, name, avatar or department of the real sender), for every viewer including the
-- sender. canLike still compares the viewer with the real sender (no self like). DEFINER, so it reads
-- the kudos rows of the ids it is given regardless of RLS: callers pass ids from their own RLS-scoped
-- query, and every kudo is readable by any authenticated user anyway.
create or replace function kudos_private.kudo_cards(p_kudo_ids uuid[], p_viewer_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', k.id,
      'title', k.title,
      'content', k.content,
      'createdAt', kudos_private.iso_utc(k.created_at),
      'likeCount', (select count(*) from public.kudo_likes l where l.kudo_id = k.id),
      'likedByViewer', exists (select 1 from public.kudo_likes l where l.kudo_id = k.id and l.sunner_id = p_viewer_id),
      'canLike', p_viewer_id is not null and p_viewer_id <> k.sender_id,
      'isAnonymous', k.is_anonymous,
      'anonymousName', case when k.is_anonymous then k.anonymous_name end,
      'sender', case when k.is_anonymous then null else kudos_private.person_json(k.sender_id) end,
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

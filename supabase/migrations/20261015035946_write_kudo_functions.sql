-- Viết Kudo (F007): the write-path RPCs (phase-03 §Contract). search_sunners is SECURITY INVOKER (it reads
-- no hidden column; viewer_sunner_id is DEFINER). create_kudo is the only kudo write path: SECURITY
-- DEFINER, identity from auth.uid(), every rule re-checked, one transaction, fixed P0001 error codes.
-- All functions pin search_path = ''.

-- Trims the whitespace String#trim() removes (space, tab, newlines, NBSP, Unicode spaces, BOM), so the SQL
-- rules agree with the client validation and the E2E mock; plain btrim() only strips spaces.
create function kudos_private.trim_whitespace(p_value text) returns text
language sql immutable security invoker set search_path = '' as $$
  select btrim(p_value, E' \t\n\r\v\f                 　﻿')
$$;

-- ALG-002 server side: true when p_doc is a Tiptap document made only of whitelisted node and mark types,
-- every link mark is http(s) and 5..2048 characters, every mention points at an existing sunner, and the
-- JSON text is at most 64 KiB (checked first, so the walk is bounded). Only node types and mark types are
-- checked: attrs (e.g. orderedList attrs.type) are free. Non-array content/marks are ignored, as in the mock.
create function kudos_private.content_doc_is_valid(p_doc jsonb) returns boolean
language sql stable security invoker set search_path = '' as $$
  with recursive allowed (types) as (
    select array['doc', 'paragraph', 'text', 'orderedList', 'listItem', 'blockquote', 'hardBreak', 'mention',
                 'bold', 'italic', 'strike', 'link']
  ), nodes (node) as (
    select p_doc where octet_length(p_doc::text) <= 65536
    union all
    select child.value from nodes,
      jsonb_array_elements(case when jsonb_typeof(nodes.node -> 'content') = 'array' then nodes.node -> 'content' else '[]'::jsonb end) child
  ), marks (mark) as (
    select m.value from nodes,
      jsonb_array_elements(case when jsonb_typeof(nodes.node -> 'marks') = 'array' then nodes.node -> 'marks' else '[]'::jsonb end) m
  )
  select coalesce(
    octet_length(p_doc::text) <= 65536
    and jsonb_typeof(p_doc) = 'object' and p_doc ->> 'type' = 'doc'
    and not exists (select 1 from nodes, allowed
                    where jsonb_typeof(nodes.node) is distinct from 'object' or jsonb_typeof(nodes.node -> 'type') is distinct from 'string'
                       or not (nodes.node ->> 'type' = any (allowed.types)))
    and not exists (select 1 from nodes
                    where nodes.node ->> 'type' = 'mention'
                      and (jsonb_typeof(nodes.node -> 'attrs' -> 'id') is distinct from 'string'
                           or not exists (select 1 from public.sunners s where s.id::text = nodes.node -> 'attrs' ->> 'id')))
    and not exists (select 1 from marks, allowed
                    where jsonb_typeof(marks.mark) is distinct from 'object' or jsonb_typeof(marks.mark -> 'type') is distinct from 'string'
                       or not (marks.mark ->> 'type' = any (allowed.types)))
    and not exists (select 1 from marks
                    where marks.mark ->> 'type' = 'link'
                      and (jsonb_typeof(marks.mark -> 'attrs' -> 'href') is distinct from 'string'
                           or marks.mark -> 'attrs' ->> 'href' !~ '^https?://'
                           or char_length(marks.mark -> 'attrs' ->> 'href') not between 5 and 2048)),
    false)
$$;

-- [{id, name, avatarUrl, department}] (no user_id), at most 10. The trimmed query is folded (lower +
-- unaccent, đ -> d) and matched as a literal substring of the folded full name: strpos, never LIKE, so
-- % and _ are ordinary characters. '' or > 100 characters -> []. The viewer is excluded. Ordered by
-- full_name in byte (code point) order, then id: deterministic whatever the database collation, and the
-- same order as the E2E mock (an ICU collation would sort "NguyenVanA" after every "Nguyễn …").
-- The two-argument unaccent is required: the one-argument form cannot find its dictionary under
-- search_path = ''.
create function public.search_sunners(p_query text) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with q as (
    select kudos_private.trim_whitespace(p_query) as raw, kudos_private.viewer_sunner_id() as viewer_id
  ), folded as (
    select lower(extensions.unaccent('extensions.unaccent'::regdictionary, q.raw)) as needle, q.viewer_id
    from q where q.raw <> '' and char_length(q.raw) <= 100
  )
  select coalesce((
    select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.full_name, 'avatarUrl', m.avatar_url, 'department', m.department)
                     order by m.full_name collate "C", m.id)
    from (
      select s.id, s.full_name, s.avatar_url, d.name as department
      from folded f
      join public.sunners s
        on strpos(lower(extensions.unaccent('extensions.unaccent'::regdictionary, s.full_name)), f.needle) > 0
       and s.id is distinct from f.viewer_id
      left join public.departments d on d.id = s.department_id
      order by s.full_name collate "C", s.id
      limit 10) m), '[]'::jsonb)
$$;

-- INT-002: writes one kudo for the caller and returns {kudoId}. Checks run in the contract order; the
-- first failure raises P0001 with its code and nothing is written (one transaction):
-- sunner_not_found, receiver_not_found, self_kudo, title_invalid (1..100 after trim), content_invalid
-- (1..2000 after trim), content_doc_invalid (ALG-002), hashtags_invalid (1..5 distinct existing slugs),
-- images_invalid (0..5 distinct neutral names, each uploaded to kudo-images by the caller and unused),
-- anonymous_name_invalid (only when anonymous, <= 50 after trim; blank -> null).
-- Stored: sender = caller (also when anonymous), trimmed title/content/alias, images as
-- kudo-images/<name> with position 1..N in array order. The caller's uploads are locked FOR SHARE; this does not
-- stop a remove whose snapshot predates the commit, so the client only removes after a definite failure.
create function public.create_kudo(p_receiver_id uuid, p_title text, p_content text, p_content_doc jsonb,
                                   p_hashtag_slugs text[], p_image_paths text[], p_is_anonymous boolean,
                                   p_anonymous_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_sender_id uuid := kudos_private.viewer_sunner_id();
  v_title text := kudos_private.trim_whitespace(p_title);
  v_content text := kudos_private.trim_whitespace(p_content);
  v_is_anonymous boolean := coalesce(p_is_anonymous, false);
  v_alias text := nullif(kudos_private.trim_whitespace(p_anonymous_name), '');
  v_hashtag_ids uuid[];
  v_kudo_id uuid;
begin
  if v_sender_id is null then
    raise exception using errcode = 'P0001', message = 'sunner_not_found';
  end if;
  if p_receiver_id is null or not exists (select 1 from public.sunners s where s.id = p_receiver_id) then
    raise exception using errcode = 'P0001', message = 'receiver_not_found';
  end if;
  if p_receiver_id = v_sender_id then
    raise exception using errcode = 'P0001', message = 'self_kudo';
  end if;
  if v_title is null or char_length(v_title) not between 1 and 100 then
    raise exception using errcode = 'P0001', message = 'title_invalid';
  end if;
  if v_content is null or char_length(v_content) not between 1 and 2000 then
    raise exception using errcode = 'P0001', message = 'content_invalid';
  end if;
  if not kudos_private.content_doc_is_valid(p_content_doc) then
    raise exception using errcode = 'P0001', message = 'content_doc_invalid';
  end if;

  if p_hashtag_slugs is null or cardinality(p_hashtag_slugs) not between 1 and 5
     or array_position(p_hashtag_slugs, null) is not null
     or (select count(distinct t) from unnest(p_hashtag_slugs) t) <> cardinality(p_hashtag_slugs) then
    raise exception using errcode = 'P0001', message = 'hashtags_invalid';
  end if;
  select array_agg(h.id) into v_hashtag_ids from public.hashtags h where h.slug = any (p_hashtag_slugs);
  if coalesce(cardinality(v_hashtag_ids), 0) <> cardinality(p_hashtag_slugs) then
    raise exception using errcode = 'P0001', message = 'hashtags_invalid';
  end if;

  if p_image_paths is null or cardinality(p_image_paths) > 5
     or array_position(p_image_paths, null) is not null
     or (select count(distinct n) from unnest(p_image_paths) n) <> cardinality(p_image_paths)
     or exists (select 1 from unnest(p_image_paths) n
                where n !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$')
     or (select count(*) from (select 1 from storage.objects o
                               where o.bucket_id = 'kudo-images' and o.name = any (p_image_paths)
                                 and o.owner_id = auth.uid()::text
                               for share) owned) <> cardinality(p_image_paths)
     or exists (select 1 from public.kudo_images ki, unnest(p_image_paths) n where ki.url like 'kudo-images/%' and ki.url = 'kudo-images/' || n) then
    raise exception using errcode = 'P0001', message = 'images_invalid';
  end if;

  if (not v_is_anonymous and p_anonymous_name is not null) or char_length(v_alias) > 50 then
    raise exception using errcode = 'P0001', message = 'anonymous_name_invalid';
  end if;

  begin
    insert into public.kudos (sender_id, receiver_id, title, content, content_doc, is_anonymous, anonymous_name)
    values (v_sender_id, p_receiver_id, v_title, v_content, p_content_doc, v_is_anonymous,
            case when v_is_anonymous then v_alias end)
    returning id into v_kudo_id;
    insert into public.kudo_hashtags (kudo_id, hashtag_id) select v_kudo_id, unnest(v_hashtag_ids);
    insert into public.kudo_images (kudo_id, url, position)
    select v_kudo_id, 'kudo-images/' || n, o from unnest(p_image_paths) with ordinality as t (n, o);
  exception when unique_violation then
    -- another create_kudo committed the same upload first (kudo_images_uploaded_url_key)
    raise exception using errcode = 'P0001', message = 'images_invalid';
  end;

  return jsonb_build_object('kudoId', v_kudo_id);
end
$$;

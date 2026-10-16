-- Sun* Kudos (F006 BR-012, INT-004, ALG-007): every Google auth.users account owns exactly one public.sunners
-- row, created in the same transaction as the account, no domain filter. Other accounts (email/password sign-up,
-- which config.toml leaves enabled) get none, so the anon key alone cannot mint a searchable, writing sunner.
-- 1. kudos_private.is_google_account: the provider gate (app metadata is written by GoTrue, not by the user).
-- 2. kudos_private.sunner_profile_from_auth: the ALG-007 name/avatar rule. Both helpers are shared by the
--    trigger and the backfill.
-- 3. kudos_private.provision_sunner: trigger on auth.users, after insert (new account) and after an update of
--    raw_app_meta_data (GoTrue links Google to an existing same-email account that way, not by insert; other
--    column updates such as last_sign_in_at do not fire it). An account that already has a row keeps it
--    untouched (on conflict do nothing: no second row, name and avatar never overwritten). SECURITY DEFINER
--    (runs as the owner, so GoTrue's role needs no right on sunners or kudos_private, and the column privileges
--    of 20261015035944 stay intact). The gate is an early return inside it, not a trigger WHEN clause: a WHEN
--    expression is permission-checked as GoTrue's role. It swallows no error: a real failure must surface.
-- 4. One-time backfill for Google accounts that existed before this migration. Seeded rows (user_id null) are
--    never matched or changed.
-- 5. Explicit revoke: 20261014095442 and 20261015035948 grant EXECUTE on every kudos_private function to
--    authenticated; none of the functions here is meant for a client (a trigger needs no EXECUTE to fire).
-- Rollback: drop trigger on_auth_user_created_provision_sunner on auth.users; drop the three functions. Keep
-- the provisioned rows (kudos reference them).

-- True when GoTrue recorded Google as the sign-up provider or as a linked provider. Null-safe on any jsonb
-- shape (null, non-object, missing keys) and never null itself.
create function kudos_private.is_google_account(p_app_meta jsonb) returns boolean
language sql immutable security invoker set search_path = '' as $$
  select coalesce(p_app_meta ->> 'provider' = 'google', false)
      or coalesce(p_app_meta -> 'providers', '[]'::jsonb) ? 'google'
$$;

-- ALG-007. Name: first non-blank of full_name, name, email local part, else 'Sunner'; cut to 100 characters
-- and trimmed again (the cut may end in whitespace; the candidate starts with a non-blank, so it stays non-empty).
-- Avatar: first non-blank of avatar_url, picture; kept only when it starts with https:// and is at most 2048
-- characters (it is rendered in <img> on every kudo card). Cannot fail on any jsonb shape or a null email.
create function kudos_private.sunner_profile_from_auth(p_meta jsonb, p_email text, out full_name text, out avatar_url text)
language sql immutable security invoker set search_path = '' as $$
  select
    kudos_private.trim_whitespace(left(coalesce(
      nullif(kudos_private.trim_whitespace(p_meta ->> 'full_name'), ''),
      nullif(kudos_private.trim_whitespace(p_meta ->> 'name'), ''),
      nullif(kudos_private.trim_whitespace(split_part(p_email, '@', 1)), ''),
      'Sunner'), 100)),
    case when pic.url like 'https://%' and char_length(pic.url) <= 2048 then pic.url end
  from (select coalesce(
      nullif(kudos_private.trim_whitespace(p_meta ->> 'avatar_url'), ''),
      nullif(kudos_private.trim_whitespace(p_meta ->> 'picture'), '')) as url) pic
$$;

create function kudos_private.provision_sunner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not kudos_private.is_google_account(new.raw_app_meta_data) then
    return null;
  end if;
  insert into public.sunners (user_id, full_name, avatar_url)
  select new.id, p.full_name, p.avatar_url
  from kudos_private.sunner_profile_from_auth(new.raw_user_meta_data, new.email) p
  on conflict (user_id) do nothing;
  return null;
end
$$;

create trigger on_auth_user_created_provision_sunner
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function kudos_private.provision_sunner();

-- Backfill (same statement as the pgTAP backfill case in auto-provision-sunner.test.sql).
insert into public.sunners (user_id, full_name, avatar_url)
select u.id, p.full_name, p.avatar_url
from auth.users u
cross join lateral kudos_private.sunner_profile_from_auth(u.raw_user_meta_data, u.email) p
where kudos_private.is_google_account(u.raw_app_meta_data)
  and not exists (select 1 from public.sunners s where s.user_id = u.id)
on conflict (user_id) do nothing;

revoke all on function kudos_private.is_google_account(jsonb) from public, anon, authenticated;
revoke all on function kudos_private.sunner_profile_from_auth(jsonb, text) from public, anon, authenticated;
revoke all on function kudos_private.provision_sunner() from public, anon, authenticated;

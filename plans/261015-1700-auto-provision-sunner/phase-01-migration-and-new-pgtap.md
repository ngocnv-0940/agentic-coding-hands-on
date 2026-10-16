# Phase 1 - Migration, backfill, revoke, new pgTAP

## Context Links
`clarifications.md`; spec ALG-007 / BR-012 / INT-004 in `spec/kudos-live-board/technical-spec.md`;
`supabase/migrations/20261014095442_kudos_live_board_grants.sql` (blanket EXECUTE grant);
`20261015035944_write_kudo_sender_masking.sql` (user_id column hidden).

## Overview
Priority P1. Status completed (drift: Google-only gate helper, UPDATE-of-raw_app_meta_data trigger; 3 functions not 2). Add the provisioning trigger, one-time backfill, and hardening in one migration.

## Requirements
- Trigger fn `kudos_private.provision_sunner()` returns trigger, SECURITY DEFINER, `set search_path = ''`, fully-qualified names.
- `after insert on auth.users for each row`; `on conflict (user_id) do nothing`; no exception swallowing.
- ALG-007: name = first non-empty of `btrim(full_name)`, `btrim(name)`, `split_part(email,'@',1)` (trimmed), else `'Sunner'`; `left(...,100)`.
  avatar = `coalesce(nullif(avatar_url,''), picture)` only if `~ '^https://'` and `length <= 2048`, else null.
  Pick the first non-empty name candidate BEFORE capping; treat whitespace-only as empty.
- Backfill the same rule for `auth.users` lacking a sunner (share the expression: backfill calls a helper or one
  `insert ... select` using the same SQL; DRY via small immutable helper `kudos_private.sunner_profile_from_auth(meta jsonb, email text)` returning name+avatar, used by both).
- `revoke all on function` (trigger fn and helper) `from public, anon, authenticated` AFTER creation (later than the blanket grant, since the new migration timestamp sorts last).

## Architecture
Trigger runs in the GoTrue insert transaction as the function owner (postgres), bypassing sunners RLS/column privileges. Triggers fire with the table owner's privilege check on EXECUTE only for the trigger-firing role? Note: trigger functions need no EXECUTE grant for the inserting role, so revoking is safe; pgTAP proves a real insert still provisions.

## Files owned
- Create `supabase/migrations/20261015035950_auto_provision_sunner.sql` (timestamp must be > 20261015035948)
- Create `supabase/tests/database/auto-provision-sunner.test.sql`

## Steps
1. Write helper + trigger fn + `create trigger on_auth_user_created_provision_sunner`.
2. Backfill `insert into public.sunners ... select from auth.users u where not exists (select 1 from public.sunners s where s.user_id = u.id) on conflict (user_id) do nothing`.
3. Revokes. Header comment states why (blanket grant earlier).
4. pgTAP (`begin; ... rollback`, own fixed-id fixtures, prefix e.g. `a9`/`b9`): insert auth user with full metadata -> sunner name/avatar; branches: full_name, name only, email local part, empty/no email -> 'Sunner', whitespace name; picture used when avatar_url absent; `http://` avatar -> null; 2049-char https avatar -> null; 150-char name -> 100; double insert path / manual re-run of backfill SQL -> still one row; backfill: insert sunner-less user by `alter table ... disable trigger`-free path (delete the auto row, re-run backfill statement via helper-based SQL) -> row appears; anon/authenticated lack execute on both fns; authenticated cannot `select user_id from sunners`; as that JWT `viewer_sunner_id()` equals the new id; `create_kudo` by new user to a seed sunner and `toggle_kudo_like` by new user succeed (reuse call shape from `write-kudo-create-rules.test.sql`).

## Todo
- [x] migration written  - [x] helper shared by trigger + backfill  - [x] revokes  - [x] new pgTAP file passes (316/316 full suite)

## Success Criteria
New test file green; `supabase db lint` clean for new objects.

## Risks
- `auth` schema permission for migration role: confirm `create trigger on auth.users` works locally; if denied, STOP and escalate (do not grant ad hoc).
- Local `supabase start` must apply auth triggers: confirmed by the test (real insert provisions).
- Name collision of trigger with future ones: use specific name above.

## Security
SECURITY DEFINER + empty search_path + no EXECUTE for client roles; user-controlled metadata only flows into text columns via parameters (no dynamic SQL); avatar restricted to https to avoid `javascript:`/`data:` URLs reaching `<img>`.

## Rollback
Drop trigger, drop both functions (new migration or revert file before merge).

## Next
Phase 2.

# Clarifications — Auto-provision a sunner for every Google account

Request (user, 2026-10-15): "login bằng google account thì phải viết kudo được chứ" → "làm luôn trên nhánh này với mọi account Google".
Discipline: auto (memory: auto-pick Recommended, no rest points). Work-type: feature (update of F006/F007 behaviour, no new F###). Size: large (auth/permissions + migration). sddMode on, spec_lang vi (inherited). Branch: feat/write-kudo (PR #10). testPolicy: n/a for MoMorph (no UI change); pgTAP + e2e regression.

## Decisions
- Q: Who gets a sunner? → A (user): every Google account that signs in, no domain filter.
- Q: Mechanism? → A (Recommended, auto-picked): `after insert on auth.users` trigger, SECURITY DEFINER, `search_path = ''`, in `kudos_private` (not exposed). Rejected: creating the row in `/auth/callback` (app code needs a write path/service role; misses users created any other way) and lazy creation inside RPCs (every reader would still see "no sunner" until the first write).
- Q: Row content? → A (Recommended): `user_id = new.id`; `full_name` = trimmed `raw_user_meta_data->>'full_name'`, else `->>'name'`, else email local part, else 'Sunner'; capped at 100 chars. `avatar_url` = `->>'avatar_url'` else `->>'picture'` when it is an https URL, else null. `department_id` and `hero_title` null.
- Q: Existing auth users without a sunner? → A (Recommended): the migration backfills them once with the same rule.
- Q: Link to an existing seeded sunner by name/email? → A (Recommended): no — `sunners` has no email column; matching by name is unsafe. Seeded rows keep `user_id` null.
- Q: Idempotency / failure? → A (Recommended): `on conflict (user_id) do nothing`. A provisioning error must not block sign-in? → A: the insert cannot fail on data (all columns defaulted/fallbacks); keep it plain (no swallow) so a real error surfaces.
- Q: Keep the "no sunner row" UI/RPC paths (disabled pill/heart, `sunner_not_found`)? → A (Recommended): keep as a backstop (a sunner can still be unlinked by `on delete set null` or removed); existing e2e identities without a row stay valid.
- Q: Spec impact → A: F006 D013 changes from "no auto-create" to "auto-created at first sign-in"; F007 FR-103 note; docs/system/permissions.md updated.
- Q: EXECUTE grant leak (20261014095442 grants EXECUTE on all kudos_private functions to authenticated)? → A (Recommended): new migration runs after it and explicitly `revoke all on function <trigger fn> from public, anon, authenticated`; pgTAP asserts it.
- Q: avatar_url length cap? → A (Recommended): accept only `https://` URLs of at most 2048 chars, else null.
- Q: Mock E2E simulate provisioning? → A (Recommended): no (YAGNI) — the behaviour lives in Postgres and is proven by pgTAP at the lowest reliable layer; existing e2e identities without a row remain valid backstop cases. Full e2e regression still runs (safety-critical).
- Q: Spec placement → A: trigger is cross-cutting A0 (no actor click), not a new CAP row.
- Q: Privacy — every Google account becomes searchable as a recipient → A (user): accepted ("mọi account Google"); logged in Open Gaps.
- Q (review M1): email sign-up is enabled, so the trigger would also provision non-Google, unconfirmed accounts. → A (Recommended, matches the user's "mọi account Google"): gate in the DB — provision (trigger and backfill) only when `raw_app_meta_data->>'provider' = 'google'` or `raw_app_meta_data->'providers' ? 'google'`. Enforced regardless of hosted auth settings. Also trim again after the 100-char cut (review L2). Avatar host allowlist (L1) deferred.

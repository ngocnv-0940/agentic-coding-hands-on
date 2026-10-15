---
phase: 3
title: "SQL: columns, create_kudo, search, bucket, sender masking (Track B)"
feature: write-kudo
status: completed
priority: P1
effort: 4h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
---

# Phase 03 — Migrations, storage policies, masking, seed, pgTAP

## Context Links
- `technical-spec.md` A3, A10, A12, A14, §4.2, §4.4 Bin 3 (FR-001/002/601/604), §4.5 ALG-001..003, INT-001..003, §5.1 SC-006/007, §5.3 Q1–Q7; `spec/system/permissions.md` Lớp 3–8
- F006: `supabase/migrations/20261014095439..42_kudos_live_board_*.sql`, `supabase/tests/database/*.test.sql`, `supabase/seed.sql`
- Mock counterpart (must match): phase 1 `e2e/support/mock-kudos-{sunner-search,create-rules,board-queries}.ts`, `mock-storage-routes.ts`, fixtures

## Overview
Additive migrations: 3 `kudos` columns, `kudo_images.url` check, `kudo-images` bucket + `storage.objects` policies, `search_sunners`, `create_kudo`, sender masking (column grants + DEFINER swaps + `kudo_cards` change), seed rows for search. RED-first: pgTAP before functions.

## Contract (single source for phases 1, 2, 4, 6)
- `kudos` + `content_doc jsonb null`, `is_anonymous boolean not null default false`, `anonymous_name text null`, check `(is_anonymous or anonymous_name is null) and (anonymous_name is null or char_length(anonymous_name) between 1 and 50)`. `title` required only via the RPC (no table check: F006 seed titles stay valid, Q6).
- `kudo_images.url` check `url ~ '^(/images/|https://|kudo-images/)'`; uploaded rows store `kudo-images/<name>` (Q3).
- **`KudoCard`** (F006, field-compatible, additive): + `isAnonymous: boolean`, `anonymousName: string|null` (null unless anonymous); `sender: Person | null` (null iff anonymous); `canLike` still from the real sender. `kudos_highlight`, `kudos_feed_page` unchanged signatures.
- `search_sunners(p_query text)` → jsonb `[{id, name, avatarUrl, department}]` (no `user_id`): `q = lower(extensions.unaccent('extensions.unaccent'::regdictionary, btrim(p_query)))`; `''` or >100 chars → `[]`; `strpos(lower(unaccent(full_name)), q) > 0`; `id is distinct from viewer_sunner_id()`; order `full_name, id`; limit 10. `language sql stable security invoker`.
- `create_kudo(p_receiver_id uuid, p_title text, p_content text, p_content_doc jsonb, p_hashtag_slugs text[], p_image_paths text[], p_is_anonymous boolean, p_anonymous_name text)` → `{kudoId}`; plpgsql `security definer set search_path = ''`. Checks in order, each `raise exception using errcode='P0001', message=<code>`: `sunner_not_found` (no viewer) · `receiver_not_found` · `self_kudo` · `title_invalid` (btrim 1–100) · `content_invalid` (btrim 1–2000) · `content_doc_invalid` (root `type='doc'`; every `$.**.type` ∈ {doc, paragraph, text, orderedList, listItem, blockquote, hardBreak, mention, bold, italic, strike, link}; every link `href ~ '^https?://'` and length 5–2048; every mention `attrs.id` is a `sunners.id`; `octet_length(doc::text) <= 65536`) · `hashtags_invalid` (1–5, distinct, all slugs exist) · `images_invalid` (0–5, distinct, name `^<uuid v4>\.(jpg|png|webp)$`, exists in `storage.objects` bucket `kudo-images` with `owner_id = auth.uid()::text`, not already in `kudo_images`) · `anonymous_name_invalid` (alias only when anonymous, btrim ≤50; `''` → null). Inserts kudo (title/alias btrimmed), hashtags, images (`position` 1..N in array order) in the function's transaction.
- Storage: bucket `kudo-images` (`public = true`, `file_size_limit = 5242880`, `allowed_mime_types = {image/jpeg,image/png,image/webp}`) inserted by migration. Policies on `storage.objects` for `authenticated`: INSERT with check bucket + neutral name regex + `owner_id = (select auth.uid())::text`; SELECT own objects only (`owner_id = auth.uid()::text`, needed by upload/remove RETURNING, reveals nothing of others); DELETE own and unreferenced (`not exists kudo_images.url = 'kudo-images/' || name`). No UPDATE. Anon nothing.
- Grants: `search_sunners`, `create_kudo` execute → `authenticated` only (revoke `public, anon`).

## Masking mechanism (FR-604, Q1/Q7)
1. `revoke select on public.kudos, public.sunners from anon, authenticated`; `grant select (id, receiver_id, title, content, content_doc, is_anonymous, anonymous_name, created_at) on public.kudos to authenticated`; `grant select (id, full_name, avatar_url, department_id, hero_title) on public.sunners to authenticated`. PostgREST cannot select, filter (`?sender_id=eq.`), order or embed (`sunners!kudos_sender_id_fkey`) on hidden columns; `select=*` fails (no app code does it: all reads are RPCs, verified by grep).
2. Functions touching hidden columns become narrow DEFINER (`set search_path = ''`, return masked data only): `kudos_private.viewer_sunner_id`, `kudos_private.kudo_cards` (create or replace with the new shape), `public.kudos_sidebar` (`alter function … security definer`). `kudos_highlight`, `kudos_feed_page`, `kudos_spotlight`, `kudos_filter_options`, `person_json` stay INVOKER (no hidden column). `toggle_kudo_like` already DEFINER. `kudos_private` stays out of `[api] schemas`; re-run its schema-wide execute grant after new functions.
3. Image names carry no uid; bucket listing returns only own objects.
Rejected: moving `sender_id` to a private table (rewrites every F006 query, seed, check, index and pgTAP for the same guarantee).

## Related Code Files
Create (via `supabase migration new …`, each <200 lines): `<ts>_write_kudo_columns_and_storage.sql`, `<ts>_write_kudo_sender_masking.sql`, `<ts>_write_kudo_functions.sql` (search + create + `kudos_private.content_doc_is_valid(jsonb)` helper), `<ts>_write_kudo_grants.sql`. Tests: `supabase/tests/database/write-kudo-create-rules.test.sql`, `write-kudo-sender-masking.test.sql`, `write-kudo-search-and-storage.test.sql`. Modify: `supabase/seed.sql` (phase-1 fixture sunners, incl. writer, `user_id` null), `kudos-seed-matches-e2e-fixture.test.sql` (new rows, card keys), other F006 tests only where a hidden-column read as `authenticated` breaks.

## Implementation Steps
1. `bun run supabase:start`; failure → BLOCKED for the SQL gate (keep writing; mark pending in `evidence/`).
2. pgTAP RED first: create rules (every code above, atomic rollback: a failing image check leaves 0 rows in all 3 tables; `sender_id` = caller; anonymous stored with real sender) · masking (`throws_ok` 42501 on `select sender_id from kudos` and `select user_id from sunners` as authenticated; `column_privilege` checks; anonymous card in `kudos_feed_page`/`kudos_highlight` has `sender` null, alias, no avatar; `kudos_sidebar` sent/hearts still credit the real sender; sender also sees alias; non-anonymous cards unchanged) · search (`nguyen van`, `  Nguyễn  `, `duc` → "Trần Minh Đức", `%`/`_` literal, ≤10, viewer excluded, anon denied) · storage (insert own neutral name ok; `<uid>/x.png`, bad ext, other bucket, other owner → rejected; delete own unreferenced ok, referenced or other's → 0 rows; bucket row limits/mimes). Impersonate with `set local role authenticated; set local request.jwt.claims = '{"sub":…}'`. `supabase test db` → non-zero → `evidence/sql-red.txt`.
3. Migrations + seed; `supabase db reset && supabase test db` exit 0 → `evidence/sql-green.txt`.
4. Real Storage probe (not pgTAP): sign a local user in (or mint a JWT with the local secret), upload via `curl` to `/storage/v1/object/kudo-images/<uuid>.png`, confirm `owner_id` set, RLS passes, public GET 200, remove works → `evidence/storage-probe.txt`. If owner_id is not set at check time, drop that predicate from INSERT (ownership still enforced in `create_kudo`) and record in clarifications.
5. `supabase db lint` if available.

## Todo List
- [x] pgTAP RED recorded
- [x] 4 migrations (columns/check, bucket/policies, masking, functions, grants)
- [x] Seed + seed-match test updated
- [x] `db reset` + `test db` GREEN recorded (all F006 tests too; 6 files, 263 tests)
- [x] Storage probe recorded

## Success Criteria
`supabase db reset && supabase test db` exit 0; every function `search_path = ''`; no `authenticated` path returns `sender_id`/`user_id` of others; JSON keys match §Contract; storage probe green.

## Risk Assessment
- Invoker fn reads a hidden column → 42501 at runtime: pgTAP calls every F006 RPC as authenticated after masking.
- `unaccent` single-arg under empty search_path fails → two-arg schema-qualified form; extension `create extension if not exists unaccent with schema extensions`.
- DEFINER owner lacks rights on `storage.objects` → probe in step 4; pgTAP inserts objects as `postgres` with `owner_id`.
- jsonpath `.**` on large docs → 64 KB cap checked first.

## Security Considerations
Safety-critical (migration, RLS, column grants, DEFINER, storage). Identity only from `auth.uid()`. No service role in app. Error messages are fixed codes.

## Next Steps
Phase 4 types/actions mirror §Contract; phase 6 reruns the SQL gate.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first

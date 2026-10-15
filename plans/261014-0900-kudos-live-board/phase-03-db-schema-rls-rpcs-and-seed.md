---
phase: 3
title: "DB schema, RLS, RPCs, seed (Track B)"
feature: kudos-live-board
status: done
priority: P1
effort: 3h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
---

# Phase 03 — DB schema, RLS, RPCs, seed

## Context Links
- `technical-spec.md` §4.2 Data Model, §4.4 Bin 3 (FR-601/602), §4.5 ALG-001..004, INT-001/002; `spec/system/permissions.md` Lớp 3–4
- `clarifications.md` (tables, like rules, special-day TZ, no auto-create, secret_boxes readable)
- `supabase/config.toml` (`[db.seed] sql_paths = ["./seed.sql"]`), `scripts/start-local-supabase.sh`
- Mock counterpart (must match): `e2e/support/mock-kudos-*.ts` (phase 1)

## Overview
First migration in the repo: 9 tables, indexes, RLS (authenticated SELECT only), 5 read RPCs (SECURITY INVOKER) and `toggle_kudo_like` (SECURITY DEFINER). Seed from Figma content. pgTAP tests prove the rules on real Postgres. RED-first: write the pgTAP tests before the functions.

## RPC contract (single source for phases 1, 2, 4, 6)
All functions in `public`, `set search_path = ''`, schema-qualified bodies, return `jsonb` with **camelCase** keys; `revoke execute ... from public, anon; grant execute ... to authenticated`. Read RPCs: `language sql stable security invoker` (RLS applies). Viewer = `public.sunners` row with `user_id = auth.uid()` (may be absent).
- `Person` = `{id, name, avatarUrl|null, department|null, heroTitle|null ('new_hero'|'rising_hero'|'super_hero'|'legend_hero'), receivedCount}`
- `KudoCard` = `{id, title|null, content, createdAt (ISO), likeCount, likedByViewer, canLike (viewer exists and viewer ≠ sender), sender: Person, receiver: Person, hashtags: {slug,label}[] (all, by label), images: {url}[] (≤5, by position)}`
- `kudos_filter_options()` → `{hashtags:{slug,label}[] by label, departments:{code,name}[] by name}`
- `kudos_highlight(p_hashtag text, p_department text)` → `KudoCard[]` ≤5, ALG-001 (count of like rows desc, created_at desc, id desc). Null arg = no filter; hashtag via `kudo_hashtags`, department = receiver's department `code`.
- `kudos_feed_page(p_hashtag text, p_department text, p_before_created_at timestamptz, p_before_id uuid, p_limit int)` → `KudoCard[]` ≤ `p_limit` (clamped 1..50), `(created_at, id) < (p_before_created_at, p_before_id)` when both non-null, order created_at desc, id desc. Caller asks 11 (ALG-004 in TS).
- `kudos_spotlight()` → `{total, receivers:{sunnerId,name,latestKudoId,latestCreatedAt}[] ≤100 by latest desc, recent:{kudoId,receiverName,createdAt}[] ≤5}`
- `kudos_sidebar()` → `{hasSunner, stats:{received,sent,hearts,boxesOpened,boxesUnopened}, latestGifts:{sunnerId,name,avatarUrl,prize,openedAt}[] ≤10 by opened_at desc}`; hearts = BR-006 sum of `hearts_awarded` on likes of kudos the viewer sent; no viewer → all 0.
- `toggle_kudo_like(p_kudo_id uuid)` → `{liked, likeCount}`; plpgsql `security definer`; ALG-003; raises `using errcode = 'P0001', message = 'sunner_not_found'|'kudo_not_found'|'self_like'`. Special day = `exists(select 1 from public.special_days where day = (now() at time zone 'Asia/Ho_Chi_Minh')::date)` → `hearts_awarded` 2 else 1. Unlike deletes the row (revokes stored value, BR-005). Concurrency: `insert ... on conflict (kudo_id, sunner_id) do nothing` then delete path if no insert happened.

## Schema
`departments(id uuid pk default gen_random_uuid(), code text unique not null, name text not null)` · `sunners(id uuid pk, user_id uuid unique null references auth.users on delete set null, full_name text not null, avatar_url text, department_id uuid references departments, hero_title text check in (4 values))` · `hashtags(id uuid pk, slug text unique not null, label text not null)` · `kudos(id uuid pk, sender_id, receiver_id uuid not null references sunners, title text, content text not null, created_at timestamptz not null default now(), check (sender_id <> receiver_id))` · `kudo_hashtags(kudo_id, hashtag_id, pk both, cascade)` · `kudo_images(id, kudo_id cascade, url text not null, position smallint not null)` · `kudo_likes(kudo_id cascade, sunner_id cascade, hearts_awarded smallint not null check in (1,2), created_at, primary key (kudo_id, sunner_id))` · `special_days(day date pk)` · `secret_boxes(id, owner_id references sunners, opened_at timestamptz, prize_description text)`.
Indexes: `kudos(created_at desc, id desc)`, `kudos(receiver_id)`, `kudos(sender_id)`, `kudo_hashtags(hashtag_id)`, `kudo_likes(sunner_id)`, `secret_boxes(owner_id)`, `secret_boxes(opened_at desc) where opened_at is not null`, `sunners(department_id)`.
RLS: `enable row level security` on all 9; one policy each `for select to authenticated using (true)`; no insert/update/delete policies; `revoke insert, update, delete on all 9 from anon, authenticated`.

## Related Code Files
Create: `supabase/migrations/<timestamp>_kudos_live_board.sql` (timestamp from `supabase migration new kudos_live_board`; split into `_kudos_live_board_tables.sql` + `_kudos_live_board_functions.sql` if >200 lines), `supabase/seed.sql` (Figma content mirroring phase-01 fixtures: same names/departments/hashtags/messages; `user_id` null), `supabase/tests/database/kudos-like-rules.test.sql`, `supabase/tests/database/kudos-rls-and-reads.test.sql` (pgTAP).

## Implementation Steps
1. `bun run supabase:start` (Docker/Podman). If it fails: report BLOCKED for the SQL gate, keep writing SQL, mark the gate pending in `evidence/`.
2. Write pgTAP tests first (RED): rules BR-002..006 (two likers, self_like, sunner_not_found, kudo_not_found, special day 2 then unlike revokes 2 after the special day row is deleted, unique key), RLS (anon reads 0 rows / execute denied; authenticated cannot insert into `kudo_likes`), read RPC shapes (keys present, highlight order with tie, feed cursor no dup/no gap, sidebar zeros without viewer). Impersonate with `set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}'`. Run `supabase test db` → non-zero; record in `evidence/sql-red.txt`.
3. Write the migration and seed; `supabase db reset` (applies both) → `supabase test db` exit 0 → `evidence/sql-green.txt`.
4. `supabase db lint` (security advisor for definer/search_path) if available.

## Todo List
- [x] pgTAP tests RED recorded (`evidence/phase3-sql-red.txt`)
- [x] Migration (tables, indexes, RLS, grants, 6 functions): 3 files, `20261014095439/41/42`
- [x] Seed from Figma content (`supabase/seed.sql`)
- [x] `db reset` + `test db` GREEN recorded (`evidence/review-fix-pgtap-output.txt`: 119 tests PASS, after review fixes; 117 at first GREEN)

## Success Criteria
`supabase db reset && supabase test db` exit 0; every function `search_path = ''`; anon cannot read or execute; RPC JSON keys exactly match the contract.

## Risk Assessment
- `auth.uid()` null inside SECURITY DEFINER when called by anon → execute revoked from anon; function also raises `sunner_not_found`.
- jsonb aggregation cost on 100+ kudos → fine at seed scale; indexes above for growth.
- Seed and mock drift → seed copies the same Figma rows; contract keys checked in both suites.

## Security Considerations
Safety-critical (migration, RLS, definer RPC). No service role in app code. `hearts_awarded` never client-supplied. Identity only from `auth.uid()`.

## Next Steps
Phase 4 wraps these RPCs; phase 6 reruns the SQL gate.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

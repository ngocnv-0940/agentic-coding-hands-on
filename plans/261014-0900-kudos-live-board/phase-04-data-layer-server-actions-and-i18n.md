---
phase: 4
title: "Data layer, server actions, i18n (Track B)"
feature: kudos-live-board
status: done
priority: P1
effort: 4h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3]
---

# Phase 04 — `lib/kudos/**`, server actions, dictionaries

## Context Links
- Phase-03 §RPC contract (types must match key for key); `technical-spec.md` A1, A5, A6, ALG-002, ALG-004, ALG-005, INT-001/002, BR-008/009/010, FR-002/003
- `lib/supabase/server.ts`, `lib/auth/get-current-user.ts`, `lib/i18n/{dictionary-vi,dictionary-en,dictionary-awards-vi}.ts`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `02-guides/server-actions.md` (sequential dispatch, security, return-value-only), `01-getting-started/07-mutating-data.md`, `03-api-reference/01-directives/use-server.md`, `02-guides/data-security.md`

## Overview
Typed, server-only wrappers over the RPCs; pure helpers shared by server and client; two Server Actions; VI/EN dictionaries. RED-first: K specs from phase 1 already fail; this phase is proven by phase 6 GREEN plus tsc. No unit runner exists (no new dependency), so pure helpers are kept tiny and covered by K assertions (time format, "1.000", stars, cursor no-dup).

## Requirements / files (each <200 lines)
- `lib/kudos/kudo-board-types.ts` — `Person`, `KudoCard`, `FilterOptions`, `SpotlightData`, `SidebarData`, `FeedCursor {createdAt, id}`, `FeedPage {items, nextCursor|null}`, `LikeResult`, `LikeErrorCode = 'self_like'|'sunner_not_found'|'kudo_not_found'|'unknown'`.
- `lib/kudos/kudo-board-queries.ts` (`import 'server-only'`: Next aliases it to `next/dist/compiled/server-only`, no package added; if tsc cannot resolve it, drop it and rely on the action/page-only import graph) — `getFilterOptions`, `getHighlight(f)`, `getFeedPage(f, cursor)` (asks 11, slices 10, `nextCursor` per ALG-004), `getSpotlight`, `getSidebar`. Each: `createClient()` → `rpc(...)`; on error throw a typed `KudosDataError` (no raw message to UI). Wrap in React `cache()` per request where the page calls twice (filter options).
- `lib/kudos/kudo-filters.ts` — `sanitizeFilters(searchParams, options)` → `{hashtag|null, department|null}` (unknown → null, D014; arrays → first); `filtersKey(f)`; `buildFilterQuery(f)` (used by hooks in phase 5).
- `lib/kudos/kudo-display-format.ts` — `formatKudoTime(iso)` → `HH:mm - MM/DD/YYYY` via `Intl.DateTimeFormat('en-US', {timeZone:'Asia/Ho_Chi_Minh', hourCycle:'h23'})` parts; `formatLikeCount(n)` → `.` thousands (`Intl.NumberFormat('de-DE')` or manual) — deterministic on server and client (BR-010).
- `lib/kudos/hero-stars.ts` — ALG-002 `starsFor(receivedCount)`.
- `lib/kudos/spotlight-node-layout.ts` — ALG-005 `positionFor(id)` (FNV-1a 32-bit hash, margin 6%), `normalizeSearchText(s)` (NFD, strip `\p{M}`, `đ→d`, lowercase) for BR-011.
- `lib/kudos/load-more-kudos-action.ts` — `'use server'`; `loadMoreKudos({cursor, hashtag, department})`: `getCurrentUser()` else throw; re-sanitize filters against `getFilterOptions()` (never trust client strings); validate cursor (ISO date + uuid shape) → `getFeedPage`.
- `lib/kudos/toggle-kudo-like-action.ts` — `'use server'`; `toggleKudoLikeAction(kudoId)`: auth check, uuid shape check, `rpc('toggle_kudo_like', {p_kudo_id})`; map PostgREST `message` to `LikeErrorCode`; return `{ok:true, liked, likeCount} | {ok:false, code}`. No `refresh()`/`revalidate*` (A6: no reorder).
- `lib/i18n/dictionary-kudos-vi.ts` / `-en.ts` — `kudosVi`/`kudosEn`, keys `kudos.*`: banner title, compose placeholder, profile-search pill, section captions/titles, filter labels + clear, carousel prev/next labels, empty "Hiện tại chưa có Kudos nào.", "Xem chi tiết", "Copy Link", toast "Link copied — ready to share!" (same both locales), error toasts (like, clipboard, load more), loading, spotlight search placeholder "Tìm kiếm", "KUDOS", "Pan/Zoom", "Chưa có dữ liệu", sidebar stat labels, "Mở Secret Box", gift list title, star tooltips (3), hero badge labels (4). VI = Figma verbatim; EN authored (plan Unresolved 1).
- `lib/i18n/dictionary-{vi,en}.ts` — add `...kudosVi` / `...kudosEn` (compile-time parity via `Dictionary`).

## Implementation Steps
1. Read the Next docs above; confirm Server Action file conventions and that actions are public endpoints (auth inside).
2. Types → queries → pure helpers → actions → dictionaries.
3. `bunx tsc --noEmit`, `bun run lint` exit 0. End-to-end proof of the query path is phase 6 GREEN (no temporary probe routes).

## Todo List
- [x] Types match phase-03 contract (proven by phase-6 GREEN and pgTAP shapes)
- [x] Queries + filters + formatters + stars + layout/search normalize (`lib/kudos/*`)
- [x] Two server actions with auth + input validation (`load-more-kudos-action.ts`, `toggle-kudo-like-action.ts`; evidence `evidence/phase4-local-supabase-probe.txt`)
- [x] Dictionaries VI/EN merged (`dictionary-kudos-{vi,en}.ts`)
- [x] tsc + lint exit 0 (`evidence/phase4-tsc-lint.txt`)

## Success Criteria
tsc/lint clean; no hard-coded board data in `lib/**` (FR-001); actions reject unauthenticated calls and malformed ids; formatters give identical output in Node and browser.

## Risk Assessment
- `Intl` output differs across runtimes → build from `formatToParts`, not locale strings.
- Server action receives forged filters/cursor → re-validated server-side.
- Sequential action dispatch delays a like behind load-more → accepted; hooks keep the button pending.

## Security Considerations
Session-bound client only (RLS + definer RPC decide). Never forward RPC error text to UI. Action inputs are ids/filters only (`server-actions.md` §security).

## Next Steps
Phase 5 hooks call these actions and helpers.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

---
phase: 6
title: "Integration, GREEN, regression, visual"
feature: kudos-live-board
status: done
priority: P1
effort: 3h
owner_agent: implementer (wiring) → tester (GREEN, regression, visual)
track: integration
test_policy: e2e-red-first
depends_on: [2, 5]
---

# Phase 06 — Page + `_wiring/**`, `[id]` placeholder, GREEN

## Context Links
- `evidence/red-evidence.json` (same command K must go GREEN), phase-01 selector contract, phase-02 integration contract, phase-03 RPC contract, phase-04/05 files
- `app/(main)/layout.tsx`, `app/(main)/page.tsx` (Suspense + `connection()` pattern), `app/(main)/_behavior/coming-soon-content.tsx`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `02-guides/migrating-to-cache-components.md` §cookies/headers/searchParams (pass the `searchParams` promise into Suspense children), `01-getting-started/08-caching.md`, `03-api-reference/04-functions/connection.md`, `03-api-reference/03-file-conventions/page.md` (`PageProps`, `searchParams`), `dynamic-routes.md` (`[id]`), `02-guides/preserving-ui-state.md`, `02-guides/streaming.md`

## Overview
Compose Track A views with Track B data/behaviour; replace the Coming soon page; add `/sun-kudos/[id]`. Then tester runs GREEN (K), full regression, SQL gate, build, visual.

## Requirements / files (each <200 lines)
- `app/(main)/sun-kudos/page.tsx` — `export default function Page({ searchParams }: PageProps<'/sun-kudos'>)`: static shell (banner + pills via `_wiring`) and Suspense blocks receiving the `searchParams` promise; blocks: highlight+filters, spotlight, feed+sidebar. Each block awaits `connection()`/`searchParams`/`getLocale()` inside itself (cacheComponents). `generateMetadata` not needed (layout title).
- `_wiring/kudos-board-providers.tsx` — `KudoFeedbackProvider` + `KudoLikeStateProvider` around the board (client).
- `_wiring/highlight-block.tsx` — server: `sanitizeFilters` → `getHighlight`; renders `HighlightSection` with `FilterBarContainer` + `HighlightCarouselContainer key={filtersKey(f)}`.
- `_wiring/filter-bar-container.tsx`, `_wiring/highlight-carousel-container.tsx`, `_wiring/kudo-card-container.tsx` (client: like slot, copy slot, hashtag click → filter navigation, formatted labels, stars via `starsFor`).
- `_wiring/feed-and-sidebar-block.tsx` — server: `getFeedPage(f, null)` + `getSidebar()`; `FeedContainer key={filtersKey(f)}` + `SidebarContainer`; `canLike` already in rows.
- `_wiring/spotlight-block.tsx` + `_wiring/spotlight-container.tsx` — positions from `positionFor`, tooltip `name · formatKudoTime`, pan/zoom + search hooks.
- `_wiring/action-pills-container.tsx` — compose pill + profile-search pill → `openModal` (A12).
- `_wiring/build-kudos-labels.ts` — dictionary → label props (DRY across containers).
- `app/(main)/sun-kudos/[id]/page.tsx` — `return <ComingSoonPage />` (A13; any id, no lookup).
- Error path: a block whose RPC throws renders the empty/error text in place (no page crash); covered by review, not E2E.

## Implementation Steps
1. Implementer: read Next docs; write page + wiring; `bunx tsc --noEmit`, `bun run lint`, `bun run build` (catches cacheComponents prerender errors).
2. Tester GREEN: K `bun run test:e2e e2e/kudos-` exit 0 (same command as RED); also `E2E_PROD=1 bun run test:e2e e2e/kudos-`.
3. Tester regression (safety-critical: mock contract, RLS/RPC, shared layout): D `bun run test:e2e`; P `E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch`; I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid`; L `E2E_SITE_LAUNCH_AT=not-a-date bun run test:e2e --grep @launch-env-invalid`.
4. SQL gate: `bun run supabase:start && supabase db reset && supabase test db` exit 0 (or recorded BLOCKED with reason).
5. Manual real-DB smoke (if Docker): sign in locally, link the user (`update public.sunners set user_id = '<uid>' where ...`), like/unlike once, check sidebar hearts on the sender.
6. Visual: Playwright MCP screenshots @1440 vs `momorph/kudos-live-board-frame.png`; @768 and @375 no horizontal scroll, sidebar below feed, one carousel card → `evidence/visual-*.png` + notes. Material mismatch → bounded fix back to `momorph-ui-implementer` (phase-02 files), K rerun.
7. Record `evidence/green-evidence.json` (commands, exit codes), TC/SC mapping final status; update plan phase statuses.

## Todo List
- [x] Page + wiring + `[id]` (`page.tsx`, `_wiring/*`, `[id]/page.tsx`)
- [x] tsc, lint, build (final: `evidence/tsc-final-output.txt`, `lint-final-output.txt`, `build-final-output.txt`; nf1: `nf1-fix-build-output.txt`)
- [x] K GREEN (dev + prod): dev 60/60 (`evidence/final2-kudos-dev-exit.txt`), prod 60/60 (`evidence/final2-kudos-prod-exit.txt`), final tree
- [x] D, P, I, L exit 0: D 176 (`final2-full-d-exit.txt`), P 35 (`final-prelaunch-P-exit.txt`), I 2 (`final-event-env-invalid-I-exit.txt`), L 2 (`final-launch-env-invalid-L-exit.txt`)
- [x] SQL gate: `db reset` + `supabase test db` 119/119 PASS on final code (`evidence/review-fix-pgtap-output.txt`)
- [x] Visual 1440/768/375: captures, metrics, and mismatch list (`evidence/visual/visual-mismatch-list.md`). 768/375 layout rules pass. 1440 outside ±4 px; accepted as minor deviation (`clarifications.md`, session "visual verdict after polish round 2"). UI follow-up open (plan follow-up 2)
- [x] Evidence + mapping: TC 1–41 (`evidence/tc-mapping.md`), SC-001..011 (`evidence/sc-mapping.md`). Time-label test covers day=month only (plan follow-up 3)

## Success Criteria
All commands exit 0; no hydration warnings in K console checks; 41 TCs and SC-001..SC-011 mapped; visual within tolerance.

## Risk Assessment
- Prerender error on `searchParams` outside Suspense → pattern from `migrating-to-cache-components.md`; build gate.
- Stale client state after filter change → keys on containers; K asserts.
- Header "Sun* Kudos" active state on `/sun-kudos/[id]` → existing `startsWithSegment` already covers it.

## Security Considerations
No service role; page reads with user session; `[id]` does not echo the id into HTML beyond the URL.

## Next Steps
Code review (reviewer template), docs promotion via doc-writer, commit/PR on user approval.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

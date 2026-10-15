---
title: "Sun* Kudos Live board (/sun-kudos) on real Supabase data"
description: "MoMorph MaZUn5xHXZ: Highlight carousel, Spotlight, infinite All Kudos, sidebar, like RPC, URL filters, copy link; first migrations + RLS + seed in the repo."
status: completed
priority: P1
effort: 26h
branch: feat/kudos-live-board
tags: [kudos-live-board, momorph, supabase, rls, rpc, server-actions, i18n, playwright, nextjs16, e2e-red-first]
created: 2026-10-14
work_type: feature
spec: docs/features/F006_KudosLiveBoard/
system_doc_drafts: [spec/system/architecture.md, spec/system/permissions.md]
blockedBy: []
---

# Sun* Kudos Live board — Implementation Plan

## Overview
`/sun-kudos` (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ, node `2940:13431`) replaces the Coming soon page inside `app/(main)`. testPolicy `e2e-red-first`. `clarifications.md` is authoritative. FR/BR/DEC/ALG/INT/SM/US ids come from `spec_draft`. First DB in the repo (9 tables, RLS, 6 RPCs). No new env var, no new npm dependency.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E RED + mock PostgREST/RPC routes](./phase-01-e2e-red-and-mock-kudos-rest-routes.md) | Done (open: homepage list edit) |
| 2 | [Kudos presentational UI (Track A)](./phase-02-kudos-presentational-ui.md) | Done (polish round in) |
| 3 | [DB schema, RLS, RPCs, seed (Track B)](./phase-03-db-schema-rls-rpcs-and-seed.md) | Done (pgTAP 119 PASS) |
| 4 | [Data layer, server actions, i18n (Track B)](./phase-04-data-layer-server-actions-and-i18n.md) | Done |
| 5 | [Client behaviour hooks (Track B)](./phase-05-client-behaviour-hooks.md) | Done |
| 6 | [Integration, GREEN, regression, visual](./phase-06-integration-green-regression-and-visual.md) | Done (visual accepted as minor deviation at 1440; UI follow-up open) |

Final gates on final tree (`evidence/final-*`, `final2-*`): K dev 60/60, K prod 60/60, D 176/176, P 35 / I 2 / L 2 PASS, tsc/lint/build exit 0, pgTAP 119/119, SC mapping `evidence/sc-mapping.md`, review SEALED 9/10. Visual 1440 is outside ±4 px; accepted in `clarifications.md` "Session 2026-10-14 (visual verdict after polish round 2)". PR pending user approval; no commit made.

Owner · track · depends · effort: 1 tester · gate · — · 6h | 2 momorph-ui-implementer · A · 1 · 6h | 3 implementer · B · 1 · 3h | 4 implementer · B · 3 · 4h | 5 implementer · B · 4 · 4h | 6 implementer → tester · integration · 2, 5 · 3h.

## Dependencies
```
1 ─┬─> 2 (Track A UI) ───────────────────────┐
   └─> 3 (SQL) ─> 4 (lib/kudos, actions) ─> 5 (hooks) ┴─> 6 (page + _wiring, GREEN, regression, visual)
```
After 1: {2} ∥ {3 → 4 → 5}; file sets disjoint. The RPC/JSON contract in phase-03 §"RPC contract" is the single source; phase 1 (mock), 3 (SQL), 4 (TS types) and 2 (view props) all match it field for field.

## Data flow
```
GET /sun-kudos?hashtag&department → proxy (lock, guard) → (main) layout (getCurrentUser)
  → page: Suspense blocks, each awaits searchParams/cookies inside (cacheComponents)
     filters = sanitize(searchParams, kudos_filter_options())            (unknown → null, D014)
     ∥ kudos_highlight(f) ∥ kudos_feed_page(f,null,11) ∥ kudos_spotlight() ∥ kudos_sidebar()  (rpc, user JWT, RLS)
  → _wiring maps rows → Track A props; client providers (like map, toast, modal); E2E: mock-kudos-* serves the same RPCs
Scroll sentinel → loadMoreKudos(cursor, f) [server action] → kudos_feed_page → {items,nextCursor}
Heart → toggleKudoLikeAction(kudoId) [server action] → rpc toggle_kudo_like (SECURITY DEFINER) → {liked,likeCount}
Filter/hashtag click → router.replace(?hashtag&department, {scroll:false}) → server re-render
```

## Key calls
- Reads go through **SECURITY INVOKER SQL functions returning jsonb**, not PostgREST table embeds: ALG-001 needs order-by-like-count (not expressible in a plain select), one call returns the nested card shape, and the mock implements 6 small RPCs instead of PostgREST's filter grammar. Logged in clarifications (planner session).
- Server Actions run one at a time per client (`02-guides/server-actions.md` §Sequential dispatch): a like waits behind a running load-more. Accepted (clarifications chose actions). Actions return values only — no `refresh()`/revalidate, so Highlight does not reorder after a like (A6).
- Activity keeps client state across `router.replace` (`02-guides/preserving-ui-state.md`): carousel index and loaded feed pages are keyed by `${hashtag}|${department}` so a filter change resets them (FR-202, A3).
- No `sunners` row → hearts disabled, stats 0, RPC raises `sunner_not_found` (no auto-create).
- Shared mock state: only the serial `e2e/kudos-like-and-hearts.spec.ts` mutates; empty-board/no-sunner cases use per-identity datasets.
- `e2e/homepage-access-and-landing.spec.ts` asserts `/sun-kudos` is Coming soon: phase 1 drops that path from its list (`/sun-kudos/x` stays, now via the `[id]` placeholder).

## File ownership (W = writes; no two parallel phases share a file)

| Path | Phase |
|------|-------|
| `e2e/kudos-*.spec.ts`, `e2e/support/kudos-*.ts`, `e2e/support/mock-kudos-*.ts`, `e2e/support/mock-supabase-server.ts`, `e2e/support/login-through-stubbed-google.ts` (additive identities), `e2e/homepage-access-and-landing.spec.ts` (one list edit) | 1 |
| `app/(main)/sun-kudos/_components/**`, `public/images/kudos/**` | 2 |
| `supabase/migrations/*_kudos_live_board.sql`, `supabase/seed.sql`, `supabase/tests/database/kudos-*.test.sql` | 3 |
| `lib/kudos/**`, `lib/i18n/dictionary-kudos-{vi,en}.ts`, `lib/i18n/dictionary-{vi,en}.ts` (one spread each) | 4 |
| `app/(main)/sun-kudos/_behavior/**` | 5 |
| `app/(main)/sun-kudos/page.tsx`, `app/(main)/sun-kudos/_wiring/**`, `app/(main)/sun-kudos/[id]/page.tsx` | 6 |

Read-only: `proxy.ts`, `lib/supabase/*`, `app/(main)/layout.tsx`, `app/(main)/_behavior/*`, `app/(main)/_components/*`, `playwright.config.ts`, every other spec. Every code file <200 lines, kebab-case.

## Verification & rollback
- K (RED and GREEN, same command) `bun run test:e2e e2e/kudos-` · D `bun run test:e2e` (full; mock + RLS/RPC are safety-critical) · P `E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch` · I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid` · L `E2E_SITE_LAUNCH_AT=not-a-date bun run test:e2e --grep @launch-env-invalid` · SQL `bun run supabase:start && supabase db reset && supabase test db` (pgTAP; no container runtime → BLOCKED, recorded, never skipped silently)
- `bunx tsc --noEmit`, `bun run lint`, `bun run build`, K with `E2E_PROD=1`. Visual vs Figma @1440, derived @768/@375 (no horizontal scroll). Rollback: revert phase commits. Phase 6 alone switches `/sun-kudos` to the board; reverting it restores Coming soon while DB objects stay harmless. DB down: a `supabase/migrations` revert + `supabase db reset` locally; no prod DB yet. Phases 1 and 6 ship together, else D stays red on the new specs.
- Done = K, D, P, I, L, SQL exit 0 on final code; tsc/lint/build 0; 41 TCs + SC-001..SC-011 mapped to a passing test or a recorded reason; visual within tolerance at 3 widths.

## Risk register (live, 2026-10-14)

| Risk | L | I | Status | Countermove / evidence |
|------|---|---|--------|------------------------|
| Mock and SQL drift (E2E green, real DB wrong) | M | H | Mitigated | One contract (phase-03); pgTAP 119 incl. `kudos-seed-matches-e2e-fixture` |
| Parallel workers race on mutable like state | H | M | Closed | Serial like spec, own identities, reset; K 57/57 |
| `SECURITY DEFINER` RPC hijack via search_path | L | H | Closed | `set search_path = ''`, revoke anon; RLS/RPC pgTAP; review pass |
| cacheComponents prerender error | M | M | Closed | `bun run build` exit 0 (nf1-fix) |
| Filter change keeps stale carousel/feed state | H | M | Closed | Keyed remount; K asserts reset |
| Hydration mismatch; mock/login edits break old specs | M | M | Mitigated | Fixed-TZ formatters; full D 173/173. No console-hydration check recorded |
| NEW: P/I/L env-gated specs never run on final code | M | M | Closed | P 35 / I 2 / L 2 PASS on final tree |
| NEW: cold-start login flake (78/110 once, passed on rerun, cause unknown) | M | M | Open | Owner tester, follow-up 5 |
| NEW: concurrent toggle on same kudo (L2) | L | M | Open (deferred) | Follow-up 6 |
| NEW: `secret_boxes` readable incl. unopened prizes (L4) | L | H | Open (deferred) | Must close before real prize data, follow-up 7 |
| NEW: DB image url as href without scheme check (L7) | L | M | Open (deferred) | Must close at write path, follow-up 7 |
| NEW: 1440 visual outside ±4 px (accepted minor deviation) | M | L | Open | UI follow-up, follow-up 2 |

## Unresolved / follow-ups
1. **Homepage list edit.** Owner: tester. Done: `/sun-kudos` removed from `PLACEHOLDER_PATHS` (`e2e/homepage-access-and-landing.spec.ts:6`), D green.
2. **UI follow-up: filter gap/width, highlight card height, banner height within ±4 px at 1440.** Owner: UI (momorph-ui-implementer). Done: `evidence/visual/visual-mismatch-list.md` deviations re-measured within tolerance.
3. **Time-label test uses 10/10, so MM/DD order is proven by code only.** Owner: tester. Done: a fixture with day ≠ month asserts the `HH:mm - MM/DD/YYYY` order in K.
4. **Docs: stale `screen-flow.md` and missing F006 PERM codes.** Owner: docs. Done: `/tkm:rebuild-spec --artifact screen-flow` and `--artifact permissions-matrix` run, plus the changelog entry; the Flow doc layer gen (`--flows`) also run after merge, as with F004/F005.
5. **Cold-start login flake** (78/110 once, passed on rerun, cause unknown). Owner: tester. Done: 3 consecutive cold-start runs without `auth_failed`, or the cause isolated.
6. **L2 concurrent toggle (deferred).** Owner: user (semantics), implementer. Done: semantics chosen and covered by pgTAP, or risk accepted in writing.
7. **L4 `secret_boxes` readable + L7 image href scheme (deferred).** Owner: implementer. Done before real prize data or user-supplied image URLs: RLS tightened, `http(s)` scheme check, with proof.
8. **NF2 page-level filter await (deferred).** Owner: implementer. Done: measured on dev, or accepted as-is.
9. **L9 no down migration (deferred).** Owner: implementer. Done: down script for the 3 migrations, or rationale recorded before first deploy.
10. ~~**Spotlight network-line artwork**~~ — resolved 2026-10-15: artwork pulled via Figma MCP (`public/images/kudos/spotlight-{roots,network}.webp`).
11. **Pager font sizes** measured from PNG, not Figma tokens. Owner: momorph-ui-implementer. Done: checked against Figma inspector or accepted.
12. **EN copy and error toasts** are implementer-authored. Owner: user. Done: strings in `lib/i18n/dictionary-kudos-en.ts` confirmed.
13. **"Tìm kiếm profile Sunner" pill** opens coming-soon modal, no spec behaviour. Owner: user. Done: accepted or behaviour named.
14. **A6 cross-card like E2E** not covered. Owner: tester. Done: K case passes, or gap accepted.
15. **Commit and PR** pending user approval. Owner: user approves, implementer opens PR with `gh pr create -R ngocnv-0940/agentic-coding-hands-on` against `master`. Done: PR merged.

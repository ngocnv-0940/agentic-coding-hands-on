---
phase: 1
title: "E2E RED + mock PostgREST/RPC routes"
feature: kudos-live-board
status: done
priority: P1
effort: 6h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E RED (`/sun-kudos`) and mock Kudos RPC routes

## Context Links
- `clarifications.md` (authoritative, incl. planner session), `momorph/kudos-live-board-test-cases.csv` (41 TCs), `momorph/kudos-live-board-specs.csv`, `momorph/kudos-live-board-frame.png`
- Spec draft: `technical-spec.md` §3 A1–A13, §4.5 ALG-001..006, §5.1 SC-001..SC-011; `functional-spec.md` §4, §8–10; `screens/SCR-kudos-live-board/spec.md` (E01–E32)
- **RPC contract: `phase-03-db-schema-rls-rpcs-and-seed.md` §RPC contract** (the mock implements exactly that)
- Harness: `playwright.config.ts`, `e2e/support/{mock-supabase-server,login-through-stubbed-google,homepage-locators,app-alert}.ts`, `e2e/homepage-access-and-landing.spec.ts`
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (valid-RED rules)

## Overview
Durable screen-level Playwright specs for the live board, plus the mock Supabase extension the app will call. No app code. Record a **valid RED**: non-zero exit caused by the screen assertions (today `/sun-kudos` is Coming soon, `/sun-kudos/<id>` is 404), not by webServer/compile/mock failures.

## Key Insights
- The app calls PostgREST through `@supabase/supabase-js`: `POST {MOCK}/rest/v1/rpc/<fn>` with JSON args, headers `apikey` + `Authorization: Bearer <user access token>`. The mock resolves the bearer to a user (existing `accessOwners`) → sunner (fixture `user_id`). No bearer / unknown → 401 `{code:'PGRST301',message:'JWT invalid'}`.
- Errors in PostgREST shape: status 400, `{code:'P0001', message:'self_like'|'sunner_not_found'|'kudo_not_found', details:null, hint:null}`.
- Unknown `/rest/v1/*` paths → 404 + stderr log (same drift guard as auth). `/auth/v1/*` handlers byte-identical.
- `mock-supabase-server.ts` is 158 lines: add only identities + one delegation line (`if (pathname.startsWith('/rest/v1/') || pathname.startsWith('/__e2e/kudos/')) return handleKudosRest(req, res, ownerOf(req))`). Logic lives in new files.
- Identities (new stub codes, additive in `USERS` and `StubIdentity`): `user` (existing `e2e-user` → viewer sunner; read-only specs assert its stats), `kudos-sender`, `kudos-liker` (like spec only), `kudos-outsider` (no sunner row, full board), `kudos-empty` (mock serves an **empty dataset** for this identity: board, spotlight, gifts, stats all empty/0). Per-identity datasets avoid a global switch under `fullyParallel`.
- Test control (mock-only, not in the app contract): `POST /__e2e/kudos/reset` (restore initial likes), `POST /__e2e/kudos/special-today {on:boolean}` (mock "today is a special day"). Only the serial like spec calls them.
- Fixtures from Figma content (names, departments, messages, hashtags, hero titles, prizes in the frame/specs CSV). Need: 25 kudos (US004: 10/20/25), ≥6 with ≥3 likes and distinct counts (stable top 5, one tie broken by newer), 1 kudo with >5 hashtags, 1 with >5 images, 1 with long content (clamp), one count ≥1000 ("1.000"), sunners with 9/10/20/50 received (0–3 stars), 12 opened secret boxes (10 shown), one hashtag+department combo with 0 kudos, 2 like-target kudos sent by `kudos-sender` with 0 likes and a unique hashtag no other spec filters by.
- Image/avatar URLs in fixtures point at `/images/kudos/*` files phase 2 adds (png/jpg/webp, proxy matcher). Missing at RED time is fine (assertions are on screen structure).
- Clipboard: `context.grantPermissions(['clipboard-read','clipboard-write'])`; blocked case: `page.addInitScript` overriding `navigator.clipboard.writeText` to reject.
- Spotlight assertions: tooltip text via hover, node `href`/navigation, `transform` style changes after drag/wheel only when Pan/Zoom is on, search highlight via `data-match="true"`.

## Requirements
Selector contract (testids, consumed read-only by phases 2/6): `kudos-board`, `kudos-banner`, `kudos-compose-pill`, `kudos-profile-search-pill`, `kudos-highlight`, `kudos-filter-hashtag`, `kudos-filter-department` (buttons; options `role=option`), `kudos-carousel`, `kudos-carousel-prev`, `kudos-carousel-next`, `kudos-carousel-pager` ("n/N"), `kudo-card` (attr `data-kudo-id`, `data-variant=highlight|feed`, `data-active` on the centre slide, `inert` on neighbours), `kudo-time`, `kudo-content`, `kudo-hashtag`, `kudo-image`, `kudo-like` (`aria-pressed`, `disabled`), `kudo-like-count`, `kudo-copy-link`, `kudo-detail-link`, `kudo-person` (`data-role=sender|receiver`, star `title`), `kudos-empty`, `kudos-spotlight`, `spotlight-total`, `spotlight-node` (`data-match`), `spotlight-tooltip`, `spotlight-panzoom`, `spotlight-canvas`, `spotlight-search`, `spotlight-empty`, `kudos-feed`, `kudos-feed-sentinel`, `kudos-sidebar`, `sidebar-stat-{received,sent,hearts,opened,unopened}`, `sidebar-open-box`, `sidebar-gift-row`, `sidebar-gifts-empty`, `kudos-toast`, `coming-soon-modal`, `coming-soon-modal-close`.

Specs (title prefixed with TC/FR id; all untagged → part of default run D):
- `e2e/kudos-board-access-and-layout.spec.ts` — ACCESSING 1–3, GUI 4–18; FR-101..106, FR-102 order, FR-002 (EN cookie: no raw `kudos.` keys), FR-314 (375/768: no horizontal scroll, sidebar below feed), `/sun-kudos/abc` → Coming soon with header/footer, guest `/sun-kudos` → `/login`.
- `e2e/kudos-highlight-and-filters.spec.ts` — FUNCTION 29–32; FR-201..208, DEC-002, DEC-004, ALG-001 order, prev disabled on 1, next on N, "2/5", URL `?hashtag=`/`department=`, reload keeps filters, card-hashtag click keeps department, unknown values ignored, empty combo → "Hiện tại chưa có Kudos nào." in both blocks, filter change resets to "1/N".
- `e2e/kudos-feed-and-cards.spec.ts` — FUNCTION 22, 24–26, 33–37, 40; FR-003/004/204, FR-301/302 (10 → 20 → 25, no duplicate ids), clamp via computed `-webkit-line-clamp` 3/5, ≤5 hashtags + "…", ≤5 images, image opens new tab, "1.000", stars/badge, avatar/name → `/profile`, content/"Xem chi tiết" → `/sun-kudos/<id>`, copy link (clipboard + toast, hidden after ~3 s; blocked → error toast), `kudos-empty` identity → empty texts.
- `e2e/kudos-spotlight.spec.ts` — FUNCTION 20, 28, 38, 39; FR-303..309, BR-011 (empty search clears, no error; `maxLength=100`; diacritic-insensitive match), drag/wheel only when on, node click after drag does not navigate, empty identity → "Chưa có dữ liệu" + "0 KUDOS".
- `e2e/kudos-sidebar-and-modal.spec.ts` — FUNCTION 19, 21, 23, 27, 41; FR-310..313, DEC-006, FR-103 (3 entry points, Esc/backdrop/close, focus return), outsider → five 0 and disabled box button.
- `e2e/kudos-like-and-hearts.spec.ts` — `test.describe.configure({mode:'serial'})`, `beforeAll` reset; FR-401..405, BR-002..006, SM-001, DEC-003: liker toggles red +1 / gray −1; sender sees own kudo disabled; sender sidebar hearts +1 normal day, +2 with special-today on, unlike after switching it off revokes 2; outsider's heart disabled.
- Helpers: `e2e/support/kudos-locators.ts`, `e2e/support/kudos-fixture-ids.ts` (exported ids/expected values shared by specs and mock — single source).
- Mock: `e2e/support/mock-kudos-rest-routes.ts` (routing, auth→sunner, errors, control), `e2e/support/mock-kudos-board-queries.ts` (ALG-001/004, spotlight, sidebar, filter options over arrays), `e2e/support/mock-kudos-like-rules.ts` (toggle rules = ALG-003), `e2e/support/mock-kudos-fixture-people.ts`, `e2e/support/mock-kudos-fixture-kudos.ts`. Each <200 lines.
- Edit `e2e/homepage-access-and-landing.spec.ts`: remove `/sun-kudos` from the placeholder loop (line ~76). Keep `/sun-kudos/x` in `PLACEHOLDER_PATHS`.

## Implementation Steps
1. Read the RPC contract (phase-03) and the spec drafts; map 41 TCs → spec/test (table in `evidence/tc-mapping.md`, with reasons for TCs not automated: TC 19/21 compose-dialog validation and form submission are out of scope → assert the modal instead; TC 20 "required message" contradicted by BR-011 → assert no message).
2. Write fixtures + mock files; extend `mock-supabase-server.ts` and the login helper additively.
3. Sanity-probe the mock with `curl` against `bun run e2e/support/start-mock-supabase.ts` (rpc returns contract JSON; 401 without bearer).
4. Write the six specs and helpers.
5. Run D-subset regression first: `bun run test:e2e --grep-invert kudos` must exit 0 (proves mock/login edits broke nothing).
6. Run K `bun run test:e2e e2e/kudos-` → expect non-zero; confirm failures are locator/assertion failures on the screen (not 404 from mock, not webServer).
7. Record `evidence/red-evidence.json`: `redTestFiles`, `redCommand`, `redExitCode`, `redFailure` (first 3 failure lines), timestamp, plus the step-5 exit code.

## Todo List
- [x] TC mapping table (`evidence/tc-mapping.md`)
- [x] Mock fixtures + routes + identities (+ control endpoints)
- [x] Six specs + locators + fixture-ids
- [ ] Homepage spec list edit (open: `/sun-kudos` still in `PLACEHOLDER_PATHS`, `e2e/homepage-access-and-landing.spec.ts:6`; plan follow-up 3)
- [x] Non-kudos regression exit 0 (`evidence/e2e-regression-nonkudos-exit.txt`, 110/110)
- [x] Valid RED recorded (`evidence/red-evidence.json`, 52 failed on screen assertions, exit 1)

## Success Criteria
Step 5 exit 0; K non-zero on screen assertions only; every TC mapped; no file >200 lines; `bunx tsc --noEmit` clean for e2e files.

## Risk Assessment
- Mock grows into a second implementation of the SQL → keep it to array filters/sorts; the pgTAP suite (phase 3) is the authority on SQL.
- Flaky like spec under parallel workers → dedicated identities/kudos, serial mode, reset in `beforeAll`.
- Timing (toast 3 s, infinite scroll) → web-first assertions, `page.clock` only for the toast hide.

## Security Considerations
Control endpoints exist only in the e2e mock process (never in app code). Fixtures contain no secrets.

## Next Steps
Hand `evidence/red-evidence.json` and the selector contract read-only to phases 2 and 6.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

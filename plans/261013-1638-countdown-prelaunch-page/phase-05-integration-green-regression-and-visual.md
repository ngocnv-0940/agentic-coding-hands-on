---
phase: 5
title: "Integration, GREEN, regression, visual"
feature: countdown-prelaunch
status: completed
priority: P1
effort: 2.5h
owner_agent: implementer → tester
track: integration
test_policy: e2e-red-first
depends_on: [2, 3, 4]
---

# Phase 05 — Page wiring + GREEN + full regression + visual

## Context Links
- Contracts: phase-02 (`PrelaunchScreen`, `CountdownDisplay size="prelaunch"`, selector contract), phase-03 (`PRELAUNCH_PATH`, lock, `prelaunch.title`), phase-04 (`useNavigateHomeAtEventStart`)
- RED: `evidence/red-evidence.json`, `reports/tester-red-evidence.md`
- Precedent: `app/(main)/page.tsx` (Suspense + `connection()` + `readEventSnapshot`), `app/(main)/_wiring/countdown-container.tsx`, `app/login/page.tsx` (top-level route outside `(main)`)
- Next docs (read FIRST): `01-app/01-getting-started/08-caching.md` ("Working with runtime APIs"), `03-api-reference/04-functions/connection.md`, `05-server-and-client-components.md`

## Overview
The implementer builds `app/prelaunch/page.tsx` and its client container. The tester then reruns P, D and I GREEN (D in full, because the proxy is safety-critical), runs P again under `E2E_PROD=1`, and does visual validation against Figma.

## Key Insights
- Page (server): `<Suspense fallback={<div className="min-h-screen bg-saa-navy" aria-hidden />}>` → `await connection()` → `getDictionary(await getLocale())` → `readEventSnapshot()` (cross-import) → `remainingMs = event.targetIso ? Date.parse(event.targetIso) - Date.now() : 0`. No session read (FR-602), no `(main)` layout, so no header and no footer.
- Container (`'use client'`): `useCountdown(targetIso, initial)` for the display, plus `useNavigateHomeAtEventStart(remainingMs)`, rendering `<CountdownDisplay size="prelaunch" comingSoonText={null} labels=… {...value} />`. Props stay serializable.
- `<title>` comes from the root `generateMetadata` (`meta.title`, as clarified). No `layout.tsx` and no metadata in `app/prelaunch`.
- Race: the server is already past the start at render (`remainingMs ≤ 0`) → the hook navigates at once (spec §3.4). No server `redirect()`, which would only be a client redirect inside streamed content anyway.

## Requirements
All FR/BR/DEC/ALG/US/SC of `spec/countdown-prelaunch/` end-to-end; all 17 TCs (or the recorded reasons from phase 1).

## Architecture
```
GET /prelaunch → proxy (phase 3: pass before start / 307 / after) → root layout (html lang, meta.title)
  → app/prelaunch/page.tsx [Suspense: connection, locale, dict, snapshot, remainingMs]
      → PrelaunchScreen (phase 2, server) { title: dict['prelaunch.title'], countdown: … }
          └─ PrelaunchCountdownContainer (client) → useCountdown + useNavigateHomeAtEventStart → CountdownDisplay size="prelaunch"
```

## Related Code Files
Create: `app/prelaunch/page.tsx`, `app/prelaunch/_wiring/prelaunch-countdown-container.tsx`.
Modify: none (bounded visual fixes go back to phase-2 files through `momorph-ui-implementer`).

## Implementation Steps
1. Implementer: read the docs, then write the page and container (<80 lines each).
2. `bunx tsc --noEmit`, `bun run lint`, `bun run build`. Fix any prerender or cookie error with Suspense / `connection()`; never by disabling `cacheComponents`.
3. Implementer smoke: P on `e2e/prelaunch-*.spec.ts`, once; hand off.
4. Tester GREEN, exact commands from plan.md, exit codes saved:
   - P (dev) → `evidence/e2e-green-prelaunch-output.txt`; P with `E2E_PROD=1` → `…-prelaunch-prod-output.txt`.
   - D **full suite** → `evidence/e2e-green-default-output.txt` (auth guards, homepage incl. the countdown with the `size` default path, awards, localization).
   - I with all three invalid values listed in `e2e/homepage-countdown-invalid-env.spec.ts` → `evidence/e2e-green-invalid-*.txt`.
5. Tester visual (Playwright MCP), browser clock set so tiles read `00 05 20` (Figma): @1440 against `momorph/countdown-prelaunch-frame.png` (frame is 1512 wide, compare proportionally): background crop/overlay, title size and position, tile size, gaps, labels. @768/@375: no horizontal scroll, readable, centered. Save to `evidence/visual/`. A material mismatch goes back to `momorph-ui-implementer` as a bounded fix (phase-2 files only); tests are never weakened.
6. Final report: TC/SC → passing test table; `docs impact: major` (permissions and architecture drafts to promote).

## Todo List
- [x] page + container (phase 5 files present; implementer smoke P 31/31 prod, 30/31 dev before the fix below)
- [x] tsc / lint / build 0 (tsc 0, eslint 0, build 0, 0 warnings)
- [x] GREEN P (dev + prod), D full, I ×3, all exit 0
- [x] Dev flake root-caused and fixed in the test (see Evidence)
- [x] visual @1440/@768/@375 + verdict: 768/375 pass; 1440 minor deviation (≈5% oversize, +8 px low) accepted, recorded in `clarifications.md`
- [x] review: `inspection-verdict.json` SEALED 9, 0 critical; Accept findings fixed (dev/prod P 34/34, full D 116/116); one Low deferred (plan.md follow-up 6)
- [x] TC/SC → test mapping

## Success Criteria
P, D and I exit 0 with the exact RED commands; tsc, lint and build exit 0; visual within tolerance, or a user-accepted deviation recorded in `clarifications.md`; every TC/SC mapped. The D test count equals the pre-feature baseline plus the new untagged and invalid-env specs (nothing silently excluded).

## Scope Contract
- **Changed:** `app/prelaunch/page.tsx`, `_wiring/prelaunch-countdown-container.tsx`; the feature as a whole touches the proxy, a shared component, dictionaries and the test config.
- **Impacted:** every proxied route (lock), sign-in/out, `/admin` gate, homepage countdown (shared `CountdownDisplay`), both locales, every E2E run (config `grepInvert`).
- **Will verify:** **full** D (safety-critical: auth/guards, config), P in dev and prod, I ×3, tsc/lint/build, visual for `/prelaunch`.
- **Deliberately skipped:** visual of other pages (homepage markup unchanged on the default `size` path, and its E2E is in D). `@smoke` (needs the real Supabase stack; the proxy's cookie contract is unchanged).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| cacheComponents prerender error | M | M | Suspense + `connection()`; build gate |
| Hydration mismatch (server vs client countdown) | L | M | First render = server snapshot (`useCountdown` contract); hydration guard in the display spec |
| Fake-clock redirect test slow (2099 chunks) | M | L | Accept up to the spec timeout; record runtime; never move the start closer than 25 days |
| Visual fidelity loops | M | M | Budget 1–2 bounded fix rounds, phase-2 files only |

## Security Considerations
`/prelaunch` reads no session and renders no user data (FR-602). The lock is verified in full in every run (D, P, I).

## Rollback
Revert this phase together with phase 1 (the untagged spec needs the page). To re-open the site, revert phase 3, or use the ops kill switch: a past `EVENT_START_AT`.

## Next Steps
Code review (reviewer template; focus: lock position, ALG-002 chunking, `size` default byte-identical). Doc-writer promotes `spec_draft` and `spec/system/*`; changelog entry; ops note that a future `EVENT_START_AT` locks the site.

## MoMorph refs:
- Countdown - Prelaunch page: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/261013-1638-countdown-prelaunch-page/clarifications.md
- testPolicy: e2e-red-first

## Evidence (tester, 2026-10-13)

**Dev flake root cause (redirect FR-402 test):** test defect (a). `toBeVisible()` on `prelaunch-screen` passes on
the server HTML before React hydrates, so `page.clock.fastForward` ran before `useNavigateHomeAtEventStart` armed
its timer. Fast-forward jumped past the due time with no timer, so no `/` request (roots 0). Verified with a
probe: hydrated-before-fast-forward gave roots 1; not hydrated gave roots 0.
**Second dev-only symptom (after the fix):** the bounced `/prelaunch` document stayed in its Suspense fallback
(`<template id="B:0">`, boundary never revealed; 40 s with no reveal). Prod is not affected. Cause (test/dev interaction,
not an app bug): React's throttled streamed reveal is clock-gated, and the fake clock jumped ~73 years and then did
not tick. Fix: `page.clock.runFor(1_000)` after the URL check. Assertions unchanged: roots == 1, URL /prelaunch,
screen visible, no second request in 3 s.
**Timing note:** the redirect hook anchors its deadline at effect mount (performance.now + server remainingMs), so a
real redirect fires late by the hydration latency. Bounded and not a loop; the server remainingMs stays the authority
(DEC-004). Minor, no change requested.

**Test changes (e2e/ only, owned by tester):**
- `e2e/support/prelaunch-locators-and-clock.ts`: added `expectPrelaunchHydrated(page)` (fiber-key poll, then one macrotask).
- `e2e/prelaunch-redirect-at-event-start.spec.ts`: FR-402 test waits for hydration before fast-forward; `clock.runFor(1_000)` after the bounce. No assertion weakened.
- Temporary diagnostic and visual specs were created in `e2e/` and deleted; none remain.

**Gate runs (exit codes; raw in `evidence/raw-temper-runs.json`):**

| Run | Output file | Exit | Result |
|---|---|---|---|
| tsc --noEmit | evidence/tsc-phase5-output.txt | 0 | clean |
| eslint . | evidence/lint-phase5-output.txt | 0 | clean |
| bun run build | evidence/build-phase5-output.txt | 0 | 0 warnings |
| D full `bun run test:e2e` | evidence/e2e-green-default-output.txt | 0 | 116 passed, 0 failed, 5.7 min |
| P dev `--grep @prelaunch` | evidence/e2e-green-prelaunch-output.txt | 0 | 31 passed, 4.8 min |
| redirect dev ×5 | evidence/e2e-green-redirect-dev-x5-output.txt | 0 | 15/15 passed, 4.9 min |
| P prod (E2E_PROD=1) | evidence/e2e-green-prelaunch-prod-output.txt | 0 | 31 passed, 4.8 min |
| redirect prod ×3 | evidence/e2e-green-redirect-prod-x3-output.txt | 0 | 9/9 passed, 4.8 min |
| I `not-a-date` | evidence/e2e-green-invalid-not-a-date-output.txt | 0 | 4 passed |
| I `2025-12-26T18:30:00` (offset-less) | evidence/e2e-green-invalid-offsetless-output.txt | 0 | 4 passed |
| I `2025-02-30T10:00:00Z` | evidence/e2e-green-invalid-feb30-output.txt | 0 | 4 passed |

No flaky retries observed (retries 0 locally). Runs green on final code; the D run predates the redirect test edit,
which is excluded from D by `@prelaunch`. D count 116 matches the RED baseline total (116), so nothing was silently excluded.

**TC → test:** GUI 5-7 (countdown-display: two tiles and label per unit), GUI 8 (label white), GUI 9-11 (digit ranges),
FUNCTION 12 (minutes drop, no reload), FUNCTION 13 (5h5m → 00 05 05), FUNCTION 14-15 (sampled offsets), FUNCTION 16
(30 s left → 00 00 00, URL stays), FUNCTION 17 (120d three digits), ACCESS-1 (signed-in sees /prelaunch), ACCESS-2 (guest sees
/prelaunch), ACCESS-3 (admin sees /prelaunch), ACCESS-4 (garbage sb-* cookies). All 17 TCs have a passing test.

**SC → test:** SC-001, SC-002 (lock-and-access); SC-003..005, SC-007 (countdown-display); SC-006 (redirect, after-start);
SC-008 (after-start, homepage/login landing). All SC-001..008 have a passing test.

**Visual (evidence/visual/, production build, locked clock 00 05 20; MCP browser unavailable, bundled Chromium via temp spec):**
- @1440 (1440×1026, aspect of 1512×1077 frame), compared proportionally against the scaled frame:
  - Background and overlay: mean luminance per region within ±1.1 of Figma (top-left, top-right, bottom-left, bottom-right). The UI agent's "upper-right lighter" concern is NOT supported (ours −0.5 there). Art alignment matches (ribbons at x ≈ 1060 vs 1057 scaled).
  - Title: text 423 px wide vs Figma-scaled ≈ 403 px, so about 5% large (36 px vs ≈ 34 px equivalent). Centered at x 720 (match).
  - Tiles: 77×123 vs Figma-scaled 72×116 (≈ +6%). Aspect ratio matches (0.626 vs 0.623). Gap in unit 21 px (match 21), gap between units 60 vs 58.
  - Group ≈ 5% wider relative to viewport; block sits ≈ 8 px lower than Figma-scaled (tile top 375.7 vs 367.6).
  - Labels: MINUTES 175 px vs Figma-scaled 164 px (≈ +6%); label gap below tiles matches.
  - Verdict: **minor** (proportions and composition match; sizes ~5% large; vertical offset ~8 px). Not PASS: discrepancies listed for explicit acceptance or one bounded phase-2 fix (scale tiles, title, labels by ≈0.95 and move the block up ≈8 px).
  - Pixel mean abs diff 5.8/255 overall: qualitative only, not an exact metric; exact is NOT claimed.
- @768 (768×1024): no horizontal scroll (scrollWidth 768 = clientWidth 768). Title and group centered (center 384 vs 384). Readable. Derived size (no Figma frame at this width). **PASS (qualitative).**
- @375 (375×812): no horizontal scroll (375 = 375). Centered (group center 187.25 vs 187.5). Title 24 px, tiles 36×56, labels small but readable. **PASS (qualitative).**

**Bounded fixes requested (owner: momorph-ui-implementer, phase-2 files only; none applied by tester):**
1. Optional, only if the user does not accept the 1440 deviation: scale the prelaunch tile/title/label sizes by ≈0.95 at ≥1024 and move the block up ≈8 px. Owner: momorph-ui-implementer.

**Concerns:** (1) the redirect spec FR-402 is ~13–28 s on dev (1,300 fast-forward steps), the slowest test; (2) hook timer anchored at mount (minor, see Timing note); (3) the MCP browser cannot start on this box (`/opt/google/chrome/chrome` missing), so visuals used a scratchpad bundled-Chromium capture.

---
title: "Countdown Prelaunch page (/prelaunch) + pre-launch site lock"
description: "Public /prelaunch countdown (MoMorph 8PJQswPZmU) and a proxy lock that sends every path except /login, /auth/*, /prelaunch and static assets there until EVENT_START_AT; auto-redirect to / at the real start."
status: completed
priority: P1
effort: 12h
branch: feat/countdown-prelaunch
tags: [countdown-prelaunch, momorph, proxy, i18n, playwright, nextjs16, e2e-red-first]
created: 2026-10-13
work_type: feature
spec: docs/features/F005_CountdownPrelaunch/
system_doc_drafts: [spec/system/permissions.md, spec/system/architecture.md]
blockedBy: []
---

# Countdown Prelaunch — Implementation Plan

## Overview
`/prelaunch` (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU, node `2268:35127`): a top-level public route outside `(main)`, plus a lock in `lib/supabase/proxy.ts`. testPolicy `e2e-red-first`. `clarifications.md` is authoritative. FR/BR/DEC/ALG/SC/US ids come from `spec_draft`. No DB, no API, no new env var, no new dependency.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E RED: prelaunch screen, lock, redirect](./phase-01-e2e-red-prelaunch-screen-lock-and-redirect.md) | Completed |
| 2 | [Prelaunch presentational UI (Track A)](./phase-02-prelaunch-presentational-ui.md) | Completed |
| 3 | [Proxy prelaunch lock + dictionary key](./phase-03-proxy-prelaunch-lock-and-dictionary.md) | Completed |
| 4 | [Redirect home at the real event start](./phase-04-redirect-home-at-real-event-start.md) | Completed |
| 5 | [Integration, GREEN, regression, visual](./phase-05-integration-green-regression-and-visual.md) | Completed (review SEALED 9; 18/18 gates) |

Owner · track · depends · effort: 1 tester · gate · — · 3h | 2 momorph-ui-implementer · A · 1 · 3h | 3 implementer · B · 1 · 2h | 4 implementer · B · 3 · 1.5h | 5 implementer → tester · integration · 2, 3, 4 · 2.5h.

## Dependencies
```
1 ─┬─> 2 (Track A) ─────────────┐
   └─> 3 (lock) ─> 4 (redirect) ┴─> 5 (page wiring, GREEN, regression, visual)
```
After 1: {2} ∥ {3 → 4}. File sets are disjoint (table below).

## Data flow
```
Request → proxy matcher (static images, _next/static|image, favicon excluded)
  → /auth/* bypass (unchanged) → getUser() refreshes cookies (unchanged)
  → ALG-001 decidePrelaunchAccess(pathname, Date.now(), readEventStartFromEnv())
       lock   → 307 /prelaunch  (redirectWithCookies, BR-004)
       unlock → 307 /           (path /prelaunch after start or invalid env, FR-104)
       pass   → existing guards (unchanged, FR-106)
GET /prelaunch → page [Suspense → connection()] → readEventSnapshot() + remainingMs
  → PrelaunchCountdownContainer (client): useCountdown (display) + useNavigateHomeAtEventStart(remainingMs) (ALG-002)
  → location.replace('/') → proxy → / (signed in) or /login (guest)
```

## Key calls
- Next 16.4, `cacheComponents: true`. Every phase that touches routing, proxy or pages reads `node_modules/next/dist/docs/` first (`cd` into it): `01-app/01-getting-started/16-proxy.md`, `01-app/03-api-reference/03-file-conventions/proxy.md` (Node runtime by default, §Runtime), `04-functions/connection.md`, `01-getting-started/08-caching.md`.
- Lock decision = pure `lib/event/prelaunch-access.ts` (ALG-001); `lib/supabase/proxy.ts` calls it after `getUser()` and before the old guards. `proxy.ts` matcher is NOT changed (clarifications).
- ALG-001 also exempts `/_next/*`: FR-102 lists `_next` as exempt, and the matcher lets `/_next/webpack-hmr` (dev HMR) and other internals through.
- ALG-002 amended: a browser `setTimeout` above 2^31-1 ms (~24.8 days) fires at once. Chunk the wait (monotonic `performance.now()` deadline, re-arm ≤ 2^31-1), clamp the first delay ≥ 1 s. Without chunking, a start more than 25 days out gives a redirect loop about once a second.
- Reuse by cross-import from `app/(main)` (clarifications): `CountdownDisplay` (additive `size` prop, default byte-identical), `readEventSnapshot`, `homeFontClassName`, `useCountdown`, `getCountdown`. `<title>` = new key `prelaunch.metaTitle` ("SAA 2025"), superseding the earlier reuse of `meta.title` (clarifications).
- One new key `prelaunch.title` (VI "Sự kiện sẽ bắt đầu sau", EN "Event starts in"). It goes straight into `dictionary-{vi,en}.ts`; a feature dictionary file for one key is not worth it (YAGNI). DAYS/HOURS/MINUTES reuse `home.hero.*`.

## File ownership (W = writes; no two parallel phases share a file)

| Path | Phase |
|------|-------|
| `e2e/prelaunch-*.spec.ts`, `e2e/support/prelaunch-locators-and-clock.ts`, `playwright.config.ts` (grepInvert `@prelaunch` + run comment only) | 1 |
| `app/prelaunch/_components/**`, `public/images/prelaunch/**`, `app/(main)/_components/countdown-display.tsx` (additive `size` prop only) | 2 |
| `lib/event/prelaunch-access.ts`, `lib/supabase/proxy.ts`, `lib/i18n/dictionary-{vi,en}.ts` (one key each) | 3 |
| `app/prelaunch/_behavior/use-navigate-home-at-event-start.ts` | 4 |
| `app/prelaunch/page.tsx`, `app/prelaunch/_wiring/prelaunch-countdown-container.tsx` | 5 |

Read-only: `proxy.ts`, `lib/event/{event-start-config,use-countdown}.ts`, `app/(main)/_wiring/*`, `app/(main)/_components/home-fonts.ts`, `app/layout.tsx`, `e2e/support/{login-through-stubbed-google,mock-supabase-server,event-clock,homepage-locators}.ts`, every existing spec. Every code file <200 lines.

## Verification & rollback
RED/GREEN commands (phase 1 records exit codes in `evidence/`):
- P `E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch` (locked server)
- D `bun run test:e2e` (default, past date: unlock + full regression)
- I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid` (no lock)
Plus `bunx tsc --noEmit`, `bun run lint`, `bun run build`, and P in both dev and `E2E_PROD=1`. Visual vs Figma @1440 (frame) and @768/@375 (derived). The proxy is safety-critical, so D runs in full; no scoping.
Rollback: revert the phase commits. Phase 3 alone holds the lock, so reverting it re-opens the site; `/prelaunch` then renders harmlessly. Ops kill switch, no deploy needed: set `EVENT_START_AT` to a past instant. Invalid also unlocks (BR-001) but zeroes the homepage countdown. Phase 1 and phase 5 ship together, otherwise D stays red on the new untagged spec.
Done = P, D, I all exit 0 on final code; tsc, lint and build exit 0; visual within tolerance at 3 widths; all 17 TCs and SC-001..SC-008 mapped to a passing test or a recorded reason.

## Risk register

| Risk | L | I | Countermove |
|------|---|---|-------------|
| Lock breaks sign-in (PKCE cookies, callback) | M | H | `/auth/*` bypass stays first; `/login` passes; US003 E2E in P |
| `setTimeout` overflow → redirect loop each second | H | H | ALG-002 chunking; P test: real clock, 2099 start, no `/` request for 3 s |
| Fast client clock → early redirect / loop | M | H | Server `remainingMs` only (DEC-004); P test with clock past start |
| Dev HMR / Next internals redirected | H | M | `/_next/` exempt in ALG-001; P runs on `next dev` |
| Homepage countdown regresses via `size` prop | M | M | Default class strings byte-identical; homepage countdown specs in D |
| cacheComponents prerender error on `/prelaunch` | M | M | Suspense + `connection()` as in `app/(main)/page.tsx`; build gate |
| Future `EVENT_START_AT` at deploy locks the site, incl. health checks on `/` (307) | M | M | Intended behavior; note in changelog / ops handoff |
| Non-image static files (fonts outside `_next`, `.json`) locked before start | L | L | Accepted (clarifications); revisit when such assets appear |

## Unresolved / follow-ups
1. No unit runner exists. ALG-001 boundary `now == start` (BR-005) and the ALG-002 chunk math are proven only by E2E and review. `bun test` would add zero deps. Owner: user. Done: decide to add a unit layer, or accept E2E + review.
2. ~~`<title>` reused the login `meta.title`~~ Closed: `prelaunch.metaTitle` ("SAA 2025" VI/EN) added and used by `app/prelaunch/page.tsx`.
3. Figma has only a desktop frame. Tile sizes at <1024 are derived (homepage sizes, no horizontal scroll at 375). Owner: user. Done: visual accepted at 768/375 or a bounded fix.
4. Screen-spec a11y [EXPECTED] (aria-hidden tiles + sr text) would change the shared `CountdownDisplay` markup. Deferred. Owner: user.
5. Docs: promote spec drafts and `spec/system/*` via doc-writer after merge; add a changelog entry. Flow doc layer gen gate skipped: run `/tkm:rebuild-spec` after merge (as F004).
6. Low, deferred (review): no `pageshow`/`focus` re-check of the redirect after system sleep. Owner: user. Done: fix or accept.
7. Open, outside phases: commit + PR pending user approval (owner: user; done = PR merged to master). Background PNG 3.1 MB uncompressed (owner: user; done = compressed or accepted).
Closed: follow-up 3 (visual accepted at 768/375; 1440 minor deviation accepted in `clarifications.md`).

---
phase: 1
title: "E2E RED: prelaunch screen, lock, redirect"
feature: countdown-prelaunch
status: completed
priority: P1
effort: 3h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E RED (`/prelaunch` + lock)

## Context Links
- `clarifications.md` (authoritative), `momorph/countdown-prelaunch-test-cases.csv` (17 TCs), `momorph/countdown-prelaunch-specs.csv`, `momorph/countdown-prelaunch-frame.png`
- Spec draft: `technical-spec.md` §3.1–3.4, §4.5 ALG-001/ALG-002, §5.1 SC-001..SC-008; `functional-spec.md` §4, §8–10; `screens/SCR-countdown-prelaunch/spec.md`
- Harness: `playwright.config.ts` (`E2E_EVENT_START_AT`, `grepInvert`), `e2e/support/{login-through-stubbed-google,event-clock,homepage-locators,app-alert}.ts`, `e2e/homepage-countdown-*.spec.ts`, `e2e/auth-flow-and-route-guards.spec.ts`
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (valid-RED rules)

## Overview
Write durable Playwright specs for the prelaunch screen, the lock and the redirect. Wire a `@prelaunch` tag. Run the three commands and record a **valid RED**. No app code.

## Key Insights
- One server has one `EVENT_START_AT`. The locked tests are tagged `@prelaunch` and run on their own server: `E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch`. Add `...(customEventEnv ? [] : [/@prelaunch/])` to `grepInvert`, the same pattern as `@event-env-invalid`. Specs read the target from `process.env.E2E_EVENT_START_AT`, so nothing is hard-coded twice.
- 2099 is chosen on purpose. The start is far more than 24.8 days away, so the run exercises the `setTimeout` overflow path (ALG-002) and does not expire.
- The readiness probe (`url: /`) treats any 2xx/3xx as ready and does not follow redirects, so a 307 on `/` is fine.
- `loginThroughStubbedGoogle` resolves once the browser leaves `/login` and `/auth/*`, so in P it lands on `/prelaunch` (callback → `/` → lock). Reuse it as is.
- Browser clock: `page.clock.install` before `goto`. Display tests set the browser time to `target − X` (the server lock still uses the real clock). The client recomputes from the browser clock after hydration, so assert with web-first `expect`.
- Redirect tests have to watch network requests: in P the server stays locked, so `location.replace('/')` bounces back to `/prelaunch`. Watch document requests with `pathname === '/'`. FR-402 is then proved by "a `/` request was issued"; the post-start landing (`/` → `/login`) is proved by run D.
- Fast-forwarding across a 2099 deadline needs a helper that loops `page.clock.fastForward` in ≤ 20-day steps (the timers re-arm per chunk). Put it in `e2e/support/prelaunch-locators-and-clock.ts`, then measure the runtime; if it is slow, record it. Do not pick a start closer than 25 days.
- Invalid TC values (Hours −1/25, Minutes −1/60) cannot come out of `getCountdown`. Cover them with a range sweep over many browser times (each reading has 2+ digits, hours ≤ 23, minutes ≤ 59), and record the reason in the evidence.
- Valid RED = non-zero exit from these assertions (404 `/prelaunch`, no lock). webServer, install and compile failures do not count.

## Requirements
Selector contract (Architecture) plus coverage. Prefix each test title with its TC/FR id.
- `e2e/prelaunch-lock-and-access.spec.ts` (`@prelaunch`). ACCESS TCs 1–4; FR-101..105, FR-601, BR-001, BR-003, DEC-001, US002, US003, SC-001, SC-002:
  - Guest and signed-in users (plus an admin identity for TC ACCESS-3) see `/prelaunch`; it never redirects to `/login`.
  - `/`, `/awards-information`, `/admin`, `/todo`, `/sun-kudos/x`, `/khong-co-trang-nay` go to `/prelaunch`. Check with `request.get(path, { maxRedirects: 0 })` → status 307 and `location` ending `/prelaunch`, for both guest and signed-in.
  - `/login` renders for a guest, and the full stubbed login ends on `/prelaunch`.
  - A signed-in `goto('/login')` ends on `/prelaunch`, which proves the session survived the lock redirect (FR-105).
  - `/auth/callback?error=x` → `/login?error=`, with the fixed alert.
  - `POST /auth/logout` → 303 `/login`.
  - `/images/login/logo.png` → 200, and the background image has `naturalWidth > 0`.
  - TC ACCESS-4: garbage `sb-*` cookies still show `/prelaunch`.
  - FR-601: a browser clock installed after the start still ends on `/prelaunch`.
- `e2e/prelaunch-countdown-display.spec.ts` (`@prelaunch`). GUI TCs 5–11, FUNCTION 12–17; FR-002, FR-201..206, FR-401, DEC-003, US001, SC-003..SC-005, SC-007:
  - h1 reads "Sự kiện sẽ bắt đầu sau"; cookie `NEXT_LOCALE=en` gives "Event starts in", with no raw `prelaunch.` key text.
  - No `banner` / `contentinfo` / language trigger / `countdown-coming-soon`.
  - Labels are DAYS, HOURS, MINUTES with uppercase text and computed color `rgb(255, 255, 255)`. Each unit has exactly 2 digit tiles. The background box covers the viewport @1440.
  - Values via the browser clock: 31d 23h 59m → `31 23 59`; 10d 10h 10m → `10 10 10`; 9d 9h 9m → `09 09 09`; 5h 5m → `00 05 05`; 30 s left → `00 00 00` and the URL stays `/prelaunch` (DEC-003); 120d → 3-digit days.
  - The minute drops after `clock.runFor('01:00')` with no reload.
  - Range sweep: about 30 sampled offsets.
  - Browser clock past the target → `00 00 00`.
  - Hydration guard as in `homepage-countdown-and-event-info.spec.ts`.
- `e2e/prelaunch-redirect-at-event-start.spec.ts` (`@prelaunch`). FR-402, FR-403, DEC-004, ALG-002, US004, SC-006:
  - (a) Real clock: no document request to `/` within 3 s, and the URL stays `/prelaunch` (overflow guard).
  - (b) Fake clock fast-forwarded past `target − serverNow` (≈ `Date.parse(target) − Date.now()` in the test process, + 2 s): exactly one document request to `/`, the page is back on `/prelaunch`, and no second `/` request within 3 s (no tight loop).
  - (c) Browser clock installed at target + 1 h (client ahead): no `/` request within 3 s.
- `e2e/prelaunch-after-event-start.spec.ts` (untagged, run D). FR-104, FR-106, DEC-002, SC-006, SC-008:
  - `request.get('/prelaunch', { maxRedirects: 0 })` → 307 to `/`.
  - Guest `goto('/prelaunch')` ends on `/login`; signed-in ends on `/` with the homepage hero.
  - Guest `/` still goes to `/login` (no lock).
- `e2e/prelaunch-invalid-env.spec.ts` (`@event-env-invalid`). BR-001, FR-104: `/prelaunch` → `/` → `/login` for a guest; `/login` renders with no lock.
- Not tested (record why): server `remainingMs ≤ 0` at render (proxy unlocks first, so the state is unreachable from E2E); BR-005 `now == start` (server clock not controllable; covered by review); system-sleep wake (FR-403, covered by the visibility re-check in review).
Non-functional: each spec <200 lines; shared locators, the hydration guard and the fast-forward helper live only in `e2e/support/prelaunch-locators-and-clock.ts`; safe under `fullyParallel`.

## Architecture
Selector contract (read-only for phases 2, 4, 5):
| Element | Locator |
|---|---|
| screen root | `getByTestId('prelaunch-screen')` (`<main>`) |
| background | `getByTestId('prelaunch-background')`: decorative `img` (`alt=""`), fills the viewport, overlay sibling |
| title | `getByRole('heading', { level: 1 })` |
| units | existing `getByTestId('countdown-{days,hours,minutes}')`; digit tiles = direct child `span`s |
| labels | `getByText(/^DAYS$/)` etc. inside the screen root |
| absent | `getByRole('banner')`, `getByRole('contentinfo')`, `countdown-coming-soon`, `language-selector-trigger` → count 0 |

## Related Code Files
Create: the 5 specs above, `e2e/support/prelaunch-locators-and-clock.ts`.
Modify: `playwright.config.ts` (`grepInvert` line + run-command comment only).

## Implementation Steps
1. Map every TC (17), SC-001..008 and US001..004 to a test title or a recorded skip.
2. Write the helpers file, the 5 specs and the config line. Run `bunx tsc --noEmit`.
3. RED runs: P, D, I (commands in plan.md). Use `E2E_PROD=1` if a `next dev` already holds the directory lock.
4. Save `evidence/e2e-red-{prelaunch,default,invalid}-output.txt`. Write `evidence/red-evidence.json` (`redTestFiles`, `redCommand` = P with D and I listed, `redExitCode` per run, `redFailure` = first 3 excerpts per spec, already-passing tests with the reason) and `reports/tester-red-evidence.md`.

## Todo List
- [x] helpers + 5 specs (<200 lines each): 35 / 170 / 22 / 123 / 58 lines; helper 105
- [x] `grepInvert` adds `@prelaunch`; default run still excludes it (D ran 116 tests, 112 pre-existing all green)
- [x] tsc 0 on specs (`bunx tsc --noEmit`, exit 0); eslint 0 on new files
- [x] RED P, D, I recorded; `evidence/red-evidence.json` written (report returned in tester message, not as a .md file)

## Evidence (RED, recorded 2026-10-13)
- redTestFiles: `e2e/prelaunch-lock-and-access.spec.ts`, `e2e/prelaunch-countdown-display.spec.ts`, `e2e/prelaunch-redirect-at-event-start.spec.ts`, `e2e/prelaunch-after-event-start.spec.ts` (untagged), `e2e/prelaunch-invalid-env.spec.ts`, `e2e/support/prelaunch-locators-and-clock.ts`
- redCommand: `E2E_EVENT_START_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch` (also D `bun run test:e2e`, I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid`)
- redExitCode: P 1 (27 failed / 4 passed of 31) · D 1 (3 failed / 113 passed of 116) · I 1 (2 failed / 2 passed of 4)
- redFailure (first excerpt per kind; full text in `evidence/e2e-red-*-output.txt`):
  - P: `getByTestId('prelaunch-screen')` not found, 5 s timeout, on `/prelaunch` (404)
  - P: guest `GET /` → 307 to `/login`, expected `/prelaunch` (ACCESS step 4)
  - P: full login and signed-in `goto('/login')` end on `http://localhost:3100/`, expected `/prelaunch`
  - D: `GET /prelaunch` → 404, expected 307 to `/` (FR-104); guest stays on `/prelaunch`, expected `/login`
  - I: `GET /prelaunch` → 404, expected 307 to `/`; guest stays on `/prelaunch`, expected `/login`
- Already passing by design (existing guards, must stay green): `/login` renders; `POST /auth/logout` 303; `/auth/callback?error=x` alert; `/images/login/logo.png` 200; guest `/` → `/login` (D)
- Not reached in RED: fast-forward helper and the redirect timing; the helper runtime is unmeasured and must be recorded in GREEN.
- Harness: no webServer, install or compile failure; `next dev` on :3100 started cleanly (no lock file, no port conflict).

## Success Criteria
P, D and I each exit non-zero because of prelaunch assertions. In D, only the new untagged spec fails; every pre-existing test stays green, which proves the config edit is inert. Every TC and SC maps to a test or a recorded reason.

## Scope Contract
- **Changed:** `e2e/prelaunch-*`, `e2e/support/prelaunch-locators-and-clock.ts`, one `grepInvert` entry.
- **Impacted:** test selection in every run (config is safety-critical).
- **Will verify:** full D (proves no existing test was excluded or broken), plus P and I.
- **Deliberately skipped:** app tsc/lint/build beyond spec compilation (no app code).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Chunked fast-forward to 2099 too slow / timer semantics differ | M | M | 20-day steps, loop until the request is seen with a hard cap; record the timing; never shorten the start below 25 days |
| Flaky "no request within 3 s" | L | M | Listen from before `goto`; the assertion is absence over a fixed window, with no polling race |
| Clock-dependent values off by one minute | M | L | Pin the browser time mid-minute (+30 s), as the homepage spec does |
| `grepInvert` edit hides tests | L | H | Compare the D test count with the pre-change baseline |

## Security Considerations
The lock is access control: the guest, signed-in, admin and tampered-cookie paths are all covered. The mock stays in `e2e/`.

## Rollback
Revert the phase commit together with phase 5 if already merged (else D is red on the untagged spec).

## Next Steps
Hand `evidence/red-evidence.json` (read-only) to phases 2–5.

## MoMorph refs:
- Countdown - Prelaunch page: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/261013-1638-countdown-prelaunch-page/clarifications.md
- testPolicy: e2e-red-first

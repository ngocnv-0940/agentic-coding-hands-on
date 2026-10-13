---
phase: 1
title: "E2E RED: homepage + F001 landing update"
feature: F003
status: completed
priority: P1
effort: 4h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E RED (homepage + F001 landing `/`)

## Context Links
- `clarifications.md` (authoritative; supersedes TC ID-0, ID-14 copy, ID-28 badge, ID-54 widget menu)
- `momorph/homepage-test-cases.csv` (62 TCs), `momorph/homepage-specs.csv`
- `spec/homepage/functional-spec.md` §4, §10; `technical-spec.md` §5.1 SC-001..SC-011
- Existing harness: `playwright.config.ts`, `e2e/support/{mock-supabase-server,login-through-stubbed-google,start-mock-supabase,app-alert}.ts`, `e2e/*.spec.ts`
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (valid-RED rules)

## Overview
Write durable screen-level Playwright specs for `/` + placeholders, update F001 specs from `/todo` landing to `/`, extend the mock for an admin user and `EVENT_START_AT` control. Run, record a **valid RED**. No app code.

## Key Insights
- One app server per run → one `EVENT_START_AT`. Default run pins `2025-12-26T18:30:00+07:00` (Figma date → `26/12/2025`); browser time driven by `page.clock`. Server time (2026) is past the event → SSR snapshot is `00`/hidden; the client hook recomputes from the faked clock after mount, so assertions must be web-first (auto-retry), never read once.
- Invalid env needs its own server: second run with `E2E_EVENT_START_AT=not-a-date`, tag `@event-env-invalid`. Config must NOT reuse an existing server when `E2E_EVENT_START_AT` is set (wrong env silently reused).
- Admin: mock issues an admin session for auth code `stub-code-admin`; `/auth/v1/user` maps token → user (Map, not Set). Real click flow kept (no forged cookies).
- Playwright `webServer.url` stays `/` (guest → 307 → readiness OK).
- Next 16 locks one `next dev` per dir: if :3000 dev server runs, use `E2E_PROD=1` (precedent D4 of login plan).
- Valid RED: non-zero exit from homepage/landing assertions. Already-passing tests (e.g. guest `/` → `/login`) are fine — list them.

## Requirements
Coverage (spec id → spec file):
- Access/landing (`homepage-access-and-landing.spec.ts`): FR-101..105, FR-601, FR-603, BR-005, DEC-003, DEC-004, US001, US002, SC-001..003, SC-011; TC ID-1, ID-5, ID-6. Guest `/`, each placeholder + nested (`/sun-kudos/x`) → `/login`; login lands `/`; signed-in `/login` → `/`; `/todo` reachable + still guarded; callback with `next=https://evil.example` still lands `/`; non-admin `/admin` → `/`; admin `/admin` shows Coming soon; placeholders show header+footer+Coming soon, active nav = route (`aria-current="page"` on Awards for `/awards-information`, none for `/standards`).
- Header & menus (`homepage-header-and-menus.spec.ts`): FR-201, FR-202, FR-401..405, FR-602, BR-004, DEC-002, US006..US009, SC-005..SC-008, SC-010; TC ID-2..4, 8..11, 18..38, 58. Sticky after scroll; About active; nav/logo click on `/` scrolls to top (`scrollY` → 0); bell → empty panel text, no badge element; account menu: user = Profile + Sign out, admin = + Admin Dashboard; Sign out → `/login`, then `/` → `/login`; Enter/Space open, Escape closes + focus returns to trigger, outside click closes, opening one closes the other; VN default; EN switches homepage strings and survives reload; only VN/EN options.
- Countdown & event (`homepage-countdown-and-event-info.spec.ts`): FR-001, FR-203..205, BR-001, BR-002, DEC-001, DEC-005, ALG-001, US003, SC-004; TC ID-12, 13, 39..43, 56, 57. Clock `2025-12-24T13:21:00+07:00` → `02 05 09` + Coming soon; `runFor('01:00')` → `08`; clock ≥ event → `00 00 00`, Coming soon hidden; date `26/12/2025`, venue, livestream note.
- Invalid env (`homepage-countdown-invalid-env.spec.ts`, `@event-env-invalid`): TC ID-60, BR-002, DEC-005: `00 00 00`, Coming soon hidden, date `—`, rest of page renders.
- Content & links (`homepage-content-and-links.spec.ts`): FR-002, FR-206..212, BR-006, US004, US005, SC-009; TC ID-7, 15..17, 44..53, 55, 59, 62. CTAs; 6 cards `href=/awards-information#<slug>` (BR-006 slugs) and image/title/Chi tiết all navigate to it; 3 cols @1280, 2 cols @768 and @375 (compare card `boundingBox().x` distinct count); description clamped (computed `-webkit-line-clamp: 2` or height ≤ 2 line-heights); hover changes `transform`; Kudos Chi tiết → `/sun-kudos`; widget fixed bottom-right after scroll; footer 4 links + copyright; ID-59 crawl: every internal `a[href]` on `/` returns < 400 for a signed-in context; no horizontal scroll @375.
- Not tested (record why): ID-28 (no notification data), ID-54 (widget menu deferred), ID-52 real section scroll (placeholder has no sections → assert hash only), ID-23/46 hover colors beyond "style changes" (visual phase).
Non-functional: each spec < 200 lines; no `waitForTimeout`; web-first assertions; `fullyParallel` safe.

## Architecture
Selector contract (read-only for phases 2, 5, 6):
| Element | Locator |
|---|---|
| header / footer / main | `getByRole('banner')` / `getByRole('contentinfo')` / `getByRole('main')` |
| logo (header, footer) | `getByRole('link', { name: /Sun\* Annual Awards 2025/i })` inside banner / contentinfo |
| nav items | `banner.getByRole('navigation').getByRole('link', { name })`; active has `aria-current="page"` |
| bell / panel | `getByTestId('notifications-trigger')` (`aria-expanded`) / `getByTestId('notifications-panel')`; badge would be `getByTestId('notifications-badge')` (must have count 0) |
| account / menu | `getByTestId('account-trigger')` / `getByTestId('account-menu')`; items `account-menu-profile`, `account-menu-signout` (button), `account-menu-admin` |
| language | existing `language-selector-trigger`, `language-option-vi|en` |
| hero / coming soon | `getByTestId('homepage-hero')` / `getByTestId('countdown-coming-soon')` |
| countdown | `getByTestId('countdown-days|hours|minutes')` (text `\d\d`), labels DAYS/HOURS/MINUTES visible |
| event info | `getByTestId('event-date')`, `getByTestId('event-venue')`, `getByTestId('event-livestream')` |
| CTAs | `getByRole('link', { name: /ABOUT AWARDS/ })`, `/ABOUT KUDOS/` |
| Root Further | `getByTestId('root-further-content')` |
| awards | `getByTestId('awards-grid')`, card link `getByTestId('award-card-<slug>')` (whole card = one `<a>`), description `award-card-description` |
| kudos | `getByTestId('kudos-promo')` + link `/Chi tiết|Details/` |
| widget | `getByTestId('widget-button')` |
| placeholder | `getByTestId('coming-soon')` |

E2E env control (playwright.config.ts):
```ts
const EVENT_START_AT = process.env.E2E_EVENT_START_AT ?? '2025-12-26T18:30:00+07:00'
const customEventEnv = process.env.E2E_EVENT_START_AT !== undefined
grepInvert: tags not enabled: @smoke unless E2E_SMOKE; @event-env-invalid unless customEventEnv
app webServer: env { ..., EVENT_START_AT }, reuseExistingServer: !CI && !customEventEnv
```
Mock: `USERS = { 'stub-code': USER, 'stub-code-admin': ADMIN_USER }` (`ADMIN_USER.app_metadata.role = 'admin'`, email `e2e-admin@example.com`); `tokenOwner: Map<accessToken, user>`, refresh keeps owner. Helper: `loginThroughStubbedGoogle(page, { as?: 'user' | 'admin' })` → lands `/`.

## Related Code Files
Create: `e2e/homepage-access-and-landing.spec.ts`, `e2e/homepage-header-and-menus.spec.ts`, `e2e/homepage-countdown-and-event-info.spec.ts`, `e2e/homepage-countdown-invalid-env.spec.ts`, `e2e/homepage-content-and-links.spec.ts`, `e2e/support/homepage-locators.ts` (shared locators only if ≥2 specs use them).
Modify: `playwright.config.ts`, `e2e/support/mock-supabase-server.ts`, `e2e/support/login-through-stubbed-google.ts`, `e2e/auth-flow-and-route-guards.spec.ts` (landing `/todo` → `/`; "root redirects to /login" stays for guests; logout/Back tests navigate to `/todo` explicitly), `e2e/login-screen-layout-and-button.spec.ts:121`, `e2e/language-selector-localization.spec.ts:123-130`.

## Implementation Steps
1. Mock: admin user + token→user map + stub code. Keep 404 logging.
2. Helper: `as` option, await `/` (`/\/$/` on URL path).
3. Config per Architecture.
4. Update F001 specs (assert new landing; keep every existing guarantee: inline error, XSS, tampered cookie, Back-after-logout).
5. Write 5 new specs per Requirements; tag invalid-env describe `@event-env-invalid`.
6. `bunx tsc --noEmit` (specs compile) → run RED:
   - `bun run test:e2e` (or `E2E_PROD=1 bun run test:e2e`)
   - `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid`
7. Save full outputs `evidence/e2e-red-output.txt`, `evidence/e2e-red-invalid-env-output.txt`; write `reports/tester-red-evidence.md` with `redTestFiles`, `redCommand` (both), `redExitCode` (each), `redFailure` (first 3 failure excerpts per spec), list of tests already passing and why.

## Todo List
- [x] Mock admin + token map
- [x] Helper `as` + landing `/`
- [x] Config env + grep tags + reuse guard
- [x] Update 3 F001/F002 specs
- [x] 5 homepage specs (6 written, see drift)
- [ ] RED run x2, evidence saved (excerpts kept this time) — evidence saved; `reports/tester-red-evidence.md` NOT written (open, tester)

## Success Criteria
Both commands exit non-zero because of homepage/landing assertions (not webServer/browser/install errors); evidence files exist; tsc 0 on specs.
Result: met. RED 1 exit 1, 48 failed / 32 passed (`evidence/temper-run-red.json`); RED 2 exit 1, 2 failed (`evidence/e2e-red-invalid-env-output.txt`).

## Scope Drift (sync-back)
- 6 homepage specs, not 5: dropdown menus split into `homepage-account-and-dropdown-menus.spec.ts`; shared `e2e/support/event-clock.ts`, `homepage-locators.ts`. Reason: <200-line rule, shared locators. Cost: one more file, no coverage lost.

## Scope Contract
- **Changed:** `e2e/**`, `playwright.config.ts`.
- **Impacted:** all F001/F002 E2E (shared helper + mock + config).
- **Will verify:** full E2E suite (both runs) — the harness itself changed, so whole suite is in scope.
- **Deliberately skipped:** app build/lint (no app code touched).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Reused dev server with wrong `EVENT_START_AT` | M | H | `reuseExistingServer` false when env overridden; doc in report |
| `page.clock` vs Next client runtime timers | L | M | install clock before `goto`; only `runFor` minutes |
| Flaky scroll/sticky asserts | M | L | `toBeInViewport`, computed `position`, poll `scrollY` |
| Selector contract drift vs Figma structure | M | M | contract uses roles + testids only; Track A must honor |

## Security Considerations
Covers safety-critical guards: guest on 7 protected roots, admin gate, callback ignores `next`, sign out invalidates session. Mock stays in `e2e/` only.

## Rollback
Revert phase commit; F001 specs return to `/todo` expectations.

## Next Steps
Hand `reports/tester-red-evidence.md` (read-only) to phases 2–6.

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first

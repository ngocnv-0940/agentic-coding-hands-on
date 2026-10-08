---
phase: 1
title: "E2E harness and RED tests"
feature: F001,F002
status: completed-with-gaps
priority: P1
effort: 3h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E harness + RED tests

## Context Links
- `clarifications.md` (authoritative), `momorph/login-test-cases.csv` (17 TCs), `momorph/login-specs.csv`
- `reports/researcher-playwright-e2e-oauth-stubbing.md` (config, mock endpoints, selectors)
- `spec/auth/technical-spec.md` §5.1 SC-001..SC-007, `spec/localization/technical-spec.md` §5.1 SC-001..SC-006
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (strict RED rules)

## Overview
Install `@playwright/test` (user-approved), stand up a mock Supabase HTTP server + app under test on dedicated ports, write screen-level E2E specs from the TCs + clarifications, run them, record a **valid RED** (non-zero exit caused by screen assertions, not infra). No app code.

## Key Insights
- Playwright `webServer.url` readiness rejects 404 → poll the app at `/` (Create Next App page today; a 3xx later), never `/login`.
- PKCE start is a browser navigation to `${SUPABASE_URL}/auth/v1/authorize` → intercept with `page.route` and 302 to `/auth/callback?code=stub-code` (or `?error=access_denied`). The real click sets the genuine PKCE verifier cookie — no forged verifier.
- Authenticated state: **log in through the real flow** (click → stubbed authorize → callback → mock token exchange) instead of hand-forging `sb-localhost-auth-token`; removes the unverified cookie-name/chunking assumptions. Tampered-cookie test: read the cookie names after a real login, then overwrite values with garbage.
- `getUser()` (not `getClaims`) is the session check → mock needs no JWKS. Mock still issues a JWT-shaped (unsigned) `access_token` so supabase-js never chokes on decoding.
- Next 16 locks one `next dev` per directory: if a dev server already runs on :3000, stop it or run with `E2E_PROD=1` (build + start).
- F001:FR-403 (initiation failure) not testable deterministically — do not write a fake-passing test for it.

## Requirements
Functional coverage (spec ids → test):
- F001: FR-101, FR-102, FR-103, FR-104, FR-201, FR-202, FR-203, FR-204, FR-205, FR-301, FR-401, FR-402, FR-404, FR-601; BR-001, BR-002, DEC-001..003; US001–US006.
- F002: FR-002, FR-201, FR-202, FR-203, FR-401..405, FR-601; BR-001, DEC-001, DEC-002; US001, US002.
- TC map: 45278c06, f62b0c97 (access); b9805e65, 8415b629, 33a1dacf, 5fbe2a18, 42b82364, 6ae76d15 (layout); 5f1cbabd, 98e20775, 20d87e28, 4426635b, cb42461d (language); c18649fa, 37eae882 (button); e76aa170 (success). **60bc5bbb superseded** → assert same-tab (no `popup` event, page URL leaves to authorize).
Non-functional: specs <200 lines each; no `waitForTimeout`; web-first assertions; tests independent (`fullyParallel`).

## Architecture
```
playwright ──webServer[0]──> bun e2e/support/mock-supabase-server.ts  (:54399)
           ──webServer[1]──> next dev -p 3100  (env: NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399,
                                                 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=e2e-publishable-key)
browser ─> localhost:3100 (app, real proxy/@supabase/ssr/cookies)
browser ─> localhost:54399/auth/v1/authorize  ← intercepted by page.route (302 back to app)
app (Node) ─> localhost:54399/auth/v1/{token,user,logout}  ← mock
```
Mock endpoints (`node:http`, ~80 lines):
- `GET /health` → 200
- `POST /auth/v1/token?grant_type=pkce` → 200 session iff body `auth_code === 'stub-code'`; else 400 `{error:'invalid_grant'}`
- `POST /auth/v1/token?grant_type=refresh_token` → 200 fresh session (same user)
- `GET /auth/v1/user` → 200 user iff `Authorization: Bearer <token issued by mock>`; else 401 (`{code:401,msg:'invalid JWT'}`)
- `POST /auth/v1/logout` → 204; records revocation so later `/user` with that token → 401
- Session: `{access_token:<unsigned JWT sub=e2e-user exp=+1h>, refresh_token, token_type:'bearer', expires_in:3600, expires_at, user:{id:'e2e-user', email:'e2e@example.com', aud:'authenticated', role:'authenticated'}}`
- CORS not needed (server-to-server only). Log unknown routes with 404 to surface contract drift.

Selector contract (handed read-only to phases 02/07):
| Element | Locator |
|---|---|
| header / footer | `getByRole('banner')` / `getByRole('contentinfo')` |
| logo | `getByRole('img', { name: /Sun\* Annual Awards 2025/i })` |
| hero visual | `getByTestId('login-hero')` |
| login button | `getByRole('button', { name: /login with google/i })` |
| loader | `getByRole('status')` inside button |
| error | `getByRole('alert')` text = dict `login.error` |
| language trigger | `getByTestId('language-selector-trigger')` (`aria-expanded`, text VN/EN) |
| language options | `getByTestId('language-option-vi')`, `getByTestId('language-option-en')` |
| todo email / logout | `getByTestId('todo-email')` / `getByRole('button', { name: /đăng xuất|logout/i })` |

## Related Code Files
Create: `playwright.config.ts`, `e2e/support/mock-supabase-server.ts`, `e2e/support/login-through-stubbed-google.ts` (helper: stub authorize + click + await `/todo`), `e2e/login-screen-layout-and-button.spec.ts`, `e2e/auth-flow-and-route-guards.spec.ts`, `e2e/language-selector-localization.spec.ts`.
Modify: `package.json` (devDep `@playwright/test@^1.64`, script `"test:e2e": "playwright test"`), `bun.lock`, `.gitignore` (`test-results/`, `playwright-report/`, `!.env.example`).

## Implementation Steps
1. `bun add -d @playwright/test`; `bunx playwright install chromium` (WSL: `--with-deps` if libs missing — infra, not RED).
2. `playwright.config.ts`: `testDir: './e2e'`, chromium only, `baseURL http://localhost:3100`, `webServer` = [mock (url `/health`), app (url `http://localhost:3100/`, timeout 180s, env above; command `process.env.E2E_PROD ? 'bun run build && bun run start -p 3100' : 'bun run dev -p 3100'`)], `reuseExistingServer: !process.env.CI`, `grepInvert: /@smoke/` unless `E2E_SMOKE=1`.
3. Mock server per Architecture. Pure `node:http`, no deps.
4. Helper `loginThroughStubbedGoogle(page)`: `page.route('**/auth/v1/authorize**', 302 → /auth/callback?code=stub-code)`, goto `/login`, click button, `waitForURL('**/todo')`.
5. `login-screen-layout-and-button.spec.ts`: layout TCs; header/footer fixed after scroll at 1280×400 (`toBeInViewport` + `position` fixed|sticky); logo/footer/intro not interactive (no `a`/`button` role, `cursor` not pointer); hover shadow (`box-shadow` ≠ `none`); click → disabled + `status` visible while authorize route is held; authorize params `provider=google`, `redirect_to` contains `/auth/callback`, `code_challenge`, `code_challenge_method=s256`; no `popup`; `/login?error=x` shows exactly one alert; `/login` none; `/login?error=<img src=x onerror=...>` renders fixed message only, no `<img>` injected; 375px width: no horizontal scroll, logo left / selector right.
6. `auth-flow-and-route-guards.spec.ts`: unauth `/todo`, `/todo/x`, `/todo?a=1` → `/login`; success → `/todo` shows `e2e@example.com`; cancel (`?error=access_denied`) → `/login?error=…` + alert; bad code → same; missing code → same; authed `/login` and `/login?error=x` → `/todo`; logout → `/login`, then `/todo` → `/login`; tampered `sb-*` cookie → `/todo` redirects to `/login`.
7. `language-selector-localization.spec.ts`: default VN + `html[lang=vi]`; flag left of code + chevron; click opens (aria-expanded=true, options visible); hover pointer; close via re-click, Escape, outside click; pick EN → cookie `NEXT_LOCALE=en` (path `/`, sameSite Lax, expires ≈1y), title/subtitle/tagline/footer/error in EN, `html[lang=en]`, persists after reload; pick current → no cookie write, no change; cookie `xx` → VN; `/todo` labels follow locale. Assert EN strings by **key presence via vi≠en** (e.g. subtitle text no longer equals the vi string) so copy edits do not break tests; vi strings asserted literally from the design.
8. Run `bun run test:e2e`. Confirm failures are assertion failures on screen elements (e.g. button not found on `/login` 404), webServers came up. Record `redTestFiles`, `redCommand`, `redExitCode`, `redFailure` (first 3 failure titles) in `reports/tester-red-evidence.md`.

## Todo
- [x] Playwright installed, browsers present (`@playwright/test` ^1.64.0 in package.json; chromium runs)
- [x] Config + mock server up (`/health` 200) (`evidence/e2e-green-v3-rerun-output.txt`)
- [x] 3 spec files written, each <200 lines (non-blank lines: 127 / 113 / 117)
- [ ] RED recorded with exit code + failure excerpts — OPEN: exit 1 and 33 failed recorded in `evidence/temper-run-red.json`; failure excerpts and `reports/tester-red-evidence.md` not kept (plan follow-up, Unresolved #1)

## Delivery Status (reconciled 2026-10-08)
- Done: `playwright.config.ts`, `e2e/support/mock-supabase-server.ts`, `e2e/support/login-through-stubbed-google.ts`, 3 spec files, `.gitignore` (`!.env.example`).
- Deviation: RED evidence stored as JSON, not `reports/tester-red-evidence.md`. RED run used `E2E_PROD=1` because a user dev server held :3000.
- Extra files: `e2e/support/app-alert.ts`, `e2e/support/start-mock-supabase.ts` (see plan Deviations D6).
- Gap: failure excerpts absent; no test in the final suite has been reverted to re-check RED.

## Success Criteria
- `bun run test:e2e` exits non-zero; ≥1 failure per spec file is a locator/URL assertion on app behavior; zero failures from webServer startup, browser launch, or TS errors in `e2e/`.
- `bunx tsc --noEmit` passes for `e2e/` and config.

## Risk Assessment
| Risk | L | I | Mitigation |
|---|---|---|---|
| Chromium deps missing on WSL | M | M | `--with-deps`; infra failure ≠ RED, fix before recording |
| supabase-js PKCE token request shape differs (form vs JSON body) | M | M | mock parses both `application/json` and form bodies; log body on 400 |
| Dev-server lock vs. a running `next dev` | M | L | `E2E_PROD=1` path; document in config comment |
| Tests over-fit vi copy | L | M | literal vi from design; EN asserted by difference |

## Security Considerations
Mock and fake tokens live only in `e2e/`. No real keys in config; `e2e-publishable-key` is a dummy. `.gitignore` keeps `.env*` ignored except `.env.example`.

## Next Steps
Hand `redTestFiles`/`redCommand`/`redExitCode`/`redFailure` + selector contract read-only to phases 02–07.

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first

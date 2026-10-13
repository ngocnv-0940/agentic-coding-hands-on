# Scope Contract: Login + Supabase Google OAuth + VN/EN

Work context: /home/nguyenvanngocb/work/agentic-coding-hands-on
Policy: e2e-red-first. GREEN must use the exact RED command: `E2E_PROD=1 bun run test:e2e`.

## Changed
- Auth/session (safety-critical): `proxy.ts`, `lib/supabase/{config,client,server,proxy}.ts`, `lib/auth/sign-in-with-google.ts`, `app/auth/callback/route.ts`, `app/todo/logout-action.ts`.
- UI/i18n: `app/login/**` (page, 2 containers, 8 components), `lib/i18n/**` (incl. `set-locale-action.ts`, cookie `NEXT_LOCALE`), `app/todo/{page,logout-button}.tsx`, `public/images/login/**`.
- Shell/config (safety-critical): `app/layout.tsx` (`lang` from cookie, `generateMetadata`, `instant=false`), `app/page.tsx` (redirect `/login`), `package.json`/`bun.lock`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `supabase/config.toml`, `playwright.config.ts`, `e2e/**`.
- Unchanged but load-bearing: `next.config.ts` (`cacheComponents: true`, `partialPrefetching: true`). This is the main build-break risk, since `cookies()` is now read in the root layout.

## Impacted
- Every route: `proxy.ts` matcher covers all non-static paths and `layout.tsx` is now request-time. Any page can fail the build or the Cache Components check, not only `/login`.
- `/` now redirects to `/login`.
- Module-load throw in `lib/supabase/config.ts`: missing `NEXT_PUBLIC_SUPABASE_*` at build or runtime fails proxy, callback and login together. The `E2E_PROD` build step receives the env through `webServer.env`, so this is covered.
- No other callers exist (greenfield). No pre-existing tests to regress.
- Environment collision: `next build` inside the user's dir while a user `next dev` holds :3000 and the dev lock. Build output goes to `.next`, so check that it does not disturb the user's dev server (see Concerns).

## Will verify (lowest reliable layer)
| # | What | Layer | Why enough |
|---|------|-------|-----------|
| 1 | `bunx tsc --noEmit` | static | Type contracts between the 3 tracks (props, `LayoutProps`/`PageProps` typegen) |
| 2 | `bun run lint` | static | Config changed (`eslint.config.mjs` ignores). Check ignores don't hide `app/`, `lib/`, `proxy.ts` |
| 3 | `E2E_PROD=1 bun run test:e2e` (33 specs) | E2E vs mock Supabase, prod build | Same command as RED. Includes `next build`, so it also proves Cache Components. Layout/guards/PKCE start/cookie/locale are browser behavior, so no lower layer can fail on them. No unit runner exists by plan decision. |
| 4 | Targeted probes P1-P8 below | curl / Playwright MCP | Security gaps the 33 specs do not assert |
| 5 | Visual validation of `/login` vs Figma | Playwright MCP screenshot | MoMorph policy. Not assertable by DOM specs |

Safety-critical groups run IN FULL: auth/session/cookies (`auth-flow-and-route-guards` 12 of 12, plus `login-screen-layout-and-button` PKCE test and `language-selector-localization` cookie/todo tests), config (build + lint + tsc). No test is filtered with `--grep` or trimmed.

## Deliberately skipped
- `@smoke` specs (`grepInvert`): need Docker + `supabase start` + a real Google consent. Safe to skip because the callback/PKCE contract is covered by the mock; hand to the user as the optional smoke checklist (phase-07 step 7). Report as NOT RUN, never as passed.
- `next dev` mode run (default command): blocked by the user's dev server and not the RED command. Prod build is the stricter check.
- No new unit tests: the logic is thin glue over Supabase and the E2E layer fails on every plausible regression. A unit seam would only be test-only (authoring gate fail).
- Cross-browser/mobile-device matrix: only the chromium project is configured; 375px width is already covered by specs.
- `next.config.ts` content: not modified, so nothing to re-verify beyond the build.

## Ordered commands (stop at first failure; record real exit codes)
```bash
cd /home/nguyenvanngocb/work/agentic-coding-hands-on
# 0. Preconditions
ls .env.example; ss -ltn | grep -E ':(3100|54399)\b' || echo "ports free"   # stale server on 3100 would be reused (reuseExistingServer) and hide a broken build
# 1. Static
bunx tsc --noEmit                      # exit 0
bun run lint                           # exit 0
# 2. GREEN: identical to RED
E2E_PROD=1 bun run test:e2e            # exit 0, 33 passed, 0 failed, 0 skipped
# 3. Standalone build is already proven by step 2 (it runs `bun run build`); do not run it again unless step 2 is cut short.
```
Probes (app on :3100 with mock on :54399; reuse the E2E_PROD server, e.g. `E2E_PROD=1 bunx playwright test --list` is not enough, so start both the same way as `playwright.config.ts` and leave them up):

- P1 Open redirect via Host: `curl -si -H 'Host: evil.test' -H 'X-Forwarded-Host: evil.test' 'http://localhost:3100/auth/callback?code=x'` and the same with a bad code. Expect 307, `Location` starting with `/` (relative), no `evil.test` anywhere, `Cache-Control: private, no-store`.
- P2 `next` ignored: `.../auth/callback?code=<valid mock code>&next=https://evil.test` and `&next=//evil.test`. Success lands on `/todo`, never on `next`.
- P3 Error param not echoed: `/login?error=<script>alert(1)</script>`, `/login?error=a&error=b`, `/login?error=`, plus `/auth/callback?error=access_denied&error_description=SECRET`. DOM and the HTML source contain only the fixed dictionary message and none of the raw text. Callback redirects to exactly `/login?error=auth_failed`. (Empty `error` shows no alert.)
- P4 Callback input bounds: `code` longer than 2048 chars, missing `code`, `error` plus valid `code` (error wins). All return 307 to `/login?error=auth_failed` and never 500.
- P5 Tampered/expired cookies: valid session cookie with a flipped byte; truncated chunk (`.0` present, `.1` missing); a cookie signed by another project ref; mock server stopped (auth unreachable). `/todo` redirects to `/login` (fail closed) with no 500. `/login` with a bad cookie renders the page, no loop. Check that the redirect carries `Cache-Control` from Supabase when cookies are refreshed.
- P6 Logout: POST the server action with no session, with a garbage cookie, and with the mock sign-out returning 500. Always ends on `/login` and no `sb-*-auth-token*` cookie remains afterwards. Back button after logout must not show `/todo` content (guard re-runs).
- P7 FR-403 (OAuth start failure): in Playwright MCP, route `**/auth/v1/authorize**` to abort or return 500 (or stop the mock) and click the button. Expect the button re-enabled, loader gone, the single inline error shown, focus back on the button, no navigation. Then, with `page.goBack()` from a mock Google page (bfcache), button returns to idle (pageshow persisted).
- P8 Route/matcher edges: `/todo/`, `/todo/x?y=1`, `/TODO` (case), `/todo%2F..%2F`, `/auth/anything` (matcher bypass: `/auth/` returns NEXT.next, so check that `/auth/callback/..` or `/auth/x` does not expose a protected page), `/images/login/*.png` served without a redirect while signed out. `/login?error=x` while signed in redirects to `/todo` and drops the query. Locale: `Set-Cookie NEXT_LOCALE` flags (path=/, Max-Age, SameSite=Lax); `NEXT_LOCALE=<garbage/long>` falls back to vi; server action `setLocale('xx')` writes no cookie.
- P9 Secrets: `grep -rn "service_role\|SUPABASE_SECRET" app lib proxy.ts` is empty; no secret in the built client chunks (`.next/static`); `.env.local` ignored by `.gitignore`; `.env.example` holds only placeholders (publishable key only).

## Visual validation (MoMorph)
1. Reference: `mcp momorph get_frame_image` for GzbNeVGJHz (1440 wide).
2. `bunx` is not needed: use Playwright MCP against the running prod app on :3100 (start via the same webServer commands if not up). Clear cookies so locale defaults to VN, no `?error`. Viewport 1440x1024 (match the frame height), full-page screenshot of `/login`.
3. Compare: header (logo left, VN selector right), key visual position and size, title/subtitle/tagline copy and weight, login button (color, Google icon, radius, no shadow at rest), footer, background and gradient overlay. Optional extra: EN state, 375px, error state (these are not in the required Figma reference, so report them as informational).
4. Pass = no material mismatch in layout, copy, colors and typography. Name any diff with pixel/color evidence. Minor sub-pixel antialiasing is not a failure. Save screenshots under `plans/261008-0850-login-page-supabase-google/reports/`.

## Pass criteria
- `tsc` 0, `lint` 0, `E2E_PROD=1 bun run test:e2e` exit 0 with exactly 33 passed, 0 failed, 0 skipped, 0 flaky (no retries), and the build inside it succeeded with no Cache Components error. If it fails, record whether it is UI (phase 02), behavior (phases 03-06) or infra. Never weaken an assertion, never use `--grep` or `.skip` to get green.
- P1-P9 all behave as stated; any 500, open redirect, echoed provider text, or `/todo` content served unauthenticated is a FAIL (security).
- Visual validation reports no material mismatch for the VN initial state at 1440.
- Every item not run (@smoke, real Google) is stated as NOT RUN in the report.

## Gaps in the 33 specs (why the probes exist)
Existing specs cover rejected-code, missing-code, cancel, HTML-in-error, garbage cookie, logout, guard variants. They do not cover: Host/X-Forwarded-Host spoofing, `next` param, over-length `code`, partial/foreign-signed cookie chunks, auth server down in proxy, logout with failing signOut, OAuth start failure (FR-403) timing/focus/bfcache, cache headers on guard redirects, matcher/static-path edge cases, `/auth/*` bypass, secret exposure in the bundle.

---
name: e2e-harness-gotchas
description: Playwright E2E harness facts for the Next 16 + Supabase login project (lock conflicts, CJS spec loading, mock server layout, valid-RED rules)
metadata:
  type: project
---

Playwright E2E lives in `e2e/` with `playwright.config.ts` (chromium only, `bun run test:e2e`).
Mock Supabase is `e2e/support/mock-supabase-server.ts` (side-effect free, :54399); the entry
script is `e2e/support/start-mock-supabase.ts`. App under test runs on :3100.

**Why:** Playwright loads specs as CJS (package.json has no `"type": "module"`), so
`import.meta` in any file a spec imports breaks the run with "Cannot use 'import.meta' outside a module".
**How to apply:** keep spec-imported helpers free of `import.meta`; put server start code in a separate entry file.

**Why:** a user `next dev` already running in this directory (seen on :3000) makes the webServer
`next dev -p 3100` fail with "Another next dev server is already running" — a dev-server failure, not a valid RED.
**How to apply:** run `E2E_PROD=1 bun run test:e2e` (build + start) and report it; never kill the user's dev server.
Note that `next build` rewrites `.next`, which a running dev server shares.

**Why:** a 404 page passes "no horizontal scroll" and fails "page taller than viewport" for the wrong reason.
**How to apply:** every spec starts with a visible-screen precondition (`expect(...).toBeVisible()`) before click/hover/boundingBox,
so RED failures name the screen element and the run does not burn 30s auto-wait timeouts.

**Why:** Next.js mounts its own `<div role="alert" id="__next-route-announcer__">` on every page, so
`getByRole('alert')` matches two nodes (strict-mode failure, or a count of 2 instead of 1).
**How to apply:** use `appAlert(page)` from `e2e/support/app-alert.ts`; for page titles use `getByRole('heading')`.

**Why:** a stub that holds the Google authorize navigation leaves the frame "waiting for navigation to finish",
so locators time out. `button.click()` also waits for the navigation to commit (30s test timeout).
A 204 response does NOT release the frame; an `attachment` download response does (verified with a probe).
**How to apply:** `click({ noWaitAfter: true })` and hold mode = `attachment` download in `stubGoogleAuthorize`.

**Why:** Tailwind v4 `shadow-none` computes to five transparent layers (`rgba(0, 0, 0, 0) 0px 0px 0px 0px` x5),
never the literal `none`. A `toHaveCSS('box-shadow','none')` check fails even though no shadow is visible.
**How to apply:** assert "every layer transparent" (or the hover value) instead of the literal; never loosen silently.

**Why:** `pkill -f <pattern>` matches the tool's own shell command line and kills it (exit 144).
**How to apply:** find PIDs with `ss -ltnp | grep :PORT` and `kill <pid>`; never kill :3000 (user dev server).

**Why:** `next start` logs `Route "/todo": ... Date.now() while prerendering` on every signed-in /todo request
(build itself is clean). Root: Supabase GoTrue `_emitInitialSession` in `UserPanel`. Not a test defect.
**How to apply:** when this appears, report it as an app concern (Cache Components), do not weaken the test.

**Why:** Chromium does not restore `Cache-Control: no-store` pages from bfcache; `/login` is served no-store, so the
`pageshow` persisted branch in `google-login-container.tsx` never runs under Playwright. Back just re-renders idle.
**How to apply:** do not report P7 bfcache as proven on /login; report it as "restore path not exercised".

**Why:** an aborted `**/auth/v1/authorize**` route makes Chrome show a chrome-error page (the authorize URL is a top-level
navigation), so it never tests the FR-403 start failure. The real start failure is `signInWithOAuth` returning an error.
**How to apply:** simulate it with an init script that makes `document.cookie` setter throw (PKCE verifier write).

**Why:** the mock returns 204 on logout, so `signOut` 500 cannot be produced from the browser (server-side fetch ignores
`page.route`). A probe-only proxy in front of the mock (`E2E_SUPABASE_PORT` on another port, toggle file for ok/logout500/down)
produces it without touching specs. Probe scripts and proxy live in the scratchpad, not the repo.
**How to apply:** reuse that pattern for fault injection; the app's `NEXT_PUBLIC_SUPABASE_URL` is inlined at build, so point the proxy at the same port.

**Why:** `pkill -f` killed the tool's own shell again (exit 144) during the v2 run.
**How to apply:** find PIDs with `ss -ltnp | grep :PORT`, then `kill <pid>`. Never `pkill -f` in this repo.

**Why (homepage RED, 2026-10-08):** the shared login helper first asserted the landing URL `/`. The app
still lands on `/todo`, so 48 homepage specs all died on that one line and their screen assertions never ran.
**How to apply:** the helper waits only for leaving `/login` and `/auth/*`; landing URL assertions live in the
landing specs (F001 "lands on the homepage /", access "callback next ... lands on /"). Each homepage spec then
fails on its own screen element (`homepage-hero` not found), which is the diagnostic the UI agent needs.

**Why:** a custom `E2E_EVENT_START_AT` server must never be reused, or the run silently uses the wrong date.
**How to apply:** playwright.config sets `reuseExistingServer: !CI && !customEventEnv` and passes `EVENT_START_AT`;
`@event-env-invalid` specs are grep-inverted unless `E2E_EVENT_START_AT` is set. Offset-less ISO is NOT covered
(needs a third server run); report it as a gap.

**Why:** `page.clock.install` keeps time flowing naturally, so a minute-precise countdown can drift past a minute on a slow box.
**How to apply:** start at :00 seconds (e.g. 13:21:00) and use `page.clock.runFor('01:00')` for minute steps only.

**Why:** Login helper + F001 regressions (logout, Back, cookies, fresh login) need `/todo` after login; the homepage
landing would have broken them for a reason they do not test.
**How to apply:** after login, specs that test /todo call `page.goto('/todo')` explicitly.

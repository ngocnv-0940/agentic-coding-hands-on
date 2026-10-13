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

**Why:** the Bash tool runs zsh, so `${PIPESTATUS[0]}` after a pipe is empty and a piped exit code reads blank.
**How to apply:** run the command without a pipe, redirect to a file, then `echo "exit=$?"` on the next statement.

**Why (awards RED, 2026-10-13):** 27 specs with 4 workers took 5.6 min because each missing-screen assertion waits the
5 s expect timeout. Login-only tests (guest redirect, unknown-route 404) already pass before the screen exists.
**How to apply:** expect a slow RED on a not-yet-built screen; do not count a pre-passing guard test as proof of the screen.

**Why (awards visual, 2026-10-13):** the Playwright MCP browser fails on init with `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome` on this box. The e2e suite still works because it uses the bundled chromium-1248.
**How to apply:** for visual captures, drive the bundled Chromium from a scratchpad script that requires `node_modules/@playwright/test`. Stub login = `page.route('**/auth/v1/authorize**')` returning a 302 to the callback with `code=stub-code`.

**Why:** `playwright test` list reporter buffers stdout until the run ends, so a background full-suite run shows an empty output file for ~7 minutes.
**How to apply:** do not read progress from the output file. Wait on the completion marker and read the file after exit.

**Why (awards fix-round regression, 2026-10-13):** the awards hero pushes the category menu below the fold at scrollY 0.
Playwright's `click()` scrolls an off-screen target into view first, so a scroll baseline or a scrollend probe taken before
the click counted that scroll (679px jump, early scrollend).
**How to apply:** `scrollIntoViewIfNeeded()` + settle before recording any baseline or installing scroll probes.

**Why (awards fix-round, 2026-10-13):** run 1 failed all 10 specs at login (`/login?error=auth_failed`) because Playwright printed
`EADDRINUSE 54399` for the mock Supabase and then reused whatever answered `/health` (a stale process). A rerun a minute later
passed 10/10.
**How to apply:** when every spec dies at login, check `ss -ltnp | grep 54399` first; it is an environment failure, not a test RED.

**Why:** a full-page screenshot taken without scrolling leaves `next/image` lazy images at naturalWidth 0 (the last cards looked missing).
**How to apply:** scroll the page in steps and wait for `img.complete && naturalWidth > 0` before a full-page capture.

**Why (PageUp precondition race, awards nav, 2026-10-13):** `locator.click()` resolves once the click is dispatched, but a
`scrollIntoView({behavior:'smooth'})` only moves the page on a later frame. A same-tick `page.evaluate` read of `scrollY`
can still see the pre-click offset (failed 1 of 3 dev repeats, read 679 = pre-click value).
**How to apply:** when a test needs a smooth scroll "in flight", wait with a bounded `expect.poll` until `scrollY` moved
by N px or a `scrollend` fired, then assert the in-flight state. Never weaken the precondition assertions themselves.

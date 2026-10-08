# /todo defects: stale Back DOM (A) and Date.now prerender error (B)

## A. Back after logout keeps previous user's data
Evidence (prod build, mock Supabase, Playwright):
- Before fix, after logout then Back: URL briefly /todo then /login; `[data-testid=todo-email]` count = 1 (inDOM), computed `MAIN display:none`. Not visible to the eye in my runs, but PII stays in DOM until hard reload.
- Docs `02-guides/preserving-ui-state.md`: with cacheComponents, Next keeps up to 3 left routes in the DOM hidden via `<Activity>` and re-shows them on Back/forward. This (not bfcache) is the mechanism. Router cache hypothesis: partly right (client-side restore); the proxy does re-run (`GET /todo?_rsc` -> 307 -> /login observed) so the guard works; the leftover is the retained tree.
- Eliminated: bfcache (all /todo, /login responses already `Cache-Control: private, no-cache, no-store`, which disables bfcache in Chromium). No extra header needed.
- Eliminated: client state toggle (TodoPanel hiding email on submit): email DOM node came back (state reset when segment re-created) -> reverted.
Fix: `app/todo/logout-action.ts` `redirect('/login', RedirectType.replace)` so the signed-in /todo history entry is replaced; Back goes to the prior /login entry, /todo is never restored.
Result: Back -> /login, todo-email count 0 (prod). New test `browser Back after logout never shows the previous user data` (e2e/auth-flow-and-route-guards.spec.ts) fails pre-fix (`toHaveCount(0)` received 1), passes after (dev + prod build).
Residual: right after logout (before Back), the hidden /todo tree is still in the /login page DOM (display:none, probe2: 1 node). Not user-visible; a hard reload clears. Removing it needs router-level control (e.g. layout/`bfcacheId` key or avoiding Activity retention) -> not done, outside allowed files.

## B. `Date.now()` while prerendering on /todo
Evidence: prod server log shows 3 errors `Route "/todo": ... Date.now() ... at __loadSession <- _useSession <- _emitInitialSession` (supabase-js getUser) for the signed-in session; dev log: 0; /login: none (it never calls supabase/server).
Fix: `await connection()` (next/server) at the start of `UserPanel` in `app/todo/page.tsx` (docs `04-functions/connection.md`). Page-level chosen: createClient also serves a Server Action and the /auth/callback route handler where prerender cannot happen, so no change there.
Result: same flow on rebuilt prod: 0 occurrences of `Date.now` in server log.
Root layout: getLocale/cookies produced no errors (`instant=false`); no change.

## Verification
tsc --noEmit: 0; eslint: 0. Targeted e2e (prod build): browser Back, logout returns, garbage cookies, unauthenticated /todo redirects: 4 passed. Full suite not run. Ports 3100/54399 freed; :3000 untouched.

## Recurrence
Add server-log assertion (grep `Date.now`/`prerendering`) to the CI e2e step; new regression test covers Back.
Unresolved: hidden-DOM residual above; whether tester's "visible" stale heading was a transient flash (my runs: never visible).

## Follow-up (controller decision): logout as full-document navigation
Residual removed. Changes: new `app/auth/logout/route.ts` (POST only; GET -> 405 verified; getUser + signOut local; on failure deletes sb-*-auth-token cookies; 303 relative `Location: /login`, `Cache-Control: private, no-store`), `app/todo/page.tsx` plain `<form action="/auth/logout" method="post">`, `logout-button.tsx` disables itself after click (deferred setTimeout, since sync disable cancels submit), `app/todo/logout-action.ts` deleted. Proxy skips `/auth/**`: fine, handler does its own signOut and cookies set via Next cookie store (no proxy refresh needed). Cookies SameSite=Lax (supabase/ssr default) so cross-site POST carries no session.
Test (now asserts todo-email count 0 on /login before Back and after Back): fails on previous code (replace-redirect Server Action): Expected 0, Received 1 (hidden tree on /login); passes after. Prod build: logout returns, garbage cookies, unauthenticated /todo, Back test pass; 0 Date.now logs; tsc/lint 0; ports freed.
Docs mentioning the Server Action (docs/features/F001_Auth/technical-spec.md, docs/system/architecture.md) now stale; doc-writer should update.

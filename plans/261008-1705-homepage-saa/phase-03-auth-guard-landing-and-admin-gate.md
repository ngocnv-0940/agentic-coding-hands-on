---
phase: 3
title: "Auth guard, landing /, protected placeholders, admin gate"
feature: F003
status: completed
priority: P1
effort: 2h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
safety_critical: true
---

# Phase 03 — Auth guard + landing `/` + admin gate (safety-critical)

## Context Links
- `clarifications.md` (D009, D011, landing `/`, proxy-only for placeholders)
- `spec/system/permissions.md` (Access Boundaries), `spec/homepage/technical-spec.md` A1, A2, A7, §4.4 BR-005
- Code: `proxy.ts`, `lib/supabase/proxy.ts`, `app/auth/callback/route.ts`, `app/page.tsx`, `lib/supabase/server.ts`
- Next docs (read first, `cd node_modules/next/dist/docs`): `01-app/01-getting-started/16-proxy.md`, `01-app/03-api-reference/04-functions/redirect.md` (streaming redirect = meta tag → why gate lives in proxy), `connection.md`
- RED: `reports/tester-red-evidence.md`

## Overview
Extend proxy guards to `/` (exact) + 5 placeholder roots, redirect signed-in `/login` → `/`, callback success → `/`, admin gate for `/admin*` in proxy, shared role + current-user helpers, delete `app/page.tsx`.

## Key Insights
- `/` must match **exactly**; prefix match would protect `/login` → loop.
- `app/page.tsx` today `redirect('/login')`; with signed-in `/login` → `/` that is an infinite loop → delete it here. Until phase 6 adds `app/(main)/page.tsx`, signed-in `/` is 404 (accepted intermediate; ship 3+6 together).
- `/admin` role gate in proxy gives a real 307; a `redirect()` from a streamed page only emits a meta tag. Page re-check lands in phase 5 via the helper below.
- `app_metadata` (not `user_metadata`) is server-writable only → trustworthy role source. Role changes apply on next refresh (accepted, RISK-05).
- Keep `getUser()` (fail closed), `/auth/*` bypass, cookie/cache-header carry-over unchanged (F001:BR-003/004).

## Requirements
FR-101, FR-102, FR-103, FR-104, FR-105, FR-601, FR-602 (helper), FR-603, BR-004, BR-005, DEC-003, DEC-004, US001, US002, US007; SC-001, SC-002, SC-003, SC-011. Non-functional: files <200 lines; no new deps.

## Architecture
```
request → proxy → updateSession(request)
  /auth/*                         → next() (unchanged)
  user = getUser() (throws → null)
  !user && isProtected(path)      → 307 /login   (+ refreshed cookies, cache headers)
  user && path === /login         → 307 /
  user && isUnder(path,'/admin') && !isAdminUser(user) → 307 /
  else                            → next()
isProtected(p) = p === '/' || PROTECTED_ROOTS.some(r => p === r || p.startsWith(r + '/'))
PROTECTED_ROOTS = ['/todo','/awards-information','/sun-kudos','/standards','/profile','/admin']
callback: success → Location '/' (relative, `next` never read); failure unchanged
```
`lib/auth/user-role.ts`: `isAdminUser(user: Pick<User,'app_metadata'> | null): boolean` → `user?.app_metadata?.role === 'admin'`.
`lib/auth/get-current-user.ts` (server-only, React `cache()` per request): `getCurrentUser(): Promise<{ email: string | null; isAdmin: boolean } | null>` via `createClient().auth.getUser()`; errors → null. Used by phase-5 `/admin` page and phase-6 layout.

## Related Code Files
Modify: `lib/supabase/proxy.ts`, `app/auth/callback/route.ts` (`SUCCESS_PATH = '/'`, update comments DEC-002 → BR-005), `proxy.ts` (matcher comment only if needed).
Create: `lib/auth/user-role.ts`, `lib/auth/get-current-user.ts`.
Delete: `app/page.tsx`.

## Implementation Steps
1. Read the Next docs listed above.
2. `user-role.ts`, `get-current-user.ts` (`import 'server-only'` if already a dep; else rely on `next/headers` import).
3. Proxy: `isProtectedPath` rewrite, `/login` → `/`, admin branch; reuse `redirectWithCookies`.
4. Callback success path `/`.
5. Delete `app/page.tsx`.
6. `bunx tsc --noEmit`, `bun run lint`; run `bun run test:e2e e2e/auth-flow-and-route-guards.spec.ts e2e/homepage-access-and-landing.spec.ts`.

## Todo List
- [x] user-role + get-current-user helpers (`lib/auth/user-role.ts`, `lib/auth/get-current-user.ts`)
- [x] proxy guards (exact `/`, 6 roots, admin) (`lib/supabase/proxy.ts`)
- [x] callback → `/` (`app/auth/callback/route.ts`)
- [x] delete `app/page.tsx` (shown as deleted in git status)
- [x] tsc/lint/targeted E2E (final gates in phase 6; `evidence/tsc-green-output.txt`, `lint-green-output.txt`)

## Success Criteria
GREEN: all F001 auth-flow tests; access spec guest-redirect, landing URL, non-admin `/admin` → `/`, callback `next` ignored. Still RED (expected until 5/6): placeholder content, homepage content.

## Scope Contract
- **Changed:** proxy guard logic, callback destination, two auth helpers, `app/page.tsx` removed.
- **Impacted:** every route (proxy matcher), F001 login/logout/landing flow, `/todo`.
- **Will verify:** full `auth-flow-and-route-guards.spec.ts` + `homepage-access-and-landing.spec.ts` (E2E is the lowest layer that exercises real proxy + cookies); tsc, lint. Safety-critical → auth groups run in full.
- **Deliberately skipped:** visual/content specs (no UI touched).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Redirect loop `/`↔`/login` | M | H | exact match; delete `app/page.tsx`; E2E asserts final URL |
| Guard regression on `/todo` | L | H | full F001 suite |
| Static assets blocked by `/` guard | L | M | matcher already excludes `_next`, images; `/` exact |
| Admin spoof via `user_metadata` | L | H | read `app_metadata` only |

## Security Considerations
Fail closed on Auth errors; no open redirect (fixed relative paths, `next` ignored); admin gate server-side; no role trust from client.

## Rollback
Revert commit → restores `app/page.tsx` and `/todo` landing. Must be reverted together with phase 6 if 6 already merged (6's `app/(main)/page.tsx` would conflict with restored `app/page.tsx`).

## Next Steps
Phase 5 (`/admin` page re-check uses `getCurrentUser`), phase 6 (layout uses `getCurrentUser`).

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first

---
phase: 3
title: "Proxy prelaunch lock + dictionary key"
feature: countdown-prelaunch
status: completed
priority: P1
effort: 2h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
safety_critical: true
---

# Phase 03 — Proxy lock (ALG-001) + `prelaunch.title`

## Context Links
- `clarifications.md` (lock scope, invalid env → no lock, matcher unchanged)
- Spec: `technical-spec.md` §3.2 A2 (DEC-001 table), §3.4, §4.4 A0, §4.5 ALG-001; `functional-spec.md` FR-001, FR-002, FR-102..106, FR-601, BR-001..005; `spec/system/permissions.md` (Layer 0)
- Code: `proxy.ts` (read-only), `lib/supabase/proxy.ts`, `lib/event/event-start-config.ts` (read-only), `lib/i18n/dictionary-{vi,en}.ts`
- Next docs (read FIRST, `cd node_modules/next/dist/docs`): `01-app/01-getting-started/16-proxy.md`, `01-app/03-api-reference/03-file-conventions/proxy.md` (§Runtime: Node by default; RSC header stripping)
- RED: `evidence/red-evidence.json` (P, D and I runs)

## Overview
Add a pure lock decision and call it in `updateSession` after the session refresh and before the old guards. Add the one VI/EN title key. Page and UI are out of scope.

## Key Insights
- The proxy runs on Node (docs §Runtime), so `process.env.EVENT_START_AT` via `readEventStartFromEnv()` and `Date.now()` are read per request. There is no second source of the start (BR-002).
- The order inside `updateSession` is fixed:
  1. `/auth/*` early return (unchanged, BR-003 F001).
  2. Client + `getUser()` (unchanged; nothing may run between them).
  3. `redirectWithCookies` definition (unchanged).
  4. **The lock (new).**
  5. The old guards (unchanged, FR-106).
- The lock never reads `user`, so an unreachable Auth server does not change the outcome (FR-601).
- Exempt `/_next/*` as well. The matcher only excludes `_next/static` and `_next/image`, so without the exemption the dev HMR socket (`/_next/webpack-hmr`) and other internals would 307 to `/prelaunch`. FR-102 already lists `_next` as exempt.
- `now == start` counts as started (BR-005): use a strict `now < start`.
- Signed-in user on `/login` before the start: the lock passes and the old guard sends them to `/`; the next request is then locked to `/prelaunch`. Two 307s, accepted (spec §3.4).

## Requirements
FR-001, FR-002 (key only), FR-102..106, FR-601, BR-001..005, DEC-001, ALG-001; SC-002, SC-007 (key), SC-008.

## Architecture
```ts
// lib/event/prelaunch-access.ts (pure, no Next/Supabase imports)
export const PRELAUNCH_PATH = '/prelaunch'
export type PrelaunchAccess = 'lock' | 'unlock' | 'pass'
export function decidePrelaunchAccess(pathname: string, nowMs: number, start: Date | null): PrelaunchAccess
//   locked = start !== null && nowMs < start.getTime()
//   locked:   /prelaunch | /login | /auth/* | /_next/*  → 'pass'; else → 'lock' (unknown paths included)
//   unlocked: pathname === /prelaunch → 'unlock'; else → 'pass'

// lib/supabase/proxy.ts, after redirectWithCookies, before `if (!user && isProtectedPath…)`
const access = decidePrelaunchAccess(pathname, Date.now(), readEventStartFromEnv())
if (access === 'lock') return redirectWithCookies(PRELAUNCH_PATH)
if (access === 'unlock') return redirectWithCookies(HOME_PATH)
```
Dictionary: `'prelaunch.title': 'Sự kiện sẽ bắt đầu sau'` in `vi` and `'Event starts in'` in `en`. One key each, added directly; `Dictionary` parity holds at compile time.

## Related Code Files
Create: `lib/event/prelaunch-access.ts`.
Modify: `lib/supabase/proxy.ts` (+ about 5 lines, stays <100), `lib/i18n/dictionary-vi.ts`, `lib/i18n/dictionary-en.ts`.
Not touched: `proxy.ts` (matcher), the guard helpers, `lib/event/event-start-config.ts`.

## Implementation Steps
1. Read the listed Next docs.
2. Write `prelaunch-access.ts` per Architecture, with a JSDoc that cites ALG-001, BR-001, BR-003 and BR-005 and explains the `/_next/` exemption.
3. Wire it into `updateSession` at the fixed position. The existing comments and guards are untouched.
4. Add the dictionary keys.
5. `bunx tsc --noEmit`, `bun run lint`.
6. Smoke: run P scoped to `e2e/prelaunch-lock-and-access.spec.ts` (lock and auth tests turn green; screen assertions stay red until phase 5). Run D scoped to `e2e/auth-flow-and-route-guards.spec.ts`, `e2e/homepage-access-and-landing.spec.ts`, `e2e/prelaunch-after-event-start.spec.ts` (the unlock 307 goes green). The full regression belongs to phase 5.

## Todo List
- [x] `lib/event/prelaunch-access.ts` (pure, <60 lines)
- [x] lock wired in `lib/supabase/proxy.ts` at the fixed position
- [x] `prelaunch.title` vi/en
- [x] tsc 0, lint 0, scoped smokes recorded in `evidence/` (final proof: phase 5 `temper-results.json` 18/18)

## Success Criteria
In P, every lock and access test that does not depend on the screen passes. In D, the existing guard suites stay green and `/prelaunch` returns 307 to `/`. In I, `/prelaunch` returns 307 to `/`. tsc proves vi/en parity.

## Scope Contract
- **Changed:** `lib/supabase/proxy.ts` (every request), new pure module, two dictionary lines.
- **Impacted:** every proxied route, sign-in/out flow, `/admin` gate, locale Server Action on `/login`, dev HMR.
- **Will verify:** scoped smokes here; the **full** D, P and I runs in phase 5. The proxy is auth/route-guard code (safety-critical), so it is never scoped down at sign-off.
- **Deliberately skipped:** visual (no UI).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Lock placed before `getUser()` → cookies not refreshed / race | L | H | Fixed position in Architecture; review checks it |
| Sign-in broken pre-launch | M | H | `/auth/*` returns first; `/login` passes; US003 E2E |
| HMR / internals redirected in dev | H | M | `/_next/` exemption |
| Off-by-one at the start instant | L | M | Strict `<` (BR-005); review |
| `/prelaunch/x` before the start | L | L | Treated as locked → 307 `/prelaunch`; after the start, normal 404 |

## Security Considerations
Server clock and server-only env only; the client cannot influence the decision (FR-601). Redirects are relative and carry the refreshed cookies (BR-004). Invalid config fails open on purpose (BR-001: a broken config must not lock everyone out); the decision is recorded in clarifications. Existing fail-closed auth guards are unchanged.

## Rollback
Revert this phase's commit to re-open the site. Ops kill switch without a deploy: set `EVENT_START_AT` to a past instant.

## Next Steps
Phase 4 (chained Track B); phase 5 runs the full regression.

## MoMorph refs:
- Countdown - Prelaunch page: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/261013-1638-countdown-prelaunch-page/clarifications.md
- testPolicy: e2e-red-first

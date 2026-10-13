---
phase: 4
title: "Redirect home at the real event start"
feature: countdown-prelaunch
status: completed
priority: P1
effort: 1.5h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3]
---

# Phase 04 — Client redirect at the real start (ALG-002)

## Context Links
- Spec: `technical-spec.md` §3.3 A4, §4.5 ALG-002, §3.4; `functional-spec.md` FR-402, FR-403, DEC-003, DEC-004, RISK-01
- Code: `lib/event/use-countdown.ts` (read-only, pattern for timer cleanup), `lib/event/prelaunch-access.ts` (phase 3, read-only)
- Tests: `e2e/prelaunch-redirect-at-event-start.spec.ts` (phase 1)
- Next docs: `01-app/01-getting-started/05-server-and-client-components.md` (hook lives in a client module)

## Overview
A client hook that sends the tab to `/` once the server-measured remaining time has elapsed: never early, never in a tight loop, and correct for starts more than 24.8 days away. Phase 5 wires it in.

## Key Insights
- DEC-004: navigate on the server's `remainingMs`, never on browser `Date.now()` compared with the target. A fast client clock would otherwise loop `/` → 307 `/prelaunch`.
- **setTimeout overflow:** browsers store delays as a signed 32-bit integer, so a delay above `2_147_483_647` ms (~24.8 days) fires immediately. Wait in chunks against a monotonic deadline: `deadline = performance.now() + delay`, re-arm `min(left, MAX_DELAY)`.
- First delay = `remainingMs <= 0 ? 0 : max(remainingMs, 1000)` (ALG-002 clamp). If the proxy is still locked when the timer fires (server clock behind), the fresh `/prelaunch` load carries a new positive `remainingMs`, so each loop costs at least 1 s and is in practice bounded by the real skew.
- FR-403 sleep/wake: timers in background tabs fire late (fine), but `performance.now()` may pause during OS sleep on some platforms. On `visibilitychange` → visible, if wall-clock time since mount ≥ `remainingMs`, call `location.reload()`. The proxy decides, so a wrong client clock causes at most one reload per user-initiated tab switch, never a loop or an early `/`.
- `location.replace('/')` (no history entry; full navigation so the proxy runs). Not `router.replace`: the client router could serve a prefetched or stale RSC payload.
- Clean up the timer and listener on unmount, with a single-fire guard.

## Requirements
FR-402, FR-403, DEC-002 (via proxy), DEC-003 (the redirect does not follow the floored display), DEC-004, ALG-002; SC-006.

## Architecture
```ts
// app/prelaunch/_behavior/use-navigate-home-at-event-start.ts ('use client')
export function useNavigateHomeAtEventStart(remainingMs: number): void
//  effect([remainingMs]):
//    delay = remainingMs <= 0 ? 0 : Math.max(remainingMs, 1000)
//    deadline = performance.now() + delay; mountWall = Date.now()
//    arm(): left = deadline - performance.now(); if left <= 0 → go(); else timeout = setTimeout(arm, Math.min(left, MAX_DELAY))
//    go(): once → window.location.replace('/')
//    onVisible: if Date.now() - mountWall >= remainingMs → window.location.reload()
//    cleanup: clearTimeout + removeEventListener
```
Data in: `remainingMs` (number, server-computed in phase 5 = `Date.parse(targetIso) − Date.now()` after `connection()`, `0` when the target is null). Data out: one navigation.

## Related Code Files
Create: `app/prelaunch/_behavior/use-navigate-home-at-event-start.ts` (<70 lines).
Modify: none.

## Implementation Steps
1. Read the listed doc.
2. Write the hook per Architecture. Comment the overflow, the 1 s clamp and the DEC-004 rationale (non-obvious logic).
3. `bunx tsc --noEmit`, `bun run lint`.
4. No standalone E2E: the hook is unreachable until phase 5 wires it. Phase 5 runs the redirect spec.

## Todo List
- [x] hook written with chunked timer, clamp, visibility re-check, cleanup (review fix r1: delay clamped to max(remainingMs, 1000))
- [x] tsc 0, lint 0

## Success Criteria
After phase 5, `e2e/prelaunch-redirect-at-event-start.spec.ts` (a), (b) and (c) pass in P on dev and prod. Review confirms: no `Date.now()`-vs-target navigation, `MAX_DELAY = 2_147_483_647`, cleanup on unmount.

## Scope Contract
- **Changed:** one new client hook, inert until wired.
- **Impacted:** nothing until phase 5.
- **Will verify:** tsc, lint here; behavior via the P redirect spec in phase 5.
- **Deliberately skipped:** E2E here (not wired).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Overflow → immediate redirect loop | H (without chunking) | H | Chunked re-arm; P test (a) with a 2099 start |
| Fake clock does not drive `performance.now()` → test (b) cannot reach the deadline | L | M | Playwright clock fakes `performance`; if not, tester records it and asserts via request interception instead, never by weakening (a) |
| Reload storm on tab switches with a skewed client clock | L | L | Reload only when the wall-clock elapsed time passes `remainingMs`; user-initiated only |
| Double navigation (StrictMode double effect) | M | L | Cleanup clears the timer; once-guard |

## Security Considerations
Client-side only, so no access decision is made here. The proxy remains the gate (FR-601).

## Rollback
Revert the commit; the page then simply never redirects on its own (a manual reload still unlocks via the proxy).

## Next Steps
Phase 5 wires the hook into `PrelaunchCountdownContainer`.

## MoMorph refs:
- Countdown - Prelaunch page: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/261013-1638-countdown-prelaunch-page/clarifications.md
- testPolicy: e2e-red-first

---
name: project-prelaunch-lock-design-calls
description: Countdown-prelaunch plan (2026-10-13) design calls for any future proxy/time-gated work — /_next exemption, setTimeout overflow chunking, custom-env E2E tags
metadata:
  type: project
---

Prelaunch lock (plans/261013-1638-countdown-prelaunch-page) settled three calls that recur whenever the proxy gates by path or time:
1. The proxy matcher excludes only `_next/static|_next/image`, so any blanket redirect in `lib/supabase/proxy.ts` must exempt `/_next/*` (dev HMR `/_next/webpack-hmr`).
2. Client redirect timers driven by server `remainingMs` must chunk at 2^31-1 ms (setTimeout overflow fires immediately) — otherwise far-off events loop.
3. E2E needing a different `EVENT_START_AT` = tagged group (`@prelaunch`, `@event-env-invalid`) in `playwright.config.ts` grepInvert + its own command; Playwright webServer probe accepts 3xx without following.

**Why:** found while planning; not visible from the spec drafts, which used a plain `setTimeout(remainingMs)`.
**How to apply:** check these before sealing any plan touching the proxy, timers, or env-dependent E2E. See [[project-plan-md-format-conventions]].

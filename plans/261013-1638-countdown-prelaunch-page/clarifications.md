# Clarifications — Countdown Prelaunch page

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU (fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `8PJQswPZmU`, Figma node `2268:35127`, frame "Countdown - Prelaunch page")
Sources: `momorph/countdown-prelaunch-specs.csv` (5 items), `momorph/countdown-prelaunch-test-cases.csv` (17 cases), `momorph/countdown-prelaunch-frame.png`

## Session 2026-10-13

- Q: Before the event starts (now < EVENT_START_AT), which pages are locked? → A: Every page except `/login` (and `/auth/*`, the prelaunch page itself, static assets). The proxy sends any other request to the prelaunch page, so users can still sign in before launch.
- Q: Does the prelaunch page require sign-in? → A: No. It is public; guests and signed-in users both see it.
- Q: What happens when the countdown reaches 00:00:00 while the page is open? → A: Navigate to `/` automatically (the proxy then sends a guest on to `/login`). Opening the prelaunch URL after the event start also goes to `/`.
- Q: Branch? → A: New branch `feat/countdown-prelaunch` from up-to-date `master` (PR #5 merged).

## Derived decisions (from specs/design/existing code, not re-asked)

- Test policy: `e2e-red-first`. The screen has behavior (navigation lock, redirect at zero, live update). `@playwright/test` exists (`bun run test:e2e`).
- Target datetime: reuse the server-only env `EVENT_START_AT` and `lib/event/event-start-config.ts` (strict ISO + offset, Asia/Ho_Chi_Minh). The spec's "TODO: API endpoint" is not built (YAGNI); one source of truth with the homepage countdown.
- Route: `/prelaunch`, a top-level route OUTSIDE the `(main)` group (no site header/footer, no auth layout). Figma frame shows no header/footer.
- Lock mechanism: in `lib/supabase/proxy.ts` after the session refresh, a real redirect (307) to `/prelaunch` carrying refreshed cookies. Cookie refresh + `/auth/*` bypass stay as they are.
- Display: Days / Hours / Minutes only (no seconds in Figma). Reuse `getCountdown` + `useCountdown` (re-render on each minute boundary — the visible value never lags). Days ≥ 100 keep the existing 3-digit behavior. Negative / out-of-range values are impossible from the math; finished → `00 00 00` (TC completion handling).
- LED digit tiles: reuse the homepage tile look only if the Figma node matches; Figma values win (bigger tiles on this frame). Labels DAYS / HOURS / MINUTES uppercase white; title VI "Sự kiện sẽ bắt đầu sau" / EN "Event starts in" in `lib/i18n` dictionaries (VN/EN parity).
- Background: full-viewport image from Figma node `2268:35129`, `cover`, no-repeat, dark overlay; asset downloaded from MoMorph/Figma, never invented.
- Locale: same cookie-based locale as the rest of the app; no language switcher on this page (none in Figma).
- Unknown URLs before launch: redirected to `/prelaunch` like any other locked page (TC ACCESS-1 step 4 "redirects appropriately").

- Q: Missing / invalid `EVENT_START_AT` — lock or not? → A: No lock; treat as already started (matches the homepage rule "invalid → countdown 00"). `/prelaunch` then goes to `/`.

## Session 2026-10-13 (spec gaps — Stage 1.5, auto-picked Recommended per user)

- Q: Share `CountdownDisplay` / `readEventSnapshot` / `home-fonts` from `app/(main)` with `app/prelaunch`? → A: Cross-import from `app/prelaunch` (least churn, F003 untouched).
- Q: LED tile size (Figma tiles bigger than homepage)? → A: Additive size variant prop on `CountdownDisplay`, values measured from node `2268:35139`; homepage default unchanged.
- Q: Page `<title>`? → A: Reuse existing `meta.title`.
- Q: Non-image static assets locked pre-launch (matcher excludes only images)? → A: Keep the matcher; revisit only when such assets appear.
- Derived (spec DEC-003/004, ALG-002): redirect at the real start, not when tiles read 00 (minute floor); server passes `remainingMs`, client `setTimeout(max(remainingMs, 1000))` → no redirect loop from a fast client clock.
- Q: (planner concern) `meta.title` reads "Đăng nhập - SAA 2025" — wrong on /prelaunch. → A (auto-picked): add `prelaunch.metaTitle` VI "SAA 2025" / EN "SAA 2025" (phase 3 dictionary), used by `app/prelaunch/page.tsx` metadata. Supersedes the earlier "reuse meta.title".
- Q: (planner concern) add a unit runner (`bun test`) for BR-005 boundary / timer split? → A (auto-picked): No (YAGNI); E2E + review only.

## Session 2026-10-13 (phase 5 visual, auto-picked Recommended per user)

- Q: 1440 visual vs Figma: title ≈+5%, tiles/labels ≈+6%, block ≈8 px low (background/overlay match). Accept or apply a bounded 0.95 scale fix? → A (auto-picked): Accept as a minor deviation (test project, under 6%, no layout or legibility impact). 768/375 pass. Evidence: `evidence/visual/`.

## Session 2026-10-14 (split launch time from event time)

- Q: MoMorph never says the prelaunch countdown and the homepage countdown share one datetime (homepage: env ISO-8601 "sự kiện bắt đầu diễn ra"; prelaunch: "target datetime lấy từ API", "khi về 0 mở khóa điều hướng"). Sharing `EVENT_START_AT` made the homepage countdown always read 00 (the homepage is only reachable after the lock lifts). Split? → A (user): Split. New server-only env `SITE_LAUNCH_AT` (same strict ISO-8601 + offset rules) drives the proxy lock and the `/prelaunch` countdown/redirect; `EVENT_START_AT` drives only the homepage countdown, date and "Coming soon". Missing/invalid `SITE_LAUNCH_AT` → no lock, `/prelaunch` → `/` (same fail-open rule as before). Supersedes "Reuse `EVENT_START_AT`" in Derived decisions. Still no API (YAGNI).

# Clarifications — Homepage SAA (/)

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM (fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `i87tDx10uM`)
Sources: `momorph/homepage-specs.csv` (46 items), `momorph/homepage-test-cases.csv` (62 cases)

## Session 2026-10-08

- Q: Who can access `/`? → A: Login required. Guests hitting `/` are redirected to `/login`; post-login landing (callback + authenticated `/login`) becomes `/` instead of `/todo`. `/todo` stays as-is (still protected). TC ID-0 ("unauthenticated user sees homepage") is superseded.
- Q: Destination pages that don't exist yet (Awards Information, Sun* Kudos, Tiêu chuẩn chung)? → A: Placeholder routes: `/awards-information` (award cards use `#<slug>`), `/sun-kudos`, `/standards`, each a minimal "Coming soon" page so no link is broken (TC ID-59). Real pages are future work.
- Q: Header menus scope (notifications, account menu, widget)? → A: Account menu is real: Profile → placeholder `/profile`, Sign out → existing `POST /auth/logout`, Admin Dashboard shown only when `user.app_metadata.role === 'admin'` (link to placeholder `/admin`). Bell opens a panel with an empty state ("no notifications"), no badge (no data source). Widget button is rendered per design; its quick-action menu is deferred until actions are specified (no invented options).
- Q: Event info source (spec text vs Figma)? → A: Figma content (date 26/12/2025, Âu Cơ Art Center, "Tường thuật trực tiếp qua sóng Livestream"). Displayed date + countdown both derive from `EVENT_START_AT` (ISO-8601). Invalid/missing value → countdown shows 00 00 00, "Coming soon" hidden, no crash (TC ID-60).

## Derived decisions (from specs/design, not re-asked)

- Test policy: `e2e-red-first` — screen has behavioral interactions (navigation, menus, countdown state); project already has `@playwright/test` (`bun run test:e2e`).
- Visual values come from MoMorph/Figma design data; design text is the mock-data source (no invented copy). Where spec text and Figma differ in copy, Figma wins.
- Language selector reuses F002 (`NEXT_LOCALE` cookie, VN/EN); homepage strings go into the existing `lib/i18n` dictionaries; English copy authored by us.
- Countdown updates per minute, 2-digit zero-padded; at/after event start shows 00 and hides "Coming soon".
- Award grid: 3 columns desktop, 2 columns tablet/mobile (spec C2 primary row); description clamps to 2 lines.
- Header sticky; active nav "About SAA 2025" on `/`; clicking active item scrolls to top.
- Dropdown menus: toggle on click, close on outside click / Escape, open with Enter/Space (TC ID-30..35).

## Session 2026-10-08 (spec gaps — Stage 1.5 Step 3)

- Q: [D011] Placeholder pages require login? → A: Yes — /awards-information, /sun-kudos, /standards, /profile, /admin are protected by the proxy like `/` (guest → /login).
- Q: [D009] Non-admin opening /admin directly? → A: Blocked server-side: `app_metadata.role !== 'admin'` → redirect `/`.
- Q: [D007] Event date display? → A: Date only, `dd/MM/yyyy`, computed in `Asia/Ho_Chi_Minh` (same on server and client).
- Q: [D006] Copy + slugs for the 6 award cards? → A: Descriptions verbatim from the Figma nodes; slugs kebab-case from titles: top-talent, top-project, top-project-leader, best-manager, signature-2025-creator, mvp.
- Q: [D008] Event date line when EVENT_START_AT missing/invalid? → A: Show "—" (layout unchanged).
- Q: [D010] Placeholder pages layout? → A: Reuse homepage header + footer; active nav item follows the current route.
- Derived (not asked): no return-to after login — landing is always `/` (callback keeps ignoring `next`, as in F001 DEC-002). Role changes take effect on the next session refresh — accepted.
- Q: Placeholder pages (except /admin) re-check session in-page? → A: Proxy only (no page data; proxy uses getUser() and fails closed). Homepage itself calls getUser() for email/role; /admin checks role server-side.

## Session 2026-10-08 (blueprint review)

- Q: EVENT_START_AT without offset/Z? → A: Invalid (strict ISO-8601 with offset or Z) → countdown 00, date "—".
- Q: Shared (main) layout calls getUser() and redirects to /login when no user (extra layer vs "proxy only")? → A: Agreed — the layout needs the user for the header anyway.
- Q: Approve 6-phase blueprint? → A: Approved.

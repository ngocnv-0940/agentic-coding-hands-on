---
phase: 5
title: "Header menus, sign out, notifications, placeholder pages"
feature: F003
status: completed
priority: P1
effort: 3h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [3, 4]
---

# Phase 05 — Header behaviors + placeholder pages

## Context Links
- `clarifications.md` (D004 menus, D009, D010, widget deferred), `spec/homepage/technical-spec.md` A4, A5, A7; `screens/SCR-homepage/spec.md` §4, §9
- Selector contract: phase-01 Architecture table; RED: `reports/tester-red-evidence.md`
- Reuse read-only: `app/login/_components/language-selector.tsx` (outside-click/Escape pattern), `app/auth/logout/route.ts` (POST), `lib/auth/get-current-user.ts`, `lib/auth/user-role.ts`
- Next docs: `03-api-reference/04-functions/use-pathname.md`, `01-app/01-getting-started/04-linking-and-navigating.md`, `03-file-conventions/route-groups.md`, `08-caching.md`

## Overview
Dropdown behavior hook, account menu (Profile, Sign out POST, Admin Dashboard if admin), empty notification panel, active-nav + scroll-to-top handler, Coming soon body, 5 placeholder pages. Does **not** import Track A components — triggers come in via render prop; phase 6 wires.

## Key Insights
- Native `<button>` already fires click on Enter/Space → toggle handles TC ID-33/34; hook adds Escape (close + focus trigger) and outside `pointerdown` close. Opening one menu closes the other naturally (other trigger click = outside).
- Sign out must be a native `<form action="/auth/logout" method="post">` (full navigation; F001 D1 lesson: no stale DOM after Back).
- Active nav from `usePathname()`: `/` → about, `/awards-information*` → awards, `/sun-kudos*` → kudos, else none. Click on href equal to current pathname (or logo on `/`) → `preventDefault` + `window.scrollTo({ top: 0, behavior: 'smooth' })` (respect `prefers-reduced-motion` → `auto`).
- Placeholders render body only; header/footer come from `app/(main)/layout.tsx` (phase 6). `/admin` page re-checks role (defense in depth; proxy already 307s): `const u = await getCurrentUser(); if (!u?.isAdmin) redirect('/')` inside Suspense after `await connection()`.
- Other placeholders: no in-page session check (clarification: proxy only).

## Requirements
FR-002, FR-202 (behavior), FR-401, FR-402, FR-403, FR-404, FR-602, FR-603, BR-004, DEC-002, DEC-004, US006, US007, US008; SC-005, SC-006, SC-007, SC-011.

## Architecture
```
app/(main)/_behavior/use-dropdown-menu.ts   ('use client')
  useDropdownMenu() → { open, rootRef, triggerProps: DropdownTriggerProps, panelProps: { id, hidden? }, close }
  DropdownTriggerProps = { ref, 'aria-expanded', 'aria-haspopup': 'menu'|'dialog', 'aria-controls', onClick }
app/(main)/_behavior/account-menu.tsx       ('use client')
  AccountMenu({ isAdmin, labels: { trigger, profile, signOut, admin }, renderTrigger: (p: DropdownTriggerProps & { label }) => ReactNode })
  panel testid account-menu: Link /profile (account-menu-profile); form POST /auth/logout → button (account-menu-signout); isAdmin → Link /admin (account-menu-admin)
app/(main)/_behavior/notifications-menu.tsx ('use client')
  NotificationsMenu({ labels: { trigger, title, empty }, renderTrigger }) → panel testid notifications-panel, empty text, no badge
app/(main)/_behavior/use-site-navigation.ts ('use client')
  useSiteNavigation() → { activeKey: 'about'|'awards'|'kudos'|null, onNavClick(href, e) }
app/(main)/_behavior/coming-soon-content.tsx
  ComingSoonContent({ title }) → <section data-testid="coming-soon"><h1>{title}</h1></section>
app/(main)/<route>/page.tsx × 5 → <ComingSoonContent title={dict['comingSoon.title']} /> (locale via getLocale in Suspense)
```
Panel styling: dark theme matching the language selector menu (no Figma frame for open menus — note in report).

## Related Code Files
Create: `app/(main)/_behavior/{use-dropdown-menu.ts,account-menu.tsx,notifications-menu.tsx,use-site-navigation.ts,coming-soon-content.tsx}`, `app/(main)/{awards-information,sun-kudos,standards,profile,admin}/page.tsx`.
Modify: none outside owned paths.

## Implementation Steps
1. Read listed Next docs.
2. `use-dropdown-menu.ts` (listeners only while open; cleanup).
3. `account-menu.tsx`, `notifications-menu.tsx` with render-prop triggers.
4. `use-site-navigation.ts`.
5. `coming-soon-content.tsx` + 5 pages; `/admin` role re-check.
6. `bunx tsc --noEmit`, `bun run lint`; run `bun run test:e2e e2e/homepage-access-and-landing.spec.ts` (placeholder access + admin cases).

## Todo List
- [x] dropdown hook (`app/(main)/_behavior/use-dropdown-menu.ts`)
- [x] account menu (+ sign-out form, admin item) (`account-menu.tsx`)
- [x] notifications menu (empty) (`notifications-menu.tsx`)
- [x] nav active + scroll-to-top (`use-site-navigation.ts`)
- [x] 5 placeholder pages, `/admin` re-check (`app/(main)/{awards-information,sun-kudos,standards,profile,admin}/page.tsx`)

## Scope Drift (sync-back)
- Extra file `_behavior/dropdown-panel-styles.ts` (shared panel styling). Reason: keeps both menus on one dark panel style. Cost: one small module, not in the plan's file list.
- Menu behavior verified in E2E only (`homepage-header-and-menus.spec.ts`, `homepage-account-and-dropdown-menus.spec.ts`); no unit runner, per plan.

## Success Criteria
Access spec: guest → `/login` for all 5, non-admin `/admin` → `/`, admin `/admin` and user `/standards` show `coming-soon`. Header/menu specs GREEN after phase 6.

## Scope Contract
- **Changed:** new `_behavior/**` modules, 5 new routes.
- **Impacted:** logout route (consumer only, unchanged), proxy decisions for new routes (phase 3).
- **Will verify:** `homepage-access-and-landing.spec.ts` in full (authz = safety-critical), tsc, lint.
- **Deliberately skipped:** menu E2E (needs phase-6 wiring), visual.

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Admin item shown from client-derived role | L | H | `isAdmin` only from server `getCurrentUser` prop |
| Streamed `redirect()` on `/admin` is a meta tag | H | L | proxy is primary gate (phase 3); page check is backup |
| Focus lost after Escape | M | L | hook focuses trigger ref |
| Sign out double-submit | L | L | reuse disabled-after-click pattern from `app/todo/logout-button.tsx` |

## Security Considerations
Hiding Admin Dashboard is cosmetic; real gate = proxy + page re-check. Sign out POST only; no GET logout.

## Rollback
Revert commit; removes placeholder routes (links 404 again) — revert with phase 6.

## Next Steps
Phase 6 wires triggers (`HeaderIconButton`), nav handler, menus into `SiteHeader`.

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first

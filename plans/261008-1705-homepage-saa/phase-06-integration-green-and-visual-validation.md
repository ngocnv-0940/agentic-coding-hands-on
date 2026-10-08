---
phase: 6
title: "Integration, GREEN, visual validation, .env.example"
feature: F003
status: completed
priority: P1
effort: 3h
owner_agent: implementer → tester
track: integration
test_policy: e2e-red-first
depends_on: [2, 3, 4, 5]
---

# Phase 06 — Integration + GREEN + visual

## Context Links
- Contracts: phase-02 (Track A props), phase-03 (`getCurrentUser`), phase-04 (`event-start-config`, `useCountdown`, `AWARD_CATEGORIES`, dictionary keys), phase-05 (`_behavior/**`)
- RED commands/evidence: `reports/tester-red-evidence.md`; acceptance: `evidence/study-context.json`
- Next docs: `03-file-conventions/route-groups.md`, `layout.md`, `01-getting-started/08-caching.md`, `14-metadata-and-og-images.md`, `04-functions/connection.md`
- Precedent: `app/todo/page.tsx` (Suspense + `connection()` + `getUser`)

## Overview
Implementer wires Track A to Track B in a route-group layout + homepage page, adds `.env.example` entry; tester reruns the exact RED commands GREEN, then visual validation vs Figma.

## Key Insights
- `app/(main)/layout.tsx` (server): `<Suspense>` → `await connection()`, `getCurrentUser()` (null → `redirect('/login')`, rare race; proxy already guards), `getLocale()`, dict → `<SiteHeaderContainer>` + `{children}` + `SiteFooter` + `WidgetButton`, wrapper gets `homeFontClassName`. Layouts persist across client nav → active nav must come from `usePathname` (phase 5 hook), not layout props.
- `app/(main)/page.tsx`: inside Suspense, after `connection()`: `target = readEventStartFromEnv()`, `initial = getCountdown(target, Date.now())`, `date = formatEventDate(target)` → `HomeScreen` with `countdown={<CountdownContainer targetIso={target?.toISOString() ?? null} initial={initial} labels comingSoonText />}`.
- `CountdownContainer` (`'use client'`) = `useCountdown` + `CountdownDisplay`; `comingSoonText` null when `!value.comingSoon`.
- `SiteHeaderContainer` (`'use client'`): `useSiteNavigation` → `nav[].active`, `onNavClick`; `notifications={<NotificationsMenu renderTrigger={(p) => <HeaderIconButton icon="bell" {...p} />} />}`, `account={<AccountMenu isAdmin … />}`, `languageSelector={<LanguageSelectorContainer … />}` (import from `app/login/language-selector-container.tsx`, unchanged).
- Root `app/layout.tsx` keeps `instant = false`; title per route group via `generateMetadata` in `(main)/layout.tsx` using `home.meta.title`. Touch root layout only if build demands.

## Requirements
All FR/BR/DEC/US of `spec/homepage/` end-to-end; every acceptance criterion in `evidence/study-context.json`.

## Architecture
```
GET /  → proxy (phase 3) → (main)/layout [Suspense: user, locale, dict] → SiteHeaderContainer(client)
                                         → (main)/page [Suspense: env snapshot] → HomeScreen(Track A) + CountdownContainer(client)
GET /<placeholder> → same layout → phase-5 page
```

## Related Code Files
Create: `app/(main)/layout.tsx`, `app/(main)/page.tsx`, `app/(main)/_wiring/site-header-container.tsx`, `app/(main)/_wiring/countdown-container.tsx`, `app/(main)/_wiring/build-home-screen-props.ts` (dict + `AWARD_CATEGORIES` → `HomeScreen` props; keeps page <200 lines).
Modify: `.env.example` (`EVENT_START_AT=2025-12-26T18:30:00+07:00` + comment: ISO-8601 with offset; invalid/missing → 00 + "—"), `app/layout.tsx` only if required.

## Implementation Steps
1. Implementer: read listed docs; build `_wiring/**`, layout, page.
2. `bunx tsc --noEmit`, `bun run lint`, `bun run build` (expect no prerender `Date.now`/cookies errors; fix with Suspense/`connection()`, never by disabling `cacheComponents` without recording why).
3. Implementer smoke: `bun run test:e2e` once; hand off.
4. Tester: rerun **exact** RED commands → GREEN; save `evidence/e2e-green-output.txt`, `evidence/e2e-green-invalid-env-output.txt` with exit codes.
5. Tester: visual validation (Playwright MCP) @1440 and @375 vs MoMorph frame; save `evidence/visual/`; material mismatch → bounded fix back to `momorph-ui-implementer` (phase 2 files only), tests never weakened.
6. Add real-stack admin note to report: `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '<email>';` then re-login.

## Todo List
- [x] `_wiring/**`, layout, page (plus `site-footer-container.tsx`, `read-event-snapshot.ts`, see drift)
- [x] `.env.example` (`EVENT_START_AT=2025-12-26T18:30:00+07:00`)
- [x] tsc / lint / build 0 (`evidence/tsc-green-output.txt`, `lint-green-output.txt`, `build-green-output.txt`)
- [x] GREEN x2 (exit 0) evidence (`evidence/e2e-green-run*-output*.txt`; final 83/83 in `evidence/e2e-full-stage5-output.txt`)
- [x] visual evidence + verdict (`evidence/visual/`, `evidence/visual-recheck/`, `evidence/inspection-verdict.json` SEALED 9/10)

## Scope Drift (sync-back)
- Visual viewports: plan said @1440 and @375. Evidence uses 320, 375, 768, 1024, 1280, 1512. 1440 was not captured. Reason: widened to cover the tablet and laptop overflow fixes. Cost: no 1440 capture (open, see plan Unresolved).
- Stage-5 tests added beyond the plan: 30 s pre-start boundary, hydration console guard, `user_metadata` admin negatives. Reason: review findings. Final E2E count 83 (earlier runs 80).
- Extra wiring file `site-footer-container.tsx`, helper `read-event-snapshot.ts`. Reason: footer and snapshot reads kept out of the page. Cost: two small files.
- Real-stack admin role is set by SQL, not in-app (plan step 6 note).

## Success Criteria
Both RED commands exit 0; tsc, lint, build exit 0; visual within project tolerance (or user-accepted deviation recorded in `clarifications.md`); acceptance criteria table mapped to passing tests in final report.

## Scope Contract
- **Changed:** route-group layout/page, wiring containers, `.env.example`.
- **Impacted:** every route under `(main)`, root layout metadata, F001 landing.
- **Will verify:** full E2E suite (both runs) — integration + safety-critical auth paths; build; visual for `/`.
- **Deliberately skipped:** visual for placeholders beyond header/footer presence (no Figma frames).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| cacheComponents prerender error (`Date.now`, env, cookies) | H | M | Suspense + `connection()` as in `/todo`; build gate |
| Hydration mismatch on countdown | M | M | snapshot prop; client recompute in effect only |
| Visual fidelity rounds (login took 2) | H | M | budget 1–2 correction loops, Track A files only |
| Build needs `NEXT_PUBLIC_SUPABASE_*` at build (F7) | M | L | set env for `E2E_PROD` build as in login plan |

## Security Considerations
`isAdmin` derived server-side only; layout never renders without verified user; env value server-only.

## Rollback
Revert 6 together with 3 (and 5): restores `/` redirect behavior and `/todo` landing. No data migration.

## Next Steps
Code review (reviewer template), docs: F001 landing `/todo` → `/` in `docs/` via doc-writer at promote; journal if correction rounds exceed 2.

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first

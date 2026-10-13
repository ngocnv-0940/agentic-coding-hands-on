---
phase: 5
title: "Integration, GREEN, visual validation"
feature: awards-information
status: completed
priority: P1
effort: 3h
owner_agent: implementer → tester
track: integration
test_policy: e2e-red-first
depends_on: [2, 3, 4]
---

# Phase 05 — Integration + GREEN + visual

## Context Links
- Contracts: phase-02 (Track A props, selector contract honored), phase-03 (`AWARD_DETAILS`, dictionary keys), phase-04 (`useAwardCategorySpy`, `useKeepActiveTabInView`)
- RED: `evidence/red-evidence.json`, `reports/tester-red-evidence.md`; acceptance: `evidence/study-context.json` AC1–AC12
- Next docs: `01-app/01-getting-started/08-caching.md` ("Working with runtime APIs"), `03-api-reference/04-functions/connection.md`, `05-server-and-client-components.md`
- Precedent: `app/(main)/page.tsx` + `_wiring/build-home-screen-props.ts`, `app/(main)/layout.tsx`

## Overview
Implementer wires Track A to Track B on `app/(main)/awards-information/page.tsx` (replacing `ComingSoonPage`); tester reruns the exact RED command GREEN, then visual validation vs Figma.

## Key Insights
- Page (server): `<Suspense>` → `await connection()` → `getDictionary(await getLocale())` → `<AwardsInformationScreen {...buildAwardsInformationProps({ dict, menu })} />`. Only the locale cookie is request-time; `connection()` mirrors the layout and keeps prerender explicit.
- `menu = <AwardsCategoryMenuContainer ariaLabel items={[{slug,label}]} />` (`'use client'`): `useAwardCategorySpy(AWARD_SLUGS)` + `useKeepActiveTabInView(listRef, activeSlug)` → `AwardsCategoryMenu`. Props stay serializable strings.
- `buildAwardsInformationProps` maps `AWARD_CATEGORIES` (title key, imageSrc) + `AWARD_DETAILS` (description, quantity, prizes) + dict → `AwardDetailCardData[]`; Kudos props reuse `home.kudos.*` (or `awards.kudos.*` if phase 3 added a variant), `href: '/sun-kudos'`.
- `ComingSoonPage` stays for the other placeholders; layout, header active state (`use-site-navigation`), proxy untouched (FR-601 unchanged).

## Requirements
All FR/BR/DEC/US/SC of `spec/awards-information/` end-to-end; AC1–AC12.

## Architecture
```
GET /awards-information[#slug] → proxy (unchanged) → (main)/layout [Suspense: user, locale] → header/footer
  → awards-information/page [Suspense: connection, locale, dict]
      → AwardsInformationScreen (server, Track A)
          ├─ hero/title, 6 × section#slug (AwardDetailCard), KudosPromo
          └─ menu slot: AwardsCategoryMenuContainer (client) → hooks (phase 4) → AwardsCategoryMenu (Track A)
```

## Related Code Files
Create: `app/(main)/_wiring/awards-category-menu-container.tsx`, `app/(main)/_wiring/build-awards-information-props.ts`.
Modify: `app/(main)/awards-information/page.tsx`.

## Implementation Steps
1. Implementer: read listed docs; build `_wiring/**` and page.
2. `bunx tsc --noEmit`, `bun run lint`, `bun run build` (no prerender cookie errors; fix with Suspense/`connection()`, never by disabling `cacheComponents`).
3. Implementer smoke: `bun run test:e2e -- e2e/awards-information-*.spec.ts` once; hand off.
4. Tester: rerun the **exact** RED command → GREEN (full suite: shared dictionaries, `(main)` routes, homepage `KudosPromo`); save `evidence/e2e-green-output.txt` with exit code.
5. Tester: visual validation (Playwright MCP) @1440 (Figma frame) and @768/@375 (clarified layout) — keyvisual, title, sticky menu, active gold + underline, card alternation, Kudos; save `evidence/visual/`; material mismatch → bounded fix to `momorph-ui-implementer` (phase 2 files only), tests never weakened.
6. Final report: AC1–AC12 → passing test table.

## Todo List
- [x] `_wiring/**` + page (`app/(main)/awards-information/page.tsx`, `_wiring/awards-category-menu-container.tsx`, `_wiring/build-awards-information-props.ts`)
- [x] tsc / lint / build 0 (`evidence/tsc-final2-output.txt`, `lint-final2-output.txt`, `build-final2-output.txt`)
- [x] GREEN evidence: full suite 112 passed, 0 failed (`evidence/e2e-full-final2-output.txt`; nav spec 30/30 dev and prod)
- [x] visual evidence @1440/@768/@375 + verdict (`evidence/visual/visual-validation.md`: 0 material mismatch; 4 minor diffs open, plan.md follow-up 1)
- [x] AC → test mapping (`evidence/inspection-verdict.json` `acceptanceCovered`, AC1–AC12; verdict SEALED 9/10)

## Success Criteria
RED command exits 0; tsc, lint, build exit 0; visual within tolerance (or user-accepted deviation recorded in `clarifications.md`); AC1–AC12 mapped to passing tests; homepage suites still green.

## Scope Contract
- **Changed:** `awards-information/page.tsx`, two `_wiring` files.
- **Impacted:** `/awards-information` route, homepage card deep links, header active state on this route, shared dictionaries.
- **Will verify:** full E2E suite + build; visual for `/awards-information`.
- **Deliberately skipped:** visual of other `(main)` pages (untouched code).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| cacheComponents prerender error (cookies) | M | M | Suspense + `connection()` as in layout; build gate |
| Sticky menu inert (ancestor overflow / Suspense wrapper height) | M | M | E2E sticky assert; fix in Track A files only |
| Client nav from homepage: Next hash scroll fires before content | M | M | hook re-scrolls on mount; E2E covers card click |
| Visual fidelity rounds | H | M | budget 1–2 correction loops, Track A files only |

## Security Considerations
Route protection unchanged (proxy + layout); E2E guest test proves it. Hash handled per phase 4.

## Rollback
Revert this phase with phase 1's homepage-spec edit → `/awards-information` shows Coming soon again; additive keys/files stay inert.

## Next Steps
Code review (reviewer template); docs: promote spec draft to `docs/features/` via doc-writer; changelog entry.

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/261013-0720-awards-information-page/clarifications.md
- testPolicy: e2e-red-first

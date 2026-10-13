---
phase: 1
title: "E2E RED: awards information screen"
feature: awards-information
status: completed
priority: P1
effort: 3h
owner_agent: tester
track: gate
test_policy: e2e-red-first
depends_on: []
---

# Phase 01 — E2E RED (`/awards-information`)

## Context Links
- `clarifications.md` (authoritative: route stays `/awards-information`, not `/he-thong-giai`; D007 replaceState; D009 card layout; tabs <1024)
- `momorph/awards-system-test-cases.csv` (ID-0..ID-14), `momorph/awards-system-specs.csv` (23 items)
- `spec/awards-information/functional-spec.md` §4, §8, §9, §10; `technical-spec.md` §3.4, §4.4 BR-002, §4.5 ALG-001, §5.1 SC-001..SC-008; `screens/SCR-awards-information/spec.md` (E01–E19)
- `evidence/study-context.json` (AC1–AC12)
- Harness: `playwright.config.ts`, `e2e/support/{login-through-stubbed-google,mock-supabase-server,homepage-locators}.ts`, `e2e/homepage-*.spec.ts`
- `.claude/skills/momorph-implement-design/references/momorph-workflow.md` (valid-RED rules)

## Overview
Write durable screen-level Playwright specs for the Awards Information page, update the one homepage spec that still expects Coming soon on `/awards-information`, run, record a **valid RED**. No app code.

## Key Insights
- Reuse `loginThroughStubbedGoogle(page)` (lands `/`), then `goto('/awards-information…')`. No mock/config change expected.
- `e2e/homepage-access-and-landing.spec.ts:76` lists `/awards-information` among Coming-soon placeholders; the page is replacing that, so remove it from that loop only (guest-guard list at :7 and the active-nav test at :88 stay).
- Smooth scroll is async: assert with web-first `toBeInViewport()` / `expect.poll`, never `waitForTimeout`.
- No-flicker (US002 error, BR-002) is provable: before clicking, inject a `MutationObserver` on the menu recording every slug that gains `aria-current`; after scroll settles the record must be `['mvp']` exactly.
- Next 16 locks one `next dev` per dir: if :3000 dev server runs, use `E2E_PROD=1`.
- Valid RED = non-zero exit caused by awards-information assertions (not webServer/install errors). Guest redirect (ID-1) and header nav (ID-2) already pass — list them.

## Requirements
Selector contract (Architecture) + coverage:
- `e2e/awards-information-access-and-content.spec.ts`: ID-0, ID-1, ID-2, ID-3, ID-4, ID-5, ID-6, ID-7, ID-8, ID-12, ID-14; FR-001, FR-101, FR-102, FR-201..205, FR-408, FR-601, BR-001, BR-003, US001, US004, US005, SC-001, SC-002, SC-007, SC-008. Signed-in sees page, no `coming-soon`; guest → `/login`; header "Awards Information" → page with `aria-current="page"`; caption + gold h1 (computed color differs from caption); 6 menu items in order; 6 sections with ids = slugs in order, image rendered 336×336 @1440, title, description, quantity, prize description is not the homepage short copy (differs from `/` card text, not line-clamped) (D005); (VN values per CSV/clarifications D006: `10 Đơn vị`, `7.000.000 VNĐ`, `02 Tập thể`, `15.000.000 VNĐ`, `03 Cá nhân`, `01 Cá nhân`, `10.000.000 VNĐ`, Signature two prize lines `5.000.000 VNĐ` + `8.000.000 VNĐ`, MVP `15.000.000 VNĐ`; use `toContainText` tolerant of the label/value split); Kudos block eyebrow/title/description + Chi tiết → `/sun-kudos` same tab; ID-14 per CSV (unknown route → default 404); EN switch: menu/title/labels English and no raw `awards.` key text.
- `e2e/awards-information-category-navigation.spec.ts`: ID-9, ID-10, ID-11, ID-13; FR-401..405, BR-002, DEC-001, ALG-001, D007, US002, US003, SC-003..SC-005. Default Top Talent active; click each item → its section in viewport below the header + only it active; URL hash = `#<slug>` and `history.length` unchanged (replaceState), header "Awards Information" keeps `aria-current="page"`; no-flicker record = clicked slug only; hover changes computed style of an inactive item; manual scroll (`window.scrollTo` to each section's top) → active follows, URL unchanged; `goto('/awards-information#mvp')` → MVP in viewport + active; homepage card Best Manager click → `#best-manager` section in viewport + active; `#abc` → no `pageerror`, `scrollY` < 50, Top Talent active.
- `e2e/awards-information-responsive-layout.spec.ts`: FR-406, FR-407, DEC-002, D009, SC-006. @1440: menu left of cards (x), computed `position: sticky`, still in viewport and below header after scrolling to MVP; @768 and @375: all menu items share one row (same `y`), menu `overflow-x` auto/scroll, no page horizontal scroll; cards @768 image and text side by side, @375 image above text; resize 1440→375 keeps the active item.
- Not tested (record why): exact hover color/underline thickness and tablet visuals beyond geometry (visual phase, no Figma frame).
Non-functional: each spec <200 lines; shared locators only in `e2e/support/awards-information-locators.ts`; `fullyParallel` safe.

## Architecture
Selector contract (read-only for phases 2, 4, 5):
| Element | Locator |
|---|---|
| page root / hero | `getByTestId('awards-information')` / `getByTestId('awards-hero')` (keyvisual `img` alt "Keyvisual Sun* Annual Award 2025") |
| caption / title | `getByTestId('awards-caption')` / `getByRole('heading', { level: 1 })` |
| menu | `getByTestId('awards-category-menu')` = `<nav aria-label>`; items `getByTestId('awards-menu-item-<slug>')` = `<a href="#<slug>">`; active has `aria-current="location"` (exactly one) |
| award section | `locator('section#<slug>')`, testid `award-detail-<slug>`, `aria-labelledby` its `h2` title; parts `award-detail-image`, `award-detail-description`, `award-detail-quantity`, `award-detail-prize` (Signature: 2 prize elements) |
| kudos | existing `getByTestId('kudos-promo')` + link `/Chi tiết|Details/` |
| header / nav | existing `homepage-locators.ts` (`header`, `navLink`) |

## Related Code Files
Create: `e2e/awards-information-access-and-content.spec.ts`, `e2e/awards-information-category-navigation.spec.ts`, `e2e/awards-information-responsive-layout.spec.ts`, `e2e/support/awards-information-locators.ts`.
Modify: `e2e/homepage-access-and-landing.spec.ts` (placeholder loop only).

## Implementation Steps
1. Read CSV TCs + clarifications; map every TC/AC to a test title prefix (`ID-n/FR-xxx:`).
2. Write locators file, then the 3 specs per Requirements; edit the homepage placeholder loop.
3. `bunx tsc --noEmit` (specs compile).
4. RED run: `bun run test:e2e` (or `E2E_PROD=1 bun run test:e2e`).
5. Save `evidence/e2e-red-output.txt`; write `evidence/red-evidence.json` + `reports/tester-red-evidence.md` with `redTestFiles`, `redCommand`, `redExitCode`, `redFailure` (first 3 failure excerpts per spec), and already-passing tests with reason.

## Todo List
- [ ] locators + 3 specs (<200 lines each) — OPEN: `awards-information-category-navigation.spec.ts` is 286 lines (plan.md follow-up 7); other files 191, 113, 54
- [x] homepage placeholder loop updated (`e2e/homepage-access-and-landing.spec.ts`: `/awards-information` gone from the placeholder loop; guard list `:7` and nav test `:88` kept)
- [x] tsc 0 on specs (`evidence/tsc-final2-output.txt`)
- [x] RED run, evidence JSON + report written (`evidence/red-evidence.json` exit 1, 25 failed / 2 passed; `reports/tester-red-evidence.md`)

## Success Criteria
Command exits non-zero from awards-information assertions; every AC1–AC12 and TC ID-0..14 maps to a test (or a recorded skip reason); homepage suites otherwise unchanged; evidence files exist.

## Scope Contract
- **Changed:** `e2e/awards-information-*`, `e2e/support/awards-information-locators.ts`, one homepage spec loop.
- **Impacted:** homepage access spec (placeholder expectation).
- **Will verify:** full E2E suite (RED baseline for every later phase).
- **Deliberately skipped:** app build/lint (no app code).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Flaky smooth-scroll asserts | M | M | `toBeInViewport`, `expect.poll` on `scrollY`/`aria-current`; no fixed sleeps |
| Copy asserts too brittle vs Figma split | M | L | `toContainText` on values; exact VN strings verified visually |
| Contract drift vs Figma structure | M | M | roles + testids only; Track A must honor |
| Weakened homepage coverage | L | M | edit only the Coming-soon loop; guard list untouched |

## Security Considerations
FR-601 guest redirect is covered (route protection is safety-critical, unchanged code). Mock stays in `e2e/`.

## Rollback
Revert phase commit (together with phase 5 if already merged).

## Next Steps
Hand `evidence/red-evidence.json` (read-only) to phases 2–5.

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/261013-0720-awards-information-page/clarifications.md
- testPolicy: e2e-red-first

---
title: "Awards Information page (/awards-information) — Hệ thống giải"
description: "Replace the Coming soon placeholder with the MoMorph zFYDgyj_pD awards system page: keyvisual, title, sticky category menu with scroll-spy and hash deep links, 6 award cards, Sun* Kudos block."
status: completed
priority: P1
effort: 15h
branch: feat/awards-information
tags: [awards-information, momorph, i18n, playwright, nextjs16, e2e-red-first]
created: 2026-10-13
completed: 2026-10-13
progress: 5/5 phases
work_type: feature
spec: docs/features/F004_AwardsInformation/
blockedBy: []
---

# Awards Information — Implementation Plan

## Overview
`/awards-information` (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD, node `313:8436`) replaces `ComingSoonPage` in place. testPolicy `e2e-red-first`. Authoritative: `clarifications.md`. Ids (FR/BR/US/SC/ALG/DEC/D###) = `spec_draft`. Acceptance AC1–AC12 = `evidence/study-context.json`. No auth/proxy change.

Result (2026-10-13): all 5 phases code-complete and gated. E2E full suite 112/112 (`evidence/temper-results.json`), tsc/lint/build exit 0, nav spec 30/30 dev and 30/30 prod (repeat-each=3), inspection SEALED 9/10 after 2 fix rounds, visual 0 material mismatch (4 minor diffs open, see follow-ups).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E RED: awards information screen](./phase-01-e2e-red-awards-information-screen.md) | Completed |
| 2 | [Awards information presentational UI (Track A)](./phase-02-awards-information-presentational-ui.md) | Completed |
| 3 | [Award detail data + vi/en dictionary](./phase-03-award-detail-data-and-dictionary.md) | Completed |
| 4 | [Category nav behavior: click, scroll-spy, hash](./phase-04-category-nav-scroll-spy-and-hash-behavior.md) | Completed |
| 5 | [Integration, GREEN, visual validation](./phase-05-integration-green-and-visual-validation.md) | Completed |

Owner · track · depends · effort: 1 tester · gate · — · 3h | 2 momorph-ui-implementer · A · 1 · 5h | 3 implementer · B · 1 (+ phase-2 copy artifact) · 2h | 4 implementer · B · 1 · 2h | 5 implementer → tester · integration · 2, 3, 4 · 3h.

## Dependencies
```
1 ─┬─> 2 (Track A) ──(step 1: momorph/awards-information-copy-vi.md)──┐
   ├─> 3 <───────────────────────────────────────────────────────────┘
   └─> 4
2, 3, 4 ──> 5
```
After 1: {2} ∥ {3, 4}. Single implementer → 3 then 4. Phase 3 VN copy waits only on the phase-2 copy artifact.

## Key calls
- Next 16.4, `cacheComponents: true`: read `node_modules/next/dist/docs/` first (`cd` into it). Locale cookie read sits behind `<Suspense>` + `await connection()` as in `app/(main)/layout.tsx`.
- Server page renders hero, title, 6 `section#<slug>` cards, Kudos; ONLY the menu is client (container + hook). One `<nav>` element serves both layouts (vertical sticky ≥1024, one-row horizontal tabs <1024) → active state survives breakpoint changes (DEC-002).
- Anchor ids = `AWARD_SLUGS` (BR-001, FR-002); `awardHref` unchanged. Sections carry responsive `scroll-margin-top`; the hook reads it as the ALG-001 line.
- Active rules (BR-002, DEC-001, D007): default first; click → smooth scroll + active + `history.replaceState(null,'','#slug')`; scroll-spy suppressed while a click scroll runs; valid hash on load/`hashchange` → scroll + active; unknown hash → no-op. Scroll-spy mechanics changed from the original plan, see Scope drift.
- Strings: keys in `lib/i18n/dictionary-awards-{vi,en}.ts` spread into the main dictionaries (parity type unchanged). VN verbatim Figma, EN authored (FR-001, BR-003).
- Reuse award PNGs, keyvisual, `KudosPromo`; additive `variant="wide"` for node `335:12023` (D008), homepage default unchanged.

## File ownership (W = writes; no two parallel phases share a file)

| Path | Phase |
|------|-------|
| `e2e/awards-information-*.spec.ts`, `e2e/support/awards-information-locators.ts`, `e2e/homepage-access-and-landing.spec.ts` (drop `/awards-information` from Coming-soon list only) | 1 |
| `app/(main)/_components/awards-information/**`, `public/images/awards-information/**` (not created: reuse), `momorph/awards-information-copy-vi.md`, `app/(main)/_components/kudos-promo.tsx` (additive variant only) | 2 |
| `lib/awards/award-details.ts`, `lib/i18n/dictionary-awards-{vi,en}.ts`, `lib/i18n/dictionary-{vi,en}.ts` (spread only) | 3 |
| `app/(main)/_behavior/award-hash.ts`, `app/(main)/_behavior/use-award-category-spy.ts`, `app/(main)/_behavior/use-keep-active-tab-in-view.ts`, `app/(main)/_behavior/award-scroll-lock.ts` (added in review) | 4 |
| `app/(main)/awards-information/page.tsx`, `app/(main)/_wiring/awards-category-menu-container.tsx`, `app/(main)/_wiring/build-awards-information-props.ts` | 5 |

Read-only: `lib/awards/award-categories.ts`, `app/(main)/layout.tsx`, `_behavior/{coming-soon-content,use-site-navigation}.ts(x)`, other `_components/**`, `proxy.ts`. Every code file <200 lines (one exception: see follow-up 7).

## Verification & rollback
RED/GREEN = phase-1 command `bun run test:e2e` (or `E2E_PROD=1 bun run test:e2e`), exit codes in `evidence/`. Plus `bunx tsc --noEmit`, `bun run lint`, `bun run build`, visual vs Figma @1440 + @768 + @375 (phase 5). No unit runner, no new deps (YAGNI).
Rollback = revert phase commits; phase 5 and phase 1's homepage-spec edit ship together (else the old placeholder test or the new page test breaks). Additive keys/files otherwise inert. No DB.
Done = phase-1 command exits 0 on final code, tsc/lint/build 0, visual within tolerance at the 3 widths, AC1–AC12 each mapped to a green test. Status: first three met; visual tolerance has no material mismatch but the 4 minor diffs still await user sign-off (follow-up 1).

## Scope drift log

| # | Step away from plan | Reason | Cost |
|---|---------------------|--------|------|
| 1 | Scroll-spy uses a `scroll` listener + rAF, and a `scrollend` + deadline lock, instead of IntersectionObserver (phase 4 Architecture, Key calls) | Review rounds; ALG-001 allows it; lock must release only on target arrival (BR-002) | Extra listeners to clean up; mid-page activation lags the section top (visual note) |
| 2 | `award-scroll-lock.ts` added as a fifth `_behavior` file | Review fix round 1 split the lock out to hold the <200-line rule | One more file, not in the original ownership table (now added) |
| 3 | `KudosPromo` gained `variant="wide"` | Node 335:12023 is 1152 wide vs the 1120 homepage card (phase 2 allowed additive) | Shared component touched; homepage class strings verified byte-identical, full suite green |
| 4 | Caption "Sun* Annual Awards 2025" (Figma), not TC lowercase | Approved in clarifications | None; E2E asserts Figma text |
| 5 | Top Talent quantity "10 Cá nhân" (Figma), not TC "Đơn vị" | Figma override, approved | None |
| 6 | Cards stack below 768 px (D009), not 1024 | Clarified layout | Promoted `docs/screens/SCR004` still says 1024 (follow-up 6) |
| 7 | Figma frame image not fetched; visual check run against node-tree data, copy notes and CSV | MoMorph and Figma MCP tools not in agent toolset; Playwright MCP browser failed to start | Visual verdicts are qualitative only, no pixel metric (follow-up 1) |
| 8 | `validate_coverage.py` not run; inline marker scan used | `.claude/skills/.venv` absent; manifest needs fresh signed URLs | Same result, less formal evidence |
| 9 | Phase 4 scratch parser check (`#%E0`, `#abc`, `''`) not preserved | Scratch run, not committed | Parser proven only indirectly via E2E ID-13 (follow-up 3) |
| 10 | Gen gate skipped by user | User decision | Flow layer absent, Core stale (follow-up 4) |
| 11 | Category-navigation spec is 286 lines | Test growth during review rounds | Breaks the <200-line rule (follow-up 7) |

## Risk register

| Risk | L | I | Status | Owner / mark |
|------|---|---|--------|--------------|
| Visual fidelity vs Figma frame unconfirmed (4 minor diffs, mobile tab-row reading RISK-01) | M | L | Open | user · follow-up 1 |
| Ctrl-click test failed once, not reproduced in 7 runs | L | M | Open | tester · follow-up 3 |
| Untested paths: vertical wheel on <1024 tab row, touchmove direction, deadline recompute | L | L | Open | tester · follow-up 2d |
| Spec drift in `docs/screens/SCR004` (1024 breakpoint, E12 "10 Đơn vị", image side) | M | M | Open | doc-writer · follow-up 6 |
| Mid-page scroll-spy activation lag (by ALG-001 design) | M | L | Open | user · follow-up 8 |
| Nav spec over 200 lines | H | L | Open | tester · follow-up 7 |
| cacheComponents prerender error | M | M | Closed: build 0 warnings (final2) | — |
| Kudos variant regresses homepage | M | M | Closed: class strings identical, suite 112/112 | — |
| Active flicker during click scroll | H | M | Closed: no-flicker record 30/30 dev and prod | — |
| `replaceState` desyncs Next router | L | M | Closed: header `aria-current` stays on click | — |
| Sticky menu broken by ancestor overflow | M | M | Closed: sticky measured at 1440/768/375 | — |

## Unresolved / follow-ups
Not blocking the Done line by itself; each item has an owner and a done-criterion.
1. Visual minor diffs need a human eyeball vs the Figma frame: keyvisual crop (`50% 58%`), sticky gap (16 px, `top: 96px`), Kudos wide height 524 vs Figma 500, text column 553 px vs 457 px note; also the mobile tab-row sticky reading and the absence of a Figma frame for hover and tablet. Owner: user. Done: each item accepted, or a bounded fix sent to momorph-ui-implementer and re-verified; decision recorded in `clarifications.md`.
2. Deferred review items. Owner: user for (a), main agent for (b)–(c), tester for (d).
   (a) EN prize values keep VN format "7.000.000 VNĐ" (product call). Done: format decided; if changed, EN keys and the EN E2E assertion updated and green.
   (b) `KudosPromo` wide `sizes` hint 1120 px for a 1152 px card. Done: hint corrected or kept with a comment.
   (c) Award image alt repeats the adjacent h2. Done: alt decision recorded in a code comment or fixed.
   (d) No E2E for vertical wheel/touch on the <1024 tab row and deadline recompute. Done: 800 px test (`page.mouse.wheel(0,-600)` over the row during click-scroll) green at repeat-each=3.
3. Ctrl-click test (`awards-information-category-navigation.spec.ts`, modifier-click) failed once in an earlier run, not reproduced in 7 runs. Owner: tester. Done: 10 consecutive green CI runs; a reproduced failure gets a root-cause fix, never a retry.
4. Gen gate skipped by user: Flow layer absent, Core stale. Owner: user. Done: `/tkm:rebuild-spec` run after merge; `docs/features/F004_AwardsInformation/` has the Flow layer and Core is current.
5. Browser tab title stays "Trang chủ - SAA 2025" on this page (spec silent). Owner: user. Done: title decision recorded in `clarifications.md`; if changed, page metadata set and an E2E asserts it.
6. Promoted spec drift in `docs/screens/SCR004_AwardsInformation/spec.md` (stack at 1024 vs 768, E12 "10 Đơn vị" vs Figma "10 Cá nhân", image always left vs alternating). Owner: doc-writer. Done: spec matches `clarifications.md` and code; `status` moved from draft.
7. `e2e/awards-information-category-navigation.spec.ts` is 286 lines, over the <200 rule. Owner: tester. Done: split into two or more specs each <200 lines, sharing `e2e/support/awards-information-locators.ts`; nav suite green at repeat-each=3 dev. Phase 1 todo "3 specs (<200 lines each)" stays unticked until then.
8. Scroll-spy activation lag: section activates when its top reaches the header line (~120 px at 1440), not when it enters the view. Owner: user (UX call). Done: keep ALG-001 as-is, or change decision recorded in `clarifications.md`.

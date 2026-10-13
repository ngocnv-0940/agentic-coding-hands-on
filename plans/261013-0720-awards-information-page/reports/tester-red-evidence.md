# Tester RED evidence: Awards Information (phase 1)

Status: **valid RED**. Exit 1, caused by the awards screen assertions. No dev-server, config, or browser-install failure.

## Files written (e2e/ only)
- `e2e/support/awards-information-locators.ts` (selector contract, testids and roles)
- `e2e/awards-information-access-and-content.spec.ts` (14 tests: ID-0..ID-8, ID-12, ID-14, D005, AC12)
- `e2e/awards-information-category-navigation.spec.ts` (8 tests: ID-9, ID-10, ID-11, ID-13, D007, BR-002, scroll-spy, deep link, homepage card)
- `e2e/awards-information-responsive-layout.spec.ts` (6 tests: FR-406, FR-407 @768 and @375, D009 @768 and @375, DEC-002)
- `e2e/homepage-access-and-landing.spec.ts`: one edit. `/awards-information` removed from the Coming-soon loop only. The guest-redirect list and the active-nav test are unchanged.

## Command and result
- Command: `bun run test:e2e e2e/awards-information-access-and-content.spec.ts e2e/awards-information-category-navigation.spec.ts e2e/awards-information-responsive-layout.spec.ts`
- Exit code: **1** (real `$?`)
- Result: 25 failed, 2 passed, 27 total
- Raw output: `evidence/e2e-red-output.txt`
- Evidence JSON: `evidence/red-evidence.json`

## Failure reasons (per spec, first three by file line)
- access-and-content: `:53` ID-0, `:71` ID-2, `:78` ID-3 fail on `toBeVisible` for `getByTestId('awards-information')`, element not found. The page still renders Coming soon.
- category-navigation: `:64` ID-9, `:75` D007, `:86` BR-002 fail in the `awards-information` precondition. Deep link `#mvp` fails on `active item for mvp` (no item carries `aria-current="location"`).
- responsive-layout: `:42` FR-406, `:67` FR-407 @768 and @375, `:82` D009 fail on the same missing `awards-information` testid.

## Already passing, with reason
- ID-1 (guest on `/awards-information` goes to `/login`): route protection is unchanged.
- ID-14 (unknown route under `/awards-information` answers 404): Next's default 404 is unchanged.
- Homepage access spec: 9/9 pass (exit 0) after the loop edit.

## Coverage map
- TC ID-0..ID-14: each maps to a test. ID-11 is inside the ID-9/ID-11 test.
- AC1..AC12: AC1 (ID-0/1/2), AC2 (ID-3), AC3 (ID-4), AC4 (ID-5), AC5 (ID-6/7), AC6 (ID-8/12), AC7 (ID-9/10/11), AC8 (scroll-spy), AC9 (deep link and homepage card), AC10 (ID-13), AC11 (responsive), AC12 (English switch).

## Caveats for the UI and tester phases
- ID-14 tests the unknown-route 404 (clarifications). It does not simulate a broken Chi tiết network failure. Recorded as an interpretation.
- ID-10 asserts that the computed style of an inactive item changes on hover. It does not pin the exact colour, which is a visual-phase check.
- The English switch test asserts only the absence of raw `awards.*` keys and the VN label. The EN copy is not fixed by the sources, so there is no positive EN string.
- The VN values come from the test-case CSV and clarifications D006. They have not been diffed against Figma. Exact strings are a visual-phase check.
- The no-flicker test watches the `aria-current` attribute only. A flicker that changes only a class is not covered.
- Single RED run. Flakiness was not re-run. The run took 5.6 min for 27 tests; expect timeouts (5 s per assertion) to dominate while the page is absent.
- Homepage access spec was run on its own (9 tests); the full suite was not run (scope contract: no app code changed).

**Status:** DONE
**Summary:** Awards RED baseline is valid: exit 1, 25 failed on the missing awards screen, 2 passing by design. Homepage access spec 9/9 green after the one-loop edit.
**Concerns/Blockers:** ID-14 interpreted as the unknown-route 404. Exact VN strings and EN copy are not yet verified against Figma.

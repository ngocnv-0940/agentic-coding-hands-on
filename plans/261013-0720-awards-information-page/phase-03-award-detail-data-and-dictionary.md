---
phase: 3
title: "Award detail data + vi/en dictionary"
feature: awards-information
status: completed
priority: P1
effort: 2h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [1]
soft_depends_on: ["phase-02 step 1: momorph/awards-information-copy-vi.md (VN copy only)"]
---

# Phase 03 — Award detail data model + dictionary keys

## Context Links
- `clarifications.md` (D005 full descriptions verbatim Figma, D006 same labels on all cards, D008 Kudos)
- `momorph/awards-information-copy-vi.md` (verbatim VN, produced by phase 2 step 1), `momorph/awards-system-specs.csv`
- Spec: `functional-spec.md` FR-001, FR-002, FR-203, BR-001, BR-003; `technical-spec.md` §4.2, §4.4 A0
- Code: `lib/awards/award-categories.ts` (read-only), `lib/i18n/dictionary-{vi,en}.ts`, `lib/i18n/dictionary-home-{vi,en}.ts`, `lib/i18n/get-dictionary.ts`

## Overview
Add the per-award detail data (quantity, unit, prize lines, full description key) and every new page string in vi/en. No UI, no behavior.

## Key Insights
- `home.award.<slug>.description` is the clamped homepage copy (e.g. "Vinh danh top cá nhân xuất sắc…") — NOT the full D.1–D.6 text → new `awards.<slug>.description` keys (D005, RISK-02). Titles reuse `home.award.<slug>.title` (DRY) unless Figma card title differs.
- Menu label ≠ card title for MVP ("MVP" vs "MVP (Most Valuable Person)") → separate `awards.menu.<slug>` keys.
- Parity is compile-time: `Dictionary` derives from `vi`; spreading `awardsVi` into `vi` and `awardsEn` into `en` keeps it (`as const`).
- New file `lib/awards/award-details.ts` keyed by `AwardSlug` instead of widening `AwardCategory` → homepage consumers untouched (zero blast radius).
- Signature 2025 has two prize lines (cá nhân / tập thể) → `prizes` is an array.

## Requirements
FR-001, FR-002, FR-203, FR-204 (Kudos keys only if D008 says the copy differs), BR-001, BR-003, D005, D006; SC-002, SC-008.

## Architecture
```
lib/awards/award-details.ts
  type AwardDetail = {
    slug: AwardSlug
    menuLabelKey: `awards.menu.${AwardSlug}`
    descriptionKey: `awards.${AwardSlug}.description`
    quantity: { valueKey; unitKey }          // e.g. '10' / 'Đơn vị'
    prizes: readonly { valueKey; noteKey }[] // Signature: 2 entries
  }
  AWARD_DETAILS: readonly AwardDetail[]      // same order as AWARD_SLUGS (BR-001)
lib/i18n/dictionary-awards-vi.ts / -en.ts   → spread into vi / en
```
Key groups (names indicative): `awards.hero.keyvisualAlt`, `awards.caption`, `awards.title`, `awards.menu.label` (nav aria-label), `awards.menu.<slug>`, `awards.label.{quantity,prize}`, `awards.<slug>.{description,quantity,unit}`, `awards.<slug>.prize.<n>.{value,note}`, `awards.kudos.*` only if D008 variant.
VN examples (verify against the artifact, Figma wins): quantity `10`/`Đơn vị`, prize `7.000.000 VNĐ`/`cho mỗi giải thưởng`; `02 Tập thể` + `15.000.000 VNĐ`; `03 Cá nhân` + `7.000.000 VNĐ`; `01 Cá nhân` + `10.000.000 VNĐ`; Signature `01` + `5.000.000 VNĐ (cá nhân)` + `8.000.000 VNĐ (tập thể)`; MVP `01` + `15.000.000 VNĐ`.

## Related Code Files
Create: `lib/awards/award-details.ts`, `lib/i18n/dictionary-awards-vi.ts`, `lib/i18n/dictionary-awards-en.ts`.
Modify: `lib/i18n/dictionary-vi.ts`, `lib/i18n/dictionary-en.ts` (one spread line each).

## Implementation Steps
1. Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (dictionary stays server-side; only strings cross to client).
2. `award-details.ts` per Architecture (typed template-literal keys so a typo fails tsc).
3. Keys + EN authored copy first; VN verbatim from `momorph/awards-information-copy-vi.md` (artifact missing → status NEEDS_CONTEXT for VN long copy only; never invent).
4. Spread into main dictionaries; keep every file <200 lines (split descriptions into a third file if needed).
5. `bunx tsc --noEmit` (parity), `bun run lint`.

## Todo List
- [x] `lib/awards/award-details.ts`
- [x] `dictionary-awards-{vi,en}.ts` + spreads (`lib/i18n/dictionary-vi.ts:22`, `dictionary-en.ts:23`)
- [x] VN copy verbatim from artifact (`momorph/awards-information-copy-vi.md`; visual check: card copy matches)
- [x] tsc 0 (parity), lint 0 (`evidence/tsc-final2-output.txt`, `evidence/lint-final2-output.txt`)

## Success Criteria
tsc 0 (proves vi/en parity and key typing), lint 0, every value in the copy artifact present verbatim in vi, no `home.*` key changed. Awards E2E content tests go GREEN only after phase 5.

## Scope Contract
- **Changed:** `lib/awards/award-details.ts` (new), `lib/i18n/**` (additive keys).
- **Impacted:** every page using `Dictionary` (additive only).
- **Will verify:** tsc parity, lint; `e2e/language-selector-localization.spec.ts` (locale behavior intact).
- **Deliberately skipped:** awards E2E (not wired until phase 5).

## Risk Assessment
| Risk | L | I | Countermove |
|---|---|---|---|
| Copy artifact late / incomplete | M | M | keys + EN first; VN fill last; NEEDS_CONTEXT, never invent |
| Short homepage copy reused by mistake | M | H | separate `awards.<slug>.description` keys; E2E asserts description ≠ homepage card text and not clamped |
| Dictionary file >200 lines | M | L | split long descriptions into own file |
| Label/value split mismatches Figma rendering | M | L | value + unit/note as separate keys; Track A decides styling |

## Security Considerations
Static strings only; no user input.

## Rollback
Revert commit; additive keys and a new unused module.

## Next Steps
Phase 5 maps `AWARD_DETAILS` + dict onto Track A props.

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/261013-0720-awards-information-page/clarifications.md
- testPolicy: e2e-red-first

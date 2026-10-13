---
phase: 2
title: "Awards information presentational UI (Track A)"
feature: awards-information
status: completed
effort: 5h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Awards Information UI (Track A)
**Screen:** Hệ thống giải — fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `zFYDgyj_pD`, node `313:8436`; `momorph/awards-system-{specs,test-cases}.csv`, `spec/awards-information/screens/SCR-awards-information/spec.md` (E01–E19, §9, §10), `clarifications.md`. RED read-only: `evidence/red-evidence.json`; selector contract = phase-01 Architecture.
**Goal:** Pixel-faithful, prop-driven hero/title, category menu, 6 award detail cards and screen shell (FR-201..205, FR-406, FR-407, D009 visuals) — no `lib/i18n`, no hooks, no scroll logic.
**Step 1 (unblocks phase 3):** extract every Figma text node verbatim (node id → VN text: caption, title, 6 menu labels, 6 titles + full descriptions D.1–D.6, quantity/prize labels, values, units, Kudos D1/D2 copy) to `momorph/awards-information-copy-vi.md`; note whether node `335:12023` matches homepage `KudosPromo` copy/layout.
**Owned files:** `app/(main)/_components/awards-information/**` (e.g. `awards-information-screen.tsx`, `awards-information-hero.tsx`, `awards-category-menu.tsx`, `award-detail-card.tsx`), `public/images/awards-information/**` (only if keyvisual differs), `momorph/awards-information-copy-vi.md`, `kudos-promo.tsx` (additive optional variant prop only, homepage default unchanged). Each file <200 lines.
**Out of scope:** `page.tsx`, `_wiring/**`, `_behavior/**`, `lib/**`, layout/header/footer, any other `_components/*` file, active-state logic, `replaceState`.
**Integration contract (all strings/hrefs via props):**
- `AwardsInformationScreen({ hero: { keyvisualAlt; caption; title }, menu: ReactNode, awards: AwardDetailCardData[], labels: { quantity; prize }, kudos: KudosPromoProps })`.
- `AwardDetailCardData = { slug; title; description; imageSrc; quantity: { value; unit }; prizes: { value; note }[] }` → `<section id={slug} aria-labelledby>` + responsive `scroll-margin-top` clearing the 80px header (+ tab row below 1024); stacked <768, side by side alternating ≥768 (D009). Reuse `/images/homepage/awards/<slug>.png` 336×336.
- `AwardsCategoryMenu({ ref, ariaLabel, items: { slug; label }[], activeSlug, onSelect(slug, e) })` → ONE `<nav>`: ≥1024 vertical sticky under header; <1024 single-row `overflow-x-auto` tabs (sticky under header); `<a href="#slug">`, active = `aria-current="location"` + gold + underline; hover style; `ref` on the scrolling list.
- No `overflow-hidden/auto` on any ancestor of the sticky menu (use `overflow-x-clip`).
**Checks:** `bunx tsc --noEmit`, `bun run lint`, homepage E2E untouched if `kudos-promo.tsx` changed; asset coverage vs MoMorph saved to `evidence/`. GUI tests go GREEN only after phase 5.

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/261013-0720-awards-information-page/clarifications.md
- testPolicy: e2e-red-first

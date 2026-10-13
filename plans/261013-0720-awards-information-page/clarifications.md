# Clarifications — Awards Information (/awards-information)

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD (fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `zFYDgyj_pD`, Figma node `313:8436`, frame "Hệ thống giải")
Sources: `momorph/awards-system-specs.csv` (23 items), `momorph/awards-system-test-cases.csv` (15 cases)

## Session 2026-10-13

- Q: Route — MoMorph TCs say `/he-thong-giai`, but the homepage header, footer and award cards already link to `/awards-information#<slug>`? → A: Keep `/awards-information`. The page replaces the "Coming soon" placeholder in place. TC ID-0/1/2 run against `/awards-information`.
- Q: Left category menu (C) below 1024px (Figma is desktop only)? → A: Horizontal scroll tabs: a single row pinned above the cards, scrolling sideways, with the same active styling (gold + underline).
- Q: When does the active menu item change? → A: On click (smooth scroll to the section), plus scroll-spy (the section in view sets the active item), plus deep link (`/awards-information#mvp` activates MVP and scrolls to it).
- Q: Desktop menu position? → A: Sticky under the sticky site header while D.1–D.6 scroll past.

## Derived decisions (from specs/design/existing code, not re-asked)

- Test policy: `e2e-red-first`. The screen has behavior (menu click → scroll + active state, scroll-spy, hash deep link, CTA navigation). The project already has `@playwright/test` (`bun run test:e2e`).
- Access: the route is already protected (proxy + `(main)` layout → guest goes to `/login`). No auth change.
- Section anchor ids = the existing slugs in `lib/awards/award-categories.ts` (top-talent, top-project, top-project-leader, best-manager, signature-2025-creator, mvp), so the homepage card links keep working.
- Award images: reuse `public/images/homepage/awards/<slug>.png` (336×336). Keyvisual: reuse `public/images/homepage/keyvisual.png` unless the Figma node differs.
- Sun* Kudos block (D1): reuse the homepage `KudosPromo` component if it matches the Figma node; "Chi tiết" → `/sun-kudos` (same tab, existing protected placeholder). An unknown route falls back to Next's 404 (TC ID-14).
- Invalid hash (TC ID-13): unknown `#id` → no JS error, page stays at top, no item becomes active beyond the default (first item).
- Copy: Vietnamese verbatim from Figma nodes (titles, descriptions, quantity/unit labels, prize values). English authored by us into the existing `lib/i18n` dictionaries (VN/EN parity type).
- Header nav item "Awards Information" is active on this route (existing behavior from F003).
- Visual values come from MoMorph/Figma design data only; Figma wins over spec text when copy differs.

## Session 2026-10-13 (spec gaps — Stage 1.5 Step 3)

- Q: [D007] Update the URL `#hash` on menu click? → A: Yes, on click only, via `history.replaceState` (no Back-button entry). Scroll-spy never touches the URL.
- Q: [D009] Award card layout below desktop? → A: Below 768px stack (image on top, content below); from 768px up, image and content side by side, alternating as in Figma.
- Derived (Figma authoritative, not asked): [D005] the 6 full award descriptions are verbatim from Figma nodes D.1–D.6 (not the homepage 2-line copy). [D006] Cards 2–6 use the same "Số lượng giải thưởng:" / "Giá trị giải thưởng:" labels as Top Talent (visible in the frame). [D008] Sun* Kudos block: reuse `KudosPromo` when node `335:12023` matches; where copy or layout differs, Figma wins (add a variant, never edit the homepage instance).

## Session 2026-10-13 (forge — Figma vs test-case copy)

- Derived (Figma authoritative per project rule, not asked): caption is `Sun* Annual Awards 2025` (Figma node text), not the lowercase TC ID-4 wording. Top Talent quantity is `10 Cá nhân` (Figma override text); `Đơn vị` in the CSV/TC is only the master layer name. E2E expectations are corrected to Figma by the tester (assertion strength unchanged).
- Derived: Sun* Kudos block on this page uses `KudosPromo variant="wide"` (Figma 335:12023 is 1152×500, text column 457px, logo 79px from right); homepage default unchanged.

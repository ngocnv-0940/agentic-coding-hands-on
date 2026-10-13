---
phase: 2
title: "Homepage screen presentational UI (Track A)"
feature: F003
status: completed
effort: 6h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Homepage UI (Track A)
**Screen:** Homepage SAA — fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `i87tDx10uM`; `momorph/homepage-specs.csv`, `momorph/homepage-test-cases.csv`, `spec/homepage/screens/SCR-homepage/spec.md` (E01–E25, R1–R8, §9 a11y, §10 responsive), `clarifications.md`. RED: `reports/tester-red-evidence.md` (redTestFiles/redCommand/redExitCode/redFailure, read-only); selector contract = phase-01 Architecture table.
**Goal:** Pixel-faithful, prop-driven components for header, hero/keyvisual, countdown display, event info, CTAs, Root Further, awards grid, Kudos, widget, footer (FR-201..212 visuals) — no data, no Supabase, no `lib/i18n` imports, no timers.
**Step 1 (unblocks phase 4):** extract every Figma text node verbatim (node id → VN text: nav, hero, event labels, Root Further paragraphs + quote, awards caption/title/subtitle, 6 titles + descriptions, Kudos eyebrow/title/body, footer, copyright) to `momorph/homepage-copy-vi.md`. Download assets to `public/images/homepage/**`; award images MUST be `/images/homepage/awards/<slug>.png` (BR-006 slugs).
**Owned files:** `app/(main)/_components/**` (e.g. `site-header.tsx`, `header-nav.tsx`, `header-icon-button.tsx`, `site-footer.tsx`, `widget-button.tsx`, `home-hero.tsx`, `countdown-display.tsx`, `event-info.tsx`, `hero-cta-links.tsx`, `root-further-content.tsx`, `awards-section.tsx`, `award-card.tsx`, `kudos-promo.tsx`, `home-screen.tsx`, `home-fonts.ts`), `public/images/homepage/**`, `app/globals.css`, `momorph/homepage-copy-vi.md`. Each file <200 lines.
**Out of scope:** `app/(main)/layout.tsx`, `page.tsx`, `_behavior/**`, `_wiring/**`, placeholder pages, `lib/**`, `proxy.ts`, dropdown open/close logic + menu panels (phase 5), countdown math (phase 4), dictionary content, widget quick-action menu (deferred), notification badge.
**Integration contract (all strings via props; `href`s via props):**
- `SiteHeader({ logoAlt, nav: NavItem[], onNavClick?, notifications: ReactNode, languageSelector: ReactNode, account: ReactNode })`; `NavItem = { key: 'about'|'awards'|'kudos'; href; label; active }` → active gets `aria-current="page"` + Figma selected style; sticky `banner`; `onNavClick?(href, e: MouseEvent<HTMLAnchorElement>)` fires for nav + logo (header and footer; behavior from phase 5).
- `HeaderIconButton` = `forwardRef` 40×40 `<button>` spreading all button props + `{ icon: 'bell'|'account'; label }` (aria-label); trigger for phase-5 menus.
- `SiteFooter({ logoAlt, links: { href; label }[], copyright, onNavClick? })` — `contentinfo`. `WidgetButton({ label })` fixed bottom-right, no action.
- `CountdownDisplay({ days, hours, minutes: string; labels: { days; hours; minutes }; comingSoonText: string | null })` — null hides Coming soon; testids per contract.
- `HomeScreen({ hero: { countdown: ReactNode; event: { dateLabel; date; venueLabel; venue; livestream }; ctas: { awards: LinkProps; kudos: LinkProps } }, rootFurther: { paragraphs: string[]; quote }, awards: { caption; title; subtitle; detailLabel; items: AwardCardData[] }, kudos: { eyebrow; title; body; detailLabel; href; imageAlt } })`; `LinkProps = { href; label }`, `AwardCardData = { slug; title; description; imageSrc; href }` — whole card one `<a>`, 3 cols ≥ lg / 2 cols below, 2-line clamp, hover lift.
- `home-fonts.ts` exports `homeFontClassName` (Figma families/weights, `vietnamese` subset). Layout applies it (phase 6).
**Checks:** `bunx tsc --noEmit`, `bun run lint`, asset coverage vs MoMorph. GUI tests go GREEN only after phase 6 wiring.

## Status (sync-back)
Done: step 1 copy artifact `momorph/homepage-copy-vi.md` present; all owned `_components/**` files present; `public/images/homepage/**` present; tsc/lint exit 0 (`evidence/tsc-impl-output.txt`, `evidence/lint-impl-output.txt`); GUI tests GREEN via phase 6.
Scope drift: polish rounds after initial build (mobile countdown, header nav from `lg`, fluid awards grid, Kudos logo anchor). Reason: visual fidelity against Figma. Cost: extra correction rounds (count not recorded). Header nav hidden below `lg` with no mobile alternative (deferred, see plan Unresolved).
Not evidenced: asset-coverage check vs MoMorph (no saved record).

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/261008-1705-homepage-saa/clarifications.md
- testPolicy: e2e-red-first

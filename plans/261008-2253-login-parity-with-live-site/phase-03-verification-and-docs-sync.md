---
phase: 3
title: "Verification + docs sync"
status: done (3A done with concerns; 3B done)
owner: tester, doc-writer
test_policy: visual-contract
blockedBy: [1, 2]
---

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Language dropdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2
- Clarifications: plans/261008-2253-login-parity-with-live-site/clarifications.md
- testPolicy: visual-contract

## 3A — tester

Scope Contract: see `plan.md`. Do not widen to other specs.

1. Gates: `npx tsc --noEmit`, `bun run lint`, `bun run build`.
2. E2E (must stay green, no assertion edits): `bunx playwright test e2e/login-screen-layout-and-button.spec.ts e2e/language-selector-localization.spec.ts e2e/homepage-header-and-menus.spec.ts`.
3. Visual compare: dev server (`bun run dev -p 3200`), then run `evidence/measure-breakpoint-boxes.mjs` and `evidence/capture-page-screenshots-and-styles.mjs` against local and live (`https://saa.sun-asterisk.vn/login?redirect=%2F`); extend viewport list to 375/768/1024/1440/1920 (copy script to scratch if editing). Save outputs under `evidence/after-*`.
4. Pass bar (vs measurements report): at 375/768/1024/1920 logo x, hero size, text x + 20/40, label 22px, footer height match live ±2px; at 1440 header padding 144, hero 144/451×200, text x 160, button 305×60, footer 91 (= Figma); text weight 700 everywhere.
5. Dropdown: open on `/login` and homepage, screenshot, compare with `evidence/figma-language-dropdown-hUyaaugye2.png` (panel p6 / bg #00070C / border #998C5F / items h56 / selected rgba(255,234,158,.2)); chevron rotated while open.
6. EN check: `NEXT_LOCALE=en` → "Login to explore!" and "Copyright © 2025 Sun* All rights reserved".
7. Material mismatch → return bounded fix to `momorph-ui-implementer` (phase 1), never weaken tests.

## 3B — doc-writer (after 3A green)

- `docs/screens/SCR001_Login/spec.md` §10 Responsive: replace "thu nhỏ cỡ chữ và padding" rows with actual rules (container 1152 + side padding 12/24/32, hero 120/160/451, gap 40→80 at `lg`, text indent only `lg`+, text 20/40 + label 22 + footer 16 all sizes, footer py 24 below `md`, background right-center below `lg`); source = this plan's `clarifications.md`.
- `docs/features/F002_Localization/functional-spec.md`: note in D003 that EN tagline/footer follow the live site ("Login to explore!", "Copyright © 2025 Sun* All rights reserved"), superseding "authored by us" for those two strings.
- Language selector styling note only if SCR001 describes menu visuals.

## Success criteria
All gates + 3 specs green; pass bar met; docs updated; report at `reports/tester-*.md`.

## Risks
Live site may change or be unreachable → compare against saved `evidence/real-*.png` + measurements report instead.

## Delivered / status

**3A (tester): done with concerns.** Source of truth: `reports/tester-261008-login-parity-verification.md`, section "Re-run 2" (its top "BLOCKED" status is superseded).
- Gates: tsc, lint, build exit 0.
- E2E: 3 specs 32/32 at `--workers=1`, exit 0. Default config (4 workers) is still flaky in `homepage-header-and-menus.spec.ts` (runs 1 and 3, cold-compile timeouts). Unresolved.
- Numbers: 375 and 768 match live; 1024 matches after the `xl:` fix; 1440 matches Figma. 1920 keeps the accepted footer 91 vs live 73 (≥1280 rule); 1920 logo/text x 384/400 vs live 348 is a known deviation.
- EN check and login dropdown: pass (run 1). Homepage dropdown: not measured.
- Accepted deviations are in `clarifications.md` (lines 26–33), including the 1440 hero→text gap of 80 vs live 40.

**3B (doc-writer): done (2026-10-09).** Updated SCR001 §10, F001 D001/D003, F002 D003, docs/project-changelog.md. Final e2e on final code (after review fix): 32/32, --workers=1, exit 0; evidence gate SEALED.

Done criteria still open: homepage dropdown measured; default-config 3-spec run green.

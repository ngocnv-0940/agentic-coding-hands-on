---
phase: 2
title: "Login screen presentational UI (Track A)"
feature: F001,F002
status: completed
effort: 4h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Login screen UI (Track A)
**Screen:** Login — fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `GzbNeVGJHz`; specs `momorph/login-specs.csv`, `spec/auth/screens/SCR-login/spec.md` (E01–E10, R1–R3, §9 a11y, §10 responsive), `clarifications.md`.
**Goal:** Pixel-faithful, prop-driven Login components (no data, no Supabase, no i18n imports) that satisfy the phase-01 selector contract (F001:FR-201/202/203 visuals; F002:FR-201/202/203).
**Owned files:** `app/login/_components/**` (e.g. `login-screen.tsx`, `login-header.tsx`, `login-footer.tsx`, `login-hero-intro.tsx`, `login-button.tsx`, `login-error-message.tsx`, `language-selector.tsx`), `public/images/login/**` (logo, key visual, VN + UK flags same size, Google icon), `app/globals.css`. Each file <200 lines.
**Out of scope:** `app/login/page.tsx`, containers, `app/layout.tsx`, `lib/**`, Supabase calls, cookie writes, dictionary content, `/todo`, `package.json`.
**Integration contract (props only; strings always arrive as props):**
- `LoginScreen({ title, subtitle, tagline, footerText, logoAlt, languageSelector: ReactNode, loginArea: ReactNode })` — header `banner` (logo left, selector right, fixed), hero `data-testid="login-hero"` (decorative, `alt=""`), footer `contentinfo` fixed.
- `LoginButton({ label, loadingLabel, loading, disabled, onClick })` — hover shadow; when `loading`: `disabled`, spinner with `role="status"` + sr-only `loadingLabel`.
- `LoginErrorMessage({ message })` — `role="alert"` under the button; renders nothing when `message` empty.
- `LanguageSelector({ locale: 'vi'|'en', labels: { vi, en, menu }, onSelect(locale), pending? })` — owns menu open/closed (F002:SM-001): Enter/Space toggle, Escape + outside click close, Tab to options, no arrow-key nav; trigger `data-testid="language-selector-trigger"` with `aria-expanded`, flag + code + chevron; options `language-option-vi|en`; choosing current locale only closes (F002:DEC-002).
**Responsive:** below `md` scale type/padding only; logo left, selector right; no horizontal scroll.
**Checks:** `bunx tsc --noEmit`, `bun run lint`, asset coverage vs. MoMorph. Phase-01 GUI tests go GREEN only after phase 07 wiring.

## Delivery Status (reconciled 2026-10-08)
- Done: `app/login/_components/` (login-screen, header, footer, hero-intro, button, error-message, language-selector), `public/images/login/` (logo, real `key-visual.webp`, `flag-vn.svg`, `flag-gb.svg` same size, `chevron-down.svg`, `google.svg`, `root-further.png`).
- Correction round 1 and 2 (user-driven): real Figma key visual, gradients at node bounds, rest-state box-shadow none, CTA 305px wide.
- Visual result: hero matches; CTA label and footer text ~2–3% wider than Figma, accepted by user as font tolerance (`evidence/visual/`, `clarifications.md`). Hover and menu states have no Figma reference frame.
- Checks: tsc 0, lint 0 (`evidence/temper-results.json`).

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: /home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-0850-login-page-supabase-google/clarifications.md
- testPolicy: e2e-red-first

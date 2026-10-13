---
title: "Login parity with live site (Figma wins)"
description: "Make /login match saa.sun-asterisk.vn/login below 1440px and fix the language dropdown to Figma hUyaaugye2; desktop 1440 stays Figma-identical."
status: done
priority: P2
effort: 4h
branch: feat/login-responsive-sizing
tags: [login, responsive, momorph, i18n, visual-parity]
created: 2026-10-08
work_type: feature
spec:
  - docs/features/F001_Auth/
  - docs/features/F002_Localization/
blockedBy: []
blocks: []
---

# Login parity with live site

Rule: **Figma wins; the live site only fills what Figma does not define.** Decisions: `clarifications.md` (authoritative, do not re-ask). Numbers: `reports/live-vs-local-login-diff-measurements.md`. testPolicy `visual-contract` (presentational + responsive only, no new behavior).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Track A: login presentational parity + language dropdown](phase-01-login-presentational-parity-and-language-dropdown.md) — momorph-ui-implementer, 2h | done |
| 2 | [EN dictionary copy](phase-02-en-dictionary-copy.md) — generic edit, 15m | done |
| 3 | [Verification + docs sync](phase-03-verification-and-docs-sync.md) — tester + doc-writer, 1.5h | done |

Dependencies: 1 ∥ 2 (disjoint files) → 3.

## Data flow

Server `page.tsx` reads `NEXT_LOCALE` → dictionary (vi/en) → `LoginScreen` props (strings) → header/hero/footer render. Only class names and two EN strings change; props, wiring, auth and cookie flow untouched.

## File ownership

- Phase 1: `app/login/_components/{login-screen,login-header,login-hero-intro,login-button,login-footer,language-selector}.tsx`
- Phase 2: `lib/i18n/dictionary-en.ts`, `lib/i18n/dictionary-home-en.ts`
- Phase 3: no source; doc-writer owns `docs/screens/SCR001_Login/spec.md`, `docs/features/F002_Localization/functional-spec.md`

## Scope Contract

- **Changed:** Tailwind classes in 6 login components (container, hero sizes, gaps, text/label/footer sizes, background anchoring below `lg`, disabled opacity, language trigger/menu styling); 2 EN strings.
- **Impacted:** homepage header (reuses `LanguageSelector` via `app/(main)/_wiring/site-header-container.tsx`); login + localization e2e asserting geometry/strings.
- **Will verify:** `npx tsc --noEmit`, `bun run lint`, `bun run build`; e2e `login-screen-layout-and-button`, `language-selector-localization`, `homepage-header-and-menus`; Playwright screenshot/box compare vs live at 375/768/1024/1440/1920 and vs Figma at 1440.
- **Deliberately skipped:** auth-flow and other homepage specs (no auth/routing/props change); unit tests (class-only change, no logic).

## Risks

| Risk | L | I | Countermove |
|------|---|---|-------------|
| 1440 drifts from Figma after container refactor | M | H | Container math gives 144px at 1440; tester box-checks 1440 against Figma numbers |
| Homepage header dropdown regresses | M | M | Run homepage header spec; visual check of homepage dropdown |
| 22px label overflows at 375 | L | M | Login spec "no horizontal scroll at 375" + screenshot |

Rollback: each phase is one commit; `git revert` it. No data, schema, or API touched.

## Done (observable)

- Box numbers at 375/768/1024/1920 match live within ±2px for logo x, hero size, text x/size, button label, footer height; 1440 unchanged vs current (= Figma).
- Dropdown matches Figma `hUyaaugye2` on login and homepage.
- 3 e2e specs green; compile/lint/build green; docs synced.

Resolved 2026-10-08: homepage EN footer `home.footer.copyright` also follows the live site (phase 2).

## Delivered (status 2026-10-09)

Met: gates (tsc, lint, build); 375/768/1024 match live (±2); 1440 = Figma; login dropdown = Figma `hUyaaugye2`; EN strings. Accepted deviation: 1920 (logo/text x, footer 91 vs 73) per `clarifications.md`, which amends the Done bullet above.
Not met: homepage dropdown unmeasured; 3 specs green only at `--workers=1`.

Scope drift (costs in phase files): homepage EN footer (phase 2); button kept `w-fit`; desktop spacing `lg` → `xl`.

Risks:
- CLOSED: 1440 drift; 22px label overflow at 375; login dropdown regression.
- OPEN: 4-worker flake in homepage-header spec. Owner: main agent (decision), tester (verify).
- OPEN: homepage dropdown unmeasured. Owner: tester.
- OPEN (deferred Low): EN footer wrap at 375; chevron motion-reduce; homepage menu panel style. Owner: momorph-ui-implementer, follow-up.

Next moves:
1. doc-writer: 3B done (2026-10-09).
2. Main agent: decide the flake fix (config workers or helper wait; no assertion edits). Done when the 3-spec command exits 0 on default config, 3 runs in a row.
3. tester: measure homepage dropdown and EN footer at 375. Done when the numbers are in the tester report.
4. Main agent: commit per phase on `feat/login-parity-live-site` (conventional, no AI refs), then set status `done`. Done when the commits exist and 1–3 are closed.

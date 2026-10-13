---
phase: 1
title: "Track A: login presentational parity + language dropdown"
status: done
owner: momorph-ui-implementer
mode: screen
test_policy: visual-contract
---

## MoMorph refs:
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Language dropdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2
- Clarifications: plans/261008-2253-login-parity-with-live-site/clarifications.md
- testPolicy: visual-contract

**Goal:** apply every "Derived decisions" item in `clarifications.md` (Figma-defined + Figma-silent→live) to the 6 owned files; ≥1440 stays pixel-identical to Figma.

**Owned files:** `app/login/_components/{login-screen,login-header,login-hero-intro,login-button,login-footer,language-selector}.tsx`

**Notes (from clarifications + measurements report):**
- Container: outer `px-3 sm:px-6 md:px-8`, inner `mx-auto w-full max-w-[1152px]`; shared by header and main (yields 144 at 1440, centered beyond).
- Hero img `h-[120px] w-auto sm:h-40 lg:h-auto lg:w-[451px]`; stack `gap-10 lg:gap-20`; text `pl-0 lg:pl-4`, 700 20/40 all sizes; label 22px all sizes; `disabled:opacity-50`; footer `py-6 md:py-[33px]` text 16px.
- Background below `lg`: key visual `inset-0`, `object-[right_center]`; `lg:` keeps current layers.
- Dropdown/trigger values: read Figma `hUyaaugye2` via MCP; `#FFEA9E1A` hover, chevron `rotate-180` when open, menu `mt-2 right-0 shadow-lg`.

**Out of scope:** logo link (stays non-interactive), button hover (keeps shadow), VI label/copy, fixed header/footer, loading/error states, auth, cookie/locale logic, props/wiring, homepage files.

**plannedChecks:** `npx tsc --noEmit`, `bun run lint`, asset coverage (no new assets expected). Visual evidence is tester-owned (phase 3). `testRunner: playwright`, `redTestFiles: []`, `redCommand/redExitCode/redFailure: not-applicable`, `redEvidence: not-applicable (visual-contract)`.

## Delivered

**Status: done** (2026-10-09). Agent `momorph-ui-implementer`; 6 files in `app/login/_components` restyled; props, wiring and auth untouched. Gates in phase 3A: tsc, lint, build exit 0.

Scope drift (orchestrator follow-ups, each recorded with cost):
- **Formatting:** agent used prettier defaults; restored repo style (`--no-semi --single-quote --print-width 140`). Cost: one format pass, no logic change.
- **Button width:** kept `w-fit`, label `w-[225px]` at all sizes. Agent had made the button full-width below `lg`; live is about 350px, not full width. Cost: deviates from the first note; matches live.
- **Desktop spacing `lg` → `xl`:** gap-20, pl-4 and footer py-[33px] now start at `xl` (1280). The `lg:` values in Notes above are superseded. Cost: 1024 matches live (text x 32, gap 40, footer 73); 1440 unchanged (= Figma).
- **Selected language item:** hover/focus bg override removed (review Low #1). Verified in `language-selector.tsx:99`. Note: the review verdict still lists this as "Accept"; the code change went beyond it.

---
phase: 2
title: "Prelaunch presentational UI (Track A)"
feature: countdown-prelaunch
status: completed
effort: 3h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Prelaunch UI (Track A)
**Screen:** Countdown - Prelaunch page, fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `8PJQswPZmU`, node `2268:35127`. Inputs: `momorph/countdown-prelaunch-{specs,test-cases}.csv`, `momorph/countdown-prelaunch-frame.png`, `spec/countdown-prelaunch/screens/SCR-countdown-prelaunch/spec.md` (E01–E08), `clarifications.md`. RED read-only: `evidence/red-evidence.json`. Selector contract: phase-01 Architecture.
**Goal:** Pixel-faithful, prop-driven full-viewport screen (background + overlay, h1 title, countdown slot) and LED tiles at the Figma size. No `lib/**`, no hooks, no timers.
**Owned files:** `app/prelaunch/_components/prelaunch-screen.tsx` (+ one sibling at most), `public/images/prelaunch/**` (background from node `2268:35129`, downloaded via MoMorph/Figma, extension png/jpg/webp so the proxy matcher serves it pre-launch), `app/(main)/_components/countdown-display.tsx` (additive `size?: 'default' | 'prelaunch'` prop only). Each file <200 lines.
**Out of scope:** `app/prelaunch/page.tsx`, `_wiring/**`, `_behavior/**`, `lib/**`, `proxy.ts`, dictionaries, `(main)` layout/header/footer, any other `_components/*` file.
**Integration contract:**
- `PrelaunchScreen({ title: string, countdown: ReactNode })` → `<main data-testid="prelaunch-screen">` with `homeFontClassName` (cross-import `app/(main)/_components/home-fonts`), full-viewport `prelaunch-background` `img` (`alt=""`, cover, no-repeat, `priority`) + dark overlay, centered `<h1>` (white, Montserrat bold, Figma size) above the slot. Root `min-h-screen`, no horizontal scroll at 375.
- `CountdownDisplay` `size="prelaunch"`: tile/digit/label/gap values measured from node `2268:35139` (frame shows ~77×123 tiles vs homepage 51×82) at ≥1024; below 1024 it falls back to the homepage responsive sizes (no mobile frame; derived, plan follow-up 3). Testids and markup order unchanged. **Default (`size` omitted) class strings byte-identical**: prove it with `git diff` showing only additive branches.
- Caller passes `comingSoonText={null}` (no caption on this frame).
**Checks:** `bunx tsc --noEmit`, `bun run lint`; asset coverage vs MoMorph → `evidence/asset-coverage-phase-02.md`; homepage countdown specs (`e2e/homepage-countdown-*.spec.ts`, default run) stay green because the shared component changed. GUI tests go GREEN only after phase 5.
**Next 16:** read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` before using `next/image` `fill`.

## MoMorph refs:
- Countdown - Prelaunch page: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/261013-1638-countdown-prelaunch-page/clarifications.md
- testPolicy: e2e-red-first

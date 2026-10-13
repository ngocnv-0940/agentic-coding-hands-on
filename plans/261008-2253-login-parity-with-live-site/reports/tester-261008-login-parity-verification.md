# Tester report — login parity verification (Phase 3A)

Status: **BLOCKED** — two pass-bar items mismatch and need a decision; the 3-spec Playwright command is not green on repeated runs (flake in the homepage spec).

Scope: `app/login/_components/*` class changes and EN strings (`login.tagline`, `login.footer`, `home.footer.copyright`). No source or test files were edited in this run. Evidence: `plans/261008-2253-login-parity-with-live-site/evidence/after-*`.

## 1. Gates and exit codes

| Command | Exit | Result |
|---|---|---|
| `npx tsc --noEmit` | 0 | clean |
| `bun run lint` | 0 | clean |
| `bun run build` | 0 | clean, no warnings in output; route table includes `/login`, `/`, `/todo` |
| `bunx playwright test e2e/login-screen-layout-and-button.spec.ts e2e/language-selector-localization.spec.ts e2e/homepage-header-and-menus.spec.ts` (run 1) | 1 | 31 passed, 1 failed |
| `bunx playwright test e2e/homepage-header-and-menus.spec.ts` (run 2, re-run alone per phase rule) | 0 | 11 passed |
| same 3-file command (run 3) | 1 | 30 passed, 2 failed |
| `bunx playwright test e2e/homepage-header-and-menus.spec.ts --workers=1` (run 4, diagnostic only) | 0 | 11 passed |
| `bun run dev -p 3200` | — | ready, returned 200 on /login; stopped by PID afterwards, port 3200 free |
| measurement + dropdown/EN scripts | 0 | all captures written |

Playwright failures, with the error text:

- **Run 1**, `homepage-header-and-menus.spec.ts:73` "Awards Information and Sun* Kudos nav items navigate to their pages": `Expected pattern: /\/sun-kudos$/ Received string: "http://localhost:3100/"`, timeout 5000ms. The nav link is present with `href=/sun-kudos` in the snapshot, so the click either missed or ran before `goto('/')` settled. Not reproduced in run 2.
- **Run 3**, `homepage-header-and-menus.spec.ts:105` "choosing EN switches the homepage...": `Locator: getByTestId('language-selector-trigger') Expected substring: "EN" Received string: "VN"`, 5000ms.
- **Run 3**, `homepage-header-and-menus.spec.ts:117` "choosing VN again restores...": `Test timeout of 30000ms exceeded while running "beforeEach" hook` (login helper, `loginThroughStubbedGoogle`).

Login-screen and language-selector specs passed in every run. Every failure is in the homepage-header spec. Run 4 (1 worker) passed 11/11. Under 4 workers the homepage spec failed in 2 of 3 runs; each failure is a timing miss, not a layout assertion. The timing-miss hypothesis is not proven. The class changes did not touch the homepage nav behaviour.

## 2. Visual numbers (CSS px, `x / w×h`, computed fonts)

Local = `bun run dev -p 3200` (current tree). Live = `https://saa.sun-asterisk.vn/login?redirect=%2F`. Figma = `GzbNeVGJHz` (desktop 1440 only). Raw: `evidence/after-measure-local.json`, `evidence/after-measure-live.json`.

| vw | Item | Local | Live | Figma | Verdict |
|---|---|---|---|---|---|
| 375 | logo x | 12 | 12 | — | PASS |
| 375 | hero | 270.6×120 | 271.3×120 | — | PASS (±2) |
| 375 | text x / font / lh | 12 / 20 / 40 | 12 / 20 / 40 | — | PASS |
| 375 | button label | 22px | 22px | — | PASS |
| 375 | footer h | 73 | 73 | — | PASS |
| 768 | logo x | 32 | 32 | — | PASS |
| 768 | hero | 360.8×160 | 361.8×160 | — | PASS (±2) |
| 768 | text x / font / lh | 32 / 20 / 40 | 32 / 20 / 40 | — | PASS |
| 768 | button label | 22px | 22px | — | PASS |
| 768 | footer h | **91** | 73 | — | **FAIL** (±2 bar) |
| 1024 | logo x | 32 | 32 | — | PASS |
| 1024 | hero | 451×200 | 451×199.4 | — | PASS |
| 1024 | text x | **48** | 32 | — | **FAIL** (±2 bar) |
| 1024 | button x / label x | 48 / 72 | 32 / 56 | — | same cause as text x |
| 1024 | button label | 22px | 22px | — | PASS |
| 1024 | footer h | **91** | 73 | — | **FAIL** (±2 bar) |
| 1440 | logo x | 144 | 108 | 144 | PASS (Figma governs) |
| 1440 | hero | 144, 451×200 | 108, 451×199.4 | 144, 451×200 | PASS |
| 1440 | text x | 160 | 108 | 160 | PASS |
| 1440 | button | 305×60 | 350×60 | 305×60 | PASS |
| 1440 | footer h | 91 | 73 | 91 | PASS |
| 1920 | logo x | 384 | 348 | — | known deviation (container 1152 vs live 1224), recorded, not a failure |
| 1920 | hero x | 384 (451×200) | 348 (451×199.4) | — | known deviation, size PASS |
| 1920 | text x | 400 | 348 | — | known deviation, recorded |
| 1920 | footer h | **91** | 73 | — | **FAIL** (±2 bar) |

Known deviations confirmed (Figma rule, not failures):

- Text weight 700 local vs 400 live at every size. Figma rule.
- Button width 305 local vs 350 live at every size. Figma rule.
- Footer font Montserrat Alternates local vs Montserrat live.

Observations outside the pass bar (recorded, not judged): vertical positions differ, for example hero y at 1024 is 160.5 local vs 182.3 live, and at 1440 it is 226.5 vs 248.3. The language trigger is 2px off live at 375 and 768 (252.7 vs 250.7 at 375).

Screenshots: `evidence/after-local-{375,768,1024,1440,1920}.png`, `evidence/after-live-{...}.png`.

## 3. Dropdown (`hUyaaugye2`), local /login at 1440

Measured with `evidence/after-dropdown-and-en.mjs`.

| Item | Measured | Figma / target | Verdict |
|---|---|---|---|
| Panel padding | 6px | 6px | PASS |
| Panel bg | rgb(0,7,12) = #00070C | #00070C | PASS |
| Panel border | 1px rgb(153,140,95) = #998C5F | #998C5F | PASS |
| Panel radius | 8px | 8px | PASS |
| Item height | 56px each (VN, EN), no gap | 56, no gap | PASS |
| Item padding | 16px | 16 | PASS |
| Selected bg | Chrome `lab(93.1 … / 0.2)`, 20% alpha over #FFEA9E | rgba(255,234,158,.2) | PASS (alpha 0.2 confirmed; exact sRGB not re-derived) |
| Selected radius | 2px | 2px | PASS |
| Hover trigger bg | rgba(255,234,158,.1) | #FFEA9E1A | PASS |
| Chevron | `rotate: none` closed, `rotate: 180deg` open | rotated while open | PASS |
| Visual vs Figma image | dark panel, gold border, stacked rows, highlighted selected row | `figma-language-dropdown-hUyaaugye2.png` | PASS (qualitative) |

Homepage dropdown: **not measured**. The homepage requires login, and the cheap route would be the stubbed-Google helper, which this run did not drive. The homepage header reuses the same `LanguageSelector` component, and `homepage-header-and-menus` tests the menu's options (VN and EN) and language switching, which passed in run 2 and run 4.

## 4. EN check (`NEXT_LOCALE=en`, local /login)

| Item | Expected | Measured | Verdict |
|---|---|---|---|
| `html lang` | en | en | PASS |
| tagline | Login to explore! | "Login to explore!" | PASS |
| footer | Copyright © 2025 Sun* All rights reserved | same | PASS |
| trigger label | EN | EN | PASS |

Screenshot: `evidence/after-en-local-1440.png`.

## 5. Blocking items

1. **Text x at 1024 (48 vs live 32).** `login-hero-intro.tsx` uses `lg:pl-4`, and `lg` is 1024px. The clarifications say "indent only `lg`+", which puts the 16px indent at 1024. Live has no indent at 1024. Bounded fix to consider: `lg:pl-4` → `xl:pl-4`. That gives 1024 → 32 and keeps 1440 → 160, but it contradicts the clarifications' "lg+" rule. **Needs a user decision.** The button x (48 vs 32) moves with it.
2. **Footer height at 768, 1024, 1920 (91 vs 73).** The clarifications' rule ("footer py 24 below `md`") and the Figma 1440 height of 91 both put the footer at 91 from `md` up. Live uses 73 everywhere. The pass bar needs 73 at 1024 and 1920 and 91 at 1440, which one breakpoint cannot give. Options: (a) accept 91 from `md` up as a Figma-driven deviation and loosen the pass bar; (b) special-case a band around 1440 (not recommended). **Needs explicit acceptance.**
3. **E2E flake.** The 3-file command is not green (exit 1 in runs 1 and 3). Homepage spec only, 4-worker load, cold compile. Options: lower `workers` in `playwright.config.ts` on local runs, or add a wait on the server response in the homepage helper. Do not loosen the assertions. Needs a decision on which, if any, to take.

Next step (not done here, per the phase): return items 1 and 2 to `momorph-ui-implementer` once the decision is made. Phase 3B (docs sync) waits for 3A to be green.

## 6. Scripts and evidence

- `evidence/after-measure-and-capture.mjs` (5 viewports, local or live), `evidence/after-dropdown-and-en.mjs` (dropdown and EN check). Both import Playwright from the repo's `node_modules`.
- Screenshots: `evidence/after-{local,live}-{375,768,1024,1440,1920}.png`, `evidence/after-dropdown-local-1440{,-full}.png`, `evidence/after-en-local-1440.png`.
- Raw JSON: `evidence/after-measure-local.json`, `evidence/after-measure-live.json`.
- Playwright logs are in the session scratchpad, not the repo.

**Status:** BLOCKED
**Summary:** Gates pass (tsc, lint, build all exit 0), and the dropdown and EN checks match. Two pass-bar items (1024 text x, footer height at 768/1024/1920) mismatch live and need a decision; the 3-spec Playwright command failed in 2 of 3 full runs with timing flakes in the homepage spec.

## Re-run 2 (after `xl:` class fix)

Scope: `login-hero-intro.tsx` (`lg:gap-20`→`xl:gap-20`, `lg:pl-4`→`xl:pl-4`) and `login-footer.tsx` (`md:py-[33px]`→`xl:py-[33px]`). Decision per `clarifications.md`: Figma desktop spacing from `xl` (≥1280), live below `xl`. The status above is superseded by this section.

### Exit codes

| Command | Exit | Result |
|---|---|---|
| `npx tsc --noEmit` | 0 | clean |
| `bun run lint` | 0 | clean |
| `bunx playwright test e2e/login-screen-layout-and-button.spec.ts e2e/language-selector-localization.spec.ts e2e/homepage-header-and-menus.spec.ts --workers=1` | 0 | 32 passed, 0 failed, 347 s |
| `bun run dev -p 3200` | — | ready, `/login` returned 200; stopped, port 3200 free |
| `node evidence/after2-measure-and-capture.mjs http://localhost:3200/login local <evidence>` | 0 | 768, 1024, 1440 captured |

The homepage flake from runs 1 and 3 did not recur at `--workers=1`. The 4-worker flake is still unresolved (see concerns).

### Measurements (CSS px, local, raw in `evidence/after2-measure-local.json`)

| vw | Item | Local (re-run 2) | Live (prior) | Expected | Verdict |
|---|---|---|---|---|---|
| 768 | text x | 32 | 32 | 32 | PASS |
| 768 | hero→text gap | 40 (hero bottom 488.5, text top 528.5) | 40 (490→530) | 40 | PASS |
| 768 | footer h | 73 | 73 | 73 | PASS (was 91) |
| 768 | hero | 360.8×160 | 361.8×160 | ±2 | PASS |
| 1024 | text x | 32 | 32 | 32 | PASS (was 48) |
| 1024 | button x / w×h | 32 / 305×60 | 32 / 350×60 | x 32 | PASS on x; width is the accepted Figma deviation |
| 1024 | hero→text gap | 40 (380.5 → 420.5) | 40 (381.7→421.7) | 40 | PASS |
| 1024 | footer h | 73 | 73 | 73 | PASS (was 91) |
| 1024 | hero | 451×200 | 451×199.4 | ±2 | PASS |
| 1440 | logo x | 144 | 108 | 144 (Figma) | PASS (Figma) |
| 1440 | hero | x 144, 451×200 | 451×199.4 | 144, 451×200 | PASS |
| 1440 | text x | 160 | 108 | 160 | PASS |
| 1440 | button | 305×60 | 350×60 | 305×60 | PASS (Figma) |
| 1440 | footer h | 91 | 73 | 91 | PASS (Figma) |
| 1440 | hero→text gap | **80** (426.5 → 506.5) | 40 (447.7→487.7) | not specified | **Observation** (see concerns) |

Captures: `evidence/after2-local-{768,1024,1440}.png`. Visual judgment for these three captures was not re-run in this pass. Only the numeric checks above were made.

Not re-measured this run, as the scope said: 375 (classes unchanged there), 1920 (footer is 91 by the ≥1280 rule, a known deviation). Dropdown and EN checks were not re-run, as the scope said. They passed in the first run and the files they cover did not change.

### Concerns

1. **Hero→text gap at 1440 is 80 vs live 40.** It comes from `xl:gap-20` (Figma desktop). It is not in the list of accepted deviations in the decision. Needs explicit acceptance, or it becomes a deviation the user has to state.
2. **4-worker flake unresolved.** The homepage-header spec failed under 4 workers in runs 1 and 3. Run 2 (single spec, 4 workers) and run 4 (`--workers=1`) passed. Re-run 2 at 1 worker is green. The default `workers: 4` in `playwright.config.ts` still carries that flake.
3. **1920 footer 91 vs live 73** stays as the accepted ≥1280 deviation. It was not re-measured here.

**Status:** DONE_WITH_CONCERNS
**Summary:** The `xl:` fix closes the 768 and 1024 mismatches (text x 32, footer 73, gap 40). The 1440 numbers match Figma. The 3-spec Playwright run is exit 0 at one worker. The 1440 hero→text gap of 80 (live 40) needs acceptance.

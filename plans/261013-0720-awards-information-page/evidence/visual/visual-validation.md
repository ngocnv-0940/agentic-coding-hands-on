# Visual validation — /awards-information (screen zFYDgyj_pD)

Build: `next build` + `next start -p 3100`, production mode, mock Supabase URL inlined. Signed in through the stubbed Google flow.
Browser: project's bundled Chromium (`@playwright/test`), 1 DPR. Scripts: scratchpad `visual-capture.cjs` and `visual-fullpage.cjs`.
Raw data: `measurements.json`, `image-load-check.json`, `capture-output.txt`.

## Reference and limits (read first)
- The MoMorph frame image could not be fetched. The `mcp__momorph__*` and Figma tools are not in this agent's toolset, and the Playwright MCP browser fails to start (`Chromium distribution 'chrome' is not found`). Comparison is therefore against the node-tree values, copy and spec in `momorph/awards-information-copy-vi.md`, `momorph/awards-system-specs.csv`, `evidence/asset-coverage-phase-02.md` and `clarifications.md`.
- No deterministic pixel metric is available, so **no region is labelled "exact"**. Every verdict below is qualitative.
- Pointer parked off the menu (and off the Kudos button) before each capture. Hover is not under test here; the active state is the reference state.

## Captures
| File | What it shows |
|---|---|
| `awards-1440-viewport-top.png` | Keyvisual, caption, gold title, menu with Top Talent active, card 1 |
| `awards-1440-full.png` | Full page 1440 (6506 px) |
| `awards-1440-sticky-midpage.png` | Mid-page scroll at 1440, menu stuck under header |
| `awards-768-viewport-top.png`, `awards-768-full.png`, `awards-768-sticky-midpage.png` | 768 tab row, cards, mid-page sticky tabs |
| `awards-375-viewport-top.png`, `awards-375-full.png` | 375 hero, tab row, stacked cards |
| `home-kudos-1440.png`, `home-1440-viewport.png` | Homepage Kudos block at 1440 (unchanged check) |

## Measured values (1440 / 768 / 375)
- Header: 80 px tall, sticky. Page `scrollWidth` = `clientWidth` at all three widths (no horizontal overflow).
- Keyvisual: 1440×547 at 1440; cover-crop `object-position 50% 58%`.
- Title h1: "Hệ thống giải thưởng SAA 2025", colour rgb(255,234,158), 57 px at md+ (36 px at 375). Caption "Sun* Annual Awards 2025".
- Menu at 1440: `position: sticky; top: 96px`, vertical list, 178 px wide, left column x=144.
- Menu at 768/375: `position: sticky; top: 80px`, `ul` row, `overflow-x: auto`, height 58 px.
- Active item: colour rgb(255,234,158), bottom border 1 px rgb(255,234,158). Idle: white, transparent border.
- Cards at 1440: 856 px wide, image 336×336. Card 1 image left (row), card 2 image right (row-reverse), alternating through card 6.
- Cards at 768: 672 px wide, alternating (rows), image 336×336.
- Cards at 375: `flex-direction: column`, image above text, image 336 px.
- Kudos wide block at 1440: 1152×524, link "Chi tiết" → `/sun-kudos`.
- Homepage Kudos at 1440: 1120×524, class string identical to the pre-change value (`max-w-[1120px]`, content `max-w-[521px]`, logo `xl:right-[84px]`).
- Image load: all 6 award images + keyvisual + root-further logo decode at every width (`image-load-check.json`). Kudos logo is `hidden lg:block` in the shared component, so it is not loaded below 1024. Expected, not a defect.

## Per-region verdicts
| Region | Verdict | Reason |
|---|---|---|
| Keyvisual crop (1440×547) | **minor diff** | Size and artwork match the spec. The crop offset (`50% 58%`) is approximated because the Figma key-visual crop is not a downloadable media node (asset-coverage caveat). Needs one eyeball against the Figma frame. |
| Title block (caption, h1, gold) | **match** | Text verbatim from Figma nodes 313:8454 and 313:8457 (caption "Sun* Annual Awards 2025" per Figma, approved over the TC wording). Gold rgb(255,234,158). Divider present. |
| Sticky menu at 1440 | **minor diff** | Sticks while D.1–D.6 scroll, under the header. It sits 16 px below the 80 px header (`top: 96px`). Figma's exact offset is not in the node data. Confirm the gap is intended. |
| Menu order and labels | **match** | Six items in order Top Talent, Top Project, Top Project Leader (wraps to 2 lines), Best Manager, Signature 2025 - Creator (wraps), MVP. Wrap is the Figma behaviour recorded in the copy notes. |
| Active state (gold + underline) | **match** (qualitative) | Colour and 1 px underline correct on the active item; only one item active per state. Underline thickness and text-shadow were not measured against Figma. |
| Alternating cards at 1440 | **match** | Image/text alternate by index; odd cards flipped (D.2, D.4, D.6), matching the Figma frame notes. |
| Alternating cards at 768 | **match** | Side-by-side from 768 px as clarified (D009). |
| Stacked cards at 375 | **match** | Image on top, content below, per D009. |
| Horizontal tab row below 1024 | **match** | One row, horizontal scroll, same active styling, sticky under header at 768 and 375. Breakpoint `lg` (1024) as clarified. |
| Card content (copy, quantity, prize) | **match** | Copy and values per copy notes: Top Talent "10 Cá nhân" (Figma override, approved over the TC "Đơn vị"), Top Project "02 Tập thể", Signature "5.000.000 / 8.000.000 VNĐ" with "Hoặc" separator, MVP "15.000.000 VNĐ". |
| Kudos wide block (1440) | **minor diff** | Width 1152 matches Figma 335:12023. Height is 524 px against the Figma 1152×500 frame: `min-h-[500px]` yields to content height. The text column (`max-w-[553px]`) is wider than the 457 px in the clarifications note, which is not measured in the frame. Needs confirmation. |
| Kudos at 768/375 | **match** (qualitative) | Logo hidden below 1024 by the shared component; text block stacks full width. |
| Homepage Kudos at 1440 | **match** | Unchanged: 1120×524, identical class strings, identical link `/sun-kudos`. |

No region is a **material mismatch**.

## Notes (not visual verdicts)
- **Scroll-spy activation lag (by design, ALG-001).** A section becomes active when its top reaches the header line (`scroll-margin-top` + 8 px, about 120 px at 1440). At the mid-page capture, the Best Manager heading sat about 300 px down the viewport, and Top Project Leader was still the active item. This follows the algorithm, not a bug. Worth a UX decision if the team wants earlier activation.
- **Spec drift in `docs/screens/SCR004_AwardsInformation/spec.md`:** section 10 says cards stack below 1024 px (clarifications D009 says 768 px; implementation follows clarifications). E12 says "10 Đơn vị" (Figma says "10 Cá nhân"). The spec is still `status: draft`, so doc-writer should reconcile it.
- Caption: the TC ID-4 lowercase "annual awards" is replaced by Figma's "Annual Awards" (approved in clarifications). E2E assertion corresponds to the Figma text.

## Result
- Material mismatches: 0.
- Minor diffs needing a Figma eyeball: keyvisual crop offset, sticky gap (16 px), Kudos wide height (524 vs 500) and text column width.
- No Track A change requested. The minor items are candidates for one bounded correction loop only if the Figma frame confirms them.

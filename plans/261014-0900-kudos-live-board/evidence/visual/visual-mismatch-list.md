# Visual mismatch list: /sun-kudos, final code (prod build, stub login)

Captures: `evidence/visual/sun-kudos-{1440,768,375}-final.png` (full page), `sun-kudos-1440-final-top1500.png`, metrics in `visual-metrics-final.json`. Capture script lives outside the repo (scratchpad `capture-visual.cjs`). Raw log: `evidence/final-visual-capture-output.txt`.

## Capture state (visualState)

- Highlight carousel at **2/5** (centre card active) to match the Figma frame. Reached by one click on Next, then pointer moved to (2,2) and focus blurred before capture.
- Lazy feed and images loaded (scroll pass, then `img.complete && naturalWidth > 0` for all images: 0 incomplete at every width).
- Signed in as the e2e stub user, so the data is the seed for that identity and not the Figma seed.

## Tolerance

- Reference: `momorph/kudos-live-board-frame.png` (1440 x 5862, 1:1). Figma values below are **read by eye from that PNG**, not from the Figma node tree.
- Position tolerance **±4 px**, size tolerance **±2 px** at 1440. Larger differences are listed as deviations.
- No deterministic pixel metric was computed (avatars, copy and seed counts differ by design), so **no region is called "exact"**. Verdicts are measured-and-qualitative.
- 768 and 375 have no Figma frame: they were checked for layout rules only (no horizontal scroll, sidebar stacks, card width), marked "derived".

## Per-region verdicts @1440

| Region | Figma (read from PNG) | Render (measured) | Verdict |
|---|---|---|---|
| Banner (hero, title, pills) | Hero 80–512 under nav; pills y 408–480 | Banner 0–456; pills y 384–456 | **Deviation.** Pills 24 px high vs Figma. Banner bottom 56 px short. Title y≈206 matches. Needs correction. |
| Compose pill | x 144–882 (738 w) | x 144–872 (728 w) | **Minor deviation.** −10 px width. Gap to search pill 32 px, same as Figma. |
| Search pill ("Tìm kiếm profile Sunner") | x 914–1295 (381 w) | x 904–1296 (392 w) | **Minor deviation.** +11 px width. |
| Highlight header "HIGHLIGHT KUDOS" + eyebrow | Eyebrow "Sun* Annual Awards 2025" above title, divider y≈592, title y≈640 | Divider y≈568, title y≈617 (−23, follows banner) | **Deviation.** Eyebrow is in the DOM at y≈520 with white computed colour, yet is **not visible in the 1440 capture** (banner layer appears to cover it). Unresolved. Needs layering check. |
| Filter buttons (Hashtag / Phòng ban) | Hashtag x 994–1130, Phòng ban x 1138–1296; y 613–669 (56 h) | x 982–1120 and 1136–1296; y 589–645 (56 h) | **Minor deviation.** Height matches. Widths ±2 px. Vertical offset is the banner offset. |
| Carousel (5 cards) | Centre card x 552–1080 (528 w), y 713–1237 (524 h) | Centre card x 552–1080 (528 w), y 689–1176 (487 h) | **Deviation.** Width matches. Height −37 px (−7%), Figma card content is taller. Pager shifts with it. |
| Carousel pager "2/5" | Centred at x≈720; text centre y≈1305; arrows at x≈636 / 803 | Centred at x 720 (box 696–744); box y 1202–1262 | **Deviation (vertical only).** Horizontal centre matches. Vertical −103 px, driven by the card height above. Glyph size estimated from PNG (≈32 px cap height), ±3 px. |
| Carousel arrows (large) | x≈120 and 1260, y≈975 | Not measured this run | **Not verified.** |
| Spotlight panel | x 144–1298 (1154 w), height ≈547 | x 144–1296 (1152 w), height 547 | **Match** within tolerance (2 px). |
| Spotlight background | Network-line artwork over colour ribbons | Flat navy, nodes only | **Accepted known deviation.** Artwork not exportable from Figma. |
| Spotlight search | x 167–386 (219 w), y 234–273 within panel | 219 w, 38 h, same relative spot | **Match.** |
| Spotlight total "KUDOS" | "388 KUDOS" | "25 KUDOS" | **Accepted, data-driven.** Count comes from the seed. |
| Spotlight vertical rhythm | Pager → spotlight eyebrow ≈176 px; eyebrow y≈1481 | Pager → eyebrow ≈79 px; eyebrow y≈1341 | **Deviation.** Section starts 140 px higher than Figma. Gap under the spotlight header is 72 px (Figma 96 px). Cascades into every block below. |
| All Kudos header | Eyebrow y≈2378 | Eyebrow y≈2162 | **Deviation (cascade).** Δ≈216 px, from the carousel and spotlight offsets above. |
| Feed card | x 144–824 (680 w) | x 144–824 (680 w) | **Match** on width. Card content is data-driven: avatars for users without photos show the default icon, and hashtags and gallery counts follow the seed. Accepted. |
| Sidebar | x 873–1297 (424 w) | x 874–1296 (422 w) | **Match** within tolerance. |
| Sidebar stats | Labels match; values 25 each | Labels match; values 3/2/3/2/1 | **Accepted, data-driven.** |
| Sidebar "Mở Secret Box" button | ≈374 x 60 | 372 x 60 | **Match** within tolerance. |
| Footer | One row: logo, About SAA 2025, Award Information, Sun* Kudos, Tiêu chuẩn chung, copyright on one line | Nav wraps to two rows; "Tiêu chuẩn chung" drops to row 2; copyright wraps to two lines (1440) | **Deviation.** Footer is the shared `(main)` layout (read-only for this change). Owner decision needed. |
| Shared header | Order: nav · bell · VN · profile; label "Award Information" | Order: nav · VN · bell · profile; label "Awards Information" | **Deviation, shared layout.** Not owned by this change. Owner decision needed. |
| Fixed compose badge ("/ logo" pill, bottom-right of viewport) | Not in the static frame | Fixed element at viewport x 1314–1421, y 788–852 (1440) | **Unverified.** Not in the reference. At 375 it covers the highlight card's avatar and name in the first viewport. Designer decision needed. |

## Derived widths (no Figma frame)

| Check | 1440 | 768 | 375 |
|---|---|---|---|
| scrollWidth = clientWidth (no horizontal scroll) | 1440 = 1440 | 768 = 768 | 375 = 375 **PASS** |
| Sidebar below feed | n/a (beside feed) | Sidebar y 13105 ≥ feed bottom 13073 | Sidebar y 13785 ≥ feed bottom 13753 **PASS** |
| Feed width / sidebar width | 680 / 422 | 672 / 672 | 343 / 343 |
| Highlight card width | 528 | 528 (centred, neighbours clipped) | 343 (one card visible) |
| Pager centred | x 720 | x 384 (box 360–408) | x 187.5 (box 164–212) |
| Page height (data-driven) | 13302 | 14443 | 15211 |

Page height and counts are data-driven (25 feed cards, 8 spotlight nodes, 5 highlight cards). The earlier capture (16125 / 17266 / 18114) came from a different build and seed run, so it is not comparable.

## Summary

- Any width: no horizontal scroll, feed and sidebar counts consistent, images loaded.
- @1440: 4 deviations to correct (banner/pills height, highlight eyebrow not visible, carousel card height, spotlight rhythm which cascades). Plus 2 shared-layout deviations (footer wrap, header order/label) and 1 unverified fixed badge.
- @768 and @375: layout rules pass. Fixed compose badge covers card content at 375 (first viewport).
- **Visual verdict: NOT within tolerance at 1440.** Requests to the UI owner: correct banner height and pill y, fix the highlight eyebrow visibility, match the carousel card height to 524, and check spotlight section spacing. Shared-layout items need an explicit owner acceptance or fix.

## After polish round 2 (final2)

Captures: `evidence/visual/sun-kudos-{1440,768,375}-final2.png` (full page), metrics `visual-metrics-final2.json`. Same method as round 1: prod build, stub login, highlight at 2/5, pointer moved away, lazy content loaded, 0 incomplete images at every width. Tolerance unchanged: **±4 px position, ±2 px size**, Figma values read by eye from `momorph/kudos-live-board-frame.png` (not from the Figma node tree). No pixel metric, so nothing is "exact".

### Per region @1440

| Region | Figma (read from PNG) | Render round 2 (measured) | Verdict |
|---|---|---|---|
| Banner bottom edge | 512 | 544 (banner h 544) | **Deviation +32 px.** Pill y now matches Figma (408). The banner is 32 px taller than Figma. Needs correction. |
| Compose pill | x 144–882, y 408–480 | x 144–883 (739 w), y 408–480 | **Pass** (w +1 px). |
| Search pill | x 914–1295, y 408–480 | x 915–1296 (381 w), y 408–480 | **Pass** (x +1 px). |
| Highlight eyebrow "Sun* Annual Awards 2025" | Visible above title, divider y≈592 | Visible, divider y≈592 | **Pass.** Round 1 hidden-eyebrow issue is resolved. |
| "HIGHLIGHT KUDOS" title | Centre y≈640 | Centre y≈641 | **Pass.** |
| Filter buttons | Hashtag x 994–1130 (136 w), Phòng ban x 1138–1296 (158 w); y 613–669 | Hashtag x 982–1120 (138 w), Phòng ban x 1136–1296 (160 w); y 613–669 | **Deviation.** Y matches. Gap 16 px vs Figma 8 px, so Hashtag starts −12 px and widths +2 each. |
| Carousel card 2/5 (centre) | x 552–1080 (528 w), y 713–1237 (524 h) | x 552–1080 (528 w), y 713–1254 (541 h) | **Deviation +17 px height** (round 1 was −37). Top and width match. Inside the card the time line sits at +35 px vs Figma because the person block is taller. |
| Carousel pager "2/5" | Centred x≈720; glyph centre y≈1305 | Centred x 720; box y 1294–1354 (centre 1324) | **Deviation ≈+19 px** (box-centre measure; glyph estimate ±3 px). Horizontal centre matches. |
| Spotlight section (eyebrow, title, panel) | Eyebrow y≈1481, title y≈1562, panel top y≈1658, panel 1152 × 547 | Eyebrow ≈1506, title ≈1588, panel top ≈1682, panel 1152 × 547 | **Deviation ≈+24–26 px** on each line (round 1 was +140 to +163). Panel size matches. Cascades from the card height and pager above. |
| Spotlight background | Network-line artwork over colour ribbons | Flat navy, nodes only | **Accepted known deviation.** Artwork is not exportable from Figma. |
| Spotlight search | 219 × 39 at panel offset (27, 26) | 219 × 38 at (+3, −1) | **Pass** within tolerance. |
| Spotlight total "KUDOS" | "388 KUDOS" | "25 KUDOS" | **Accepted, data-driven.** |
| All Kudos eyebrow and header | Eyebrow ≈2378; first feed card top 2530 | Feed top 2554 (eyebrow not measured this run; estimated ≈2400 from the feed-top offset) | **Deviation ≈+22–24 px (cascade).** Estimate is marked as such. |
| Feed card | x 144–824 (680 w) | x 144–824 (680 w) | **Pass** on width. Content is data-driven (avatars, counts). Accepted. |
| Sidebar | x 873–1297 (424 w), top 2530 | x 874–1296 (422 w), top 2554 | **Pass** on size (−2 px). Top follows the cascade (+24). |
| Sidebar "Mở Secret Box" | ≈374 × 60 | 372 × 60 | **Pass.** |
| Sidebar stats | Labels match; values 25 each | Labels match; values 3/2/3/2/1 | **Accepted, data-driven.** |
| Footer | One row: logo, About SAA 2025, Award Information, Sun* Kudos, Tiêu chuẩn chung, copyright on one line | Nav wraps to two rows; copyright wraps to two lines | **Accepted, out of scope.** Shared `(main)` footer, unchanged by polish. Owner decision needed. |
| Shared header | Order nav · bell · VN · profile; label "Award Information" | Order nav · VN · bell · profile; label "Awards Information" | **Accepted, out of scope.** Shared layout. Owner decision needed. |
| Fixed compose badge ("/ logo", bottom-right of viewport) | Not in static frame | Fixed element at viewport x 1314–1421, y 788–852 | **Accepted, out of scope.** Widget button, not part of the frame. Its overlap at 375 is noted in round 1. |

### Derived widths (no Figma frame)

| Check | 1440 | 768 | 375 |
|---|---|---|---|
| scrollWidth = clientWidth | 1440 = 1440 | 768 = 768 | 375 = 375 **PASS** |
| Sidebar below feed | beside feed (≥1024) | sidebar y 13343 ≥ feed bottom 13311 **PASS** | sidebar y 13821 ≥ feed bottom 13789 **PASS** |
| Feed / sidebar width | 680 / 422 | 672 / 672 | 343 / 343 |
| Page height (data-driven) | 13540 | 14681 | 15247 |

### Overall verdict

- **@1440: NOT within tolerance.** Round 2 closes the eyebrow, pill-position and highlight-header gaps. Still out of tolerance: banner bottom +32 px, filter gap/offset, carousel card +17 px, pager ≈+19 px, and the spotlight and All Kudos blocks ≈+24 px (cascade). Accepted deviations: spotlight flat navy artwork, data values, and the shared header, footer and fixed widget.
- **@768 and @375: layout rules pass** (no horizontal scroll, sidebar stacks). No Figma frame exists at these widths.
- Requests to the UI owner: banner height −32 px; filter gap 8 px and widths 136/158; carousel card height −17 px (524); pager box centre −19 px; the spotlight and All Kudos offsets then follow from the card and banner fixes.

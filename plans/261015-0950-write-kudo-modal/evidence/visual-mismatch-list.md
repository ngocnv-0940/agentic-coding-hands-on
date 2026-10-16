# Visual check — Viết Kudo modal vs momorph/write-kudo-frame.png (phase 6, step 6)

Method: `evidence/visual/*.png` taken at 1440, 768 and 375 px wide on the real-stack dev server (localhost:3000, deviceScaleFactor 1, reduced motion), modal opened from the compose pill. Measurements from `evidence/visual/visual-measurements.json`. The frame was read as an image (1440×1024 reference); no pixel-diff tool was used, so every comparison below is measured geometry or a qualitative judgment. No "exact" claim is made.

Playwright MCP was not usable here (its Chrome build is not installed); the same Playwright engine ran from a scratch script.

## Measured, matches the frame (1440)
| Element | Frame (Figma) | Build (measured) | Verdict |
|---------|---------------|------------------|---------|
| Modal width | 752 px (frame x 357→1109) | 752 px | matches (FR-227 ±4 holds) |
| Title input height | ~56 px (y 250→306) | 56 px (screenshot, y 120→176) | matches (qualitative, screenshot) |
| Recipient input height | ~56 px (y 162→218) | ~56 px (screenshot, top cropped) | matches (qualitative) |
| Hashtag and Image add buttons | 48 px (y 678→726; 766→814) | 48 px (y 620→668; 728→776) | matches |
| Content editor | ~200 px (y 426→626) | 200 px (y 332→532) | matches |
| Footer Hủy / Gửi | ~60 px tall, side by side | 60 px tall, side by side (1440) | matches |
| Horizontal overflow | none expected | 0 px at 1440, 768, 375 | matches |

## Differences, not defects in the build
1. **Image row content:** the frame shows five uploaded thumbnails and the anonymous alias row checked; the visual run opens an empty modal. This is a state difference, not a layout defect.
2. **Error state (no frame in `momorph/`):** after Gửi on an empty form the build shows "Không được để trống" under each of the four required rows (recipient, title, content, hashtags) and sets `data-invalid`. The frame description for the error state (`5c7PkAibyD`) was not in the local materials, so no comparison is claimed. Evidence: `visual/modal-1440-error-state.png`.
3. **Viewport height:** at a 900 px viewport the modal (868 px tall, growing with errors) does not fit; its top and footer scroll. The frame was drawn for a 1024 px viewport, where the whole modal fits. Not a build defect at 1024.

## Layout at narrow widths (judgment, no frame for these widths)
- 768 px: rows keep label and control side by side (recipient control at x+187, title at x+172). FR-227 stacks rows under 640 px, so 768 is correct. No overflow.
- 375 px: recipient, title, images and anonymous rows stack (label above control, control left-aligned at x+25 or x+0). No overflow (0 px). Footer: Gửi sits above Hủy (`flex-col-reverse`). No mobile frame is available, so the order cannot be checked against Figma. Logged for the designer to confirm.

## Material mismatches requiring a UI-agent fix
None found in the measured geometry at 1440, 768 or 375. Open items for the designer, not blocking: footer order at 375 px, and error-state styling (no frame to compare).

## Files
- `evidence/visual/modal-1440.png`, `modal-768.png`, `modal-375.png` (empty state)
- `evidence/visual/modal-1440-error-state.png` (empty submit)
- `evidence/visual/visual-measurements.json` (raw numbers)
- `evidence/visual/real-stack/` (board before submit, filled modal, new kudo card with two images)

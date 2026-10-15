# Asset coverage, phase 02 (Viết Kudo, screen ihQ26W78P2)

Command: `python3 -I .claude/skills/momorph-implement-design/scripts/validate_coverage.py --assets <assets.md> --code "app/(main)/sun-kudos/_components"` exit 0
(assets.md planned from `get_media_files(ihQ26W78P2)` limited to the modal nodes; the project `.claude/skills/.venv` does not exist, system python3 used).

All 13 modal media nodes are inline SVG components (currentColor), no raster export is needed. Out of scope here: Header logo and Cover/Avatar of the page behind the mask (rendered by the (main) layout and the F006 board).

| nodeId | Name | Rendered by |
|--------|------|-------------|
| I520:11647;520:9873;186:2761 | Down | `IconChevronDown` (kudos-icons.tsx) in recipient-picker-view.tsx |
| I520:11647;520:9881;186:1420 | Bold | `IconBold` write-kudo-icons.tsx |
| I520:11647;662:11119;186:1420 | Italic | `IconItalic` |
| I520:11647;662:11213;186:1420 | Strikethrough | `IconStrikethrough` |
| I520:11647;662:10376;186:1420 | Number List | `IconOrderedList` |
| I520:11647;662:10507;186:1420 | Link | `IconLink` (kudos-icons.tsx, identical path) |
| I520:11647;662:10647;186:1420 | Quote | `IconQuote` |
| I520:11647;662:8911;186:2759, I520:11647;662:9133;186:2759 | Plus (x2, same file) | `IconPlus` in hashtag-picker-view.tsx and image-picker-view.tsx |
| I520:11647;662:9197;662:9287;186:1420 (x5 instances) | Close Tiny | `IconCloseTiny` in image-picker-view.tsx |
| I520:11647;662:9197;256:4717 (x5 instances) | Sample Image | replaced by the picked file preview (`next/image` unoptimized) |
| I520:11647;520:9906;186:2761 | Close | `IconClose` (footer Hủy, link dialog Hủy) |
| I520:11647;520:9907;186:1766 | Send | `IconSend` (kudos-icons.tsx, identical path) |

No Figma export exists for: the hashtag "selected" tick (node 1002:13204, Material check used), the Gửi spinner (new), the Lưu link glyph (same `IconLink`). Verified by script that each hand-copied `d` string equals the downloaded SVG.

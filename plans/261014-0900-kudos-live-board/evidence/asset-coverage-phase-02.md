# Asset coverage, phase 02 (Kudos presentational UI)

Source: `get_media_files(MaZUn5xHXZ)` (65 entries, 23 unique files, 1 entry without URL). `.claude/skills/.venv` does not exist, so `validate_coverage.py` was not run; coverage checked by hand below. Files under `public/images/kudos/`.

| Figma media node(s) | Asset | Used in |
|---|---|---|
| `I2940:13432;2167:5141` KV Background | `keyvisual.webp` (png 1440x512 converted) | `kudos-banner.tsx`, `spotlight-board-view.tsx` (backdrop) |
| `2940:13440` KUDOS logo | `kudos-logo.svg` | `kudos-banner.tsx` |
| `I2940:13433;178:1033;178:1030`, `I2940:13522;342:1408;178:1030` header/footer logo | not owned (layout) | `(main)` layout |
| `I2940:13449;186:2759`, `I3127:*;2234:33040` Pen | inline `IconPen` | banner pill, feed card title row |
| `I2940:13450;186:2759`, `I2940:14833;186:2759` Search | inline `IconSearch` | banner pill, spotlight search |
| `I2940:1345x;186:2761` Down | inline `IconChevronDown` | `filter-dropdown-view.tsx` |
| `I2940:13470/13472;186:1420` Left, `I2940:13468/13474;186:1420` Right | inline `IconChevronLeft/Right` | `carousel-view.tsx` |
| `I3127:*;256:5147` sent arrow | inline `IconSend` | `kudo-card.tsx` |
| `I3127:*;256:5171` heart | inline `IconHeart` | `kudo-card-actions.tsx`, `sidebar-view.tsx` |
| `I3127:*;256:5216;186:1441` link | inline `IconLink` | `kudo-card-actions.tsx` |
| `I2940:13464;335:9663;186:1441` detail arrow (no URL in media map; arrow glyph of the same icon family) | inline `IconArrowUpRight` | `kudo-card.tsx` |
| `I2940:13497;186:1766` Open Gift | inline `IconGift` | `sidebar-view.tsx` |
| `I2940:13464;335:9443;256:4734`, `...:9446;...`, `I3127:*;256:4858/4860;256:4734` avatars (`b7a45393`, `c5d2f914`) | `avatars/{nhat,quy,xuan,chuc,sender,linh,viewer}.png` (fixture avatars) | phase-01 fixtures `/images/kudos/avatars/<key>.png` |
| `I2940:13516..13520;256:7460` gift avatar (`4d76b089`) | `avatars/linh.png`, `avatars/viewer.png` | fixtures |
| `I3127:*;256:4860;3106:17694` Legend / `I3127:22053;256:4858;3106:17694` Rising / `I3127:22375;256:4858;3106:17694` Super badge | `badges/legend-hero.png`, `rising-hero.png`, `super-hero.png` | `hero-badge.tsx` |
| `I3127:21871;256:4858;3106:17694` New Hero | no URL in the media map (null); drawn as text pill | `hero-badge.tsx` |
| `I3127:*;256:5177..5181;513:8436` Sample Image (`f4c11e1a`) | `posts/kudo-{3,4,10,13,18,20}-<n>.jpg` (jpg of the sample image, paths from fixtures) | fixtures, `kudo-card.tsx` gallery |

Not drawn from MoMorph media (no artwork exported): Pan/Zoom glyph (`3007:17479`), star mark, "x2" heart marker (`3241:14931`), default avatar. Drawn as inline SVG; listed as concerns.

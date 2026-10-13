# Asset coverage — phase 02 (screen `zFYDgyj_pD`)

Scope: media nodes inside the screen body (Header `313:8440` and Footer `354:4323` belong to the shared layout, not this phase).
Tool: `get_media_files` (MoMorph) vs `mm:<nodeId>` markers in `app/(main)/_components/awards-information/**` and `kudos-promo.tsx`.
`validate_coverage.py` was not run: `.claude/skills/.venv` is absent and the manifest needs fresh signed URLs; an equivalent inline Python scan of the markers was run instead.

| MoMorph node | Asset | Rendered as | Marker file |
|---|---|---|---|
| `2167:5138` key visual | homepage keyvisual.png (reused, cropped object-position 50% 58%) | `next/image` | awards-information-hero.tsx |
| `2789:12915` Root Further logo | `/images/homepage/root-further-logo.png` (reused, 338x150) | `next/image` | awards-information-hero.tsx |
| `I313:8467;214:2525;81:2442` + `;214:666` (x6 cards) | `/images/homepage/awards/<slug>.png` 336x336, pre-composited | `next/image` | award-detail-card.tsx |
| `MM_MEDIA_Target` (menu x6, card title x6) | inline SVG `IconTarget` | inline, currentColor | award-icons.tsx, awards-category-menu.tsx |
| `MM_MEDIA_Diamond` | inline SVG `IconDiamond` | inline, currentColor | award-icons.tsx |
| `MM_MEDIA_License` | inline SVG `IconLicense` | inline, currentColor | award-icons.tsx |
| `I335:12023;313:8416` Kudos background | `/images/homepage/kudos-background.png` (reused) | `next/image` | kudos-promo.tsx |
| `I335:12023;313:8426;186:1766` arrow up | `IconArrowUpRight` (reused) | inline | kudos-promo.tsx |
| `I335:12023;329:2948` KUDOS logo | `/images/homepage/kudos-logo.svg` (reused) | `next/image` | kudos-promo.tsx |

Result: every screen-body media node is covered; no new binary asset was added (`public/images/awards-information/` not created).
Caveats: the 'Award-Name-*' media `I313:846x;214:666` returned null URLs for D.2/3/4/5/6 in `get_media_files`; the composed homepage PNGs already carry the name artwork. The Figma key-visual crop (`image 20`, 101.245% x 367.889% at -859px) is not a downloadable media node; the crop is approximated and must be eyeballed in phase 5.

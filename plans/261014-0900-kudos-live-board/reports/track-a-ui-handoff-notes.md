# Track A (phase 2) hand-off notes for phases 5–6

Source: momorph-ui-implementer report, 2026-10-14. Components in `app/(main)/sun-kudos/_components/`. tsc + lint clean. Visual not yet captured (nothing wired).

## Contract additions (beyond phase-02 file; all optional unless noted)
- `PersonView.stars`, `KudoCardView.timeLabel`. No `likeCountLabel`: `LikeButtonView` formats `count` itself (dot thousands separator).
- `KudoCard` takes `active?: boolean` → sets `data-active` on the centre card. `CarouselView` handles `inert` on neighbours.
- `HighlightSection` takes `eyebrow`; `SpotlightBoardView` takes `eyebrow` + `title` (title required on both).
- `CarouselView` takes `regionLabel`, `prevLabel`, `nextLabel`, `emptyLabel` and renders the empty message itself. Wiring must NOT render the pager when there are no slides.
- `KudosBanner` takes `composeRef`, `profileSearchRef` so wiring can return focus to the pill after the modal closes.
- Extra exports: `AllKudosSection` (feed + sidebar composition), `SpotlightSearchInput` (pass as `searchSlot`).

## Wiring obligations
- Spotlight: node `x`/`y` are percentages 0–100. `recent` is newest-first (view reverses it). Wiring sets `transform` on `canvasStyle`, ignores `pointerdown` starting on buttons/inputs, suppresses the click after a drag, and truncates search input to 100 chars (Playwright `fill` ignores `maxLength`). `SpotlightBoardView` keeps hovered node in `useState` (one `spotlight-tooltip`).
- Filter dropdown: Escape and outside-click closing belong to the wiring.
- Feed: sentinel `kudos-feed-sentinel` always rendered, even when `status` is `done`.
- Modal: `ComingSoonModalView` focuses close and handles Escape/backdrop; returning focus to the opener is the wiring's job.

## Approximations (no Figma artwork)
- Inline SVG: Pan/Zoom glyph, star, "x2" heart marker, default avatar. `new_hero` badge = text pill. Star colour `#d4a017`, matched node `#f26b66` picked by the agent.
- Avatars reuse the two Figma portraits + gift avatar; post images are copies of the single Figma sample, named to phase-01 fixture paths.
- `next/image` with `unoptimized` for avatars/attachments (unknown hosts).
- Carousel centre card at x=552 @1440 (`50% - 168px`); <1280 centred, side arrows + edge fades hidden. Sidebar `lg:sticky`, own scroll.

# Phase 4 + 5 hand-off notes for phase 6

## Phase 4 (lib/kudos/**)
- `SidebarData.latestGifts[].prize` is `string | null`; phase-2 `SidebarGift.prize` is `string` → map with `?? ''`.
- `formatLikeCount` exists in lib and in `_components/format-kudos-count.ts` (duplicate) — prefer one; phase 6 may delete the component copy if the UI owner contract allows, otherwise leave and note.
- `buildFilterQuery` returns no leading `?` and `''` when empty.
- `import 'server-only'` not installed — queries need a request scope (cookies()).
- Like error dictionary keys: `kudos.error.like.${LikeErrorCode}`.

## Phase 5 hook API (`app/(main)/sun-kudos/_behavior/`)
- `useHighlightCarousel(count)` → `{index,count,prev,next,canPrev,canNext,pagerLabel}`; reset by remount `key={filtersKey(filters)}`.
- `useKudoFilterNavigation(filters)` (sanitized filters, no useSearchParams) → `{selectHashtag(slug|null), selectDepartment(code|null)}`; card hashtag chip uses `selectHashtag`.
- `useFilterDropdown(onSelect)` → `{open,rootRef,toggle,select}`; wrap each `FilterDropdownView` in `<div ref={rootRef} className="contents">`.
- `useInfiniteKudosFeed(initialPage, filters)` → `{items,status,sentinelRef}`; key container by `filtersKey`.
- `<KudoFeedbackProvider modalTitle modalCloseLabel>` renders ToastView + ComingSoonModalView; `useKudoFeedback()` → `{show(msg,'success'|'error'), openModal(triggerEl), closeModal()}`.
- `<KudoLikeStateProvider errorMessages>` inside the feedback provider; `useKudoLike(card)` → `{liked,count,pending,disabled,toggle}` (shared by kudo id across highlight + feed).
- `useCopyKudoLink({copied,error})` → `copy(kudoId)` (never throws).
- `useSpotlightPanZoom()` → `{panZoomOn,toggle,canvasStyle,canvasHandlers}` (`canvasHandlers` carries a `ref` for the non-passive wheel listener — pass unchanged; verify at runtime).
- `useSpotlightSearch(receivers)` → `{query,setQuery,matches:Set|null}`; live matching (no submit — E2E fills without Enter); node `match: matches?.has(id) ?? false`.

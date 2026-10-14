---
phase: 2
title: "Kudos presentational UI (Track A)"
feature: kudos-live-board
status: done
effort: 6h
owner_agent: momorph-ui-implementer
track: A
test_policy: e2e-red-first
depends_on: [1]
---
# Phase 02 — Kudos UI (Track A)
**Screen:** Sun* Kudos - Live board, fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `MaZUn5xHXZ`, node `2940:13431` (dropdown frames `JWpsISMAaM`, `WXK5AYB_rG`). Inputs: `momorph/kudos-live-board-{specs,test-cases}.csv`, `momorph/kudos-live-board-frame.png`, `spec/.../screens/SCR-kudos-live-board/spec.md` (E01–E32), `clarifications.md`. RED read-only: `evidence/red-evidence.json`; selector contract: phase-01 Requirements.
**Goal:** Pixel-faithful, prop-driven, stateless sections (banner + pills, highlight + filter bar + carousel frame, kudo card highlight|feed, spotlight board view, feed list + sentinel slot, sidebar, toast, coming-soon modal view) and Figma assets.
**Owned files:** `app/(main)/sun-kudos/_components/**` (incl. `kudos-view-types.ts`), `public/images/kudos/**` (png/jpg/webp/svg from MoMorph/Figma, incl. avatars/attachments referenced by phase-01 fixtures and seed). Each file <200 lines.
**Out of scope:** `page.tsx`, `_wiring/**`, `_behavior/**`, `lib/**`, dictionaries, `(main)` layout/header/footer, data fetching, hooks with effects, timers, clipboard, router.
**Integration contract** (`kudos-view-types.ts`; field names identical to phase-03 RPC contract `KudoCard`/`Person`):
- `KudoCardView` = RPC `KudoCard`; `KudoCard({ kudo, variant: 'highlight'|'feed', labels, likeSlot: ReactNode, copyLinkSlot: ReactNode, onHashtagClick?(slug) })` — detail links `/sun-kudos/${id}`, person links `/profile`, text rendered as text only (FR-604), stars from `starsFor(receivedCount)` passed in as `stars: 0|1|2|3` per person, time/number pre-formatted strings passed in (`timeLabel`, `likeCountLabel`).
- `LikeButtonView({ liked, count, disabled, pending, onToggle, label })`, `CopyLinkButtonView({ onCopy, label })`.
- `HighlightSection({ title, filterBar: ReactNode, carousel: ReactNode })`; `CarouselView({ slides: ReactNode[], index, onPrev, onNext, pagerLabel })` (neighbours faded + `inert`, one slide <1024).
- `FilterDropdownView({ testId, label, options:{value,label}[], selected:string|null, open, onToggle, onSelect(value|null), clearLabel })`.
- `SpotlightBoardView({ total, nodes:{id,name,x,y,href,tooltip,match}[], recent:string[], panZoomOn, canvasStyle, canvasHandlers, searchSlot, emptyLabel, panZoomLabel, onTogglePanZoom })`.
- `FeedView({ cards: ReactNode[], sentinelRef, status:'idle'|'loading'|'error'|'done', labels })`; `SidebarView({ stats, gifts, canOpenBox, onOpenBox, labels })`; `ToastView({ message, kind })`; `ComingSoonModalView({ open, title, closeLabel, onClose })`.
**Checks:** `bunx tsc --noEmit`, `bun run lint`; asset coverage vs MoMorph → `evidence/asset-coverage-phase-02.md`. K stays red until phase 6.
**Next 16:** read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` and `link.md` (cd into the dir) before using `next/image`/`next/link`.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

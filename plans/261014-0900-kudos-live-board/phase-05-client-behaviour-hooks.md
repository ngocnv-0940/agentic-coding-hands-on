---
phase: 5
title: "Client behaviour hooks (Track B)"
feature: kudos-live-board
status: done
priority: P1
effort: 4h
owner_agent: implementer
track: B
test_policy: e2e-red-first
depends_on: [4]
---

# Phase 05 — `app/(main)/sun-kudos/_behavior/**`

## Context Links
- `technical-spec.md` A2, A3, A4, A5, A6, A7, A9, A10, A12; SM-001, SM-002, ALG-006, DEC-002/003/005/006; §3.8 edge cases
- Phase-04 files (`lib/kudos/*`), phase-02 view prop types (read-only, for hook return shapes)
- Existing patterns: `app/(main)/_behavior/use-dropdown-menu.ts` (outside click/Esc), `dropdown-panel-styles.ts`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `03-api-reference/04-functions/use-router.md` (`replace`, `scroll:false`), `use-search-params.md` (Suspense requirement), `02-guides/preserving-ui-state.md` (Activity; reset by key, `useLayoutEffect` cleanup for transient open state)

## Overview
Client hooks + small providers that own all interaction state; no markup beyond providers. Phase 6 composes them with Track A views. Proven by K in phase 6 (RED already recorded).

## Requirements / files (each <200 lines, `'use client'`)
- `use-highlight-carousel.ts` — `{index, count, prev, next, canPrev, canNext, pagerLabel:'n/N'}`; N=0/1 handled (DEC-002). Reset happens by parent `key` (filters), not effects.
- `use-kudo-filter-navigation.ts` — reads current `useSearchParams`, `selectHashtag(slug|null)`, `selectDepartment(code|null)` → `router.replace('/sun-kudos?' + buildFilterQuery(...), {scroll:false})`; keeps the other param, drops cleared ones (A3/A4).
- `use-filter-dropdown.ts` — open/close per dropdown, wraps existing `use-dropdown-menu.ts` if its API fits (else same pattern), closes on select and on Activity hide.
- `use-infinite-kudos-feed.ts` — `{items, status, sentinelRef}` from `initialPage`; `IntersectionObserver` on the sentinel; single in-flight guard; append dedup by id; stop at `nextCursor=null`; error → `status:'error'`, retry on next intersection (A5, §3.8).
- `kudo-like-state-provider.tsx` + `use-kudo-like.ts` — map `kudoId → {liked, count, pending}` seeded from every rendered card (Highlight and feed share it, A6); `toggle(id)`: ignore if pending/disabled, set pending, await `toggleKudoLikeAction`, apply `{liked, likeCount}` or restore previous + error toast (SM-001, FR-405). No optimistic flip (DEC-003 "chưa đổi màu").
- `kudo-feedback-provider.tsx` — toast (`show(message, kind)`, one at a time, replace + restart ~3 s timer, cleared on unmount) and coming-soon modal (`openModal(triggerEl)`, Esc/backdrop close, focus into modal on open, back to trigger on close) (A7, A12).
- `use-copy-kudo-link.ts` — `navigator.clipboard.writeText(location.origin + '/sun-kudos/' + id)`; success toast only on resolve, error toast on reject/absent API (FR-406/407, INT-003).
- `use-spotlight-pan-zoom.ts` — SM-002 toggle; when on: pointer drag translates, non-passive `wheel` listener (registered via ref, `preventDefault` only when on) zooms around the pointer, scale clamp 0.5–3, translate clamped to keep the canvas partly visible (ALG-006); drag beyond 4 px sets `suppressClick` so node clicks after a drag do not navigate.
- `use-spotlight-search.ts` — `{query, setQuery, submit, matches:Set<id>|null}`; `normalizeSearchText` substring match; empty submit clears (BR-011); no network.

## Implementation Steps
1. Read the Next docs above.
2. Write hooks/providers; keep side effects cleaned up (observer disconnect, timers, wheel listener).
3. `bunx tsc --noEmit`, `bun run lint` exit 0.

## Todo List
- [x] Carousel, filter navigation, dropdown (`use-highlight-carousel.ts`, `use-kudo-filter-navigation.ts`, `use-filter-dropdown.ts`)
- [x] Infinite feed (`use-infinite-kudos-feed.ts`)
- [x] Like provider + hook (`kudo-like-state-provider.tsx`, `use-kudo-like.ts`)
- [x] Feedback provider (toast, modal) + copy link (`kudo-feedback-provider.tsx`, `use-copy-kudo-link.ts`)
- [x] Spotlight pan/zoom + search (`use-spotlight-pan-zoom.ts`, `use-spotlight-search.ts`)
- [x] tsc + lint (`evidence/phase5-tsc-lint.txt`, both exit 0)

## Success Criteria
tsc/lint clean; no data literals; every listener/timer/observer disposed; hooks expose exactly what the phase-02 view props need.

## Risk Assessment
- Activity keeps an open dropdown/modal after navigation → close in `useLayoutEffect` cleanup.
- Passive wheel listeners cannot `preventDefault` → attach manually with `{passive:false}` only while on.
- Observer firing twice while loading → in-flight ref guard.

## Security Considerations
Clipboard text built from origin + id only. No HTML injection (text nodes only).

## Next Steps
Phase 6 wires hooks to views.

## MoMorph refs:
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/261014-0900-kudos-live-board/clarifications.md
- testPolicy: e2e-red-first

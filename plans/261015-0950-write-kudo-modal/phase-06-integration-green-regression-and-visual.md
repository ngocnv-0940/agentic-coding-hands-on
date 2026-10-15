---
phase: 6
title: "Integration, GREEN, regression, visual"
feature: write-kudo
status: completed
priority: P1
effort: 4h
owner_agent: implementer (wiring) → tester (GREEN, regression, visual)
track: integration
test_policy: e2e-red-first
depends_on: [2, 5]
---

# Phase 06 — `_wiring/**`, page props, GREEN

## Context Links
- `evidence/red-evidence.json` (W must go GREEN with the same command), phase-01 §Selectors, phase-02 contract, phase-03 §Contract, phase-04/05 files
- `app/(main)/sun-kudos/page.tsx`, `_wiring/{action-pills-container,feed-and-sidebar-block,feed-container,to-kudo-card-view,build-kudos-labels,kudos-board-providers}.ts(x)`
- Next 16 (cd into `node_modules/next/dist/docs/01-app/`): `02-guides/lazy-loading.md` (`next/dynamic`, `ssr:false` in client components), `03-api-reference/04-functions/use-router.md`, `02-guides/migrating-to-cache-components.md`

## Overview
Wire views + hooks, switch the compose pill, render anonymous senders, keep the feed fresh after `router.refresh()`. Then tester: GREEN, full regression, SQL gate, build, visual.

## Requirements / files (each <200 lines)
- `page.tsx` — inside the existing `KudosBoard` Suspense: `getSidebar()` (cached) → `hasSunner`; `getFilterOptions()` (cached) → hashtags; pass to `ActionPillsContainer` with `buildWriteKudoLabels(dict)`. Read failure → `hasSunner=false` (pill disabled, no crash).
- `_wiring/action-pills-container.tsx` — compose pill → `WriteKudoModalContainer` open state (opener ref for focus return); `composeDisabled={!hasSunner}`; profile-search pill unchanged (`openModal`).
- `_wiring/write-kudo-modal-container.tsx` — renders nothing until first open; `const WriteKudoForm = dynamic(() => import('./write-kudo-form-container'), { ssr:false })` so Tiptap stays out of the board bundle; unmount on close discards state (FR-221).
- `_wiring/write-kudo-form-container.tsx` — modal view + rows; composes form, focus-trap, recipient, hashtag, image, anonymous, submit hooks; `useKudoFeedback().show` for toasts.
- `_wiring/write-kudo-editor-container.tsx` — editor hook + `EditorContent` into `editorSlot`, toolbar, mention list (`SunnerOptionListView` at `rect`), link dialog.
- `_wiring/build-write-kudo-labels.ts` — dictionary → label props (DRY).
- `_wiring/to-kudo-card-view.ts` — `sender: null` passthrough for anonymous; `build-kudos-labels.ts` + `anonymousSender` label.
- `_wiring/feed-and-sidebar-block.tsx` — `FeedContainer key={`${filtersKey(f)}|${page.items[0]?.id ?? ''}`}` so a refresh with a new first kudo remounts the feed (F006 hook seeds state once).

## Implementation Steps
1. Implementer: read Next docs; wire; `bunx tsc --noEmit`, `bun run lint`, `bun run build` (check the board route's first-load JS has no Tiptap: compare build output before/after or grep `.next` chunks of `/sun-kudos`).
2. Tester GREEN: W `bun run test:e2e e2e/write-kudo-` exit 0 (same as RED); K `bun run test:e2e e2e/kudos-`; both again with `E2E_PROD=1`.
3. Regression (safety-critical: migrations, grants, storage, mock contract, shared page): D `bun run test:e2e`; P `E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch`; I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid`; L `E2E_SITE_LAUNCH_AT=not-a-date bun run test:e2e --grep @launch-env-invalid`.
4. SQL gate: `bun run supabase:start && supabase db reset && supabase test db` exit 0 (or recorded BLOCKED).
5. Real-stack smoke (if Docker): link a local user to a sunner, send one kudo with 2 images (one anonymous), confirm board shows it first, image loads from local Storage, PostgREST `GET /rest/v1/kudos?select=sender_id` with that user's token → 401/42501 → `evidence/real-stack-smoke.md`.
6. Visual: Playwright MCP screenshot of the open modal @1440 vs `momorph/write-kudo-frame.png` (±4 px on modal width 752, row heights 56, footer); error state vs frame `5c7PkAibyD` description; @768/@375 no horizontal scroll, rows stacked → `evidence/visual/`. Material mismatch → bounded fix to `momorph-ui-implementer` (phase-02 files), W rerun.
7. Record `evidence/green-evidence.json`, TC 0–56 final status (`evidence/tc-mapping.md`), SC-001..007 (`evidence/sc-mapping.md`); update plan statuses.

## Todo List
- [x] Wiring + page props + feed key + anonymous card mapping
- [x] tsc, lint, build (Tiptap only in lazy chunk)
- [x] W + K GREEN (dev + prod)
- [x] D, P, I, L exit 0
- [x] SQL gate + real-stack smoke
- [x] Visual 1440/768/375 (no frame for 375 footer order; see report)
- [x] Evidence + TC/SC mapping

## Success Criteria
All commands exit 0; no hydration warnings in W console checks; 57 TCs + SC-001..007 mapped; visual within tolerance; board first-load bundle unchanged by Tiptap.

## Risk Assessment
- `dynamic` loading flash on first open → acceptable; focus moves after mount (focus-trap hook).
- Prerender error (cacheComponents) from new reads → they live inside the existing Suspense; build gate.
- Feed remount on refresh drops loaded pages → acceptable (user just posted; first page shows the new kudo).

## Security Considerations
No service role; uploads and RPC with the user session; anonymous mapping never reconstructs the sender client-side.

## Next Steps
Code review (reviewer template), doc-writer promotion (F###, permissions/architecture drafts, changelog), commit/PR on user approval.

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/261015-0950-write-kudo-modal/clarifications.md
- testPolicy: e2e-red-first

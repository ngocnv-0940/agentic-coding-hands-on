---
title: "SAA 2025 Homepage (/) — guarded home, countdown, header menus, placeholders"
description: "Login-required homepage from MoMorph i87tDx10uM: header menus, EVENT_START_AT countdown, awards grid, Kudos, 5 protected placeholder routes, landing / instead of /todo."
status: completed
priority: P1
effort: 20h
branch: feat/homepage-saa
tags: [homepage, momorph, auth, i18n, playwright, nextjs16, e2e-red-first]
created: 2026-10-08
work_type: feature
spec: docs/features/F003_Homepage/
system_doc_drafts: [plans/261008-1705-homepage-saa/spec/system/permissions.md]
system_docs: [docs/system/permissions.md]
blockedBy: []
---

# SAA 2025 Homepage — Implementation Plan

## Overview
Homepage `/` (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM), login required, post-login landing `/` (was `/todo`), placeholders `/awards-information` `/sun-kudos` `/standards` `/profile` `/admin` (proxy-protected, `/admin` admin-only). testPolicy `e2e-red-first`. Authoritative: `clarifications.md`. Spec ids (FR/BR/DEC/US/SC) = `spec/homepage/`; F001 ids prefixed `F001:`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E RED: homepage + F001 landing update](./phase-01-e2e-red-homepage-and-landing-update.md) | Completed |
| 2 | [Homepage screen presentational UI (Track A)](./phase-02-homepage-screen-presentational-ui.md) | Completed |
| 3 | [Auth guard, landing `/`, protected placeholders, admin gate](./phase-03-auth-guard-landing-and-admin-gate.md) | Completed |
| 4 | [Homepage dictionary, EVENT_START_AT, countdown logic](./phase-04-homepage-dictionary-and-countdown-logic.md) | Completed |
| 5 | [Header menus, sign out, notifications, placeholder pages](./phase-05-header-menus-and-placeholder-pages.md) | Completed |
| 6 | [Integration, GREEN, visual validation, .env.example](./phase-06-integration-green-and-visual-validation.md) | Completed |

Owner · track · depends · effort: 1 tester · gate · — · 4h | 2 momorph-ui-implementer · A · 1 · 6h | 3 implementer · B · 1 · 2h | 4 implementer · B · 1 (+ phase-2 copy artifact) · 2h | 5 implementer · B · 3, 4 · 3h | 6 implementer → tester · integration · 2, 3, 4, 5 · 3h.

## Dependencies
```
1 ─┬─> 2 (Track A) ──────────(copy artifact, step 1)──┐
   ├─> 3 ─────────────┐                               │
   └─> 4 <────────────┼───────────────────────────────┘
                      └─> 5 <── 4
2, 3, 4, 5 ──> 6
```
After 1: {2} ∥ {3, 4}; then 5; 6 last. Single implementer → 3 → 4 → 5. Phase 4 VN long copy waits only on `momorph/homepage-copy-vi.md` (phase 2 step 1).

## Key calls
- Next 16.4, `cacheComponents: true`: request-time reads (`cookies`, `getUser`, `Date.now`, env snapshot) sit behind `<Suspense>` + `await connection()` (precedent `app/todo/page.tsx`). Read `node_modules/next/dist/docs/` first (`cd` into it — see agent memory).
- Route group `app/(main)/` holds `/` + 5 placeholders; its layout renders shared header/footer/widget. `app/page.tsx` is deleted (phase 3) — else `/`↔`/login` loop.
- `/admin` role gate in **proxy** (true 307; `redirect()` inside streamed Suspense only emits a meta tag — `redirect.md`) + page re-check. Role = `user.app_metadata.role === 'admin'` via one helper `lib/auth/user-role.ts`.
- `EVENT_START_AT`: server-only env, strict ISO-8601 **with offset/Z** (offset-less = invalid, avoids TZ ambiguity). Server computes date string + countdown snapshot; client hook resumes from snapshot (no hydration mismatch).
- E2E: default run `EVENT_START_AT=2025-12-26T18:30:00+07:00` (Figma date) + `page.clock`; invalid env = second run `E2E_EVENT_START_AT=not-a-date --grep @event-env-invalid`. Admin = mock stub code `stub-code-admin`.
- Strings: new keys in `lib/i18n/dictionary-home-{vi,en}.ts` spread into existing dictionaries (parity type unchanged). VN verbatim Figma; EN authored.

## File ownership (W = writes; no two parallel phases share a file)

| Path | Phase |
|------|-------|
| `e2e/**`, `playwright.config.ts` | 1 (later fixes by tester only, never weakening) |
| `app/(main)/_components/**`, `public/images/homepage/**`, `app/globals.css`, `plans/…/momorph/homepage-copy-vi.md` | 2 |
| `proxy.ts`, `lib/supabase/proxy.ts`, `app/auth/callback/route.ts`, `lib/auth/user-role.ts`, `lib/auth/get-current-user.ts`, delete `app/page.tsx` | 3 |
| `lib/i18n/**`, `lib/event/**`, `lib/awards/**` | 4 |
| `app/(main)/_behavior/**`, `app/(main)/{awards-information,sun-kudos,standards,profile,admin}/page.tsx` | 5 |
| `app/(main)/layout.tsx`, `app/(main)/page.tsx`, `app/(main)/_wiring/**`, `.env.example`, `app/layout.tsx` (only if needed) | 6 |
Read-only reuse: `app/login/language-selector-container.tsx`, `app/auth/logout/route.ts`, `app/todo/**`.

## Verification & rollback
RED/GREEN = phase-1 commands (exit codes recorded in `evidence/`). Plus `bunx tsc --noEmit`, `bun run lint`, `bun run build`. Visual: tester vs Figma (phase 6). No unit runner (YAGNI; logic proven via E2E + `page.clock`). Rollback = revert phase commit; phases 3 and 6 ship together (3 alone leaves signed-in `/` as 404). No DB migrations.
Done = both phase-1 commands exit 0 on final code, tsc/lint/build 0, visual within tolerance, every acceptance criterion in `evidence/study-context.json` mapped to a green test.

## Top risks
`/`↔`/login` redirect loop · auth guard regression (safety-critical) · countdown hydration mismatch · cacheComponents prerender errors · wrong-env server reuse in E2E · Figma copy not extractable → blocks phase 4 VN copy. Details in phase files.

## Unresolved / follow-ups
Not completed work; none blocks the plan's Done line (E2E 83/83, tsc/lint/build 0, review SEALED 9/10).
- Skipped by user: `/tkm:rebuild-spec` Core+Flow run. Owner: user. Done: run after merge, spec regenerated.
- No header nav below 1024 (no hamburger in spec). Owner: user to confirm vs Figma mobile. Done: confirmed as out of scope, or new plan created.
- Deferred Low review items: sign-out bfcache, dropdown focusout/aria-haspopup, widget button no action, font class applied twice, 4.4 MB keyvisual. Owner: main agent to log as issues. Done: each has an issue.
- Real-stack admin: set `raw_app_meta_data.role` via SQL, then re-login (phase 6 step 6). Owner: user. Done: `/admin` visible for that account on the real stack.
- F003 US numbering clashes with global US001–US008. Owner: doc-writer. Done: F003 IDs prefixed like F001.
- F001 docs/specs still say landing `/todo` (`docs/features/F001_Auth/`, `docs/system/permissions.md`). Owner: doc-writer at promote. Done: no landing-`/todo` statements left.
- Phase 1 `reports/tester-red-evidence.md` missing (`reports/` is empty). Owner: tester. Done: file written from `evidence/temper-run-red.json`.
- Visual at 1440 never captured (plan said @1440; evidence uses 1280/1512). Owner: tester. Done: 1440 capture added, or deviation noted in clarifications.md.
- No saved asset-coverage record (phase 2 check) and no raw output for the offset-less and impossible-date invalid-env runs (JSON summary only). Owner: tester. Done: files saved under `evidence/`.

## Risks (open)
Admin role applies on next token refresh (RISK-05, accepted). Mobile nav gap above. Visual fidelity checked only at tested widths.

---
title: "Viết Kudo modal on /sun-kudos (create_kudo, Storage, anonymous)"
description: "MoMorph ihQ26W78P2: compose modal with recipient search, Tiptap editor, hashtags, images to Storage, anonymous alias; first write path + bucket; sender masking for F006 reads."
status: completed
priority: P1
effort: 28h
branch: feat/write-kudo
tags: [write-kudo, momorph, supabase, storage, rls, rpc, server-actions, tiptap, i18n, playwright, nextjs16, e2e-red-first]
created: 2026-10-15
work_type: feature
spec: docs/features/F007_WriteKudo/
system_doc_drafts: [spec/system/architecture.md, spec/system/permissions.md]
test_policy: e2e-red-first
blockedBy: []
---

# Viết Kudo — Implementation Plan

## Overview
Modal on `/sun-kudos` (MoMorph https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2, node `520:11602`) opened by `kudos-compose-pill`. testPolicy `e2e-red-first`. `clarifications.md` is authoritative (later sessions win, incl. "Session 2026-10-15 (planner)"). FR/BR/DEC/ALG/INT/SM/US ids come from `spec_draft`. Builds on F006 (migrations `20261014095439..42`). New deps: Tiptap 3.32.0 family only. No new env var, no `next.config.ts` change.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [E2E RED + mock search/create/storage routes](./phase-01-e2e-red-and-mock-write-kudo-routes.md) | Completed |
| 2 | [Write-kudo presentational UI (Track A)](./phase-02-write-kudo-presentational-ui.md) | Completed |
| 3 | [SQL: columns, create_kudo, search, bucket, sender masking (Track B)](./phase-03-sql-create-kudo-storage-and-anonymity.md) | Completed |
| 4 | [Data layer, server actions, image storage, i18n (Track B)](./phase-04-data-layer-actions-storage-and-i18n.md) | Completed |
| 5 | [Client behaviour hooks + Tiptap editor (Track B)](./phase-05-client-behaviour-hooks-and-editor.md) | Completed |
| 6 | [Integration, GREEN, regression, visual](./phase-06-integration-green-regression-and-visual.md) | Completed (uncommitted; see reports/delivery-tracker-261015-write-kudo-status.md) |

Owner · track · depends · effort: 1 tester · gate · — · 6h | 2 momorph-ui-implementer · A · 1 · 6h | 3 implementer · B · 1 · 4h | 4 implementer · B · 3 · 3h | 5 implementer · B · 4 · 5h | 6 implementer → tester · integration · 2, 5 · 4h.

## Dependencies
```
1 ─┬─> 2 (Track A views) ─────────────────────────────────┐
   └─> 3 (SQL) ─> 4 (lib/kudos, actions, i18n) ─> 5 (hooks, editor) ┴─> 6 (wiring, GREEN, regression, visual)
```
Contracts (single sources): RPC/storage contract = phase-03 §Contract; selector contract = phase-01 §Selectors; view props = phase-02. Mock, SQL, TS types and views match them field for field.

## Data flow
```
page KudosBoard (Suspense) ── getSidebar().hasSunner, getFilterOptions().hashtags (both React cache) ──> ActionPillsContainer
Compose click ─> WriteKudoModalContainer (lazy-loads the form + Tiptap chunk)
Recipient / "@" typing ─250ms─> searchSunnersAction(q) ─> rpc search_sunners (unaccent, strpos, ≤10, ≠viewer) ─> options
Gửi ─> validate (lib/kudos/kudo-write-rules, BR-001/003/004/005/006/007/009) ─ invalid ─> all field errors, no network
     └ valid ─> browser client uploads each File to Storage kudo-images/<uuid>.<ext> (owner_id = auth.uid())
              ─> createKudoAction(payload) ─> rpc create_kudo (DEFINER, revalidates, owner check, 1 txn) ─> {kudoId}
              ─ ok ─> close, toast, router.refresh() ─> feed re-keyed by first id ─> new kudo first (kudo_cards masks anonymous)
              ─ fail ─> remove uploaded objects (best effort), error toast, modal keeps data
Board read: kudo_cards (DEFINER) → isAnonymous/anonymousName, sender null if anonymous; image url "kudo-images/…" resolved in TS
```

## Key calls (detail + reasoning in phase files and clarifications planner session)
- **Anonymity**: column-level SELECT grants on `kudos` (minus `sender_id`) and `sunners` (minus `user_id`) + narrow `SECURITY DEFINER` for `kudo_cards`, `viewer_sunner_id`, `kudos_sidebar`; `sender: null` on anonymous cards; neutral uuid object names. Chosen over a split table (touches every F006 query, seed, check constraint).
- **Upload**: client-direct to Storage (Server Action default body limit 1 MB, `serverActions.md`; 5×5 MB would need 26 MB+ and the proxy also buffers bodies, `proxyClientMaxBodySize`). E2E mock serves `/storage/v1/*` with CORS.
- **Editor**: `@tiptap/{react,pm,core,starter-kit,extension-mention,suggestion,extensions}@3.32.0` exact (peer React ^19, verified `npm view` 2026-10-15). StarterKit with unused nodes disabled; `immediatelyRender:false`; lazy chunk.
- **Image URL**: `kudo_images.url` stores `kudo-images/<name>`; `lib/kudos/resolve-kudo-image-url.ts` builds the public URL, drops non-`/images/`/`https://` values (closes F006 L7).
- **Feed refresh**: F006 feed keeps client state; phase 6 keys `FeedContainer` by `filtersKey|firstId` so `router.refresh()` shows the new kudo.

## File ownership (W; no two parallel phases share a file)

| Path | Phase |
|------|-------|
| `e2e/write-kudo-*.spec.ts`, `e2e/support/write-kudo-*.ts`, `e2e/support/mock-kudos-*.ts`, `e2e/support/mock-storage-*.ts`, `e2e/support/mock-supabase-server.ts`, `e2e/support/kudos-fixture-ids.ts`, `e2e/support/login-through-stubbed-google.ts` (additive identity), `e2e/kudos-sidebar-and-modal.spec.ts` (TC 19 case only) | 1 |
| `app/(main)/sun-kudos/_components/**` | 2 |
| `supabase/migrations/*_write_kudo_*.sql`, `supabase/seed.sql`, `supabase/tests/database/*.test.sql` | 3 |
| `lib/kudos/**`, `lib/i18n/dictionary-write-kudo-{vi,en}.ts`, `lib/i18n/dictionary-{vi,en}.ts` (one spread each) | 4 |
| `app/(main)/sun-kudos/_behavior/**`, `package.json`, `bun.lock` | 5 |
| `app/(main)/sun-kudos/page.tsx`, `app/(main)/sun-kudos/_wiring/**` | 6 |

Read-only: `proxy.ts`, `lib/supabase/*`, `next.config.ts`, `supabase/config.toml`, `playwright.config.ts`, F006 migrations, other specs. Every code file <200 lines, kebab-case.

## Verification & rollback
- W (RED and GREEN, same command) `bun run test:e2e e2e/write-kudo-` · K `bun run test:e2e e2e/kudos-` · D `bun run test:e2e` · P `E2E_SITE_LAUNCH_AT=2099-01-01T00:00:00+07:00 bun run test:e2e --grep @prelaunch` · I `E2E_EVENT_START_AT=not-a-date bun run test:e2e --grep @event-env-invalid` · L `E2E_SITE_LAUNCH_AT=not-a-date bun run test:e2e --grep @launch-env-invalid` · SQL `bun run supabase:start && supabase db reset && supabase test db` (no container runtime → BLOCKED, recorded, never skipped silently) · W and K again with `E2E_PROD=1`.
- `bunx tsc --noEmit`, `bun run lint`, `bun run build`. Visual: 1440 vs `momorph/write-kudo-frame.png`, 768/375 no horizontal scroll, rows stacked <640.
- Rollback: revert phase commits. Phase 6 alone switches the pill (revert → Coming soon again). DB: revert the `*_write_kudo_*` migrations + `supabase db reset` restores F006 grants/functions (no prod DB yet; new columns are additive, defaults keep F006 rows valid). Phases 1 and 6 ship together, else D stays red.
- Done = W, K, D, P, I, L, SQL exit 0 on final code; tsc/lint/build 0; 57 TCs + SC-001..SC-007 mapped to a passing test or a recorded reason (`evidence/tc-mapping.md`, `evidence/sc-mapping.md`); visual within tolerance.

## Risk register

| Risk | L | I | Countermove |
|------|---|---|-------------|
| Column revoke breaks an F006 read (invoker fn touching `sender_id`/`user_id`) | M | H | Phase 3 greps every F006 fn; DEFINER swap; all F006 pgTAP + K rerun |
| Anonymous sender leaks via a path not covered (RPC, PostgREST select/filter/embed, image URL, storage list) | M | H | pgTAP per path (phase 3 list); neutral names; owner-only storage SELECT |
| Storage RLS semantics differ from plan (owner_id unset at check, RETURNING needs SELECT) | M | M | Phase 3 real upload probe with a user JWT on local stack; fallback recorded in clarifications |
| `unaccent` fails under `search_path=''` or misses đ | M | M | Two-arg `extensions.unaccent('extensions.unaccent'::regdictionary, …)`; pgTAP "Đức"→"duc" |
| Mock/SQL drift for create/search/storage rules | M | H | One contract (phase 3); seed-match pgTAP extended to new sunners |
| Browser→mock cross-origin upload blocked (CORS) or browser client has no session | M | M | Mock answers OPTIONS + CORS headers on `/storage/v1/*`; phase 6 GREEN proves |
| Tiptap SSR/hydration or Esc conflicts (mention list, link dialog, modal) | M | M | Lazy client chunk, `immediatelyRender:false`; modal Esc ignores handled events |
| New kudo not visible after `router.refresh()` (feed client state) | H | M | Feed key includes first item id (phase 6); W asserts first card |
| Parallel workers see created kudos | H | M | Own `kudos-writer` dataset + serial submit spec + `/__e2e/kudos/reset` |
| Orphan objects when best-effort cleanup fails | L | L | Accepted; delete policy only for own unreferenced objects |

## Unresolved / follow-ups
1. EN copy (all new keys) is implementer-authored. Owner: user. Done: `dictionary-write-kudo-en.ts` confirmed.
2. Docs promotion (F### allocation, permissions/architecture drafts → `docs/`). Owner: doc-writer after merge.
3. Orphan Storage cleanup job (failed best-effort deletes). Owner: implementer, deferred (YAGNI).
4. Commit/PR on user approval: `gh pr create -R ngocnv-0940/agentic-coding-hands-on` against `master`.

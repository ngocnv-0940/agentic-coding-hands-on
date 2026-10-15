---
title: "Auto-provision a sunners row for every Google account"
description: "Trigger on auth.users plus one-time backfill so every signed-in Google user can read and write kudos."
status: completed
priority: P1
effort: 4h
branch: feat/write-kudo
tags: [supabase, auth, migration, pgtap, kudos]
created: 2026-10-15
spec: docs/features/F006_KudosLiveBoard/
---

# Auto-provision sunner at first sign-in

Decisions are fixed in [clarifications.md](clarifications.md) (do not reopen). Spec delta: F006 (FR-605, BR-012,
ALG-007, INT-004, SC-012, D013), F007 note, `spec/system/permissions.md`.
Safety-critical (auth trigger, migration, grants): pgTAP and e2e run in full.

## Data flow
Google OAuth -> GoTrue inserts `auth.users` (raw_user_meta_data) -> trigger `kudos_private.provision_sunner()`
(same transaction) -> `public.sunners (user_id, full_name, avatar_url)` -> `/auth/callback` -> pages call
`viewer_sunner_id()` / `create_kudo` / `toggle_kudo_like` and find the row. No app code change.

## Phases
| # | Phase | Status | Depends on |
|---|-------|--------|------------|
| 1 | [Migration: trigger, backfill, revoke + new pgTAP](phase-01-migration-and-new-pgtap.md) | completed | - |
| 2 | [Adapt existing pgTAP files and seed comment](phase-02-adapt-existing-tests.md) | completed (scope reduced) | 1 |
| 3 | [Verification gate: db reset/test/lint, e2e, tsc/lint](phase-03-verification.md) | completed | 1, 2 |

## Scope drift (logged 2026-10-15)
| Change | Reason | Cost |
|--------|--------|------|
| Google-only gate (`is_google_account`, 3rd function) | Review round 1 M1: email sign-up enabled, anon /signup could mint a writing sunner | +1 helper, pgTAP 302 -> 310 |
| Trigger also `after update of raw_app_meta_data` | Review round 2: GoTrue links Google to existing same-email account via UPDATE, not INSERT | Trigger fires on every Google sign-in (no-op), pgTAP 310 -> 316 |
| Planned fixture cleanup in 5 existing pgTAP files dropped | Dead code: those files never needed it once verified green; only sender-masking DEFINER allowlist + seed.sql comment changed | Phase 2 smaller than planned |

Outcome: pgTAP 316/316 (7 files), db reset 0, db lint clean, e2e 252/252, tsc 0, lint 0, inspection SEALED 9.5.
Open follow-ups: `reports/delivery-tracker-261015-sunner-provisioning-status.md`.

Phases 1 and 2 land together (the migration alone turns 5 existing pgTAP files red). Sequential, no parallelism,
so no file-ownership clash; each phase lists the files it owns.

## Key finding (not in clarifications)
Five existing pgTAP files insert `auth.users` then `public.sunners` with the same `user_id` (unique). Once the
trigger exists those inserts raise unique_violation, and the "no-sunner" users would own a row, breaking
`sunner_not_found` assertions. Phase 2 fixes them (delete the auto-created row right after the auth insert).

## Risk summary
| Risk | L | I | Countermove |
|------|---|---|-------------|
| Trigger error blocks all sign-ups | L | High | Insert cannot fail on data (fallbacks, caps); pgTAP covers null/empty metadata; rollback = drop trigger |
| Migration role lacks rights on `auth.users` | M | High | Verify on local `supabase db reset` first; remote uses same role as other migrations |
| Trigger fn callable by authenticated (blanket grant in 20261014095442) | H if forgotten | Med | Explicit revoke + pgTAP `has_function_privilege` |
| Existing tests/seed break | H | Med | Phase 2 |
| Every Google account searchable as recipient | accepted | - | Logged by user in clarifications |

## Rollback
`drop trigger on_auth_user_created_provision_sunner on auth.users; drop function kudos_private.provision_sunner();`
Backfilled rows are ordinary sunners; keep them (deleting could orphan kudos FKs).

## Done (observable)
`supabase db reset && supabase test db` exit 0; `supabase db lint` clean; `bun run test:e2e` exit 0; `tsc`/lint unchanged.
